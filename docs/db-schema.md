# Modelo de base de datos local (IndexedDB)

## Base: `fitforge-db` v1

### Store `profile`
- **keyPath:** `id`
- Registro único por usuario local:
  - `id: "me"`
  - `age: number`
  - `weight: number`
  - `height: number`
  - `goal: "perder_grasa" | "ganar_musculo" | "mantener"`
  - `level: "principiante" | "intermedio" | "avanzado"`
  - `injuries: string`
  - `sex: string`

### Store `sessions`
- **keyPath:** `id` (autoIncrement)
- **Índice:** `date`
- Campos:
  - `id: number`
  - `date: string (YYYY-MM-DD)`
  - `weight: number`
  - `duration: number`
  - `notes: string`
  - `failCount: number`
  - `completedAllSets: boolean`

## Justificación

- **Local-first real:** no requiere servidor.
- **Escalable:** se pueden agregar stores para `streaks`, `coachMode`, `notifications`, etc.
- **Compatible PWA:** acceso offline completo.
