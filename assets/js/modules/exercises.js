// Biblioteca de ejercicios con carga diferida + modal premium.
// Objetivo: mejorar UX tipo app sin penalizar rendimiento inicial.

let exercisesCache = null;

async function loadExercises() {
  if (exercisesCache) return exercisesCache;

  // Fetch diferido: sólo se ejecuta cuando el dashboard está activo.
  const response = await fetch('./assets/data/exercises.json');
  if (!response.ok) {
    throw new Error('No se pudo cargar la base de ejercicios.');
  }

  exercisesCache = await response.json();
  return exercisesCache;
}

function normalize(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getExerciseByName(list, name) {
  const target = normalize(name);
  return list.find((item) => normalize(item.nombre).includes(target) || target.includes(normalize(item.nombre)));
}

function createCard(exercise, onOpen) {
  const card = document.createElement('article');
  card.className = 'exercise-card';
  card.innerHTML = `
    <div class="exercise-head">
      <h4>${exercise.nombre}</h4>
      <span class="tag">${exercise.nivel}</span>
    </div>
    <p>${exercise.grupoMuscular}</p>
    <button class="btn btn-ghost" type="button">Ver técnica</button>
  `;

  card.querySelector('button').addEventListener('click', () => onOpen(exercise));
  return card;
}

function setupModal(modalRoot) {
  const titleEl = modalRoot.querySelector('[data-modal-title]');
  const metaEl = modalRoot.querySelector('[data-modal-meta]');
  const bodyEl = modalRoot.querySelector('[data-modal-body]');
  const videoWrap = modalRoot.querySelector('[data-modal-video]');
  const closeBtn = modalRoot.querySelector('[data-modal-close]');
  const backdrop = modalRoot.querySelector('.exercise-modal-backdrop');

  function close() {
    modalRoot.classList.remove('is-open');
    modalRoot.setAttribute('aria-hidden', 'true');
    videoWrap.innerHTML = '';
  }

  function open(exercise) {
    titleEl.textContent = exercise.nombre;
    metaEl.textContent = `${exercise.grupoMuscular} · Nivel: ${exercise.nivel}`;
    bodyEl.textContent = exercise.instrucciones;

    videoWrap.innerHTML = '';
    if (exercise.videoYoutubeEmbed) {
      const lazyButton = document.createElement('button');
      lazyButton.type = 'button';
      lazyButton.className = 'btn';
      lazyButton.textContent = 'Cargar video';

      lazyButton.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = exercise.videoYoutubeEmbed;
        iframe.loading = 'lazy';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.title = `Video: ${exercise.nombre}`;
        iframe.className = 'exercise-video-frame';
        videoWrap.innerHTML = '';
        videoWrap.appendChild(iframe);
      });

      videoWrap.appendChild(lazyButton);
    }

    modalRoot.classList.add('is-open');
    modalRoot.setAttribute('aria-hidden', 'false');
  }

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && modalRoot.classList.contains('is-open')) close();
  });

  return { open, close };
}

export async function createExerciseLibrary({ container, modalRoot, routineContainer }) {
  container.innerHTML = '<p class="text-muted">Cargando biblioteca de ejercicios…</p>';

  const exercises = await loadExercises();
  const modal = setupModal(modalRoot);

  const controls = document.createElement('div');
  controls.className = 'exercise-controls';
  controls.innerHTML = `
    <input type="search" id="exercise-search" placeholder="Buscar ejercicio…" />
    <select id="exercise-level-filter">
      <option value="">Todos los niveles</option>
      <option value="principiante">Principiante</option>
      <option value="intermedio">Intermedio</option>
      <option value="avanzado">Avanzado</option>
    </select>
  `;

  const grid = document.createElement('div');
  grid.className = 'exercise-grid';

  function renderGrid() {
    const query = normalize(controls.querySelector('#exercise-search').value);
    const level = controls.querySelector('#exercise-level-filter').value;

    grid.innerHTML = '';
    const filtered = exercises.filter((item) => {
      const matchQuery = !query || normalize(item.nombre).includes(query) || normalize(item.grupoMuscular).includes(query);
      const matchLevel = !level || item.nivel === level;
      return matchQuery && matchLevel;
    });

    filtered.forEach((item) => grid.appendChild(createCard(item, modal.open)));
  }

  controls.addEventListener('input', renderGrid);
  controls.addEventListener('change', renderGrid);

  container.innerHTML = '';
  container.appendChild(controls);
  container.appendChild(grid);
  renderGrid();

  // Delegación para ítems de rutina actual -> abrir modal contextual.
  if (routineContainer) {
    routineContainer.addEventListener('click', (ev) => {
      const button = ev.target.closest('[data-exercise-name]');
      if (!button) return;
      const exercise = getExerciseByName(exercises, button.dataset.exerciseName);
      if (exercise) modal.open(exercise);
    });
  }
}
