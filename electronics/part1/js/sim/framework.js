/* =========================================================
   Simulation framework
   - shared animation clock with global PAUSE
   - polyline path helper for moving particles
   - standard simulation frame (header / stage / controls / readouts)
   Every lesson simulation is built on these pieces so pause,
   reset and teardown behave the same everywhere.
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});
  const { h, s } = EFZ.util;

  /* ---------- Clock ---------- */
  const loops = new Set();
  let paused = false;
  let rafId = null;
  let last = 0;

  function frame(now) {
    rafId = null;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (!paused && !document.hidden) {
      loops.forEach((l) => { if (l.running) { l.t += dt; l.fn(dt, l.t); } });
    }
    if (loops.size) rafId = requestAnimationFrame(frame);
  }
  function ensure() {
    if (rafId === null && loops.size) { last = performance.now(); rafId = requestAnimationFrame(frame); }
  }

  /** Create an animation loop. fn(dt, t). Starts immediately unless {autostart:false}. */
  function loop(fn, opts = {}) {
    const l = { fn, t: 0, running: opts.autostart !== false };
    loops.add(l);
    ensure();
    return {
      start() { l.running = true; ensure(); },
      stop() { l.running = false; },
      destroy() { loops.delete(l); },
      get time() { return l.t; },
    };
  }

  function setPaused(v) { paused = !!v; if (!paused) ensure(); }

  /* ---------- Polyline path ---------- */
  function path(points) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      segs.push({ x1, y1, x2, y2, len, start: total, ang: Math.atan2(y2 - y1, x2 - x1) });
      total += len;
    }
    return {
      points,
      length: total,
      segs,
      /** Point at arc length u (clamped). Returns {x, y, ang(rad)} */
      at(u) {
        if (!segs.length) return { x: points[0][0], y: points[0][1], ang: 0 };
        u = Math.max(0, Math.min(total, u));
        let sg = segs[segs.length - 1];
        for (let i = 0; i < segs.length; i++) { if (u <= segs[i].start + segs[i].len) { sg = segs[i]; break; } }
        const t = sg.len ? (u - sg.start) / sg.len : 0;
        return { x: sg.x1 + (sg.x2 - sg.x1) * t, y: sg.y1 + (sg.y2 - sg.y1) * t, ang: sg.ang };
      },
      d() { return "M" + points.map((p) => p[0] + " " + p[1]).join(" L"); },
    };
  }

  /* ---------- Standard simulation frame ---------- */
  function frameUI({ title, badge = "SIMULATION", hint = "ลองเปลี่ยนค่าเอง", stage, controls, readouts, footer }) {
    const head = h("div", { class: "sim__head" },
      h("div", { class: "sim__title" }, h("span", { class: "sim__badge" }, badge), h("span", null, title)),
      hint ? h("div", { class: "sim__hint" }, EFZ.icon("hand"), hint) : null);
    const stageEl = h("div", { class: "sim__stage" }, stage);
    const controlsEl = controls ? h("div", { class: "sim__controls" }, controls) : null;
    const readoutsEl = readouts ? h("div", { class: "sim__readouts" }, readouts) : null;
    return h("section", { class: "sim", "aria-label": title }, head, stageEl, controlsEl, readoutsEl, footer || null);
  }

  /** Scale-safe SVG root. */
  function svgRoot(w, hgt, label) {
    return s("svg", { viewBox: `0 0 ${w} ${hgt}`, role: "img", "aria-label": label || "", preserveAspectRatio: "xMidYMid meet" });
  }

  EFZ.sim = {
    loop,
    setPaused,
    get paused() { return paused; },
    path,
    frame: frameUI,
    svgRoot,
  };
})();
