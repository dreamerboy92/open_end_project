/* ─── ui.js ─── Quiz, Result Modals, Panel Builders ─── */

/* ══════════ Slider Tracker ══════════ */
function trackSlider(input) {
  const min = parseFloat(input.min), max = parseFloat(input.max);
  const val = parseFloat(input.value);
  const pct = ((val - min) / (max - min)) * 100;
  input.style.setProperty('--pct', pct + '%');
}
document.addEventListener('input', (e) => {
  if (e.target.type === 'range') trackSlider(e.target);
});

/* ══════════ Panel Builder ══════════ */
function makePanel({ title, controls = [], readouts = [], formula, info, actions = [], procedure }) {
  const el = document.createElement('div');
  el.className = 'exp-panel';

  // Controls section
  if (controls.length) {
    const sec = makePanelSection('⚙ Controls', controls.map(c => `
      <div class="control-row">
        <span class="control-label">${c.label}</span>
        <span class="control-val" id="val-${c.id}">${c.defaultVal} ${c.unit || ''}</span>
      </div>
      <input type="range" id="${c.id}" min="${c.min}" max="${c.max}"
        step="${c.step || 1}" value="${c.defaultVal}"
        oninput="trackSlider(this); document.getElementById('val-${c.id}').textContent=this.value+' ${c.unit||''}'; ${c.oninput || ''}" />
    `).join(''));
    el.appendChild(sec);
  }

  // Actions
  if (actions.length) {
    const sec = makePanelSection('▶ Actions', actions.map(a => `
      <button class="action-btn ${a.cls || ''}" id="${a.id || ''}" onclick='${a.onclick}'>${a.label}</button>
    `).join(''));
    el.appendChild(sec);
  }

  // Readouts
  if (readouts.length) {
    const inner = readouts.map(r => `
      <div class="readout-row">
        <span class="readout-key">${r.label}</span>
        <span class="readout-val" id="ro-${r.id}">—</span>
      </div>`).join('');
    const wrap = document.createElement('div');
    wrap.className = 'panel-section';
    wrap.innerHTML = `<h4>📊 Live Readings</h4><div class="readout-box">${inner}</div>`;
    el.appendChild(wrap);
  }

  // Formula
  if (formula) {
    const wrap = document.createElement('div');
    wrap.className = 'panel-section';
    wrap.innerHTML = `<h4>📐 Formula</h4><div class="formula-box">${formula}</div>`;
    el.appendChild(wrap);
  }

  // Info
  if (info) {
    const wrap = document.createElement('div');
    wrap.className = 'panel-section';
    wrap.innerHTML = `<h4>📚 Theory</h4><div class="info-box">${info}</div>`;
    el.appendChild(wrap);
  }

  // Procedure
  if (procedure) {
    const items = procedure.map((s, i) => `<li><span class="proc-num">${i+1}</span>${s}</li>`).join('');
    const wrap = document.createElement('div');
    wrap.className = 'panel-section';
    wrap.innerHTML = `<h4>🔬 Procedure</h4><ul class="procedure-list">${items}</ul>`;
    el.appendChild(wrap);
  }

  return el;
}

function makePanelSection(title, inner) {
  const el = document.createElement('div');
  el.className = 'panel-section';
  el.innerHTML = `<h4>${title}</h4>${inner}`;
  return el;
}

function setReadout(id, val) {
  const el = document.getElementById('ro-' + id);
  if (el) el.textContent = val;
}

/* ══════════ Quiz System ══════════ */
const QUIZZES = {
  projectile: {
    title: '🚀 Quiz: Projectile Motion',
    questions: [
      {
        q: 'At what launch angle does a projectile achieve maximum horizontal range?',
        options: ['30°', '45°', '60°', '90°'],
        answer: 1,
      },
      {
        q: 'Which component of projectile velocity is constant throughout the flight (ignoring air resistance)?',
        options: ['Vertical component', 'Horizontal component', 'Both components', 'Neither component'],
        answer: 1,
      },
      {
        q: 'What is the acceleration of a projectile at its highest point?',
        options: ['Zero', '9.8 m/s² downward', '9.8 m/s² upward', 'Equal to initial velocity'],
        answer: 1,
      },
    ],
  },
  pendulum: {
    title: '🕰️ Quiz: Simple Pendulum',
    questions: [
      {
        q: 'The period of a pendulum depends on which factor?',
        options: ['Mass of bob', 'Length of string', 'Amplitude (small)', 'Both mass and amplitude'],
        answer: 1,
      },
      {
        q: 'If you double the length of a pendulum, what happens to its period?',
        options: ['Doubles', 'Quadruples', 'Increases by √2', 'Stays the same'],
        answer: 2,
      },
      {
        q: 'At which point does a pendulum have maximum kinetic energy?',
        options: ['At the highest point', 'At the lowest point', 'At 45° from vertical', 'Always equal'],
        answer: 1,
      },
    ],
  },
  optics: {
    title: '🔭 Quiz: Ray Optics',
    questions: [
      {
        q: 'Snell\'s Law describes which phenomenon?',
        options: ['Reflection', 'Refraction', 'Diffraction', 'Interference'],
        answer: 1,
      },
      {
        q: 'A convex lens is also known as a:',
        options: ['Diverging lens', 'Concave lens', 'Converging lens', 'Plane mirror'],
        answer: 2,
      },
      {
        q: 'What happens to light traveling from a denser to rarer medium at the critical angle?',
        options: ['Total internal reflection', 'Total refraction', 'Absorption', 'Diffraction'],
        answer: 0,
      },
    ],
  },
  circuits: {
    title: '⚡ Quiz: Electric Circuits',
    questions: [
      {
        q: 'Ohm\'s Law states that V = ?',
        options: ['P × R', 'I × R', 'I / R', 'R / I'],
        answer: 1,
      },
      {
        q: 'In a parallel circuit, which quantity is the same across all branches?',
        options: ['Current', 'Resistance', 'Voltage', 'Power'],
        answer: 2,
      },
      {
        q: 'What is the equivalent resistance of two 10Ω resistors in series?',
        options: ['5Ω', '10Ω', '20Ω', '100Ω'],
        answer: 2,
      },
    ],
  },
  waves: {
    title: '🌊 Quiz: Wave Interference',
    questions: [
      {
        q: 'Constructive interference occurs when two waves are:',
        options: ['Out of phase by 180°', 'In phase (0° phase difference)', 'Perpendicular', 'Different frequencies'],
        answer: 1,
      },
      {
        q: 'The principle of superposition states that:',
        options: ['Waves cancel always', 'Resultant displacement equals algebraic sum of individual displacements', 'Frequency doubles', 'Amplitude stays constant'],
        answer: 1,
      },
      {
        q: 'In a standing wave, points with zero displacement are called:',
        options: ['Antinodes', 'Crests', 'Nodes', 'Troughs'],
        answer: 2,
      },
    ],
  },
};

