import { sanitizeText, toNumber } from './sanitize.js';

// Definición del wizard paso a paso y sus reglas de validación.
const STEPS = [
  {
    key: 'age',
    label: 'Edad',
    type: 'number',
    attrs: { min: 12, max: 85, step: 1, required: true },
    helper: 'Tu edad permite ajustar volumen y recuperación de forma segura.',
    parser: (value) => toNumber(value, 12, 85)
  },
  {
    key: 'weight',
    label: 'Peso corporal (kg)',
    type: 'number',
    attrs: { min: 30, max: 300, step: 0.1, required: true },
    helper: 'Se usa para estimar calorías, macros y progreso semanal.',
    parser: (value) => toNumber(value, 30, 300)
  },
  {
    key: 'height',
    label: 'Altura (cm)',
    type: 'number',
    attrs: { min: 130, max: 230, step: 1, required: true },
    helper: 'La altura permite calcular IMC y ajustar metas realistas.',
    parser: (value) => toNumber(value, 130, 230)
  },
  {
    key: 'goal',
    label: 'Objetivo',
    type: 'select',
    options: [
      ['perder_grasa', 'Perder grasa'],
      ['ganar_musculo', 'Ganar músculo'],
      ['mantener', 'Mantener']
    ],
    helper: 'Define el tipo de rutina, intensidad y recomendaciones nutricionales.',
    parser: (value) => sanitizeText(value)
  },
  {
    key: 'level',
    label: 'Nivel',
    type: 'select',
    options: [
      ['principiante', 'Principiante'],
      ['intermedio', 'Intermedio'],
      ['avanzado', 'Avanzado']
    ],
    helper: 'El nivel regula volumen total y progresión semanal automática.',
    parser: (value) => sanitizeText(value)
  },
  {
    key: 'injuries',
    label: 'Lesiones',
    type: 'text',
    attrs: { maxlength: 120, placeholder: 'Ej: molestia lumbar o rodilla' },
    helper: 'Campo opcional para limitar ejercicios y sugerencias de carga.',
    parser: (value) => sanitizeText(value)
  },
  {
    key: 'sex',
    label: 'Sexo (opcional)',
    type: 'select',
    options: [
      ['no_especificado', 'Prefiero no decir'],
      ['masculino', 'Masculino'],
      ['femenino', 'Femenino']
    ],
    helper: 'Solo se usa para ajustar la estimación de grasa corporal.',
    parser: (value) => sanitizeText(value)
  }
];

function attrsToString(attrs = {}) {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(' ');
}

export function createOnboardingWizard({ container, initialProfile = {}, dbApi, onComplete }) {
  // Estado local del wizard; se persiste progresivamente en IndexedDB.
  let currentStep = 0;
  const profileDraft = {
    goal: 'mantener',
    level: 'principiante',
    sex: 'no_especificado',
    ...initialProfile
  };

  const totalSteps = STEPS.length;

  async function autosave() {
    await dbApi.saveProfile(profileDraft);
  }

  function progressPercent() {
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  }

  function getStepMarkup(step, value) {
    if (step.type === 'select') {
      const options = step.options
        .map(([v, text]) => `<option value="${v}" ${String(value) === v ? 'selected' : ''}>${text}</option>`)
        .join('');
      return `<select id="wizard-input" name="${step.key}" class="wizard-input">${options}</select>`;
    }
    return `<input id="wizard-input" class="wizard-input" name="${step.key}" type="${step.type}" ${attrsToString(step.attrs)} value="${String(value ?? '')}" />`;
  }

  function renderStep(message = '') {
    const step = STEPS[currentStep];
    const value = profileDraft[step.key] ?? '';
    const isLast = currentStep === totalSteps - 1;

    container.innerHTML = `
      <div class="wizard">
        <div class="wizard-header">
          <h2>Onboarding inteligente</h2>
          <p>Paso ${currentStep + 1} de ${totalSteps}</p>
        </div>

        <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent()}">
          <span class="progress-fill" style="width:${progressPercent()}%"></span>
        </div>

        <form id="wizard-form" class="wizard-step fade-step" novalidate>
          <label for="wizard-input" class="wizard-label">${step.label}</label>
          ${getStepMarkup(step, value)}
          <small class="wizard-helper">${step.helper}</small>
          <small class="wizard-message ${message ? 'is-visible' : ''}">${message || ''}</small>

          <div class="wizard-actions">
            <button type="button" class="btn btn-ghost" id="wizard-prev" ${currentStep === 0 ? 'disabled' : ''}>Anterior</button>
            <button type="submit" class="btn">${isLast ? 'Finalizar plan' : 'Siguiente'}</button>
          </div>
        </form>
      </div>
    `;

    const input = container.querySelector('#wizard-input');
    const form = container.querySelector('#wizard-form');
    const prevBtn = container.querySelector('#wizard-prev');

    input.addEventListener('input', () => validateCurrentInput(input, step, false));
    input.addEventListener('blur', () => validateCurrentInput(input, step, false));

    prevBtn.addEventListener('click', async () => {
      if (currentStep > 0) {
        currentStep -= 1;
        renderStep();
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const parsed = validateCurrentInput(input, step, true);
      if (parsed === null) return;

      profileDraft[step.key] = parsed;
      await autosave();

      if (isLast) {
        await onComplete(profileDraft);
      } else {
        currentStep += 1;
        renderStep();
      }
    });
  }

  function validateCurrentInput(input, step, showMessage) {
    const rawValue = input.value ?? '';
    try {
      const parsed = step.parser(rawValue);

      // Reglas de obligatoriedad explícitas para evitar avance vacío.
      if (step.attrs?.required && (rawValue === '' || rawValue === null)) {
        throw new Error('Este campo es obligatorio.');
      }

      setValidityUI(input, true, 'Dato correcto ✔');
      return parsed;
    } catch (error) {
      if (showMessage) {
        setValidityUI(input, false, error.message || 'Dato inválido.');
      } else {
        setValidityUI(input, false, 'Revisá este dato.');
      }
      return null;
    }
  }

  function setValidityUI(input, isValid, message) {
    const messageEl = container.querySelector('.wizard-message');
    input.classList.remove('is-valid', 'is-invalid');
    input.classList.add(isValid ? 'is-valid' : 'is-invalid');
    messageEl.classList.add('is-visible');
    messageEl.textContent = message;
    messageEl.classList.toggle('is-error', !isValid);
  }

  renderStep();
}
