/* ─── circuits.js ─── Electric Circuits Experiment ─── */

window.launchCircuits = function(container) {
  let animId = null;

  const layout = document.createElement('div');
  layout.className = 'exp-layout';

  /* ── Panel ── */
  const panel = makePanel({
    controls: [
      { id: 'cir-v',   label: 'Voltage (V)',     min: 1, max: 24, defaultVal: 9, unit: 'V',
        oninput: 'updateCircuit()' },
      { id: 'cir-r1',  label: 'Resistor R₁',    min: 10, max: 500, defaultVal: 100, unit: 'Ω',
        oninput: 'updateCircuit()' },
      { id: 'cir-r2',  label: 'Resistor R₂',    min: 10, max: 500, defaultVal: 200, unit: 'Ω',
        oninput: 'updateCircuit()' },
      { id: 'cir-r3',  label: 'Resistor R₃',    min: 10, max: 500, defaultVal: 150, unit: 'Ω',
        oninput: 'updateCircuit()' },
    ],
    readouts: [
      { id: 'cir-rs',   label: 'Series R_total' },
      { id: 'cir-rp',   label: 'Parallel R_total' },
      { id: 'cir-is',   label: 'Current (Series)' },
      { id: 'cir-ip',   label: 'Current (Parallel)' },
      { id: 'cir-ps',   label: 'Power (Series)' },
      { id: 'cir-pp',   label: 'Power (Parallel)' },
      { id: 'cir-v1',   label: 'V across R₁ (series)' },
      { id: 'cir-v2',   label: 'V across R₂ (series)' },
    ],
    formula: 'V = I·R (Ohm\'s Law)<br>Series: R_T = R₁+R₂+R₃<br>Parallel: 1/R_T = 1/R₁+1/R₂+1/R₃<br>P = V·I = V²/R',
    actions: [
      { label: '▶ Run Simulation', cls: 'launch', onclick: 'runCircuit()' },
      { label: '⏸ Pause', cls: 'reset', onclick: 'pauseCircuit()' },
      { label: '📝 Take Quiz', cls: 'quiz-btn', onclick: 'openQuiz("circuits")' },
    ],
    info: `<strong>Ohm's Law:</strong> V = IR. In a <em>series</em> circuit, current is the same everywhere; voltage is split. In a <em>parallel</em> circuit, voltage is the same across branches; current is split.`,
    procedure: [
      'Set the supply voltage',
      'Adjust resistor values R₁, R₂, R₃',
      'Observe series vs parallel differences',
      'Compare total resistance and current',
      'Check power dissipation',
      'Complete the quiz',
    ],
  });

  /* ── Viewport ── */
  const viewport = document.createElement('div');
  viewport.className = 'exp-viewport';
  viewport.style.cssText = 'background:#050e14;';

  // Toggle series / parallel
  const toggleBar = document.createElement('div');
  toggleBar.style.cssText = `
    display:flex; gap:0.5rem; padding:0.6rem 1rem;
    background:rgba(0,0,0,0.4); border-bottom:1px solid rgba(0,212,255,0.1);
    align-items:center;
  `;
  toggleBar.innerHTML = `
    <span style="font-size:0.8rem;color:#7a8fa6;margin-right:0.5rem;">Circuit Type:</span>
    <button id="btn-series"   onclick="setCircuitMode('series')"   class="action-btn" style="padding:0.3rem 0.9rem;width:auto;background:rgba(0,212,255,0.15);border:1px solid #00d4ff;color:#00d4ff;">Series</button>
    <button id="btn-parallel" onclick="setCircuitMode('parallel')" class="action-btn" style="padding:0.3rem 0.9rem;width:auto;">Parallel</button>
    <button id="btn-mixed"    onclick="setCircuitMode('mixed')"    class="action-btn" style="padding:0.3rem 0.9rem;width:auto;">Mixed</button>
  `;

  const canvas = document.createElement('canvas');
  canvas.id = 'circuit-canvas';
  canvas.style.cssText = 'width:100%;flex:1;display:block;';

  viewport.appendChild(toggleBar);
  viewport.appendChild(canvas);
  layout.appendChild(panel);
  layout.appendChild(viewport);
  container.appendChild(layout);

  const ctx = canvas.getContext('2d');
  let W, H;
  const ro = new ResizeObserver(() => {
    W=canvas.width=canvas.offsetWidth||700;
    H=canvas.height=canvas.offsetHeight||460;
    drawCircuit();
  });
  ro.observe(canvas);
  W=canvas.width=canvas.offsetWidth||700; H=canvas.height=canvas.offsetHeight||460;

  let mode = 'series', running = false, electronT = 0;

  window.setCircuitMode = function(m) {
    mode = m;
    ['series','parallel','mixed'].forEach(id => {
      const btn = document.getElementById('btn-'+id);
      if (!btn) return;
      btn.style.background = m===id ? 'rgba(0,212,255,0.15)' : '';
      btn.style.border = m===id ? '1px solid #00d4ff' : '1px solid rgba(0,212,255,0.2)';
      btn.style.color = m===id ? '#00d4ff' : '#7a8fa6';
    });
    updateCircuit();
  };

  function getP() {
    return {
      V:  parseFloat(document.getElementById('cir-v')?.value  || 9),
      R1: parseFloat(document.getElementById('cir-r1')?.value || 100),
      R2: parseFloat(document.getElementById('cir-r2')?.value || 200),
      R3: parseFloat(document.getElementById('cir-r3')?.value || 150),
    };
  }

  window.updateCircuit = function() {
    const { V, R1, R2, R3 } = getP();
    const Rs = Physics.seriesResistance(R1,R2,R3);
    const Rp = Physics.parallelResistance(R1,R2,R3);
    const Is = Physics.current(V, Rs);
    const Ip = Physics.current(V, Rp);
    setReadout('cir-rs', Rs.toFixed(1)+' Ω');
    setReadout('cir-rp', Rp.toFixed(1)+' Ω');
    setReadout('cir-is', (Is*1000).toFixed(2)+' mA');
    setReadout('cir-ip', (Ip*1000).toFixed(2)+' mA');
    setReadout('cir-ps', Physics.power(V,Is).toFixed(3)+' W');
    setReadout('cir-pp', Physics.power(V,Ip).toFixed(3)+' W');
    setReadout('cir-v1', Physics.voltage(Is,R1).toFixed(2)+' V');
    setReadout('cir-v2', Physics.voltage(Is,R2).toFixed(2)+' V');
    drawCircuit();
  };

  function drawCircuit() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#050e14'; ctx.fillRect(0,0,W,H);

    const { V, R1, R2, R3 } = getP();
    const Rs = Physics.seriesResistance(R1,R2,R3);
    const Is = Physics.current(V,Rs);

    if (mode === 'series') drawSeriesCircuit(V, R1, R2, R3, Is, electronT);
    else if (mode === 'parallel') {
      const Rp = Physics.parallelResistance(R1,R2,R3);
      drawParallelCircuit(V, R1, R2, R3, Physics.current(V,Rp), electronT);
    } else {
      drawMixedCircuit(V, R1, R2, R3, electronT);
    }
  }

  function drawSeriesCircuit(V, R1, R2, R3, I, et) {
    const cx = W/2, cy = H/2;
    const bw = 280, bh = 180;
    const x0=cx-bw/2, x1=cx+bw/2, y0=cy-bh/2, y1=cy+bh/2;

    // Wires
    ctx.strokeStyle='#1a3a4a'; ctx.lineWidth=4;
    // Top wire
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y0); ctx.stroke();
    // Bottom wire
    ctx.beginPath(); ctx.moveTo(x0,y1); ctx.lineTo(x1,y1); ctx.stroke();
    // Left wire
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x0,y1); ctx.stroke();
    // Right wire
    ctx.beginPath(); ctx.moveTo(x1,y0); ctx.lineTo(x1,y1); ctx.stroke();

    // Current-colored wires
    const iColor = currentColor(I);
    ctx.strokeStyle=iColor; ctx.lineWidth=2;
    ctx.shadowColor=iColor; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x0,y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0,y1); ctx.lineTo(x1,y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1,y0); ctx.lineTo(x1,y1); ctx.stroke();
    ctx.shadowBlur=0;

    // Battery (left)
    drawBattery(ctx, x0, cy, V);

    // Resistors on top wire
    const rSpacing = bw / 4;
    drawResistor(ctx, x0+rSpacing,   y0, R1, 'R₁', iColor, I);
    drawResistor(ctx, x0+rSpacing*2, y0, R2, 'R₂', iColor, I);
    drawResistor(ctx, x0+rSpacing*3, y0, R3, 'R₃', iColor, I);

    // Electrons
    if (running) {
      drawElectrons(ctx, et, x0, y0, x1, y1, iColor, 'series', 5);
    }

    // Labels
    ctx.fillStyle='rgba(0,212,255,0.7)'; ctx.font='11px monospace';
    ctx.fillText(`I = ${(I*1000).toFixed(2)} mA`, cx-35, y1+20);
    ctx.fillText(`R_total = ${Physics.seriesResistance(R1,R2,R3).toFixed(0)} Ω (Series)`, cx-70, y0-12);
  }

  function drawParallelCircuit(V, R1, R2, R3, I, et) {
    const cx = W/2, cy = H/2;
    const bw = 300, bh = 200;
    const x0=cx-bw/2, x1=cx+bw/2, y0=cy-bh/2, y1=cy+bh/2;
    const cols = ['#00d4ff','#7c3aed','#10b981'];
    const Rs = [R1,R2,R3], labels=['R₁','R₂','R₃'];
    const rowH = bh/3;

    const iColor = currentColor(I);

    // Main vertical wires
    ctx.strokeStyle=iColor; ctx.lineWidth=2.5; ctx.shadowColor=iColor; ctx.shadowBlur=4;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x0,y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1,y0); ctx.lineTo(x1,y1); ctx.stroke();
    ctx.shadowBlur=0;

    // Battery
    drawBattery(ctx, x0, cy, V);

    Rs.forEach((R,i) => {
      const ry = y0 + rowH*i + rowH/2;
      const Ii = Physics.current(V,R);
      const col = cols[i];
      // Horizontal branch
      ctx.beginPath(); ctx.moveTo(x0,ry); ctx.lineTo(x1,ry);
      ctx.strokeStyle=col; ctx.lineWidth=2; ctx.shadowColor=col; ctx.shadowBlur=3;
      ctx.stroke(); ctx.shadowBlur=0;
      drawResistor(ctx, (x0+x1)/2, ry, R, labels[i], col, Ii);
      ctx.fillStyle=col+'aa'; ctx.font='10px monospace';
      ctx.fillText(`I₍${labels[i]}₎=${(Ii*1000).toFixed(1)}mA`, x1+8, ry+4);
    });

    // Electrons in branches
    if (running) {
      Rs.forEach((R,i) => {
        const ry = y0 + rowH*i + rowH/2;
        const Ii = Physics.current(V,R);
        drawElectronsLinear(ctx, et*(1+(i*0.3)), x0, ry, x1, ry, cols[i], 3);
      });
    }

    ctx.fillStyle='rgba(0,212,255,0.7)'; ctx.font='11px monospace';
    ctx.fillText(`R_total = ${Physics.parallelResistance(R1,R2,R3).toFixed(1)} Ω (Parallel)`, cx-80, y0-12);
    ctx.fillText(`V across all = ${V} V`, cx-45, y1+20);
  }

  function drawMixedCircuit(V, R1, R2, R3, et) {
    // R1 in series with (R2 || R3)
    const Rp23 = Physics.parallelResistance(R2,R3);
    const Rtotal = R1 + Rp23;
    const I = Physics.current(V, Rtotal);
    const V1 = I * R1;
    const Vp = I * Rp23;
    const I2 = Vp/R2, I3 = Vp/R3;

    const cx = W/2, cy = H/2;
    const iColor = currentColor(I);

    // Outer loop
    const x0=cx-200, x1=cx+200, y0=cy-120, y1=cy+120;
    ctx.strokeStyle=iColor; ctx.lineWidth=2.5; ctx.shadowColor=iColor; ctx.shadowBlur=4;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y0);
    ctx.moveTo(x0,y1); ctx.lineTo(x1,y1);
    ctx.moveTo(x0,y0); ctx.lineTo(x0,y1);
    ctx.moveTo(x1,y0); ctx.lineTo(x1,y1);
    ctx.stroke(); ctx.shadowBlur=0;

    drawBattery(ctx, x0, cy, V);
    // R1 on top left portion
    drawResistor(ctx, cx-90, y0, R1, 'R₁', '#f59e0b', I);

    // Parallel section (cx+20 to x1)
    const py0=y0+30, py1=y1-30, pmx=(cx+60+x1)/2;
    drawResistor(ctx, pmx, py0-5, R2, 'R₂', '#7c3aed', I2);
    drawResistor(ctx, pmx, py1+5, R3, 'R₃', '#10b981', I3);

    ctx.strokeStyle='rgba(124,58,237,0.5)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(cx+60,y0); ctx.lineTo(cx+60,py0-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+60,y1); ctx.lineTo(cx+60,py1+5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1,y0); ctx.lineTo(x1,py0-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1,py1+5); ctx.stroke();

    // Info
    ctx.fillStyle='rgba(0,212,255,0.7)'; ctx.font='11px monospace';
    ctx.fillText(`Mixed: R₁ + (R₂‖R₃)`, cx-60, y0-12);
    ctx.fillText(`I = ${(I*1000).toFixed(2)}mA, R_T=${Rtotal.toFixed(1)}Ω`, cx-70, y1+22);
  }

  function currentColor(I) {
    const norm = Math.min(I*1000/100, 1);
    const r = Math.round(norm*255);
    const g = Math.round((1-norm)*180+75);
    return `rgb(${r},${g},50)`;
  }

  function drawBattery(ctx, x, y, V) {
    const bh = 40, bw = 12;
    ctx.fillStyle='#1e293b'; ctx.fillRect(x-bw/2, y-bh/2, bw, bh);
    ctx.strokeStyle='#00d4ff'; ctx.lineWidth=1.5;
    ctx.strokeRect(x-bw/2, y-bh/2, bw, bh);
    // +/- lines
    ctx.strokeStyle='#10b981'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x-8,y-bh/4); ctx.lineTo(x+8,y-bh/4); ctx.stroke();
    ctx.strokeStyle='#ef4444'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x-5,y+bh/4); ctx.lineTo(x+5,y+bh/4); ctx.stroke();
    ctx.fillStyle='#00d4ff'; ctx.font='bold 10px monospace';
    ctx.fillText(`${V}V`, x-8, y+bh/2+14);
    // Glow
    ctx.shadowColor='#00d4ff'; ctx.shadowBlur=8;
    ctx.strokeStyle='rgba(0,212,255,0.4)'; ctx.lineWidth=1;
    ctx.strokeRect(x-bw/2-2, y-bh/2-2, bw+4, bh+4);
    ctx.shadowBlur=0;
  }

  function drawResistor(ctx, x, y, R, label, color, I) {
    const rw=40, rh=14;
    ctx.fillStyle='rgba(30,41,59,0.9)'; ctx.strokeStyle=color;
    ctx.lineWidth=2; ctx.shadowColor=color; ctx.shadowBlur=6;
    ctx.fillRect(x-rw/2, y-rh/2, rw, rh);
    ctx.strokeRect(x-rw/2, y-rh/2, rw, rh);
    ctx.shadowBlur=0;
    // Zig-zag lines inside
    ctx.beginPath();
    const steps=5, sw=rw/steps;
    ctx.moveTo(x-rw/2, y);
    for(let i=0;i<steps;i++){
      ctx.lineTo(x-rw/2+sw*(i+0.5), i%2===0?y-rh/3:y+rh/3);
      ctx.lineTo(x-rw/2+sw*(i+1), y);
    }
    ctx.strokeStyle=color+'66'; ctx.lineWidth=1; ctx.stroke();
    // Label
    ctx.fillStyle=color; ctx.font='10px monospace';
    ctx.fillText(label, x-8, y-rh/2-4);
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px monospace';
    ctx.fillText(R+'Ω', x-12, y+rh/2+10);
  }

  function drawElectrons(ctx, et, x0, y0, x1, y1, color, type, count) {
    // Simple electron dots animated along perimeter
    const perim = 2*(x1-x0)+2*(y1-y0);
    for (let i=0;i<count;i++) {
      const frac = ((et*0.3 + i/count) % 1);
      const dist = frac * perim;
      let ex, ey;
      const top=x1-x0, right=y1-y0, bottom=x1-x0, left=y1-y0;
      if (dist < top) { ex=x0+dist; ey=y0; }
      else if (dist<top+right) { ex=x1; ey=y0+(dist-top); }
      else if (dist<top+right+bottom) { ex=x1-(dist-top-right); ey=y1; }
      else { ex=x0; ey=y1-(dist-top-right-bottom); }
      ctx.beginPath(); ctx.arc(ex,ey,4,0,Math.PI*2);
      ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=8; ctx.fill(); ctx.shadowBlur=0;
    }
  }

  function drawElectronsLinear(ctx, et, x0, y0, x1, y1, color, count) {
    for (let i=0;i<count;i++) {
      const frac = ((et*0.4+i/count)%1);
      const ex = x0+(x1-x0)*frac, ey = y0+(y1-y0)*frac;
      ctx.beginPath(); ctx.arc(ex,ey,3,0,Math.PI*2);
      ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=6; ctx.fill(); ctx.shadowBlur=0;
    }
  }

  window.runCircuit = function() {
    running = true;
    if (animId) cancelAnimationFrame(animId);
    function step(ts) {
      electronT += 0.01;
      drawCircuit();
      animId = requestAnimationFrame(step);
    }
    animId = requestAnimationFrame(step);
  };
  window.pauseCircuit = function() { running = false; cancelAnimationFrame(animId); };

  window._stopCurrentExperiment = () => { running = false; cancelAnimationFrame(animId); ro.disconnect(); };

  updateCircuit();
  document.querySelectorAll('input[type=range]').forEach(trackSlider);
  window.runCircuit();
};
