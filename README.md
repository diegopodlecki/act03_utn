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
    └── js/
        ├── app.js
        └── modules/
            ├── db.js
            ├── sanitize.js
            ├── metrics.js
            ├── recommendation.js
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
- `recommendation.js`: lógica de rutina inteligente + progresión semanal.
- `chart.js`: render de gráfico de evolución de peso en canvas.
- `sw.js`: cache offline y estrategia cache-first con fallback.

## Seguridad aplicada

- Sanitización de texto para entradas de usuario.
- Validaciones de rango en todos los campos numéricos.
- Sin uso de `innerHTML` con texto no saneado.
- Sin dependencias remotas obligatorias para operar.

## Funcionalidades incluidas

- Onboarding obligatorio (edad, peso, altura, objetivo, nivel, lesiones, sexo opcional).
- Ajuste de volumen/intensidad según nivel.
- Explicación de cada ejercicio recomendado.
- Registro de sesiones y evolución en gráfico.
- Panel de métricas (peso, IMC, grasa estimada, calorías y macros).
- Historial de entrenamientos.
- PWA instalable + funcionamiento offline.
- Diseño responsive, premium y amigable para principiantes.
