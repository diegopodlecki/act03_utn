import { sanitizeText, toNumber } from './modules/sanitize.js';
import { dbApi } from './modules/db.js';
import { bmi, estimatedBodyFat, caloriesAndMacros } from './modules/metrics.js';
import { buildRoutine, weeklyProgression } from './modules/recommendation.js';
import { renderWeightChart } from './modules/chart.js';
import { createOnboardingWizard } from './modules/onboarding.js';

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
  if (!isProfileComplete(profile)) {
    renderOnboarding(profile || {});
  } else {
    await renderDashboard(profile);
  }
}

function isProfileComplete(profile) {
  return Boolean(
    profile &&
      Number.isFinite(Number(profile.age)) &&
      Number.isFinite(Number(profile.weight)) &&
      Number.isFinite(Number(profile.height)) &&
      profile.goal &&
      profile.level
  );
}

function renderOnboarding(initialProfile) {
  onboardingEl.classList.remove('hidden');
  dashboardEl.classList.add('hidden');

  createOnboardingWizard({
    container: onboardingEl,
    initialProfile,
    dbApi,
    onComplete: async (profile) => {
      await dbApi.saveProfile(profile);
      await renderDashboard(profile);
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
    .map(
      (s) =>
        `<li><strong>${s.date}</strong> · ${s.weight} kg · ${s.duration} min<br><small>${s.notes || 'Sin notas'}</small></li>`
    )
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
