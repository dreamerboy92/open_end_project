/* ─── waves.js ─── Wave Interference Experiment ─── */

window.launchWaves = function(container) {
  let animId = null;
  let t = 0;

  const layout = document.createElement('div');
  layout.className = 'exp-layout';

  /* ── Panel ── */
  const panel = makePanel({
    controls: [
      { id: 'wv-f1',   label: 'Wave 1 Frequency', min: 0.2, max: 3.0, defaultVal: 1.0, step: 0.1, unit: 'Hz',
        oninput: '' },
      { id: 'wv-a1',   label: 'Wave 1 Amplitude',  min: 0.1, max: 1.0, defaultVal: 0.8, step: 0.05, unit: '',
        oninput: '' },
      { id: 'wv-f2',   label: 'Wave 2 Frequency', min: 0.2, max: 3.0, defaultVal: 1.0, step: 0.1, unit: 'Hz',
        oninput: '' },
      { id: 'wv-a2',   label: 'Wave 2 Amplitude',  min: 0.1, max: 1.0, defaultVal: 0.8, step: 0.05, unit: '',
        oninput: '' },
      { id: 'wv-phase','label': 'Phase Shift (Δφ)', min: 0, max: 360, defaultVal: 0, unit: '°',
        oninput: '' },
    ],
    readouts: [
      { id: 'wv-type',      label: 'Interference Type' },
      { id: 'wv-resultA',   label: 'Max Resultant Amp.' },
      { id: 'wv-beats',     label: 'Beat Frequency' },
      { id: 'wv-lambda1',   label: 'λ₁ (wave speed=1)' },
      { id: 'wv-lambda2',   label: 'λ₂ (wave speed=1)' },
    ],
    formula: 'y₁ = A₁·sin(2πf₁t - kx)<br>y₂ = A₂·sin(2πf₂t - kx + φ)<br>y = y₁ + y₂ (Superposition)<br>f_beat = |f₁ - f₂|',
    actions: [
      { label: '▶ Animate', cls: 'launch', onclick: 'startWaves()' },
      { label: '⏸ Pause',  cls: 'reset',  onclick: 'pauseWaves()' },
      { label: '📝 Take Quiz', cls: 'quiz-btn', onclick: 'openQuiz("waves")' },
    ],
    info: `<strong>Wave Superposition:</strong> When two waves overlap, their displacements add. Equal frequency + equal phase = <em>constructive</em> interference (amplitude doubles). Equal freq + 180° phase = <em>destructive</em> (cancellation).<br><br><strong>Beats:</strong> Slightly different frequencies create a beating pattern at f_beat = |f₁-f₂|.`,
    procedure: [
      'Set both frequencies equal (f₁=f₂) with phase 0°',
      'Observe constructive interference',
      'Change phase to 180° for destructive',
      'Make f₁≠f₂ slightly to create beats',
      'Observe the 2D interference pattern below',
      'Complete the quiz',
    ],
  });

  /* ── Viewport ── */
  const viewport = document.createElement('div');
  viewport.className = 'exp-viewport';
  viewport.style.cssText = 'display:flex;flex-direction:column;';

  const canvas = document.createElement('canvas');
  canvas.id = 'wave-canvas';
  canvas.style.cssText = 'width:100%;flex:1;display:block;';

  viewport.appendChild(canvas);
  layout.appendChild(panel);
  layout.appendChild(viewport);
  container.appendChild(layout);

  const ctx = canvas.getContext('2d');
  let W, H, running = false;
  const ro = new ResizeObserver(() => {
    W=canvas.width=canvas.offsetWidth||700; H=canvas.height=canvas.offsetHeight||500;
  });
  ro.observe(canvas);
  W=canvas.width=canvas.offsetWidth||700; H=canvas.height=canvas.offsetHeight||500;

  function getP() {
    return {
      f1:  parseFloat(document.getElementById('wv-f1')?.value   || 1.0),
      a1:  parseFloat(document.getElementById('wv-a1')?.value   || 0.8),
      f2:  parseFloat(document.getElementById('wv-f2')?.value   || 1.0),
      a2:  parseFloat(document.getElementById('wv-a2')?.value   || 0.8),
      phi: parseFloat(document.getElementById('wv-phase')?.value || 0) * Math.PI / 180,
    };
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#050b14'; ctx.fillRect(0,0,W,H);

    const { f1, a1, f2, a2, phi } = getP();

    // Divide canvas into 3 rows
    const rowH = H / 3;
    const padX = 30, padY = 16;

    // ─ Row 1: Wave 1 ─
    drawWaveRow(ctx, 0, 0, W, rowH, t, f1, a1, 0, '#00d4ff', 'Wave 1 (f='+f1+'Hz, A='+a1+')');

    // ─ Row 2: Wave 2 ─
    drawWaveRow(ctx, 0, rowH, W, rowH, t, f2, a2, phi, '#7c3aed', 'Wave 2 (f='+f2+'Hz, A='+a2+', φ='+Math.round(phi*180/Math.PI)+'°)');

    // ─ Row 3: Superposition ─
    const cy3 = rowH*2 + rowH/2;
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,rowH*2,W,rowH);
    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,cy3); ctx.lineTo(W,cy3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,rowH*2); ctx.lineTo(W,rowH*2); ctx.stroke();

    const points = [];
    const steps = W;
    const xscale = (2*Math.PI*2) / W;
    for (let px = 0; px < steps; px++) {
      const xPos = px * xscale;
      const y1 = a1 * Math.sin(2*Math.PI*f1*t - xPos);
      const y2 = a2 * Math.sin(2*Math.PI*f2*t - xPos + phi);
      points.push(y1+y2);
    }
    const maxA = a1+a2 || 1;
    ctx.beginPath();
    points.forEach((y,i) => {
      const sx = i;
      const sy = cy3 - (y/maxA) * (rowH/2-padY);
      if (i===0) ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy);
    });
    // Color by interference type
    const beatF = Math.abs(f1-f2);
    const phaseDiff = Math.abs(phi%(2*Math.PI));
    let interType, sColor;
    if (beatF < 0.05 && phaseDiff < 0.2) { interType='Constructive ✨'; sColor='#10b981'; }
    else if (beatF < 0.05 && Math.abs(phaseDiff - Math.PI) < 0.3) { interType='Destructive 💫'; sColor='#ef4444'; }
    else if (beatF > 0.05) { interType='Beats 〜'; sColor='#f59e0b'; }
    else { interType='Partial'; sColor='#ec4899'; }

    ctx.strokeStyle=sColor; ctx.lineWidth=2.5;
    ctx.shadowColor=sColor; ctx.shadowBlur=8;
    ctx.stroke(); ctx.shadowBlur=0;

    // Fill under superposition
    ctx.lineTo(W,cy3); ctx.lineTo(0,cy3); ctx.closePath();
    ctx.fillStyle = sColor+'22'; ctx.fill();

    // Label row 3
    ctx.fillStyle=sColor; ctx.font='bold 11px monospace';
    ctx.fillText(`Superposition — ${interType}`, 12, rowH*2+14);

    // ─ 2D interference pattern (small grid in corner) ─
    draw2DPattern(ctx, W-140, H-140, 130, 130, f1, f2, a1, a2, phi, t);

    // Update readouts
    setReadout('wv-type',   interType);
    setReadout('wv-resultA', (a1+a2).toFixed(2)+' (max)');
    setReadout('wv-beats',   beatF.toFixed(2)+' Hz');
    setReadout('wv-lambda1', (1/f1).toFixed(2)+' m');
    setReadout('wv-lambda2', (1/f2).toFixed(2)+' m');
  }

  function drawWaveRow(ctx, rx, ry, rw, rh, t, f, amp, phi, color, label) {
    const cy = ry + rh/2;
    ctx.fillStyle='rgba(255,255,255,0.02)'; ctx.fillRect(rx,ry,rw,rh);
    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(rx,cy); ctx.lineTo(rx+rw,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx+rw,ry); ctx.stroke();

    const steps = rw;
    const xscale = (2*Math.PI*2) / rw;
    ctx.beginPath();
    for (let px=0;px<steps;px++) {
      const xPos = px*xscale;
      const y = amp * Math.sin(2*Math.PI*f*t - xPos + phi);
      const sy = cy - y * (rh/2 - 16);
      if (px===0) ctx.moveTo(rx+px,sy); else ctx.lineTo(rx+px,sy);
    }
    ctx.strokeStyle=color; ctx.lineWidth=2;
    ctx.shadowColor=color; ctx.shadowBlur=6;
    ctx.stroke(); ctx.shadowBlur=0;

    // Label
    ctx.fillStyle=color+'cc'; ctx.font='11px monospace';
    ctx.fillText(label, rx+10, ry+14);

    // Amplitude annotation
    const yPeak = cy - amp*(rh/2-16);
    ctx.beginPath(); ctx.setLineDash([3,4]);
    ctx.moveTo(rx+rw*0.85, cy); ctx.lineTo(rx+rw*0.85, yPeak);
    ctx.strokeStyle=color+'66'; ctx.lineWidth=1; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=color+'aa'; ctx.font='10px monospace';
    ctx.fillText('A='+amp.toFixed(1), rx+rw*0.85+4, (cy+yPeak)/2+4);
  }

  function draw2DPattern(ctx, px, py, pw, ph, f1, f2, a1, a2, phi, t) {
    const imgData = ctx.createImageData(pw, ph);
    const data = imgData.data;
    const src1x = pw*0.3, src1y = ph/2;
    const src2x = pw*0.7, src2y = ph/2;
    const k1 = 2*Math.PI*f1, k2 = 2*Math.PI*f2;
    for (let iy=0;iy<ph;iy++) {
      for (let ix=0;ix<pw;ix++) {
        const d1 = Math.sqrt((ix-src1x)**2+(iy-src1y)**2);
        const d2 = Math.sqrt((ix-src2x)**2+(iy-src2y)**2);
        const y1 = a1 * Math.sin(k1*t - d1*0.15);
        const y2 = a2 * Math.sin(k2*t - d2*0.15 + phi);
        const sup = (y1+y2)/(a1+a2);
        const idx = (iy*pw+ix)*4;
        if (sup > 0) {
          data[idx]   = Math.round(sup*100);
          data[idx+1] = Math.round(sup*200);
          data[idx+2] = 255;
        } else {
          data[idx]   = 255;
          data[idx+1] = Math.round(-sup*100);
          data[idx+2] = Math.round(-sup*80);
        }
        data[idx+3] = Math.round(Math.abs(sup)*180+40);
      }
    }
    ctx.putImageData(imgData, px, py);
    ctx.strokeStyle='rgba(0,212,255,0.4)'; ctx.lineWidth=1; ctx.strokeRect(px,py,pw,ph);
    ctx.fillStyle='rgba(0,212,255,0.6)'; ctx.font='9px monospace';
    ctx.fillText('2D Pattern', px+4, py+11);
    // Source dots
    ctx.beginPath(); ctx.arc(px+pw*0.3, py+ph/2, 4, 0, Math.PI*2);
    ctx.fillStyle='#00d4ff'; ctx.fill();
    ctx.beginPath(); ctx.arc(px+pw*0.7, py+ph/2, 4, 0, Math.PI*2);
    ctx.fillStyle='#7c3aed'; ctx.fill();
  }

  window.startWaves = function() {
    running = true;
    if (animId) cancelAnimationFrame(animId);
    function step() {
      t += 0.016;
      draw();
      animId = requestAnimationFrame(step);
    }
    animId = requestAnimationFrame(step);
  };
  window.pauseWaves = function() { running = false; cancelAnimationFrame(animId); };

  window._stopCurrentExperiment = () => { running = false; cancelAnimationFrame(animId); ro.disconnect(); };

  draw();
  document.querySelectorAll('input[type=range]').forEach(trackSlider);
  window.startWaves();
};
