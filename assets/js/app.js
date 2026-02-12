import { sanitizeText, toNumber } from './modules/sanitize.js';
import { dbApi } from './modules/db.js';
import { bmi, estimatedBodyFat, caloriesAndMacros } from './modules/metrics.js';
import { buildRoutine, weeklyProgression } from './modules/recommendation.js';
import { renderWeightChart } from './modules/chart.js';

const onboardingEl = document.querySelector('#onboarding');
const dashboardEl = document.querySelector('#dashboard');
const metricsCards = document.querySelector('#metrics-cards');
const historyList = document.querySelector('#history-list');
const routineList = document.querySelector('#routine-list');
const profileSummary = document.querySelector('#profile-summary');
const chart = document.querySelector('#progress-chart');
const themeBtn = document.querySelector('#theme-toggle');

init();

async function init() {
  setupTheme();
  registerSW();
  const profile = await dbApi.getProfile();
  if (!profile) {
    renderOnboarding();
  } else {
    await renderDashboard(profile);
  }
}

function renderOnboarding(error = '') {
  onboardingEl.innerHTML = `
    <h2>Onboarding inteligente</h2>
    <p>Configurá tu perfil para recibir un plan seguro y progresivo.</p>
    <form id="onboarding-form" class="grid" style="grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: .7rem;">
      <label>Edad <input name="age" type="number" min="12" max="85" required></label>
      <label>Peso (kg) <input name="weight" type="number" min="30" max="300" step="0.1" required></label>
      <label>Altura (cm) <input name="height" type="number" min="130" max="230" required></label>
      <label>Objetivo
        <select name="goal" required>
          <option value="perder_grasa">Perder grasa</option>
          <option value="ganar_musculo">Ganar músculo</option>
          <option value="mantener">Mantener</option>
        </select>
      </label>
      <label>Nivel
        <select name="level" required>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
      </label>
      <label>Lesiones <input name="injuries" maxlength="120" placeholder="Ej: rodilla izquierda"></label>
      <label>Sexo (opcional)
        <select name="sex">
          <option value="no_especificado">Prefiero no decir</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
        </select>
      </label>
      <div style="grid-column: 1 / -1;" class="error">${error}</div>
      <button class="btn" type="submit" style="grid-column: 1 / -1;">Crear mi plan</button>
    </form>
  `;

  document.querySelector('#onboarding-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const profile = {
        age: toNumber(fd.get('age'), 12, 85),
        weight: toNumber(fd.get('weight'), 30, 300),
        height: toNumber(fd.get('height'), 130, 230),
        goal: sanitizeText(fd.get('goal')),
        level: sanitizeText(fd.get('level')),
        injuries: sanitizeText(fd.get('injuries')),
        sex: sanitizeText(fd.get('sex'))
      };
      await dbApi.saveProfile(profile);
      await renderDashboard(profile);
    } catch (err) {
      renderOnboarding(err.message);
    }
  });
}

async function renderDashboard(profile) {
  onboardingEl.classList.add('hidden');
  dashboardEl.classList.remove('hidden');
  profileSummary.textContent = `${profile.level} · objetivo: ${profile.goal.replace('_', ' ')} ${
    profile.injuries ? `· lesiones: ${profile.injuries}` : ''
  }`;

  const sessions = await dbApi.getSessions();
  const latestWeight = sessions.at(-1)?.weight ?? profile.weight;
  const bmiVal = bmi(latestWeight, profile.height);
  const fatVal = estimatedBodyFat({ bmiValue: bmiVal, age: profile.age, sex: profile.sex });
  const nutrition = caloriesAndMacros({ weightKg: latestWeight, goal: profile.goal });
  const prog = weeklyProgression(profile, sessions.length + 1);

  renderMetrics({
    peso: `${latestWeight.toFixed(1)} kg`,
    imc: bmiVal.toFixed(1),
    grasa: `${fatVal.toFixed(1)}%`,
    calorías: `${nutrition.calories} kcal`,
    macros: `P${nutrition.protein}/C${nutrition.carbs}/G${nutrition.fat}`,
    progresión: `x${prog.volumeFactor}`
  });

  renderRoutine(profile, prog);
  renderHistory(sessions);
  renderWeightChart(chart, sessions);

  document.querySelector('#session-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await dbApi.addSession({
        date: sanitizeText(fd.get('date')),
        weight: toNumber(fd.get('weight'), 30, 350),
        duration: toNumber(fd.get('duration'), 5, 300),
        notes: sanitizeText(fd.get('notes'))
      });
      e.target.reset();
      await renderDashboard(profile);
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
    }
  };
}

function renderMetrics(data) {
  metricsCards.innerHTML = Object.entries(data)
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join('');
}

function renderRoutine(profile, prog) {
  const routine = buildRoutine(profile);
  routineList.innerHTML = routine
    .map(
      (item) => `<li><strong>${item.name}</strong> · ${item.sets}x${item.reps}<br><small>${item.reason}</small></li>`
    )
    .join('');
  routineList.insertAdjacentHTML('beforeend', `<li><span class="tag">${prog.note}</span></li>`);
}

function renderHistory(sessions) {
  if (!sessions.length) {
    historyList.innerHTML = '<li>Aún no hay entrenamientos registrados.</li>';
    return;
  }
  historyList.innerHTML = sessions
    .slice()
    .reverse()
    .slice(0, 8)
    .map((s) => `<li><strong>${s.date}</strong> · ${s.weight} kg · ${s.duration} min<br><small>${s.notes || 'Sin notas'}</small></li>`)
    .join('');
}

function setupTheme() {
  const stored = localStorage.getItem('fitforge-theme') || 'dark';
  document.documentElement.dataset.theme = stored;
  themeBtn.textContent = stored === 'dark' ? '🌙' : '☀️';
  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = current;
    localStorage.setItem('fitforge-theme', current);
    themeBtn.textContent = current === 'dark' ? '🌙' : '☀️';
  });
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
