// Módulo de progresión automática basado en historial real de sesiones.
// Reglas:
// 1) Si completó todas las series -> +5% carga.
// 2) Si falló más de 2 veces -> -10% volumen.
// 3) Cada 4 semanas -> deload automático.
// 4) Reps base ajustadas por nivel.

const LEVEL_REP_OFFSET = {
  principiante: 2,
  intermedio: 0,
  avanzado: -1
};

function getCycleWeek(sessionsCount = 0) {
  // Semana de mesociclo [1..4] usando cantidad de sesiones como aproximación simple.
  return (sessionsCount % 4) + 1;
}

function inferFailuresFromText(notes = '') {
  const clean = String(notes).toLowerCase();
  const match = clean.match(/fall[é|e]\s*(\d+)/i);
  if (match) return Number(match[1]) || 0;
  if (clean.includes('fallo') || clean.includes('fallé')) return 1;
  return 0;
}

function normalizeSession(session = {}) {
  const failCount = Number.isFinite(Number(session.failCount))
    ? Number(session.failCount)
    : inferFailuresFromText(session.notes);

  return {
    completedAllSets: Boolean(session.completedAllSets),
    failCount: Math.max(0, failCount)
  };
}

export function applyProgressionToRoutine({ routine, sessions = [], level = 'principiante' }) {
  const safeRoutine = Array.isArray(routine) ? routine : [];
  const lastSession = sessions.length ? normalizeSession(sessions[sessions.length - 1]) : { completedAllSets: false, failCount: 0 };
  const weekInCycle = getCycleWeek(sessions.length);
  const isDeloadWeek = weekInCycle === 4;
  const repOffset = LEVEL_REP_OFFSET[level] ?? 0;

  let globalReason = 'Mantenemos la carga actual para consolidar técnica.';

  const adjusted = safeRoutine.map((exercise) => {
    const baseLoad = Number(exercise.loadKg) || 20;
    const baseSets = Number(exercise.sets) || 3;
    const baseReps = Number(exercise.reps) || 10;

    let loadKg = baseLoad;
    let sets = baseSets;
    let reps = Math.max(4, baseReps + repOffset);
    let progressionNote = 'Sin cambios de progresión.';

    if (lastSession.completedAllSets) {
      loadKg = +(baseLoad * 1.05).toFixed(1);
      progressionNote = 'Aumentamos carga porque completaste tu rutina anterior.';
      globalReason = progressionNote;
    }

    if (lastSession.failCount > 2) {
      sets = Math.max(2, Math.round(baseSets * 0.9));
      progressionNote = 'Reducimos volumen 10% por fatiga detectada (más de 2 fallos).';
      globalReason = progressionNote;
    }

    if (isDeloadWeek) {
      sets = Math.max(2, Math.round(sets * 0.8));
      loadKg = +(loadKg * 0.9).toFixed(1);
      progressionNote = 'Semana 4: aplicamos deload automático para facilitar recuperación.';
      globalReason = progressionNote;
    }

    return {
      ...exercise,
      reps,
      sets,
      loadKg,
      progressionNote
    };
  });

  return {
    routine: adjusted,
    context: {
      weekInCycle,
      isDeloadWeek,
      basedOnSessions: sessions.length,
      explanation: globalReason
    }
  };
}

export function buildProgressionExample() {
  const before = {
    routine: [
      { name: 'Sentadilla', sets: 4, reps: 8, loadKg: 60 },
      { name: 'Press pecho', sets: 4, reps: 8, loadKg: 50 }
    ],
    sessions: [{ completedAllSets: true, failCount: 0 }],
    level: 'intermedio'
  };

  const after = applyProgressionToRoutine(before);
  return { before, after };
}
