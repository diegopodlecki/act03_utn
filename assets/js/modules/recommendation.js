const baseExercises = {
  perder_grasa: ['Sentadilla goblet', 'Remo con banda', 'Zancadas', 'Plancha', 'Burpees suaves'],
  ganar_musculo: ['Sentadilla', 'Press pecho', 'Peso muerto rumano', 'Dominadas asistidas', 'Press militar'],
  mantener: ['Sentadilla frontal', 'Flexiones', 'Remo', 'Plancha lateral', 'Hip thrust']
};

const levelMult = { principiante: 0.8, intermedio: 1, avanzado: 1.2 };

export function buildRoutine(profile) {
  const exercises = baseExercises[profile.goal] || baseExercises.mantener;
  const mult = levelMult[profile.level] || 1;
  const baseSets = Math.round(3 * mult);
  const baseReps = Math.round(profile.goal === 'perder_grasa' ? 12 * mult : 8 * mult);

  return exercises.map((name, i) => ({
    name,
    sets: baseSets + (i % 2),
    reps: baseReps + i,
    reason: profile.goal === 'perder_grasa'
      ? 'Alta activación metabólica y gasto calórico.'
      : 'Estimula hipertrofia y progreso de fuerza.'
  }));
}

export function weeklyProgression(profile, weekIndex = 1) {
  const inc = profile.level === 'principiante' ? 0.025 : 0.04;
  return {
    volumeFactor: (1 + inc * weekIndex).toFixed(2),
    note: `Sube ${Math.round(inc * 100)}% de volumen semanal si RPE ≤ 8.`
  };
}
