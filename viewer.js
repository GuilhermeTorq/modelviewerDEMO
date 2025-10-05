const viewer = document.getElementById('viewer');
const controlsContainer = document.getElementById('model-controls');

let modelsConfig = null;
let currentModel = null;

// Fetch JSON once at page load
async function loadHotspotConfig() {
  try {
    const res = await fetch('hotspot.json');
    if (!res.ok) throw new Error('Failed to load hotspot.json');
    modelsConfig = await res.json();
    initializeViewer();
  } catch (err) {
    console.error(err);
  }
}

function initializeViewer() {
  const models = Object.keys(modelsConfig.models);
  if (!models.length) return console.error('No models in JSON');

  // Create buttons for each model
  models.forEach((modelName, index) => {
    const btn = document.createElement('button');
    btn.textContent = modelsConfig.models[modelName].displayName || modelName;
    btn.onclick = () => setModel(modelName);
    if (index === 0) btn.classList.add('active');
    controlsContainer.appendChild(btn);
  });

  // Load first model
  setModel(models[0]);
}

function clearHotspots() {
  viewer.querySelectorAll('.Hotspot').forEach(h => h.remove());
}

function addHotspots(modelName) {
  clearHotspots();
  const modelConfig = modelsConfig.models[modelName];
  if (!modelConfig || !modelConfig.hotspots) return;

  modelConfig.hotspots.forEach((h, i) => {
    const btn = document.createElement('button');
    btn.className = 'Hotspot';
    btn.slot = `hotspot-${i+1}`;
    btn.setAttribute('data-surface', h.surface);
    btn.setAttribute('data-visibility-attribute', 'visible');

    const annotation = document.createElement('div');
    annotation.className = 'HotspotAnnotation';
    annotation.textContent = h.label;
    btn.appendChild(annotation);

    btn.onclick = () => playAnimation(h.animation, btn);
    viewer.appendChild(btn);
  });
}

function playAnimation(animationName, hotspot) {
  const allHotspots = viewer.querySelectorAll('.Hotspot');
  allHotspots.forEach(h => h.style.display = 'none');

  viewer.pause();
  viewer.animationName = animationName;
  viewer.currentTime = 0;

  const duration = 250 / 30;

  setTimeout(() => {
    viewer.play();
    setTimeout(() => {
      viewer.pause();
      allHotspots.forEach(h => h.style.display = 'flex');
    }, duration * 1000);
  }, 50);
}

function setModel(modelName) {
  if (!modelsConfig || !modelsConfig.models[modelName]) return;

  currentModel = modelName;
  clearHotspots();
  stopAnimations();

  viewer.src = modelsConfig.models[modelName].file;

  // Update active button
  controlsContainer.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === (modelsConfig.models[modelName].displayName || modelName));
  });

  viewer.addEventListener('load', () => addHotspots(modelName), { once: true });
}

function stopAnimations() {
  viewer.pause();
  viewer.animationName = '';
}


// Progress bar handling
const progressBar = document.getElementById('progress-bar');

viewer.addEventListener('progress', (event) => {
  const ratio = event.detail.totalProgress || 0;
  progressBar.style.width = `${ratio * 100}%`;
});

viewer.addEventListener('load', () => {
  progressBar.style.width = '100%';
  setTimeout(() => {
    progressBar.style.width = '0%';
  }, 500); // smooth fade out
});


// Start everything
loadHotspotConfig();
