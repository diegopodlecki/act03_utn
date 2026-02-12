# FitForge PWA (Local-First)

Plataforma web fitness inspirada en workout.cool, optimizada para principiantes y preparada para escalar.

## Arquitectura del sistema

- **Frontend (HTML + CSS + JS modular):** interfaz premium, onboarding guiado, dashboard de progreso y modo oscuro.
- **Persistencia local con IndexedDB:** datos 100% en dispositivo (perfil + sesiones).
- **Capa de recomendación:** genera rutina según objetivo y nivel + progresión semanal automática.
- **PWA:** Service Worker + Manifest para uso offline e instalación en móvil/desktop.

### Estructura de carpetas

```text
/
├── index.html
├── manifest.webmanifest
├── sw.js
├── README.md
├── docs/
│   ├── db-schema.md
│   ├── user-flow.md
│   └── wireframe-textual.md
└── assets/
    ├── css/styles.css
    ├── icons/icon.svg
    ├── data/exercises.json
    └── js/
        ├── app.js
        └── modules/
            ├── db.js
            ├── sanitize.js
            ├── metrics.js
            ├── recommendation.js
            ├── progression.js
            ├── onboarding.js
            ├── timer.js
            └── chart.js
```

## Instalación en XAMPP local

1. Copiar el proyecto a `htdocs`.
2. Iniciar Apache en XAMPP.
3. Abrir `http://localhost/act03_utn/`.

## Explicación técnica de módulos

- `app.js`: orquestación completa de UI, onboarding, dashboard y eventos de formularios.
- `db.js`: acceso a IndexedDB con stores `profile` y `sessions`.
- `sanitize.js`: sanitización y validación numérica estricta.
- `metrics.js`: cálculo de IMC, grasa estimada y calorías/macros.
- `recommendation.js`: arma rutina base y aplica progresión automática según historial.
- `progression.js`: algoritmo de auto-progresión (+5% carga, -10% volumen, deload semana 4, ajuste por nivel).
- `onboarding.js`: wizard interactivo por pasos con barra de progreso, autosave y validación en vivo.
- `timer.js`: temporizador de ejercicio/descanso con pausa, anillo SVG animado y sonido suave.
- `chart.js`: render de gráfico de evolución de peso en canvas.
- `sw.js`: cache offline y estrategia cache-first con fallback.

## Seguridad aplicada

- Sanitización de texto para entradas de usuario.
- Validaciones de rango en todos los campos numéricos.
- Sin uso de `innerHTML` con texto no saneado.
- Sin dependencias remotas obligatorias para operar.

## Funcionalidades incluidas

- Onboarding obligatorio tipo wizard (paso a paso, feedback visual y guardado automático por paso).
- Ajuste de volumen/intensidad según nivel.
- Explicación de cada ejercicio recomendado.
- Registro de sesiones y evolución en gráfico.
- Panel de métricas (peso, IMC, grasa estimada, calorías y macros).
- Historial de entrenamientos.
- Temporizador por ejercicio y descanso automático con persistencia de tiempo real en historial.
- Biblioteca de ejercicios con modal elegante y carga diferida.
- PWA instalable + funcionamiento offline.
- Diseño responsive, premium y amigable para principiantes.


## Ejemplo de progresión (antes/después)

```js
const before = {
  routine: [
    { name: "Sentadilla", sets: 4, reps: 8, loadKg: 60 },
    { name: "Press pecho", sets: 4, reps: 8, loadKg: 50 }
  ],
  sessions: [{ completedAllSets: true, failCount: 0 }],
  level: "intermedio"
};

// Después de aplicar progression.js
const after = {
  routine: [
    { name: "Sentadilla", sets: 4, reps: 8, loadKg: 63, progressionNote: "Aumentamos carga porque completaste tu rutina anterior." },
    { name: "Press pecho", sets: 4, reps: 8, loadKg: 52.5, progressionNote: "Aumentamos carga porque completaste tu rutina anterior." }
  ],
  context: { explanation: "Aumentamos carga porque completaste tu rutina anterior" }
};
```
