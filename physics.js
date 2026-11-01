/* ─── physics.js ─── Physics Calculation Utilities ─── */

window.Physics = {

  /* ── Projectile ── */
  projectileRange(v, angle, g = 9.81) {
    const θ = angle * Math.PI / 180;
    return (v * v * Math.sin(2 * θ)) / g;
  },
  projectileMaxHeight(v, angle, g = 9.81) {
    const θ = angle * Math.PI / 180;
    return (v * v * Math.sin(θ) ** 2) / (2 * g);
  },
  projectileTimeOfFlight(v, angle, g = 9.81) {
    const θ = angle * Math.PI / 180;
    return (2 * v * Math.sin(θ)) / g;
  },
  projectileX(v, angle, t) {
    return v * Math.cos(angle * Math.PI / 180) * t;
  },
  projectileY(v, angle, t, g = 9.81) {
    const θ = angle * Math.PI / 180;
    return v * Math.sin(θ) * t - 0.5 * g * t * t;
  },

  /* ── Pendulum ── */
  pendulumPeriod(L, g = 9.81) {
    return 2 * Math.PI * Math.sqrt(L / g);
  },
  pendulumAngle(amplitude, omega, t) {
    return amplitude * Math.cos(omega * t);
  },
  pendulumOmega(L, g = 9.81) {
    return Math.sqrt(g / L);
  },

  /* ── Optics ── */
  snellsLaw(n1, n2, theta1_deg) {
    const θ1 = theta1_deg * Math.PI / 180;
    const sinθ2 = (n1 / n2) * Math.sin(θ1);
    if (Math.abs(sinθ2) > 1) return null; // TIR
    return Math.asin(sinθ2) * 180 / Math.PI;
  },
  lensEquation(f, u) {
    // 1/v = 1/f - 1/u  (using sign convention)
    if (f === 0 || u === 0) return Infinity;
    return 1 / (1/f - 1/u);
  },
  magnification(v, u) { return -v / u; },

  /* ── Ohm's Law ── */
  voltage(I, R) { return I * R; },
  current(V, R) { return R !== 0 ? V / R : 0; },
  seriesResistance(...Rs) { return Rs.reduce((a, b) => a + b, 0); },
  parallelResistance(...Rs) { return 1 / Rs.reduce((s, r) => s + 1/r, 0); },
  power(V, I) { return V * I; },

  /* ── Waves ── */
  waveY(A, f, x, t, phi = 0) {
    return A * Math.sin(2 * Math.PI * f * t - (2 * Math.PI / 1) * x + phi);
  },
  superposition(y1, y2) { return y1 + y2; },
  wavelength(v, f) { return f !== 0 ? v / f : 0; },
};
