/* ─── pendulum.js ─── Simple Pendulum Experiment ─── */

window.launchPendulum = function(container) {
  let animId = null;

  const layout = document.createElement('div');
  layout.className = 'exp-layout';

  /* ── Panel ── */
  const panel = makePanel({
    controls: [
      { id: 'pen-length',    label: 'String Length', min: 0.2, max: 3.0, defaultVal: 1.0, step: 0.1, unit: 'm',
        oninput: 'updatePendulumParams()' },
      { id: 'pen-amplitude', label: 'Amplitude',     min: 5,   max: 60,  defaultVal: 30,  unit: '°',
        oninput: 'updatePendulumParams()' },
      { id: 'pen-gravity',   label: 'Gravity',       min: 1,   max: 25,  defaultVal: 9.81, step: 0.01, unit: 'm/s²',
        oninput: 'updatePendulumParams()' },
      { id: 'pen-damping',   label: 'Damping',       min: 0,   max: 0.5, defaultVal: 0.02, step: 0.01, unit: '',
        oninput: '' },
    ],
    readouts: [
      { id: 'pen-period',  label: 'Period (T)' },
      { id: 'pen-freq',    label: 'Frequency (f)' },
      { id: 'pen-omega',   label: 'Angular Velocity (ω)' },
      { id: 'pen-angle',   label: 'Current Angle' },
      { id: 'pen-vel',     label: 'Velocity' },
      { id: 'pen-ke',      label: 'Kinetic Energy' },
      { id: 'pen-pe',      label: 'Potential Energy' },
    ],
    formula: 'T = 2π√(L/g)<br>ω = √(g/L)<br>f = 1/T',
    actions: [
      { label: '▶ Start / Pause', cls: 'launch', onclick: 'togglePendulum()' },
      { label: '↺ Reset', cls: 'reset', onclick: 'resetPendulum()' },
      { label: '📝 Take Quiz', cls: 'quiz-btn', onclick: 'openQuiz("pendulum")' },
    ],
    info: `<strong>Simple Pendulum SHM:</strong> For small angles, the restoring force is F = -mg·sinθ ≈ -mgθ. The period T = 2π√(L/g) depends only on length and gravity, NOT on mass or amplitude (small angles).`,
    procedure: [
      'Adjust the string length',
      'Set the initial amplitude (angle)',
      'Observe how period changes with length',
      'Try different gravity values (Moon: 1.6, Mars: 3.7)',
      'Observe energy exchange between KE and PE',
      'Complete the quiz',
    ],
  });

  /* ── Viewport ── */
  const viewport = document.createElement('div');
  viewport.className = 'exp-viewport';

  const canvas = document.createElement('canvas');
  canvas.id = 'pendulum-canvas';
  canvas.style.cssText = 'width:100%;height:100%;display:block;';

  viewport.appendChild(canvas);
  layout.appendChild(panel);
  layout.appendChild(viewport);
  container.appendChild(layout);

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || 700;
    H = canvas.height = canvas.offsetHeight || 500;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let simTime = 0, running = false;
  let currentAngle = 0, currentVel = 0;
  let trailPoints = [];
  const MAX_TRAIL = 120;

  function getParams() {
    const L = parseFloat(document.getElementById('pen-length')?.value    || 1.0);
    const A = parseFloat(document.getElementById('pen-amplitude')?.value || 30);
    const g = parseFloat(document.getElementById('pen-gravity')?.value   || 9.81);
    const d = parseFloat(document.getElementById('pen-damping')?.value   || 0.02);
    return { L, A, g, d };
  }

  window.updatePendulumParams = function() {
    const { L, g } = getParams();
    const T = Physics.pendulumPeriod(L, g);
    setReadout('pen-period', T.toFixed(3) + ' s');
    setReadout('pen-freq',   (1/T).toFixed(3) + ' Hz');
    setReadout('pen-omega',  Physics.pendulumOmega(L, g).toFixed(3) + ' rad/s');
  };
  window.updatePendulumParams();

  function drawPendulum(angle) {
    ctx.clearRect(0, 0, W, H);

    const { L, g } = getParams();
    const pivotX = W / 2, pivotY = 80;
    const pixL = Math.min(H - 140, 300) * (L / 3);
    const bobX = pivotX + Math.sin(angle) * pixL;
    const bobY = pivotY + Math.cos(angle) * pixL;
    const bobR = 18;

    // Background gradient
    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/2);
    bg.addColorStop(0, '#0a111f');
    bg.addColorStop(1, '#060a14');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,212,255,0.04)'; ctx.lineWidth=1;
    for (let i=0;i<W;i+=40){ ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke(); }
    for (let i=0;i<H;i+=40){ ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(W,i);ctx.stroke(); }

    // Pivot support
    ctx.fillStyle = '#1e2840';
    ctx.fillRect(pivotX-40, 0, 80, pivotY);
    ctx.strokeStyle='rgba(0,212,255,0.3)'; ctx.lineWidth=1;
    ctx.strokeRect(pivotX-40, 0, 80, pivotY);

    // Equilibrium line
    ctx.beginPath();
    ctx.setLineDash([4,6]);
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + pixL + 30);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.stroke();
    ctx.setLineDash([]);

    // Arc of motion
    const maxA = parseFloat(document.getElementById('pen-amplitude')?.value || 30) * Math.PI/180;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, pixL, Math.PI/2 - maxA, Math.PI/2 + maxA);
    ctx.strokeStyle='rgba(0,212,255,0.15)'; ctx.lineWidth=2; ctx.stroke();

    // Trail
    if (trailPoints.length > 1) {
      ctx.beginPath();
      trailPoints.forEach((pt, i) => {
        const alpha = i / trailPoints.length * 0.6;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else { ctx.lineTo(pt.x, pt.y); }
      });
      ctx.strokeStyle = 'rgba(124,58,237,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    }
    trailPoints.push({ x: bobX, y: bobY });
    if (trailPoints.length > MAX_TRAIL) trailPoints.shift();

    // String shadow
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.strokeStyle = 'rgba(0,212,255,0.15)'; ctx.lineWidth = 8; ctx.stroke();

    // String
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    const strGrad = ctx.createLinearGradient(pivotX, pivotY, bobX, bobY);
    strGrad.addColorStop(0, '#7c3aed');
    strGrad.addColorStop(1, '#00d4ff');
    ctx.strokeStyle = strGrad; ctx.lineWidth = 3; ctx.stroke();

    // Velocity vector
    const vel = currentVel;
    const velScale = 40;
    const vx = Math.cos(angle) * vel * velScale;
    const vy = -Math.sin(angle) * vel * velScale;
    if (Math.abs(vel) > 0.02) {
      ctx.beginPath(); ctx.moveTo(bobX, bobY); ctx.lineTo(bobX+vx, bobY+vy);
      ctx.strokeStyle='#10b981'; ctx.lineWidth=2.5; ctx.stroke();
    }

    // Bob glow
    const gr = ctx.createRadialGradient(bobX, bobY, 0, bobX, bobY, bobR*2.5);
    gr.addColorStop(0, 'rgba(124,58,237,0.4)');
    gr.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.beginPath(); ctx.arc(bobX, bobY, bobR*2.5, 0, Math.PI*2);
    ctx.fillStyle = gr; ctx.fill();

    // Bob
    const bobGr = ctx.createRadialGradient(bobX-5, bobY-5, 2, bobX, bobY, bobR);
    bobGr.addColorStop(0, '#a78bfa');
    bobGr.addColorStop(1, '#7c3aed');
    ctx.beginPath(); ctx.arc(bobX, bobY, bobR, 0, Math.PI*2);
    ctx.fillStyle = bobGr;
    ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 20;
    ctx.fill(); ctx.shadowBlur = 0;

    // Pivot
    ctx.beginPath(); ctx.arc(pivotX, pivotY, 8, 0, Math.PI*2);
    ctx.fillStyle='#00d4ff'; ctx.shadowColor='#00d4ff'; ctx.shadowBlur=10; ctx.fill(); ctx.shadowBlur=0;

    // AR label on bob
    ctx.fillStyle='rgba(124,58,237,0.2)'; ctx.strokeStyle='rgba(124,58,237,0.5)'; ctx.lineWidth=1;
    roundRectP(ctx, bobX+bobR+5, bobY-20, 100, 38, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#c4b5fd'; ctx.font='10px monospace';
    ctx.fillText(`θ = ${(angle*180/Math.PI).toFixed(1)}°`, bobX+bobR+10, bobY-7);
    ctx.fillText(`v = ${Math.abs(vel*pixL).toFixed(2)} m/s`, bobX+bobR+10, bobY+8);

    // Energy bar
    const m = 1, grav = parseFloat(document.getElementById('pen-gravity')?.value||9.81);
    const h = pixL - pixL * Math.cos(angle); // height from lowest
    const pe = m * grav * h * 0.1;
    const ke = 0.5 * m * Math.pow(vel * pixL * 0.1, 2);
    const totalE = pe + ke;

    drawEnergyBar(ctx, 20, H-100, 16, 120, pe, ke, totalE);

    // Angle arc
    const arcR = 40;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, arcR, Math.PI/2, Math.PI/2 + angle, angle < 0);
    ctx.strokeStyle = 'rgba(245,158,11,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle='rgba(245,158,11,0.7)'; ctx.font='11px monospace';
    ctx.fillText((angle*180/Math.PI).toFixed(0)+'°', pivotX+12, pivotY+30);
  }

  function drawEnergyBar(ctx, x, y, w, h, pe, ke, total) {
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    const peH = total > 0 ? (pe/total)*h : 0;
    const keH = total > 0 ? (ke/total)*h : 0;
    ctx.fillStyle='#7c3aed'; ctx.fillRect(x, y+h-peH, w, peH);
    ctx.fillStyle='#10b981'; ctx.fillRect(x, y+h-peH-keH, w, keH);
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='9px monospace';
    ctx.save(); ctx.translate(x-2, y+h/2); ctx.rotate(-Math.PI/2); ctx.fillText('ENERGY',0,0); ctx.restore();
    ctx.fillStyle='#a78bfa'; ctx.fillText('PE', x+1, y+h-peH/2+3);
    ctx.fillStyle='#6ee7b7'; ctx.fillText('KE', x+1, y+h-peH-keH/2+3);
  }

  function roundRectP(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
  }

  // Physics integration (RK4)
  let lastTime = null;
  function simulate(ts) {
    if (!running) return;
    if (lastTime === null) lastTime = ts;
    const dtRaw = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    const { L, g, d } = getParams();
    const omega2 = g / L;
    const damp = d;

    // RK4
    const dt = dtRaw;
    const k1a = currentVel;
    const k1v = -omega2 * Math.sin(currentAngle) - damp * currentVel;
    const k2a = currentVel + 0.5*dt*k1v;
    const k2v = -omega2*Math.sin(currentAngle+0.5*dt*k1a) - damp*(currentVel+0.5*dt*k1v);
    const k3a = currentVel + 0.5*dt*k2v;
    const k3v = -omega2*Math.sin(currentAngle+0.5*dt*k2a) - damp*(currentVel+0.5*dt*k2v);
    const k4a = currentVel + dt*k3v;
    const k4v = -omega2*Math.sin(currentAngle+dt*k3a) - damp*(currentVel+dt*k3v);

    currentAngle += (dt/6)*(k1a+2*k2a+2*k3a+k4a);
    currentVel   += (dt/6)*(k1v+2*k2v+2*k3v+k4v);
    simTime += dt;

    drawPendulum(currentAngle);

    // Update readouts
    const { L: len, g: grav } = getParams();
    const T = Physics.pendulumPeriod(len, grav);
    const pixL = Math.min(H-140, 300) * (len/3);
    const vel_ms = currentVel * pixL * 0.1;
    const h = pixL*(1-Math.cos(currentAngle))*0.1;
    const ke = 0.5*1*vel_ms*vel_ms;
    const pe = 1*grav*h;
    setReadout('pen-period', T.toFixed(3)+' s');
    setReadout('pen-freq',   (1/T).toFixed(3)+' Hz');
    setReadout('pen-omega',  (currentVel > 0 ? currentVel : -currentVel).toFixed(3)+' rad/s');
    setReadout('pen-angle',  (currentAngle*180/Math.PI).toFixed(1)+'°');
    setReadout('pen-vel',    vel_ms.toFixed(3)+' m/s');
    setReadout('pen-ke',     ke.toFixed(3)+' J');
    setReadout('pen-pe',     pe.toFixed(3)+' J');

    animId = requestAnimationFrame(simulate);
  }

  window.togglePendulum = function() {
    running = !running;
    if (running) {
      lastTime = null;
      animId = requestAnimationFrame(simulate);
    } else {
      cancelAnimationFrame(animId);
    }
  };

  window.resetPendulum = function() {
    running = false;
    cancelAnimationFrame(animId);
    const { A } = getParams();
    currentAngle = A * Math.PI / 180;
    currentVel = 0; simTime = 0; trailPoints = [];
    lastTime = null;
    drawPendulum(currentAngle);
  };

  window._stopCurrentExperiment = () => {
    running = false;
    cancelAnimationFrame(animId);
    ro.disconnect();
  };

  // Initialize
  const { A } = getParams();
  currentAngle = A * Math.PI / 180;
  drawPendulum(currentAngle);
  document.querySelectorAll('input[type=range]').forEach(trackSlider);
  window.togglePendulum(); // auto-start
};
