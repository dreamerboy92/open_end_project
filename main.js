/* ─── main.js ─── App State, Routing, Loading, Navigation ─── */

/* ══════════ Global App State ══════════ */
window.AppState = {
  currentExperiment: null,
  scores: { projectile: 0, pendulum: 0, optics: 0, circuits: 0, waves: 0 },
  completed: { projectile: false, pendulum: false, optics: false, circuits: false, waves: false },
  vrMode: false,
  currentSection: 'lab',
};

const EXP_META = {
  projectile: { name: 'Projectile Motion', icon: '🚀', color: '#00d4ff' },
  pendulum:   { name: 'Simple Pendulum',   icon: '🕰️', color: '#7c3aed' },
  optics:     { name: 'Ray Optics',        icon: '🔭', color: '#10b981' },
  circuits:   { name: 'Electric Circuits', icon: '⚡', color: '#f59e0b' },
  waves:      { name: 'Wave Interference', icon: '🌊', color: '#ec4899' },
};

/* ══════════ Loading Screen ══════════ */
window.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('loader-bar');
  const pct = document.getElementById('loader-pct');
  let prog = 0;
  const messages = [
    'Loading 3D Engine...',
    'Building Virtual Lab...',
    'Calibrating Physics...',
    'Setting Up XR Interface...',
    'Ready!'
  ];
  const sub = document.querySelector('.loader-sub');

  const iv = setInterval(() => {
    prog += Math.random() * 22 + 3;
    if (prog >= 100) { prog = 100; clearInterval(iv); }
    bar.style.width = prog + '%';
    pct.textContent = Math.round(prog) + '%';
    const msgIdx = Math.min(Math.floor(prog / 22), messages.length - 1);
    sub.textContent = messages[msgIdx];
    if (prog === 100) {
      setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        document.getElementById('loading-screen').style.transition = 'opacity 0.6s ease';
        setTimeout(() => {
          document.getElementById('loading-screen').classList.add('hidden');
          document.getElementById('landing-page').classList.remove('hidden');
          initStarfield();
          initParticles();
          updateProgress();
        }, 600);
      }, 400);
    }
  }, 120);
});

/* ══════════ Navigation ══════════ */
function showSection(name) {
  const sections = ['experiments-section', 'about-section', 'progress-section'];
  const map = { lab: 'experiments-section', about: 'about-section', progress: 'progress-section' };

  sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));

  const target = map[name] || 'experiments-section';
  const el = document.getElementById(target);
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('anim-fade-in');
    setTimeout(() => el.classList.remove('anim-fade-in'), 600);
  }
  AppState.currentSection = name;

  const pills = document.querySelectorAll('.nav-pill');
  const pillMap = { lab: 0, about: 1, progress: 2 };
  if (pills[pillMap[name]]) pills[pillMap[name]].classList.add('active');

  if (name === 'progress') updateProgress();
  if (name !== 'lab') {
    setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 100);
  }
}

function enterLab() {
  document.querySelector('[onclick="launchExperiment(\'projectile\')"]').click();
}

/* ══════════ Experiment Launcher ══════════ */
function launchExperiment(expId) {
  AppState.currentExperiment = expId;
  const meta = EXP_META[expId];
  document.getElementById('hud-title').textContent = meta.icon + ' ' + meta.name;
  document.getElementById('hud-status-text').textContent = 'Running';
  document.getElementById('hud-bottom-info').textContent = `Experiment: ${meta.name} — Use sliders to adjust parameters`;

  // Stop previous experiment
  if (window._stopCurrentExperiment) window._stopCurrentExperiment();

  const content = document.getElementById('lab-content');
  content.innerHTML = '';

  const labEnv = document.getElementById('lab-environment');
  labEnv.classList.remove('hidden');
  document.getElementById('landing-page').classList.add('hidden');

  // Launch experiment
  const launchers = {
    projectile: () => window.launchProjectile && window.launchProjectile(content),
    pendulum:   () => window.launchPendulum   && window.launchPendulum(content),
    optics:     () => window.launchOptics     && window.launchOptics(content),
    circuits:   () => window.launchCircuits   && window.launchCircuits(content),
    waves:      () => window.launchWaves      && window.launchWaves(content),
  };
  if (launchers[expId]) launchers[expId]();

  // Highlight active quick nav
  document.querySelectorAll('.exp-quick-nav button').forEach((btn, i) => {
    btn.style.borderColor = '';
    const ids = ['projectile','pendulum','optics','circuits','waves'];
    if (ids[i] === expId) btn.style.borderColor = '#00d4ff';
  });
}

function exitLab() {
  if (window._stopCurrentExperiment) window._stopCurrentExperiment();
  document.getElementById('lab-environment').classList.add('hidden');
  document.getElementById('landing-page').classList.remove('hidden');
  showSection('lab');
}

/* ══════════ VR Mode Toggle ══════════ */
function toggleVRMode() {
  AppState.vrMode = !AppState.vrMode;
  const btn = document.getElementById('vr-toggle-btn');
  const labEnv = document.getElementById('lab-environment');
  if (AppState.vrMode) {
    btn.textContent = '⬛ Exit VR';
    btn.classList.add('active');
    labEnv.style.background = '#000';
    document.querySelector('.xr-hud-top').style.opacity = '0.3';
    document.querySelector('.xr-hud-bottom').style.opacity = '0.3';
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } else {
    btn.textContent = '⬛ VR Mode';
    btn.classList.remove('active');
    labEnv.style.background = '';
    document.querySelector('.xr-hud-top').style.opacity = '';
    document.querySelector('.xr-hud-bottom').style.opacity = '';
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }
}

/* ══════════ Progress ══════════ */
function updateProgress() {
  const grid = document.getElementById('progress-grid');
  if (!grid) return;
  const exps = Object.entries(EXP_META);
  grid.innerHTML = exps.map(([id, meta]) => `
    <div class="progress-card ${AppState.completed[id] ? 'done' : ''}">
      <div class="prog-icon">${meta.icon}</div>
      <div class="prog-name">${meta.name}</div>
      <div class="prog-score">${AppState.scores[id]}</div>
      <div class="prog-status">${AppState.completed[id] ? '✅ Completed' : '⏳ Pending'}</div>
    </div>
  `).join('');
  const total = Object.values(AppState.scores).reduce((a, b) => a + b, 0);
  const el = document.getElementById('total-score-display');
  if (el) el.textContent = total;
}

function recordScore(expId, score) {
  AppState.scores[expId] = score;
  AppState.completed[expId] = true;
  updateProgress();
}
