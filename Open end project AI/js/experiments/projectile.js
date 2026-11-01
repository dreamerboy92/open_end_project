/* ─── projectile.js ─── Projectile Motion Experiment ─── */

window.launchProjectile = function(container) {
  let animId = null;
  let isRunning = false;

  // Layout
  const layout = document.createElement('div');
  layout.className = 'exp-layout';

  /* ── Left Panel ── */
  const panel = makePanel({
    controls: [
      { id: 'p-velocity', label: 'Initial Velocity', min: 5, max: 60, defaultVal: 30, unit: 'm/s',
        oninput: 'updateProjectileParams()' },
      { id: 'p-angle',    label: 'Launch Angle',    min: 5, max: 85, defaultVal: 45, unit: '°',
        oninput: 'updateProjectileParams()' },
      { id: 'p-gravity',  label: 'Gravity',          min: 1, max: 25, defaultVal: 10, unit: 'm/s²',
        oninput: 'updateProjectileParams()' },
    ],
    readouts: [
      { id: 'p-range',   label: 'Max Range' },
      { id: 'p-height',  label: 'Max Height' },
      { id: 'p-time',    label: 'Flight Time' },
      { id: 'p-vx',      label: 'Vx (horizontal)' },
      { id: 'p-vy0',     label: 'Vy₀ (vertical)' },
    ],
    formula: 'R = v²·sin(2θ)/g<br>H = v²·sin²θ/(2g)<br>T = 2v·sinθ/g',
    actions: [
      { label: '🚀 Launch!', cls: 'launch', onclick: 'startProjectile()' },
      { label: '↺ Reset',   cls: 'reset',  onclick: 'resetProjectile()' },
      { label: '📝 Take Quiz', cls: 'quiz-btn', onclick: 'openQuiz("projectile")' },
    ],
    info: `<strong>Projectile Motion</strong> occurs when an object is launched with an initial velocity and moves under gravity alone. The horizontal velocity is constant, while the vertical velocity changes due to gravity (${10} m/s²).`,
    procedure: [
      'Set the initial velocity using the slider',
      'Adjust the launch angle (45° gives max range)',
      'Change gravity to simulate other planets',
      'Click Launch to see the trajectory',
      'Observe live data and graph',
      'Complete the quiz to earn points',
    ],
  });

  /* ── Right Viewport ── */
  const viewport = document.createElement('div');
  viewport.className = 'exp-viewport';
  viewport.style.cssText = 'display:flex;flex-direction:column;';

  const canvas = document.createElement('canvas');
  canvas.id = 'projectile-canvas';
  canvas.style.cssText = 'flex:1;display:block;';

  const graphWrap = document.createElement('div');
  graphWrap.className = 'graph-wrap';
  graphWrap.style.cssText = 'position:absolute;bottom:60px;right:12px;width:180px;';
  graphWrap.innerHTML = `
    <div class="graph-title">Height vs Time</div>
    <canvas id="p-graph" width="180" height="90" style="display:block;"></canvas>
  `;

  viewport.appendChild(canvas);
  viewport.appendChild(graphWrap);
  layout.appendChild(panel);
  layout.appendChild(viewport);
  container.appendChild(layout);

  // Canvas 2D context
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || 800;
    H = canvas.height = canvas.offsetHeight || 500;
    drawScene();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // State
  let t = 0, trajectory = [], simRunning = false, simId = null;

  function getParams() {
    const v = parseFloat(document.getElementById('p-velocity')?.value || 30);
    const a = parseFloat(document.getElementById('p-angle')?.value   || 45);
    const g = parseFloat(document.getElementById('p-gravity')?.value || 10);
    return { v, a, g };
  }

  window.updateProjectileParams = function() {
    const { v, a, g } = getParams();
    setReadout('p-range',  Physics.projectileRange(v,a,g).toFixed(1) + ' m');
    setReadout('p-height', Physics.projectileMaxHeight(v,a,g).toFixed(1) + ' m');
    setReadout('p-time',   Physics.projectileTimeOfFlight(v,a,g).toFixed(2) + ' s');
    setReadout('p-vx',     (v * Math.cos(a*Math.PI/180)).toFixed(2) + ' m/s');
    setReadout('p-vy0',    (v * Math.sin(a*Math.PI/180)).toFixed(2) + ' m/s');
    drawScene();
  };
  window.updateProjectileParams();

  function drawScene(animT = -1) {
    ctx.clearRect(0, 0, W, H);

    const { v, a, g } = getParams();
    const T   = Physics.projectileTimeOfFlight(v, a, g);
    const R   = Physics.projectileRange(v, a, g);
    const Hmax= Physics.projectileMaxHeight(v, a, g);

    // Padding/scale
    const padL = 60, padB = 50, padT = 40, padR = 20;
    const scaleX = (W - padL - padR)  / (R  * 1.1 || 1);
    const scaleY = (H - padB - padT)  / (Hmax * 1.4 || 1);

    function px(x) { return padL + x * scaleX; }
    function py(y) { return H - padB - y * scaleY; }

    // Background grid
    ctx.strokeStyle = 'rgba(0,212,255,0.05)';
    ctx.lineWidth = 1;
    for (let xi = 0; xi <= 10; xi++) {
      const x = padL + xi * (W - padL - padR) / 10;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke();
    }
    for (let yi = 0; yi <= 6; yi++) {
      const y = padT + yi * (H - padB - padT) / 6;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }

    // Ground & axes
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(0,212,255,0.6)';
    ctx.font = '11px Space Mono, monospace';
    ctx.fillText('X (m)', W - padR - 20, H - padB + 35);
    ctx.save(); ctx.translate(15, H/2); ctx.rotate(-Math.PI/2); ctx.fillText('Y (m)', 0, 0); ctx.restore();
    ctx.fillStyle = '#7a8fa6'; ctx.font = '10px monospace';
    ctx.fillText('0', padL - 12, H - padB + 4);
    ctx.fillText(R.toFixed(0), px(R) - 10, H - padB + 15);
    ctx.fillText(Hmax.toFixed(1), padL - 40, py(Hmax) + 4);

    // Draw full trajectory (preview ghost)
    const steps = 120;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= steps; i++) {
      const ti = (i / steps) * T;
      const xi = Physics.projectileX(v, a, ti);
      const yi = Physics.projectileY(v, a, ti, g);
      if (yi < 0) break;
      if (!started) { ctx.moveTo(px(xi), py(yi)); started = true; }
      else ctx.lineTo(px(xi), py(yi));
    }
    ctx.strokeStyle = 'rgba(0,212,255,0.2)';
    ctx.lineWidth = 2; ctx.setLineDash([5,5]); ctx.stroke(); ctx.setLineDash([]);

    // Draw live trajectory
    if (trajectory.length > 1) {
      ctx.beginPath();
      trajectory.forEach((pt, i) => {
        const fn = i === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](px(pt.x), py(pt.y));
      });
      const grad = ctx.createLinearGradient(px(0), 0, px(R), 0);
      grad.addColorStop(0, '#00d4ff');
      grad.addColorStop(1, '#7c3aed');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3; ctx.stroke();
    }

    // Draw projectile ball
    if (animT >= 0) {
      const bx = Physics.projectileX(v, a, animT);
      const by = Physics.projectileY(v, a, animT, g);
      const bpx = px(bx), bpy = py(by);

      // Trail glow
      const grd = ctx.createRadialGradient(bpx, bpy, 0, bpx, bpy, 18);
      grd.addColorStop(0, 'rgba(0,212,255,0.3)');
      grd.addColorStop(1, 'rgba(0,212,255,0)');
      ctx.beginPath(); ctx.arc(bpx, bpy, 18, 0, Math.PI*2);
      ctx.fillStyle = grd; ctx.fill();

      // Ball
      ctx.beginPath(); ctx.arc(bpx, bpy, 8, 0, Math.PI*2);
      ctx.fillStyle = '#00d4ff';
      ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 12;
      ctx.fill(); ctx.shadowBlur = 0;

      // Velocity vectors
      const vx = v * Math.cos(a * Math.PI/180);
      const vy = v * Math.sin(a * Math.PI/180) - g * animT;
      const scale = 3;
      drawArrow(ctx, bpx, bpy, bpx + vx*scale, bpy, 'rgba(255,200,0,0.8)');
      drawArrow(ctx, bpx, bpy, bpx, bpy - vy*scale, 'rgba(0,255,128,0.8)');

      // AR-style readout
      ctx.fillStyle = 'rgba(0,212,255,0.15)'; ctx.strokeStyle = 'rgba(0,212,255,0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, bpx+14, bpy-38, 110, 34, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#00d4ff'; ctx.font = '10px monospace';
      ctx.fillText(`x: ${bx.toFixed(1)}m`, bpx+20, bpy-22);
      ctx.fillText(`y: ${Math.max(0,by).toFixed(1)}m`, bpx+20, bpy-10);
    }

    // Launch cannon
    const cw = 30, ch = 14;
    const angleRad = a * Math.PI / 180;
    ctx.save();
    ctx.translate(px(0), py(0));
    ctx.rotate(-angleRad);
    ctx.fillStyle = '#7c3aed';
    ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 10;
    ctx.fillRect(0, -ch/2, cw, ch);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Cannon base
    ctx.beginPath(); ctx.arc(px(0), py(0), 10, 0, Math.PI*2);
    ctx.fillStyle = '#5b21b6'; ctx.fill();

    // Landing point marker
    if (R > 0) {
      ctx.beginPath(); ctx.moveTo(px(R), py(0)); ctx.lineTo(px(R)-6, py(0)-12); ctx.lineTo(px(R)+6, py(0)-12);
      ctx.closePath(); ctx.fillStyle = 'rgba(16,185,129,0.7)'; ctx.fill();
    }
  }

  function drawArrow(ctx, x1, y1, x2, y2, color) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    const angle = Math.atan2(y2-y1, x2-x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8*Math.cos(angle-0.4), y2 - 8*Math.sin(angle-0.4));
    ctx.lineTo(x2 - 8*Math.cos(angle+0.4), y2 - 8*Math.sin(angle+0.4));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x, y+r); ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
  }

  function updateGraph(pts) {
    const gc = document.getElementById('p-graph');
    if (!gc) return;
    const gctx = gc.getContext('2d');
    const gw = gc.width, gh = gc.height;
    gctx.clearRect(0,0,gw,gh);
    gctx.fillStyle = '#050b14'; gctx.fillRect(0,0,gw,gh);
    if (pts.length < 2) return;
    const maxT = pts[pts.length-1].t;
    const maxY = Math.max(...pts.map(p=>p.y), 1);
    gctx.beginPath();
    pts.forEach((p,i) => {
      const x = (p.t/maxT)*(gw-10)+5;
      const y = gh - (p.y/maxY)*(gh-10)-5;
      if (i===0) gctx.moveTo(x,y); else gctx.lineTo(x,y);
    });
    gctx.strokeStyle='#00d4ff'; gctx.lineWidth=2; gctx.stroke();
    gctx.fillStyle='rgba(0,212,255,0.1)';
    gctx.lineTo((pts[pts.length-1].t/maxT)*(gw-10)+5, gh);
    gctx.lineTo(5,gh); gctx.closePath(); gctx.fill();
  }

  window.startProjectile = function() {
    if (simId) cancelAnimationFrame(simId);
    trajectory = [];
    const { v, a, g } = getParams();
    const T = Physics.projectileTimeOfFlight(v, a, g);
    let animT = 0;
    const graphPts = [];
    const speed = 1.5;

    function step() {
      if (animT > T) {
        drawScene(-1);
        return;
      }
      const x = Physics.projectileX(v, a, animT);
      const y = Math.max(0, Physics.projectileY(v, a, animT, g));
      trajectory.push({ x, y });
      graphPts.push({ t: animT, y });
      drawScene(animT);
      updateGraph(graphPts);

      // Live readout update
      const vy = v * Math.sin(a*Math.PI/180) - g*animT;
      setReadout('p-range',  Physics.projectileRange(v,a,g).toFixed(1)+' m');
      setReadout('p-height', y.toFixed(1)+' m');
      setReadout('p-time',   animT.toFixed(2)+' s');
      setReadout('p-vx',     (v*Math.cos(a*Math.PI/180)).toFixed(2)+' m/s');
      setReadout('p-vy0',    vy.toFixed(2)+' m/s');

      animT += 0.016 * speed;
      simId = requestAnimationFrame(step);
    }
    simId = requestAnimationFrame(step);
  };

  window.resetProjectile = function() {
    if (simId) cancelAnimationFrame(simId);
    trajectory = [];
    window.updateProjectileParams();
  };

  window._stopCurrentExperiment = () => {
    if (simId) cancelAnimationFrame(simId);
    ro.disconnect();
  };

  // Init sliders visual state
  document.querySelectorAll('input[type=range]').forEach(trackSlider);
};
