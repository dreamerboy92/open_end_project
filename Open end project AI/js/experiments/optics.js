/* ─── optics.js ─── Ray Optics Experiment ─── */

window.launchOptics = function(container) {
  let animId = null;

  const layout = document.createElement('div');
  layout.className = 'exp-layout';

  /* ── Panel ── */
  const panel = makePanel({
    controls: [
      { id: 'op-n1',     label: 'Medium 1 (n₁)', min: 1.0, max: 2.5, defaultVal: 1.0, step: 0.01, unit: '',
        oninput: 'drawOptics()' },
      { id: 'op-n2',     label: 'Medium 2 (n₂)', min: 1.0, max: 2.5, defaultVal: 1.5, step: 0.01, unit: '',
        oninput: 'drawOptics()' },
      { id: 'op-angle',  label: 'Incident Angle',  min: 1,   max: 89,  defaultVal: 45, unit: '°',
        oninput: 'drawOptics()' },
      { id: 'op-focal',  label: 'Focal Length',    min: 50,  max: 250, defaultVal: 120, unit: 'px',
        oninput: 'drawOptics()' },
    ],
    readouts: [
      { id: 'op-refr',   label: 'Refracted Angle' },
      { id: 'op-crit',   label: 'Critical Angle' },
      { id: 'op-tir',    label: 'Total Int. Reflection' },
      { id: 'op-speed1', label: 'Speed in Medium 1' },
      { id: 'op-speed2', label: 'Speed in Medium 2' },
    ],
    formula: 'n₁·sinθ₁ = n₂·sinθ₂<br>θ_c = arcsin(n₂/n₁)<br>1/f = 1/v - 1/u',
    actions: [
      { label: '▶ Animate Ray', cls: 'launch', onclick: 'animateRay()' },
      { label: '↺ Reset', cls: 'reset', onclick: 'drawOptics()' },
      { label: '📝 Take Quiz', cls: 'quiz-btn', onclick: 'openQuiz("optics")' },
    ],
    info: `<strong>Snell's Law:</strong> When light passes from one medium to another, it bends. n₁sinθ₁ = n₂sinθ₂.<br><br>
    Common indices: Air=1.0, Water=1.33, Glass=1.5, Diamond=2.42.<br><br>
    <strong>Total Internal Reflection</strong> occurs when θ₁ > θ_critical (light going denser→rarer).`,
    procedure: [
      'Set n₁ (first medium, e.g. air=1.0)',
      'Set n₂ (second medium, e.g. glass=1.5)',
      'Adjust incident angle with slider',
      'Observe the refracted and reflected rays',
      'Try n₁ > n₂ and large angles for TIR',
      'Check critical angle in readouts',
    ],
  });

  /* ── Viewport ── */
  const viewport = document.createElement('div');
  viewport.className = 'exp-viewport';
  const canvas = document.createElement('canvas');
  canvas.id = 'optics-canvas';
  canvas.style.cssText = 'width:100%;height:100%;display:block;';
  viewport.appendChild(canvas);
  layout.appendChild(panel);
  layout.appendChild(viewport);
  container.appendChild(layout);

  const ctx = canvas.getContext('2d');
  let W, H;
  const ro = new ResizeObserver(() => { W=canvas.width=canvas.offsetWidth||700; H=canvas.height=canvas.offsetHeight||500; drawOptics(); });
  ro.observe(canvas);
  W=canvas.width=canvas.offsetWidth||700; H=canvas.height=canvas.offsetHeight||500;

  let rayT = 0, rayAnim = false;

  function getP() {
    return {
      n1: parseFloat(document.getElementById('op-n1')?.value    || 1.0),
      n2: parseFloat(document.getElementById('op-n2')?.value    || 1.5),
      ang: parseFloat(document.getElementById('op-angle')?.value || 45),
      f:   parseFloat(document.getElementById('op-focal')?.value || 120),
    };
  }

  window.drawOptics = function(rT = 1) {
    const { n1, n2, ang, f } = getP();
    ctx.clearRect(0,0,W,H);

    // BG
    const half = H/2;
    ctx.fillStyle='#060d18'; ctx.fillRect(0,0,W,H);

    // Medium 1 label
    ctx.fillStyle='rgba(0,212,255,0.05)'; ctx.fillRect(0,0,W,half);
    ctx.fillStyle='rgba(124,58,237,0.08)'; ctx.fillRect(0,half,W,H-half);

    // Medium labels
    ctx.font='13px monospace'; ctx.fillStyle='rgba(0,212,255,0.4)';
    ctx.fillText(`Medium 1 — n₁ = ${n1.toFixed(2)}`, 16, 28);
    ctx.fillStyle='rgba(124,58,237,0.6)';
    ctx.fillText(`Medium 2 — n₂ = ${n2.toFixed(2)}`, 16, H-14);

    // Interface line
    const grad = ctx.createLinearGradient(0, half, W, half);
    grad.addColorStop(0,'rgba(0,212,255,0.0)');
    grad.addColorStop(0.5,'rgba(0,212,255,0.5)');
    grad.addColorStop(1,'rgba(0,212,255,0.0)');
    ctx.beginPath(); ctx.moveTo(0,half); ctx.lineTo(W,half);
    ctx.strokeStyle=grad; ctx.lineWidth=2; ctx.stroke();

    // Normal line
    const normX = W/2;
    ctx.beginPath(); ctx.moveTo(normX, half-140); ctx.lineTo(normX, half+140);
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.setLineDash([5,5]); ctx.stroke(); ctx.setLineDash([]);

    // Compute
    const θ1 = ang * Math.PI / 180;
    const θ2_deg = Physics.snellsLaw(n1, n2, ang);
    const θ2 = θ2_deg !== null ? θ2_deg * Math.PI / 180 : null;
    const isTIR = θ2 === null;

    const rayLen = 160;
    const incX = normX - Math.sin(θ1)*rayLen;
    const incY = half  - Math.cos(θ1)*rayLen;

    // Draw incident ray (progress = rT)
    const ipX = normX + (incX-normX)*(1-rT), ipY = half + (incY-half)*(1-rT);
    ctx.beginPath(); ctx.moveTo(ipX, ipY); ctx.lineTo(normX, half);
    drawGlowLine(ctx, incX, incY, normX, half, '#ffdd57', 2, rT);

    // Angle arc for θ1
    ctx.beginPath(); ctx.arc(normX, half, 40, -Math.PI/2, -Math.PI/2+θ1, false);
    ctx.strokeStyle='rgba(255,221,87,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='rgba(255,221,87,0.7)'; ctx.font='11px monospace';
    ctx.fillText(`θ₁=${ang}°`, normX+18, half-30);

    if (!isTIR && rT > 0.5) {
      // Refracted ray
      const refX = normX + Math.sin(θ2)*rayLen;
      const refY = half  + Math.cos(θ2)*rayLen;
      const t2 = (rT-0.5)*2;
      drawGlowLine(ctx, normX, half, normX+(refX-normX)*t2, half+(refY-half)*t2, '#7c3aed', 2.5, 1);
      // θ2 arc
      ctx.beginPath(); ctx.arc(normX, half, 40, Math.PI/2-θ2, Math.PI/2, false);
      ctx.strokeStyle='rgba(167,139,250,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='rgba(167,139,250,0.7)'; ctx.font='11px monospace';
      ctx.fillText(`θ₂=${θ2_deg.toFixed(1)}°`, normX+8, half+35);
    }

    // Reflected ray
    if (rT > 0.5) {
      const refRX = normX + Math.sin(θ1)*rayLen;
      const refRY = half  - Math.cos(θ1)*rayLen;
      const t2 = (rT-0.5)*2;
      const col = isTIR ? '#ff4d6d' : '#00d4ff44';
      drawGlowLine(ctx, normX, half, normX+(refRX-normX)*t2, half+(refRY-half)*t2, isTIR ? '#ff4d6d' : 'rgba(0,212,255,0.3)', isTIR?2.5:1.5, 1);
      if (isTIR) {
        ctx.fillStyle='rgba(255,77,109,0.15)'; ctx.fillRect(0,0,W,half);
        ctx.font='bold 14px monospace'; ctx.fillStyle='#ff4d6d';
        ctx.fillText('⚡ TOTAL INTERNAL REFLECTION', W/2-130, half-10);
      }
    }

    // Convex lens (on the right side)
    const lx = W*0.75, ly = H*0.5;
    drawLens(ctx, lx, ly, f);

    // Compute readouts
    const c = 3e8;
    setReadout('op-refr',   θ2_deg !== null ? θ2_deg.toFixed(2)+'°' : 'TIR');
    const θc_deg = n1 > n2 ? (Math.asin(n2/n1)*180/Math.PI).toFixed(2)+'°' : 'N/A (n₁<n₂)';
    setReadout('op-crit',   θc_deg);
    setReadout('op-tir',    isTIR ? '✅ YES' : '❌ No');
    setReadout('op-speed1', ((c/n1)/1e8).toFixed(3)+'×10⁸ m/s');
    setReadout('op-speed2', ((c/n2)/1e8).toFixed(3)+'×10⁸ m/s');
  };

  function drawGlowLine(ctx, x1, y1, x2, y2, color, lw, progress) {
    const mx = x1+(x2-x1)*progress, my = y1+(y2-y1)*progress;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(mx,my);
    ctx.strokeStyle=color; ctx.lineWidth=lw+2;
    ctx.shadowColor=color; ctx.shadowBlur=8;
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(mx,my);
    ctx.strokeStyle=color; ctx.lineWidth=lw;
    ctx.shadowBlur=0; ctx.stroke();
    // Moving photon dot
    if (progress < 1) {
      ctx.beginPath(); ctx.arc(mx,my,5,0,Math.PI*2);
      ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10; ctx.fill(); ctx.shadowBlur=0;
    }
  }

  function drawLens(ctx, cx, cy, f) {
    const lh = 120, lw2 = 18;
    ctx.beginPath();
    ctx.moveTo(cx, cy-lh/2);
    ctx.quadraticCurveTo(cx+lw2, cy, cx, cy+lh/2);
    ctx.quadraticCurveTo(cx-lw2, cy, cx, cy-lh/2);
    ctx.fillStyle='rgba(0,180,255,0.08)';
    ctx.strokeStyle='rgba(0,212,255,0.5)'; ctx.lineWidth=2;
    ctx.shadowColor='#00d4ff'; ctx.shadowBlur=8;
    ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
    // Focal points
    const fp1 = cx+f, fp2 = cx-f;
    [fp1,fp2].forEach(fx => {
      ctx.beginPath(); ctx.arc(fx, cy, 5, 0, Math.PI*2);
      ctx.fillStyle='#00d4ff'; ctx.fill();
      ctx.fillStyle='rgba(0,212,255,0.6)'; ctx.font='10px monospace';
      ctx.fillText('F', fx-4, cy-10);
    });
    ctx.beginPath(); ctx.moveTo(cx,cy-lh/2-12); ctx.lineTo(cx,cy+lh/2+12);
    ctx.strokeStyle='rgba(0,212,255,0.2)'; ctx.lineWidth=1; ctx.stroke();
    // Label
    ctx.fillStyle='rgba(0,212,255,0.6)'; ctx.font='11px monospace';
    ctx.fillText(`Convex Lens`, cx-35, cy+lh/2+20);
    ctx.fillText(`f=${f}px`, cx-18, cy-lh/2-16);
  }

  window.animateRay = function() {
    rayAnim = true;
    rayT = 0;
    if (animId) cancelAnimationFrame(animId);
    function step() {
      rayT = Math.min(rayT + 0.015, 1);
      drawOptics(rayT);
      if (rayT < 1) animId = requestAnimationFrame(step);
      else { rayAnim = false; animId = null; }
    }
    animId = requestAnimationFrame(step);
  };

  window._stopCurrentExperiment = () => { cancelAnimationFrame(animId); ro.disconnect(); };
  drawOptics();
  document.querySelectorAll('input[type=range]').forEach(trackSlider);
  setTimeout(() => window.animateRay(), 500);
};
