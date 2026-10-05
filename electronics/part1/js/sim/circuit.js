/* =========================================================
   Circuit simulation engine (reusable across Part 1)

   Declarative circuit → SVG with:
     • real-hardware view  ⇄  schematic-symbol view
     • path checking: a loop conducts only when EVERY part in
       it conducts (broken wire, open switch, reversed LED or an
       insulator in a slot all open the path)
     • electron-flow dots (− → +) and conventional-current
       arrows (+ → −) animated along every complete loop
     • free electrons stay in the metal and only jiggle in place
       when the path is open (no net flow)

   This is a qualitative "is there a complete path?" model —
   numeric V/I/R behaviour is added by later lessons on top.
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});
  const { s, mod, reducedMotion } = EFZ.util;
  let uid = 0;

  const WIRE_COLORS = { red: "#e11d48", black: "#1f2937", blue: "#2563eb", green: "#16a34a", yellow: "#eab308", orange: "#f97316", white: "#e5e7eb" };
  const SYM_LEN = {
    symbol: { battery: 40, battery2: 44, resistor: 48, led: 40, switch: 44, slot: 64, source: 0, lamp: 40 },
    real: { battery: 52, battery2: 100, resistor: 60, led: 46, switch: 60, slot: 64, source: 0, lamp: 48 },
  };

  /* ---------- geometry helpers ---------- */
  function slice(path, u0, u1) {
    u0 = Math.max(0, u0); u1 = Math.min(path.length, u1);
    if (u1 <= u0) return [];
    const pts = [];
    const a = path.at(u0); pts.push([a.x, a.y]);
    for (const sg of path.segs) {
      const end = sg.start + sg.len;
      if (end > u0 && end < u1) pts.push([sg.x2, sg.y2]);
    }
    const b = path.at(u1); pts.push([b.x, b.y]);
    return pts;
  }
  const dOf = (pts) => (pts.length < 2 ? "" : "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"));

  function circuit(opts) {
    const id = "cx" + (++uid);
    const W = opts.width || 560;
    const H = opts.height || 340;
    const spacing = opts.spacing || 26;
    let style = opts.style || "real";
    let flow = opts.flow || "electron";
    let speed = opts.speed == null ? 1 : opts.speed;
    let highlighted = [];
    const listeners = [];

    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "cx", role: "img", "aria-label": opts.label || "วงจรไฟฟ้า" });
    const defs = s("defs");
    defs.innerHTML = `
      <radialGradient id="${id}-glow"><stop offset="0" stop-color="#ff4d4d" stop-opacity=".95"/><stop offset=".45" stop-color="#ff6b6b" stop-opacity=".45"/><stop offset="1" stop-color="#ff6b6b" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-cell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#475569"/><stop offset=".5" stop-color="#1e293b"/><stop offset="1" stop-color="#0f172a"/></linearGradient>
      <linearGradient id="${id}-res" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e2bf"/><stop offset="1" stop-color="#d9bd86"/></linearGradient>`;
    const gBg = s("g", { class: "cx-bg" });
    const gParts = s("g", { class: "cx-parts" });
    const gFlow = s("g", { class: "cx-flow", "aria-hidden": "true" });
    const gOver = s("g", { class: "cx-over" });
    svg.append(defs, gBg, gParts, gFlow, gOver);

    const nodes = opts.nodes;
    const P = (n) => (Array.isArray(n) ? n : nodes[n]);
    const parts = {};
    const order = [];
    let battery = null;

    for (const def of opts.parts) {
      const p = Object.assign({}, def);
      if (p.type === "battery" || p.type === "source") { p.from = p.minus; p.to = p.plus; battery = p; }
      p.init = Object.assign({ broken: false, missing: false, closed: p.closed !== false, reversed: false, material: p.material || null }, def.state || {});
      p.state = Object.assign({}, p.init);
      p.points = [P(p.from), ...(p.via || []).map(P), P(p.to)];
      p.path = EFZ.sim.path(p.points);
      p.ePool = []; p.aPool = []; p.jit = [];
      parts[p.id] = p;
      order.push(p);
    }
    if (!battery) throw new Error("circuit needs a battery/source part");

    /* ---------- conduction + loop evaluation ---------- */
    function conducts(p, fwd) {
      const st = p.state;
      if (st.missing) return false;
      switch (p.type) {
        case "wire": return !st.broken;
        case "switch": return !!st.closed;
        case "led": return st.reversed ? !fwd : fwd;
        case "slot": return !!(st.material && st.material.conductor);
        default: return true;
      }
    }

    let evalState = null;
    function evaluate() {
      const loopInfo = (opts.loops || []).map((ids) => {
        let cur = battery.plus;
        let cum = 0;
        const segs = [];
        let ok = true;
        for (const pid of ids) {
          const p = parts[pid];
          let fwd;
          if (p.from === cur) { fwd = true; cur = p.to; }
          else if (p.to === cur) { fwd = false; cur = p.from; }
          else throw new Error(`loop broken at ${pid}`);
          if (!conducts(p, fwd)) ok = false;
          segs.push({ p, fwd, cum });
          cum += p.path.length;
        }
        if (cur !== battery.minus) throw new Error("loop must end at battery minus");
        segs.push({ p: battery, fwd: true, cum });
        cum += battery.path.length;
        return { ids, segs, length: cum, active: ok };
      });
      const active = loopInfo.filter((l) => l.active);
      order.forEach((p) => { p.flowInfo = null; p.share = 0; });
      active.forEach((l) => l.segs.forEach((sg) => {
        if (!sg.p.flowInfo) sg.p.flowInfo = { fwd: sg.fwd, cum: sg.cum };
        sg.p.share += 1 / active.length;
      }));
      const leds = {};
      order.filter((p) => p.type === "led" || p.type === "lamp").forEach((p) => { leds[p.id] = !!p.flowInfo; });
      evalState = {
        closed: active.length > 0,
        loops: loopInfo.map((l) => l.active),
        leds,
        ledOn: Object.values(leds).some(Boolean),
      };
      return evalState;
    }

    /* ---------- drawing ---------- */
    function symLen(p) {
      const key = p.type === "battery" && (p.cells || 1) > 1 ? "battery2" : p.type;
      return (SYM_LEN[style][key] || 0);
    }
    function wireStroke(g, pts, p, isLead) {
      if (pts.length < 2) return;
      const d = dOf(pts);
      if (style === "symbol") {
        g.appendChild(s("path", { d, class: "cx-wire-sym" }));
      } else if (isLead) {
        g.appendChild(s("path", { d, class: "cx-lead" }));
      } else {
        const col = WIRE_COLORS[p.color] || p.color || WIRE_COLORS.red;
        g.appendChild(s("path", { d, class: "cx-wire-out" }));
        g.appendChild(s("path", { d, class: "cx-wire-in", stroke: col }));
        g.appendChild(s("path", { d, class: "cx-wire-hi" }));
      }
    }
    function symbolSpan(p) {
      // Longest segment hosts the component body unless p.seg is given.
      let si = p.seg;
      if (si == null) { si = 0; p.path.segs.forEach((sg, i) => { if (sg.len > p.path.segs[si].len) si = i; }); }
      const sg = p.path.segs[si];
      const L = symLen(p);
      const center = sg.start + sg.len * (p.at == null ? 0.5 : p.at);
      const c = p.path.at(center);
      return { u0: center - L / 2, u1: center + L / 2, cx: c.x, cy: c.y, ang: sg.ang, L };
    }
    /** global position of local (lx along part, ly normal) relative to symbol centre */
    function toGlobal(span, lx, ly) {
      const ca = Math.cos(span.ang), sa = Math.sin(span.ang);
      return [span.cx + lx * ca - ly * sa, span.cy + lx * sa + ly * ca];
    }
    function textAt(x, y, str, cls, anchor) {
      return s("text", { x, y, class: cls || "cx-label", "text-anchor": anchor || "middle", "dominant-baseline": "middle" }, str);
    }

    function drawPart(p) {
      const st = p.state;
      const g = s("g", { class: ["cx-part", "cx-" + p.type, highlighted.includes(p.id) && "is-hl"].filter(Boolean).join(" "), "data-part": p.id });
      p.g = g;
      if (p.type === "source" && p.hidden) return g;

      if (st.missing) {
        g.appendChild(s("path", { d: p.path.d(), class: "cx-missing" }));
        const m = p.path.at(p.path.length / 2);
        gOver.appendChild(textAt(m.x, m.y - 16, p.missingLabel || "ไม่มีสาย", "cx-label cx-label--muted"));
        return g;
      }

      if (p.type === "wire") {
        if (st.broken) {
          const bu = p.path.length * (p.breakAt == null ? 0.5 : p.breakAt);
          wireStroke(g, slice(p.path, 0, bu - 10), p);
          wireStroke(g, slice(p.path, bu + 10, p.path.length), p);
          const a = p.path.at(bu - 10), b = p.path.at(bu + 10);
          g.appendChild(s("circle", { cx: a.x, cy: a.y, r: style === "real" ? 3.4 : 2.6, class: "cx-copper" }));
          g.appendChild(s("circle", { cx: b.x, cy: b.y, r: style === "real" ? 3.4 : 2.6, class: "cx-copper" }));
        } else {
          wireStroke(g, p.points, p);
        }
        return g;
      }

      const span = symbolSpan(p);
      const isComponentLead = true;
      wireStroke(g, slice(p.path, 0, span.u0), p, isComponentLead && style === "real" && !p.wireLeads);
      wireStroke(g, slice(p.path, span.u1, p.path.length), p, isComponentLead && style === "real" && !p.wireLeads);
      const flip = p.type === "led" && st.reversed;
      const body = s("g", { transform: `translate(${span.cx.toFixed(1)} ${span.cy.toFixed(1)}) rotate(${(span.ang * 180 / Math.PI + (flip ? 180 : 0)).toFixed(2)})` });
      body.innerHTML = (style === "real" ? REAL : SYMBOL)[p.type](p, span, id);
      g.appendChild(body);

      // Polarity / names (always upright, placed in global coords)
      if (p.type === "battery" || p.type === "source") {
        const half = span.L / 2 + 12;
        const off = p.polarityOffset == null ? 18 : p.polarityOffset;
        const plus = toGlobal(span, half, off), minus = toGlobal(span, -half, off);
        gOver.appendChild(textAt(plus[0], plus[1], "+", "cx-pol cx-pol--plus"));
        gOver.appendChild(textAt(minus[0], minus[1], "−", "cx-pol cx-pol--minus"));
      }
      if (p.type === "led" && p.showPolarity) {
        const half = span.L / 2 + 2;
        const sgn = flip ? -1 : 1;
        const an = toGlobal(span, -half * sgn, -16), ca = toGlobal(span, half * sgn, -16);
        gOver.appendChild(textAt(an[0], an[1], "+", "cx-pol cx-pol--plus cx-pol--sm"));
        gOver.appendChild(textAt(ca[0], ca[1], "−", "cx-pol cx-pol--minus cx-pol--sm"));
      }
      if (p.type === "switch" && p.clickable !== false && opts.switchClickable !== false) {
        const hit = s("rect", { x: -34, y: -30, width: 68, height: 52, class: "cx-hit", tabindex: "0", role: "button",
          "aria-label": st.closed ? "สวิตช์ปิดอยู่ (วงจรครบ) — แตะเพื่อเปิดสวิตช์" : "สวิตช์เปิดอยู่ (วงจรขาด) — แตะเพื่อปิดสวิตช์" });
        const toggle = () => { if (opts.onSwitch) opts.onSwitch(p, api); else api.set(p.id, { closed: !p.state.closed }); };
        hit.addEventListener("click", toggle);
        hit.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
        body.appendChild(hit);
      }
      return g;
    }

    function drawLabels() {
      for (const p of order) {
        if (!p.label || (p.type === "source" && p.hidden && !p.labelPos)) continue;
        let x, y, anchor;
        if (p.labelPos) { [x, y] = p.labelPos; anchor = p.labelAnchor || "middle"; }
        else {
          const span = p.type === "wire" ? (() => { const m = p.path.at(p.path.length / 2); return { cx: m.x, cy: m.y, ang: m.ang }; })() : symbolSpan(p);
          const side = p.labelSide || 1;
          const off = p.labelOffset || 30;
          const nx = -Math.sin(span.ang) * side, ny = Math.cos(span.ang) * side;
          x = span.cx + nx * off; y = span.cy + ny * off;
          anchor = nx > 0.3 ? "start" : nx < -0.3 ? "end" : "middle";
        }
        const lines = String(p.label).split("\n");
        const t = s("text", { x, y: y - (lines.length - 1) * 8, class: "cx-label", "text-anchor": anchor, "dominant-baseline": "middle" });
        lines.forEach((ln, i) => t.appendChild(s("tspan", { x, dy: i === 0 ? 0 : 17, class: i ? "cx-label__sub" : null }, ln)));
        gOver.appendChild(t);
      }
      const nl = opts.nodeLabels || {};
      for (const k of Object.keys(nl)) {
        const L = nl[k];
        const [x, y] = P(k);
        gOver.appendChild(textAt(x + (L.dx || 0), y + (L.dy || 0), L.text, L.cls || "cx-label", L.anchor));
      }
    }

    function drawHandles() {
      if (!opts.interactiveBreaks) return;
      for (const p of order) {
        if (!p.breakable) continue;
        const bu = p.path.length * (p.breakAt == null ? 0.5 : p.breakAt);
        const m = p.path.at(bu);
        const broken = p.state.broken;
        const g = s("g", { class: ["cx-handle", broken && "is-broken", p.handleState && "is-" + p.handleState].filter(Boolean).join(" "),
          transform: `translate(${m.x.toFixed(1)} ${m.y.toFixed(1)})`, tabindex: "0", role: "button",
          "aria-label": `จุด ${p.breakLabel || p.id}: ${broken ? "สายถูกตัดอยู่" : "สายต่ออยู่"}` });
        g.appendChild(s("circle", { r: 22, class: "cx-handle__hit" }));
        g.appendChild(s("circle", { r: 14, class: "cx-handle__ring" }));
        g.appendChild(textAt(0, 1, broken ? "✕" : (p.breakLabel || "✂"), "cx-handle__txt"));
        const act = () => { if (opts.onBreak) opts.onBreak(p, api); else api.set(p.id, { broken: !p.state.broken }); };
        g.addEventListener("click", act);
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
        gOver.appendChild(g);
      }
    }

    function render() {
      gParts.innerHTML = ""; gOver.innerHTML = "";
      if (opts.background && !gBg.childNodes.length) opts.background(gBg, api);
      svg.classList.toggle("cx--real", style === "real");
      svg.classList.toggle("cx--symbol", style === "symbol");
      for (const p of order) gParts.appendChild(drawPart(p));
      drawLabels();
      drawHandles();
      if (opts.overlay) opts.overlay(gOver, api);
      applyLedState();
    }
    function applyLedState() {
      if (!evalState) return;
      for (const pid of Object.keys(evalState.leds)) {
        const p = parts[pid];
        if (p.g) p.g.classList.toggle("is-on", evalState.leds[pid]);
      }
      svg.classList.toggle("is-closed", evalState.closed);
    }

    /* ---------- particles ---------- */
    function ensurePools(p) {
      const n = Math.ceil(p.path.length / spacing) + 1;
      while (p.ePool.length < n) {
        const e = s("g", { class: "cx-e" });
        e.innerHTML = '<circle r="5"/><rect x="-2.6" y="-0.75" width="5.2" height="1.5" rx=".7"/>';
        gFlow.appendChild(e);
        p.ePool.push(e);
        p.jit.push({ x: 0, y: 0 });
      }
      while (p.aPool.length < n) {
        const a = s("path", { class: "cx-a", d: "M-4.5 -5 L3.5 0 L-4.5 5" });
        gFlow.appendChild(a);
        p.aPool.push(a);
      }
    }
    order.forEach(ensurePools);

    let phase = 0;
    const calm = reducedMotion();
    function hideFrom(pool, i) { for (; i < pool.length; i++) pool[i].style.display = "none"; }
    function electronsAllowed(p) {
      if (p.type === "battery" || p.type === "source" || p.hideFlow) return false;
      if (p.state.missing) return false;
      if (p.type === "slot") return !!(p.state.material && p.state.material.conductor);
      return true;
    }
    function step(dt) {
      phase += dt * 62 * speed;
      const showE = flow === "electron" || flow === "both";
      const showA = flow === "conventional" || flow === "both";
      for (const p of order) {
        const L = p.path.length;
        let ei = 0, ai = 0;
        const allowed = electronsAllowed(p);
        const breakU = p.type === "wire" && p.state.broken ? L * (p.breakAt == null ? 0.5 : p.breakAt) : null;
        if (allowed && showE) {
          const fi = p.flowInfo;
          const place = (uPoly) => {
            if (breakU !== null && Math.abs(uPoly - breakU) < 12) return;
            const e = p.ePool[ei];
            const j = p.jit[ei];
            if (!calm) {
              j.x = Math.max(-2.6, Math.min(2.6, j.x + (Math.random() - 0.5) * 1.1));
              j.y = Math.max(-2.6, Math.min(2.6, j.y + (Math.random() - 0.5) * 1.1));
            }
            const pt = p.path.at(uPoly);
            e.style.display = "";
            e.setAttribute("transform", `translate(${(pt.x + j.x).toFixed(1)} ${(pt.y + j.y).toFixed(1)})`);
            ei++;
          };
          if (fi) {
            // electrons travel opposite to conventional current
            const ph = -phase * p.share;
            let X = fi.cum + mod(ph - fi.cum, spacing);
            for (; X < fi.cum + L && ei < p.ePool.length; X += spacing) {
              const u = X - fi.cum;
              place(fi.fwd ? u : L - u);
            }
          } else {
            for (let u = spacing / 2; u < L && ei < p.ePool.length; u += spacing) place(u);
          }
        }
        hideFrom(p.ePool, ei);
        if (showA && p.flowInfo && allowed) {
          const fi = p.flowInfo;
          const ph = phase * p.share + spacing / 2;
          let X = fi.cum + mod(ph - fi.cum, spacing);
          for (; X < fi.cum + L && ai < p.aPool.length; X += spacing) {
            const u = X - fi.cum;
            const pt = p.path.at(fi.fwd ? u : L - u);
            const ang = (pt.ang + (fi.fwd ? 0 : Math.PI)) * 180 / Math.PI;
            const a = p.aPool[ai++];
            a.style.display = "";
            a.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
          }
        }
        hideFrom(p.aPool, ai);
      }
    }

    const clock = EFZ.sim.loop(step);

    function emit() { listeners.forEach((fn) => fn(evalState, api)); if (opts.onChange) opts.onChange(evalState, api); }

    const api = {
      el: svg,
      svg,
      parts,
      get state() { return evalState; },
      get style() { return style; },
      get flow() { return flow; },
      node: P,
      partCenter(pid) { const p = parts[pid]; const m = p.path.at(p.path.length * (p.breakAt == null ? 0.5 : p.breakAt)); return [m.x, m.y]; },
      set(pid, patch, silent) {
        Object.assign(parts[pid].state, patch);
        evaluate(); render();
        if (!silent) emit();
        return api;
      },
      setMany(map) { for (const k of Object.keys(map)) Object.assign(parts[k].state, map[k]); evaluate(); render(); emit(); return api; },
      setProp(pid, key, val) { parts[pid][key] = val; render(); return api; },
      setStyle(v) { style = v; render(); return api; },
      setFlow(v) { flow = v; svg.dataset.flow = v; step(0); return api; },
      setSpeed(v) { speed = v; return api; },
      highlight(pid) { highlighted = [].concat(pid || []); order.forEach((p) => p.g && p.g.classList.toggle("is-hl", highlighted.includes(p.id))); return api; },
      on(fn) { listeners.push(fn); return api; },
      reset(silent) {
        order.forEach((p) => { p.state = Object.assign({}, p.init); p.handleState = null; });
        evaluate(); render();
        if (!silent) emit();
        return api;
      },
      refresh() { render(); return api; },
      destroy() { clock.destroy(); },
    };

    evaluate();
    render();
    svg.dataset.flow = flow;
    step(0);
    return api;
  }

  /* =========================================================
     Part artwork — local coordinates, x runs from the part's
     "from" terminal to its "to" terminal, centred on 0.
     ========================================================= */
  const SYMBOL = {
    battery(p) {
      if ((p.cells || 1) > 1) {
        return `<g class="cx-sym">
          <line x1="-15" y1="-8" x2="-15" y2="8" class="cx-plate-short"/><line x1="-7" y1="-17" x2="-7" y2="17" class="cx-plate-long"/>
          <line x1="-7" y1="0" x2="7" y2="0" class="cx-sym-dash"/>
          <line x1="7" y1="-8" x2="7" y2="8" class="cx-plate-short"/><line x1="15" y1="-17" x2="15" y2="17" class="cx-plate-long"/>
          <line x1="-22" y1="0" x2="-15" y2="0"/><line x1="15" y1="0" x2="22" y2="0"/></g>`;
      }
      return `<g class="cx-sym"><line x1="-6" y1="-9" x2="-6" y2="9" class="cx-plate-short"/><line x1="6" y1="-18" x2="6" y2="18" class="cx-plate-long"/>
        <line x1="-20" y1="0" x2="-6" y2="0"/><line x1="6" y1="0" x2="20" y2="0"/></g>`;
    },
    source() { return ""; },
    resistor() {
      return `<g class="cx-sym"><path d="M-24 0 L-18 0 L-15 -8 L-9 8 L-3 -8 L3 8 L9 -8 L15 8 L18 0 L24 0" fill="none"/></g>`;
    },
    led(p, span, id) {
      return `<g class="cx-sym cx-led-body">
        <circle r="30" class="cx-led-glow" fill="url(#${id}-glow)"/>
        <line x1="-20" y1="0" x2="-10" y2="0"/><line x1="10" y1="0" x2="20" y2="0"/>
        <path d="M-10 -11 L-10 11 L10 0 Z" class="cx-led-tri"/>
        <line x1="10" y1="-11" x2="10" y2="11"/>
        <g class="cx-led-rays"><path d="M0 -14 L7 -24 M4 -24 L7 -24 L7 -21"/><path d="M7 -12 L14 -22 M11 -22 L14 -22 L14 -19"/></g></g>`;
    },
    switch(p) {
      const ang = p.state.closed ? 0 : -30;
      return `<g class="cx-sym"><line x1="-22" y1="0" x2="-17" y2="0"/><line x1="17" y1="0" x2="22" y2="0"/>
        <line x1="-17" y1="0" x2="17" y2="0" class="cx-lever" transform="rotate(${ang} -17 0)"/>
        <circle cx="-17" cy="0" r="3.6" class="cx-term"/><circle cx="17" cy="0" r="3.6" class="cx-term"/></g>`;
    },
    slot(p) { return slotArt(p, "symbol"); },
    lamp() {
      return `<g class="cx-sym"><circle r="14" fill="#fff"/><path d="M-10 -10 L10 10 M-10 10 L10 -10"/><line x1="-20" y1="0" x2="-14" y2="0"/><line x1="14" y1="0" x2="20" y2="0"/></g>`;
    },
  };

  const REAL = {
    battery(p, span, id) {
      const cells = p.cells || 1;
      const cellLen = 44;
      let out = "";
      for (let i = 0; i < cells; i++) {
        const x0 = -((cells * cellLen) / 2) + i * cellLen + 2;
        out += `<g><rect x="${x0}" y="-13" width="38" height="26" rx="5" fill="url(#${id}-cell)" stroke="#0f172a" stroke-width="1.5"/>
          <rect x="${x0 + 26}" y="-13" width="12" height="26" rx="3" fill="#f59e0b" stroke="#b45309" stroke-width="1.2"/>
          <rect x="${x0 + 38}" y="-5" width="4" height="10" rx="1.5" fill="#cbd5e1" stroke="#64748b" stroke-width="1"/>
          <path d="M${x0 + 6} -7 h12" stroke="rgba(255,255,255,.35)" stroke-width="2.4" stroke-linecap="round"/></g>`;
      }
      return out;
    },
    source() { return ""; },
    resistor(p, span, id) {
      return `<g><line x1="-30" y1="0" x2="30" y2="0" class="cx-lead"/>
        <path d="M-19 -7 Q-21 -8.5 -19 -8.5 H-12 Q-10 -6 -6 -6 H6 Q10 -6 12 -8.5 H19 Q21 -8.5 21 -6 V6 Q21 8.5 19 8.5 H12 Q10 6 6 6 H-6 Q-10 6 -12 8.5 H-19 Q-21 8.5 -21 6 V-6 Q-21 -8.5 -19 -8.5 Z" fill="url(#${id}-res)" class="cx-res-body"/>
        <rect x="-15" y="-8.4" width="3.6" height="16.8" fill="#f97316"/>
        <rect x="-7.5" y="-6" width="3.6" height="12" fill="#f97316"/>
        <rect x="-1" y="-6" width="3.6" height="12" fill="#7c2d12"/>
        <rect x="12.5" y="-8.4" width="3.6" height="16.8" fill="#d4a017"/></g>`;
    },
    led(p, span, id) {
      return `<g class="cx-led-body">
        <circle r="34" class="cx-led-glow" fill="url(#${id}-glow)"/>
        <line x1="-23" y1="0" x2="-8" y2="0" class="cx-lead"/><line x1="8" y1="0" x2="23" y2="0" class="cx-lead"/>
        <path d="M-12.5 -6 A14 14 0 1 1 -12.5 6 Z" transform="rotate(180)" class="cx-led-rim"/>
        <path d="M-10.8 -5 A12 12 0 1 1 -10.8 5 Z" transform="rotate(180)" class="cx-led-dome"/>
        <ellipse cx="-4" cy="-5" rx="3.5" ry="2.2" fill="#fff" opacity=".55"/></g>`;
    },
    switch(p) {
      const ang = p.state.closed ? 0 : -32;
      return `<g><line x1="-30" y1="0" x2="-18" y2="0" class="cx-lead"/><line x1="18" y1="0" x2="30" y2="0" class="cx-lead"/>
        <rect x="-27" y="1" width="54" height="11" rx="4" fill="#334155" stroke="#0f172a" stroke-width="1.3"/>
        <g transform="rotate(${ang} -18 0)"><rect x="-19" y="-2.6" width="38" height="5.2" rx="2.4" fill="#e5e7eb" stroke="#64748b" stroke-width="1.2"/>
        <circle cx="14" cy="-7" r="5.4" fill="#ef4444" stroke="#991b1b" stroke-width="1.2"/><line x1="14" y1="-2" x2="14" y2="-4" stroke="#64748b" stroke-width="2"/></g>
        <circle cx="-18" cy="0" r="4.2" fill="#cbd5e1" stroke="#475569" stroke-width="1.3"/><circle cx="18" cy="0" r="4.2" fill="#cbd5e1" stroke="#475569" stroke-width="1.3"/></g>`;
    },
    slot(p) { return slotArt(p, "real"); },
    lamp() {
      return `<g><line x1="-24" y1="0" x2="-12" y2="0" class="cx-lead"/><line x1="12" y1="0" x2="24" y2="0" class="cx-lead"/>
        <circle r="15" class="cx-led-dome"/></g>`;
    },
  };

  /** Slot: two clips with an exchangeable test material between them. */
  function slotArt(p, styleName) {
    const m = p.state.material;
    const clips = `<rect x="-32" y="-7" width="8" height="14" rx="2" fill="#475569"/><rect x="24" y="-7" width="8" height="14" rx="2" fill="#475569"/>`;
    if (!m) {
      return `${clips}<rect x="-22" y="-14" width="44" height="28" rx="6" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="0" y="1" text-anchor="middle" dominant-baseline="middle" class="cx-slot-q">?</text>`;
    }
    return `${clips}<g class="cx-material">${m.art ? m.art(styleName) : ""}</g>`;
  }

  EFZ.sim.circuit = circuit;
  EFZ.sim.WIRE_COLORS = WIRE_COLORS;
})();
