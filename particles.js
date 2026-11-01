/* ─── particles.js ─── Starfield & Floating Particles ─── */

/* ══════════ Starfield ══════════ */
function initStarfield() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); generateStars(); });

  function generateStars() {
    stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.2,
      alpha: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.15 + 0.02,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }
  generateStars();

  let t = 0;
  function drawStars() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;
    stars.forEach(s => {
      s.twinkle += s.speed * 0.06;
      const alpha = s.alpha * (0.6 + 0.4 * Math.sin(s.twinkle));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }
  drawStars();
}

/* ══════════ Floating Particles ══════════ */
function initParticles() {
  const wrap = document.getElementById('particles-wrap');
  if (!wrap) return;
  const colors = ['#00d4ff', '#7c3aed', '#ec4899', '#10b981'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 6 + 2;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const dur = Math.random() * 15 + 10;
    const delay = Math.random() * 10;
    const left = Math.random() * 100;
    p.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:${color};
      opacity:${Math.random() * 0.4 + 0.1};
      left:${left}%;
      bottom:-10px;
      animation: rise ${dur}s ${delay}s linear infinite;
      filter: blur(${Math.random() > 0.5 ? 1 : 0}px);
    `;
    wrap.appendChild(p);
  }

  // Inject rise keyframes
  if (!document.getElementById('rise-kf')) {
    const style = document.createElement('style');
    style.id = 'rise-kf';
    style.textContent = `
      @keyframes rise {
        0%   { transform: translateY(0) translateX(0); opacity: 0; }
        10%  { opacity: 0.4; }
        90%  { opacity: 0.2; }
        100% { transform: translateY(-110vh) translateX(${Math.random() > 0.5 ? '' : '-'}60px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
