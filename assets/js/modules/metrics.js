export function bmi(weightKg, heightCm) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

// Estimación simple para prototipo local.
export function estimatedBodyFat({ bmiValue, age, sex = 'no_especificado' }) {
  const sexFactor = sex === 'masculino' ? 1 : sex === 'femenino' ? 0 : 0.5;
  return 1.2 * bmiValue + 0.23 * age - 10.8 * sexFactor - 5.4;
}

export function caloriesAndMacros({ weightKg, goal }) {
  const base = weightKg * 33;
  const adjusted = goal === 'perder_grasa' ? base - 400 : goal === 'ganar_musculo' ? base + 250 : base;
  const protein = weightKg * (goal === 'ganar_musculo' ? 2 : 1.7);
  const fat = weightKg * 0.9;
  const carbs = (adjusted - protein * 4 - fat * 9) / 4;
  return {
    calories: Math.round(adjusted),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.max(60, Math.round(carbs))
  };
}
