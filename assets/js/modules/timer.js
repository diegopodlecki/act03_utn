// Temporizador modular para trabajo + descanso con indicador circular SVG.
// - Soporta pausa/reanudar.
// - Reproduce sonido suave al finalizar cada fase.
// - Expone resumen de tiempo real para persistir en historial.

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

function createSoftBeep() {
  return () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Si el audio no está disponible, el timer sigue funcionando sin sonido.
    }
  };
}

export function createTrainingTimer({ container, onUpdate }) {
  let intervalId = null;
  let running = false;
  let phase = 'idle'; // idle | work | rest
  let remaining = 0;
  let totalPhase = 0;

  const state = {
    activeExerciseSec: 0,
    restSec: 0,
    completedExercises: 0,
    cycles: 0
  };

  const beep = createSoftBeep();

  container.innerHTML = `
    <div class="timer-card">
      <div class="timer-head">
        <h3>Temporizador de entrenamiento</h3>
        <small id="timer-phase" class="tag">En espera</small>
      </div>

      <div class="timer-config grid">
        <label>
          Ejercicio actual
          <input id="timer-exercise" type="text" maxlength="60" placeholder="Ej: Sentadilla" value="Ejercicio" />
        </label>
        <label>
          Trabajo (seg)
          <input id="timer-work" type="number" min="10" max="900" value="45" />
        </label>
        <label>
          Descanso (seg)
          <input id="timer-rest" type="number" min="10" max="600" value="60" />
        </label>
      </div>

      <div class="timer-visual-wrap">
        <svg viewBox="0 0 120 120" class="timer-ring" aria-label="Progreso del temporizador">
          <circle class="timer-ring-bg" cx="60" cy="60" r="52"></circle>
          <circle class="timer-ring-progress" cx="60" cy="60" r="52"></circle>
        </svg>
        <div class="timer-readout" id="timer-readout">00:00</div>
      </div>

      <div class="timer-controls">
        <button class="btn" id="timer-start" type="button">Iniciar</button>
        <button class="btn btn-ghost" id="timer-pause" type="button">Pausar</button>
        <button class="btn btn-ghost" id="timer-reset" type="button">Reset</button>
      </div>

      <p class="timer-note" id="timer-note">Configura un ejercicio y empieza. El descanso arranca automático al terminar trabajo.</p>
    </div>
  `;

  const exerciseInput = container.querySelector('#timer-exercise');
  const workInput = container.querySelector('#timer-work');
  const restInput = container.querySelector('#timer-rest');
  const phaseEl = container.querySelector('#timer-phase');
  const readoutEl = container.querySelector('#timer-readout');
  const noteEl = container.querySelector('#timer-note');
  const progressCircle = container.querySelector('.timer-ring-progress');
  const startBtn = container.querySelector('#timer-start');
  const pauseBtn = container.querySelector('#timer-pause');
  const resetBtn = container.querySelector('#timer-reset');

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = `${circumference}`;

  function emitUpdate() {
    onUpdate?.({ ...state, phase, remaining, totalPhase });
  }

  function setProgress() {
    const ratio = totalPhase > 0 ? remaining / totalPhase : 0;
    progressCircle.style.strokeDashoffset = `${circumference * (1 - ratio)}`;
  }

  function paintPhase() {
    phaseEl.textContent = phase === 'work' ? 'Trabajo' : phase === 'rest' ? 'Descanso' : 'En espera';
    phaseEl.classList.toggle('timer-work-phase', phase === 'work');
    phaseEl.classList.toggle('timer-rest-phase', phase === 'rest');
    noteEl.textContent =
      phase === 'work'
        ? `Trabajando: ${exerciseInput.value || 'Ejercicio'}`
        : phase === 'rest'
          ? 'Descanso activo automático.'
          : 'Configura un ejercicio y empieza. El descanso arranca automático al terminar trabajo.';
  }

  function tick() {
    if (!running) return;
    if (remaining <= 0) {
      beep();
      if (phase === 'work') {
        phase = 'rest';
        totalPhase = Number(restInput.value) || 60;
        remaining = totalPhase;
        state.completedExercises += 1;
        state.cycles += 1;
      } else if (phase === 'rest') {
        phase = 'work';
        totalPhase = Number(workInput.value) || 45;
        remaining = totalPhase;
      }
      paintPhase();
      setProgress();
      emitUpdate();
      return;
    }

    remaining -= 1;

    if (phase === 'work') state.activeExerciseSec += 1;
    if (phase === 'rest') state.restSec += 1;

    readoutEl.textContent = formatTime(remaining);
    setProgress();
    emitUpdate();
  }

  function start() {
    if (running) return;
    if (phase === 'idle') {
      phase = 'work';
      totalPhase = Number(workInput.value) || 45;
      remaining = totalPhase;
      readoutEl.textContent = formatTime(remaining);
      paintPhase();
      setProgress();
    }
    running = true;
    intervalId = window.setInterval(tick, 1000);
  }

  function pause() {
    running = false;
    if (intervalId) window.clearInterval(intervalId);
    intervalId = null;
    emitUpdate();
  }

  function reset() {
    pause();
    phase = 'idle';
    remaining = 0;
    totalPhase = 0;
    state.activeExerciseSec = 0;
    state.restSec = 0;
    state.completedExercises = 0;
    state.cycles = 0;
    readoutEl.textContent = '00:00';
    setProgress();
    paintPhase();
    emitUpdate();
  }

  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', pause);
  resetBtn.addEventListener('click', reset);

  setProgress();
  paintPhase();
  emitUpdate();

  return {
    getSummary() {
      return {
        activeExerciseSec: state.activeExerciseSec,
        restSec: state.restSec,
        completedExercises: state.completedExercises,
        cycles: state.cycles
      };
    },
    reset
  };
}