let currentQuizData = null;
let quizSelections = [];

function openQuiz(expId) {
  currentQuizData = QUIZZES[expId];
  quizSelections = new Array(currentQuizData.questions.length).fill(null);

  document.getElementById('quiz-title').textContent = currentQuizData.title;
  const body = document.getElementById('quiz-body');
  body.innerHTML = currentQuizData.questions.map((q, qi) => `
    <div class="quiz-question">
      <p>${qi + 1}. ${q.q}</p>
      <div class="quiz-options">
        ${q.options.map((opt, oi) => `
          <label class="quiz-option" id="opt-${qi}-${oi}" onclick="selectOpt(${qi},${oi})">
            <input type="radio" name="q${qi}" value="${oi}" />
            <span class="quiz-dot"></span>
            ${opt}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  document.getElementById('quiz-modal').classList.remove('hidden');
}

function selectOpt(qi, oi) {
  quizSelections[qi] = oi;
  const q = currentQuizData.questions[qi];
  for (let i = 0; i < q.options.length; i++) {
    const el = document.getElementById(`opt-${qi}-${i}`);
    if (el) { el.classList.remove('selected'); }
  }
  const sel = document.getElementById(`opt-${qi}-${oi}`);
  if (sel) sel.classList.add('selected');
}

function submitQuiz() {
  if (!currentQuizData) return;
  let correct = 0;
  currentQuizData.questions.forEach((q, qi) => {
    const userAns = quizSelections[qi];
    for (let oi = 0; oi < q.options.length; oi++) {
      const el = document.getElementById(`opt-${qi}-${oi}`);
      if (!el) continue;
      if (oi === q.answer) el.classList.add('correct');
      else if (oi === userAns && oi !== q.answer) el.classList.add('wrong');
    }
    if (userAns === q.answer) correct++;
  });
  const score = Math.round((correct / currentQuizData.questions.length) * 100);
  document.getElementById('quiz-submit-btn').disabled = true;
  document.getElementById('quiz-submit-btn').textContent = `${correct}/${currentQuizData.questions.length} Correct`;

  // Show result after delay
  setTimeout(() => {
    closeQuiz();
    showResult(AppState.currentExperiment, score);
    recordScore(AppState.currentExperiment, score);
  }, 1800);
}

function closeQuiz() {
  document.getElementById('quiz-modal').classList.add('hidden');
  document.getElementById('quiz-submit-btn').disabled = false;
  document.getElementById('quiz-submit-btn').textContent = 'Submit Answers';
}

/* ══════════ Result Modal ══════════ */
function showResult(expId, score) {
  const stars = score >= 90 ? '⭐⭐⭐' : score >= 60 ? '⭐⭐' : '⭐';
  const icon  = score >= 90 ? '🎉' : score >= 60 ? '👍' : '💡';
  const msgs  = {
    90: 'Outstanding! You have mastered this experiment!',
    60: 'Good work! Keep practicing to perfect your understanding.',
    0:  'Keep experimenting! Physics takes practice.'
  };
  const msg = score >= 90 ? msgs[90] : score >= 60 ? msgs[60] : msgs[0];

  document.getElementById('result-icon').textContent = icon;
  document.getElementById('result-title').textContent = score >= 90 ? 'Excellent!' : 'Experiment Complete!';
  document.getElementById('result-desc').textContent = msg;
  document.getElementById('result-score').textContent = score;
  document.getElementById('result-stars').textContent = stars;
  document.getElementById('result-modal').classList.remove('hidden');
}

function closeResult() {
  document.getElementById('result-modal').classList.add('hidden');
}
