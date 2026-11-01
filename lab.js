/* ─── lab.js ─── Three.js 3D Lab Environment (optional 3D scene) ─── */
/* This file sets up the landing page 3D background orb using Three.js */

(function() {
  // Only run on landing page
  const canvas3d = document.createElement('canvas');
  canvas3d.id = 'three-bg';
  canvas3d.style.cssText = `
    position: fixed; top: 0; left: 0; z-index: 0;
    width: 100%; height: 100%; pointer-events: none; opacity: 0.35;
  `;
  document.body.insertBefore(canvas3d, document.body.firstChild);

  if (typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 4);

  /* ── Wireframe Sphere (lab orb) ── */
  const geo = new THREE.IcosahedronGeometry(1.5, 3);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00d4ff,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const orb = new THREE.Mesh(geo, mat);
  scene.add(orb);

  /* ── Inner orb ── */
  const innerGeo = new THREE.IcosahedronGeometry(0.8, 2);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x7c3aed,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });
  const innerOrb = new THREE.Mesh(innerGeo, innerMat);
  scene.add(innerOrb);

  /* ── Floating particles ── */
  const partCount = 300;
  const partGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 10;
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const partMat = new THREE.PointsMaterial({
    color: 0x00d4ff,
    size: 0.03,
    transparent: true,
    opacity: 0.4,
  });
  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  /* ── Ring ── */
  const ringGeo = new THREE.TorusGeometry(2.2, 0.008, 8, 80);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.25 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  scene.add(ring);

  const ring2 = ring.clone();
  ring2.rotation.x = -Math.PI / 5;
  ring2.rotation.y = Math.PI / 4;
  (ring2.material = ringMat.clone()).color.set(0x00d4ff);
  ring2.material.opacity = 0.15;
  scene.add(ring2);

  /* ── Mouse parallax ── */
  let mx = 0, my = 0;
  document.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  /* ── Animation ── */
  let t3 = 0;
  function animate3() {
    t3 += 0.004;
    orb.rotation.y = t3 * 0.4 + mx * 0.3;
    orb.rotation.x = t3 * 0.2 + my * 0.2;
    innerOrb.rotation.y = -t3 * 0.6;
    innerOrb.rotation.z = t3 * 0.3;
    ring.rotation.z  = t3 * 0.3;
    ring2.rotation.z = -t3 * 0.2;
    particles.rotation.y = t3 * 0.05;

    camera.position.x += (mx * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (-my * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate3);
  }
  animate3();
})();
