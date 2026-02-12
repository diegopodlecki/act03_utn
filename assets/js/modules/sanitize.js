// Sanitización defensiva para evitar inyecciones de HTML/JS en texto libre.
export function sanitizeText(value = '') {
  return String(value)
    .replace(/[<>"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`Valor fuera de rango (${min}-${max})`);
  }
  return n;
}
