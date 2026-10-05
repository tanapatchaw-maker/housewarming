/* =========================================================
   Teaching Assistant ("พี่ไอซ์") — one SVG character reused
   throughout Part 1. Recreated from the visual reference as
   layered SVG so pose, expression and props can animate.

   Poses: neutral, explain, point, thinking, idea, warning,
          happy, esp32, multimeter, laptop, summary
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});
  const { h, s, graphemes, reducedMotion } = EFZ.util;

  const C = {
    hair: "#6b3f2a", hairFront: "#7a4a31", hairHi: "#9a6446",
    skin: "#ffe3d3", skinShade: "#f6c9b3", line: "#3b2418",
    hoodie: "#ffffff", hoodieShade: "#e6ebf2", hoodieLine: "#cbd5e1",
    brand: "#e11d48", cheek: "#ff9fa0", mouth: "#b4533c",
  };

  /* ---------- Expressions ---------- */
  const EYES = {
    open: `
      <g><ellipse cx="82" cy="104" rx="7.2" ry="9" fill="${C.line}"/><ellipse cx="82" cy="106" rx="5" ry="6.2" fill="#6b4226"/>
      <circle cx="79.6" cy="100.6" r="2.7" fill="#fff"/><circle cx="84.4" cy="108.4" r="1.2" fill="#fff"/>
      <path d="M73.5 97.5 Q82 92 90.5 97" stroke="${C.line}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
      <g><ellipse cx="118" cy="104" rx="7.2" ry="9" fill="${C.line}"/><ellipse cx="118" cy="106" rx="5" ry="6.2" fill="#6b4226"/>
      <circle cx="115.6" cy="100.6" r="2.7" fill="#fff"/><circle cx="120.4" cy="108.4" r="1.2" fill="#fff"/>
      <path d="M109.5 97 Q118 92 126.5 97.5" stroke="${C.line}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`,
    happy: `
      <path d="M74 106 Q82 96 90 106" stroke="${C.line}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M110 106 Q118 96 126 106" stroke="${C.line}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    wink: `
      <g><ellipse cx="82" cy="104" rx="7.2" ry="9" fill="${C.line}"/><ellipse cx="82" cy="106" rx="5" ry="6.2" fill="#6b4226"/>
      <circle cx="79.6" cy="100.6" r="2.7" fill="#fff"/><circle cx="84.4" cy="108.4" r="1.2" fill="#fff"/></g>
      <path d="M110 105 Q118 98 126 105" stroke="${C.line}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    wide: `
      <g><ellipse cx="82" cy="104" rx="7.8" ry="9.8" fill="#fff" stroke="${C.line}" stroke-width="1.6"/><circle cx="82" cy="105" r="4.6" fill="${C.line}"/><circle cx="80.4" cy="103" r="1.6" fill="#fff"/></g>
      <g><ellipse cx="118" cy="104" rx="7.8" ry="9.8" fill="#fff" stroke="${C.line}" stroke-width="1.6"/><circle cx="118" cy="105" r="4.6" fill="${C.line}"/><circle cx="116.4" cy="103" r="1.6" fill="#fff"/></g>`,
  };
  const BROWS = {
    soft: `<path d="M73 88 Q81 84 89 87" /><path d="M111 87 Q119 84 127 88" />`,
    up: `<path d="M73 85 Q81 80 89 84" /><path d="M111 84 Q119 80 127 85" />`,
    worry: `<path d="M73 89 Q82 87 89 83" /><path d="M111 83 Q118 87 127 89" />`,
    think: `<path d="M73 87 Q81 84 89 87" /><path d="M111 84 Q119 79 127 83" />`,
  };
  const MOUTHS = {
    smile: `<path d="M92 122 Q100 129 108 122" stroke="${C.mouth}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    open: `<path d="M90.5 120 Q100 135 109.5 120 Z" fill="#c24a3a" stroke="${C.mouth}" stroke-width="1.6" stroke-linejoin="round"/><path d="M94 127 Q100 131 106 127 Q100 133 94 127Z" fill="#ff8a80"/>`,
    o: `<ellipse cx="100" cy="124" rx="4.2" ry="5" fill="#c24a3a" stroke="${C.mouth}" stroke-width="1.4"/>`,
    hmm: `<path d="M93 124 Q99 121 107 124" stroke="${C.mouth}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    worry: `<path d="M92 126 Q100 119 108 126" stroke="${C.mouth}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M95 125.5 Q100 122 105 125.5" stroke="#c24a3a" stroke-width="1.4" fill="none"/>`,
  };

  /* ---------- Arms: [shoulder, elbow(control), hand] ---------- */
  function arm(sx, sy, ex, ey, hx, hy, extra) {
    const d = `M${sx} ${sy} Q${ex} ${ey} ${hx} ${hy}`;
    return `<path d="${d}" stroke="${C.hoodieLine}" stroke-width="23" fill="none" stroke-linecap="round"/>
            <path d="${d}" stroke="${C.hoodie}" stroke-width="19.5" fill="none" stroke-linecap="round"/>
            <circle cx="${hx}" cy="${hy}" r="9.5" fill="${C.skin}" stroke="${C.skinShade}" stroke-width="1.5"/>${extra || ""}`;
  }
  const finger = (x, y, ang) =>
    `<rect x="${x - 3}" y="${y - 15}" width="6" height="15" rx="3" fill="${C.skin}" stroke="${C.skinShade}" stroke-width="1.3" transform="rotate(${ang} ${x} ${y})"/>`;
  const armDownL = arm(60, 186, 50, 214, 54, 248);
  const armDownR = arm(140, 186, 150, 214, 146, 248);

  /* ---------- Props ---------- */
  const PROPS = {
    bulb: `<g class="ta-prop-float"><circle cx="166" cy="44" r="22" fill="#fde047" class="ta-glow"/>
      <path d="M166 26 a14 14 0 0 1 8.5 25 c-1.6 1.3-2.5 3-2.5 5 h-12 c0-2-.9-3.7-2.5-5 A14 14 0 0 1 166 26z" fill="#facc15" stroke="#a16207" stroke-width="2"/>
      <rect x="159.5" y="57" width="13" height="7" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
      <path d="M160 64h12" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
      <path d="M144 30l-6-4M188 30l6-4M166 14v-6M144 50h-7M188 50h7" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"/></g>`,
    question: `<g class="ta-prop-float"><text x="160" y="58" font-family="Prompt, sans-serif" font-weight="800" font-size="44" fill="#dc2626">?</text></g>`,
    warning: `<g class="ta-prop-float"><path d="M168 18 L192 60 H144 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="165.5" y="32" width="5" height="15" rx="2.5" fill="#fff"/><circle cx="168" cy="53" r="3" fill="#fff"/></g>`,
    sparkles: `<g class="ta-prop-float" fill="#facc15" stroke="#ca8a04" stroke-width="1.2">
      <path d="M170 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M30 46 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M182 74 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z"/></g>`,
    esp32: `<g class="ta-pop"><rect x="64" y="186" width="72" height="44" rx="4" fill="#0f172a" stroke="#020617" stroke-width="2"/>
      <rect x="88" y="192" width="34" height="26" rx="2" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/>
      <text x="105" y="209" text-anchor="middle" font-family="Prompt, sans-serif" font-weight="700" font-size="8" fill="#334155">ESP32</text>
      <g fill="#facc15">${Array.from({ length: 10 }, (_, i) => `<rect x="${67 + i * 7}" y="188" width="3" height="3"/><rect x="${67 + i * 7}" y="225" width="3" height="3"/>`).join("")}</g>
      <rect x="70" y="203" width="10" height="9" rx="1.5" fill="#94a3b8"/></g>`,
    multimeter: `<g class="ta-pop"><rect x="146" y="128" width="40" height="64" rx="7" fill="#facc15" stroke="#a16207" stroke-width="2"/>
      <rect x="152" y="134" width="28" height="15" rx="2" fill="#1f2937"/>
      <text x="166" y="145.5" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="9" fill="#a3e635">3.30</text>
      <circle cx="166" cy="166" r="10" fill="#1f2937"/><path d="M166 166 L172 160" stroke="#facc15" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="157" cy="185" r="2.6" fill="#111"/><circle cx="175" cy="185" r="2.6" fill="#dc2626"/></g>`,
    laptop: `<g class="ta-pop"><path d="M58 236 L70 196 H130 L142 236 Z" fill="#94a3b8" stroke="#475569" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="100" cy="215" r="5" fill="#e2e8f0"/><path d="M48 236 H152 L148 244 H52Z" fill="#cbd5e1" stroke="#475569" stroke-width="2" stroke-linejoin="round"/></g>`,
    clipboard: `<g class="ta-pop"><rect x="42" y="176" width="44" height="58" rx="5" fill="#fef3c7" stroke="#a16207" stroke-width="2"/>
      <rect x="54" y="171" width="20" height="9" rx="3" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
      <path d="M50 194l4 4 7-8M50 210l4 4 7-8M50 226l4 4 7-8" stroke="#16a34a" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M66 195h14M66 211h14M66 227h12" stroke="#94a3b8" stroke-width="2.4" stroke-linecap="round"/></g>`,
  };

  /* ---------- Pose table ---------- */
  const POSES = {
    neutral: { eyes: "open", brows: "soft", mouth: "open", arms: armDownL + `<g class="ta-wave">${arm(140, 186, 170, 172, 172, 128, finger(172, 122, -8))}</g>`, label: "สวัสดี" },
    explain: { eyes: "open", brows: "soft", mouth: "smile", arms: armDownL + arm(140, 186, 172, 206, 178, 170, finger(182, 164, 30)), label: "อธิบาย" },
    point: { eyes: "open", brows: "up", mouth: "smile", arms: armDownL + arm(140, 186, 168, 194, 176, 150, finger(186, 148, 72)), label: "ชี้จุดสำคัญ" },
    thinking: { eyes: "open", brows: "think", mouth: "hmm", arms: armDownL + arm(140, 188, 158, 176, 121, 151), prop: "question", label: "สงสัย" },
    idea: { eyes: "wide", brows: "up", mouth: "o", arms: armDownL + arm(140, 186, 166, 182, 166, 136, finger(166, 128, 0)), prop: "bulb", label: "คิดออกแล้ว" },
    warning: { eyes: "wide", brows: "worry", mouth: "worry", arms: arm(60, 186, 30, 180, 30, 140) + arm(140, 186, 170, 180, 170, 140), prop: "warning", label: "ระวัง!" },
    happy: { eyes: "happy", brows: "up", mouth: "open", arms: arm(60, 186, 28, 182, 34, 140) + arm(140, 186, 172, 182, 166, 140), prop: "sparkles", label: "เยี่ยมเลย!" },
    esp32: { eyes: "wink", brows: "soft", mouth: "open", arms: arm(60, 186, 56, 214, 70, 210) + arm(140, 186, 144, 214, 130, 210), propFront: "esp32", label: "ถือ ESP32" },
    multimeter: { eyes: "open", brows: "up", mouth: "smile", arms: armDownL + arm(140, 186, 150, 200, 152, 176), propFront: "multimeter", label: "ถือมัลติมิเตอร์" },
    laptop: { eyes: "open", brows: "soft", mouth: "smile", arms: arm(60, 186, 62, 216, 80, 230) + arm(140, 186, 138, 216, 120, 230), propFront: "laptop", label: "ใช้คอมพิวเตอร์" },
    summary: { eyes: "happy", brows: "soft", mouth: "open", arms: arm(60, 186, 50, 214, 66, 208) + arm(140, 186, 166, 182, 166, 136, finger(166, 128, 0)), propFront: "clipboard", prop: "sparkles", label: "สรุป" },
  };

  function characterMarkup(poseName) {
    const p = POSES[poseName] || POSES.neutral;
    return `
    <g class="ta-bob">
      <path d="M100 28 C52 28 36 70 38 120 C40 165 34 195 28 222 C50 228 70 224 82 214 L118 214 C130 224 150 228 172 222 C166 195 160 165 162 120 C164 70 148 28 100 28Z" fill="${C.hair}"/>
      <path d="M44 262 C44 212 56 178 82 168 L118 168 C144 178 156 212 156 262 Z" fill="${C.hoodie}" stroke="${C.hoodieLine}" stroke-width="2"/>
      <path d="M58 210 C60 236 60 250 58 262" stroke="${C.hoodieShade}" stroke-width="3" fill="none"/>
      <path d="M142 210 C140 236 140 250 142 262" stroke="${C.hoodieShade}" stroke-width="3" fill="none"/>
      <rect x="90" y="134" width="20" height="34" rx="6" fill="${C.skin}"/>
      <path d="M90 150 Q100 158 110 150 L110 140 L90 140Z" fill="${C.skinShade}" opacity=".6"/>
      <path d="M72 166 Q100 192 128 166" stroke="${C.hoodieShade}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M72 166 Q100 192 128 166" stroke="${C.hoodieLine}" stroke-width="1.5" fill="none"/>
      <path d="M92 182 L90 206 M108 182 L110 206" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <circle cx="90" cy="208" r="2.4" fill="#94a3b8"/><circle cx="110" cy="208" r="2.4" fill="#94a3b8"/>
      <text x="100" y="236" text-anchor="middle" font-family="Prompt, sans-serif" font-weight="800" font-size="15" fill="${C.brand}" letter-spacing=".5">ESP32</text>
      <g class="ta-arms">${p.arms}</g>
      <ellipse cx="100" cy="96" rx="44" ry="48" fill="${C.skin}"/>
      <ellipse cx="70" cy="118" rx="7.5" ry="4.2" fill="${C.cheek}" opacity=".5"/>
      <ellipse cx="130" cy="118" rx="7.5" ry="4.2" fill="${C.cheek}" opacity=".5"/>
      <g class="ta-eyes">${EYES[p.eyes]}</g>
      <g stroke="${C.line}" stroke-width="2.6" fill="none" stroke-linecap="round">${BROWS[p.brows]}</g>
      <path d="M99 113 Q100 115 101.5 113" stroke="${C.skinShade}" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${MOUTHS[p.mouth]}
      <path d="M56 98 C50 54 76 32 100 32 C128 32 152 54 146 100 C141 82 133 71 124 64 C120 77 107 85 92 87 C99 79 101 71 99 64 C89 76 75 84 61 88 C59 91 57 94 56 98Z" fill="${C.hairFront}"/>
      <path d="M58 92 C51 122 54 152 48 180 C58 172 63 150 65 118Z" fill="${C.hairFront}"/>
      <path d="M142 92 C149 122 146 152 152 180 C142 172 137 150 135 118Z" fill="${C.hairFront}"/>
      <path d="M78 44 Q92 37 108 39" stroke="${C.hairHi}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
      ${p.propFront ? PROPS[p.propFront] : ""}
      ${p.prop ? PROPS[p.prop] : ""}
    </g>`;
  }

  function figure(pose) {
    const svgEl = s("svg", { viewBox: "0 0 200 262", class: "ta-svg", role: "img", "aria-label": "ผู้ช่วยสอน: " + ((POSES[pose] || POSES.neutral).label) });
    svgEl.innerHTML = characterMarkup(pose);
    return svgEl;
  }

  /**
   * Create a Teaching Assistant with speech bubble + narration.
   * lines: Array<string | {text, pose}>
   */
  function create(opts = {}) {
    const fig = h("div", { class: "ta__figure" });
    const text = h("p", { class: "ta__text", "aria-live": "polite" });
    const dots = h("div", { class: "ta__dots", "aria-hidden": "true" });
    const prev = h("button", { type: "button", class: "ta__navbtn", "aria-label": "ประโยคก่อนหน้า" }, EFZ.icon("back"));
    const next = h("button", { type: "button", class: "ta__navbtn", "aria-label": "ประโยคถัดไป" }, EFZ.icon("next"));
    const bubble = h("div", { class: "ta__bubble", title: "แตะเพื่ออ่านประโยคถัดไป" },
      h("div", { class: "ta__name" }, h("span", null, opts.name || "พี่ไอซ์ · ผู้ช่วยสอน")),
      text,
      h("div", { class: "ta__nav" }, prev, dots, next));
    const el = h("div", { class: ["ta", opts.compact && "ta--compact"] }, fig, bubble);

    let pose = null;
    let lines = [];
    let idx = 0;
    let shown = 0;
    let parts = [];
    let typer = null;
    let advanceTimer = null;
    let paused = false;
    let typing = false;
    let onDone = null;

    function setPose(p) {
      if (p === pose) return;
      pose = p;
      fig.innerHTML = "";
      fig.appendChild(figure(p));
    }
    function clearTimers() { clearTimeout(typer); clearTimeout(advanceTimer); typer = advanceTimer = null; }
    function renderDots() {
      dots.innerHTML = "";
      lines.forEach((_, i) => dots.appendChild(h("span", { class: i === idx ? "is-on" : "" })));
      prev.disabled = idx === 0;
      next.disabled = idx >= lines.length - 1 && !typing;
    }
    function lineObj(i) { const l = lines[i]; return typeof l === "string" ? { text: l } : l; }

    // Text may contain <b>…</b>; type the plain text, then swap in the rich version.
    function startLine(i) {
      clearTimers();
      idx = i;
      const l = lineObj(i);
      if (l.pose) setPose(l.pose);
      const plain = l.text.replace(/<[^>]+>/g, "");
      parts = graphemes(plain);
      shown = 0;
      typing = true;
      renderDots();
      if (reducedMotion()) { finishLine(); return; }
      tick();
    }
    function tick() {
      if (paused) return;
      shown = Math.min(parts.length, shown + 2);
      text.textContent = parts.slice(0, shown).join("");
      text.appendChild(h("span", { class: "ta__caret" }));
      if (shown >= parts.length) finishLine();
      else typer = setTimeout(tick, 32);
    }
    function finishLine() {
      clearTimers();
      typing = false;
      text.innerHTML = lineObj(idx).text;
      renderDots();
      scheduleAdvance();
    }
    function scheduleAdvance() {
      if (paused || typing) return;
      clearTimeout(advanceTimer);
      if (idx < lines.length - 1) {
        const len = parts.length;
        advanceTimer = setTimeout(() => startLine(idx + 1), 2200 + len * 38);
      } else if (onDone) {
        const cb = onDone; onDone = null; cb();
      }
    }

    prev.addEventListener("click", (e) => { e.stopPropagation(); if (idx > 0) startLine(idx - 1); });
    next.addEventListener("click", (e) => { e.stopPropagation(); advance(); });
    bubble.addEventListener("click", advance);
    function advance() {
      if (typing) finishLine();
      else if (idx < lines.length - 1) startLine(idx + 1);
    }

    const api = {
      el,
      setPose,
      /** Replace narration with new lines. */
      say(newLines, o = {}) {
        lines = (Array.isArray(newLines) ? newLines : [newLines]).filter(Boolean);
        onDone = o.onDone || null;
        if (!lines.length) return;
        if (o.pose) setPose(o.pose);
        startLine(0);
      },
      replay() { if (lines.length) startLine(0); },
      pause() { paused = true; clearTimers(); },
      resume() {
        if (!paused) return;
        paused = false;
        if (typing) tick(); else scheduleAdvance();
      },
      destroy() { clearTimers(); },
    };
    setPose(opts.pose || "neutral");
    if (opts.lines) api.say(opts.lines);
    return api;
  }

  EFZ.TA = { create, figure, poses: Object.keys(POSES) };
})();
