/* =========================================================
   LESSON 01 — Electricity คืออะไร (8 นาที)
   Goal: electricity involves electric charge, and a circuit
   needs a complete path. Introduces electron flow (− → +)
   vs conventional current (+ → −).
   ========================================================= */
(function () {
  "use strict";
  const EFZ = window.EFZ;
  const { h, s, svgFrag, clamp } = EFZ.util;
  const ui = EFZ.ui;

  /* ---------------------------------------------------------
     Shared circuit: 3V battery pack → switch → 330Ω → LED → back
     (the resistor is there for accuracy; it is taught in L04/L10)
     --------------------------------------------------------- */
  const NODES = {
    p: [130, 120], n: [130, 240], tl: [130, 60], s1: [230, 60], s2: [320, 60],
    tr: [500, 60], ra: [500, 110], rb: [500, 200], br: [500, 290],
    la: [370, 290], lc: [260, 290], bl: [130, 290],
  };
  const LOOP = ["w1", "sw", "w2", "r1", "w3", "led", "w4"];

  function circuitParts(o = {}) {
    return [
      { id: "bat", type: "battery", plus: "p", minus: "n", cells: 2, label: "แบตเตอรี่\n3V (AA × 2)", labelSide: -1, labelOffset: 36 },
      { id: "w1", type: "wire", from: "p", to: "s1", via: ["tl"], color: "red", breakable: true, breakAt: 0.6, breakLabel: "A" },
      { id: "sw", type: "switch", from: "s1", to: "s2", closed: o.closed !== false, clickable: o.switchClickable !== false, label: "สวิตช์", labelSide: -1, labelOffset: 34 },
      { id: "w2", type: "wire", from: "s2", to: "ra", via: ["tr"], color: "red", breakable: true, breakAt: 0.4, breakLabel: "B" },
      { id: "r1", type: "resistor", from: "ra", to: "rb", label: "ตัวต้านทาน\n330Ω", labelSide: -1, labelOffset: 30 },
      { id: "w3", type: "wire", from: "rb", to: "la", via: ["br"], color: "red", breakable: true, breakAt: 0.7, breakLabel: "C" },
      { id: "led", type: "led", from: "la", to: "lc", label: "LED", labelSide: o.ledLabelUp ? 1 : -1, labelOffset: 34 },
      { id: "w4", type: "wire", from: "lc", to: "n", via: ["bl"], color: "black", breakable: true, breakAt: 0.4, breakLabel: "D", state: o.w4State },
    ];
  }
  function mainCircuit(ctx, o = {}) {
    return ctx.circuit(Object.assign({
      width: 640, height: 340, nodes: NODES, parts: circuitParts(o), loops: [LOOP],
      style: "real", flow: "electron",
      label: "วงจร: แบตเตอรี่ สวิตช์ ตัวต้านทาน และ LED",
    }, o.circuit || {}));
  }

  const { ledState, flowLegend, viewToggle } = EFZ.kit;

  /* =========================================================
     STEP 1 — HOOK: อะไรทำให้หลอดไฟติด?
     ========================================================= */
  function renderHook(el, ctx) {
    const svg = s("svg", { viewBox: "0 0 600 300", class: "room", role: "img", "aria-label": "ห้องที่มีสวิตช์และหลอดไฟ" });
    svg.innerHTML = `
      <defs>
        <radialGradient id="l1-bulbglow"><stop offset="0" stop-color="#fff7c2" stop-opacity="1"/><stop offset=".4" stop-color="#fde68a" stop-opacity=".55"/><stop offset="1" stop-color="#fde68a" stop-opacity="0"/></radialGradient>
        <linearGradient id="l1-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef3fb"/><stop offset="1" stop-color="#dde6f3"/></linearGradient>
      </defs>
      <rect width="600" height="300" fill="url(#l1-wall)"/>
      <rect y="262" width="600" height="38" fill="#c7d2e3"/>
      <rect x="0" y="0" width="600" height="18" fill="#cfd9e8"/>
      <g class="room-dark"><rect width="600" height="300" fill="#0b1f44" opacity=".26"/></g>
      <g class="room-light"><circle cx="420" cy="132" r="190" fill="url(#l1-bulbglow)"/></g>
      <!-- hidden wiring inside wall (shown as x-ray) -->
      <g class="room-wires">
        <path d="M120 150 V40 H404 V96" class="room-wire"/>
        <path d="M132 150 V52 H436 V96" class="room-wire"/>
        <path d="M120 150 V40 H404 V96" class="room-flow"/>
        <path d="M436 96 V52 H132 V150" class="room-flow"/>
        <text x="270" y="33" text-anchor="middle" class="room-xray">ภาพเอกซเรย์: สายไฟในผนัง</text>
      </g>
      <!-- lamp -->
      <line x1="420" y1="18" x2="420" y2="70" stroke="#475569" stroke-width="3"/>
      <path d="M392 96 L448 96 L436 70 L404 70Z" fill="#334155"/>
      <circle cx="420" cy="118" r="22" class="room-bulb"/>
      <path d="M412 112 q8 10 16 0" stroke="#a16207" stroke-width="2" fill="none" class="room-filament"/>
      <!-- switch -->
      <g class="room-switch" tabindex="0" role="button" aria-label="สวิตช์ไฟ แตะเพื่อเปิดปิด">
        <rect x="96" y="142" width="60" height="88" rx="10" fill="#fff" stroke="#94a3b8" stroke-width="2"/>
        <rect x="110" y="160" width="32" height="52" rx="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
        <rect x="114" y="164" width="24" height="22" rx="4" class="room-rocker"/>
        <text x="126" y="252" text-anchor="middle" class="room-hint">แตะสวิตช์</text>
      </g>
      <text x="580" y="290" text-anchor="end" class="room-note">ภาพประกอบเท่านั้น — ห้ามทดลองกับไฟบ้าน 220V</text>`;
    let on = false;
    const status = h("div", { class: "status-line" }, ledState(false));
    const sw = svg.querySelector(".room-switch");
    function setOn(v) {
      on = v;
      svg.classList.toggle("is-on", on);
      status.innerHTML = "";
      status.appendChild(h("span", { class: "big-state " + (on ? "big-state--on" : "big-state--off") }, h("span", { class: "lamp" }), on ? "หลอดไฟติด" : "หลอดไฟดับ"));
      ctx.say(on
        ? [{ pose: "idea", text: "ไฟติดแล้ว! สังเกต <b>เส้นสีส้ม</b> ในผนังไหม? มีบางอย่างเคลื่อนที่ไป<b>และกลับ</b>" }]
        : [{ pose: "thinking", text: "ไฟดับ… สวิตช์ทำอะไรกับสายไฟกันแน่นะ?" }]);
    }
    sw.addEventListener("click", () => setOn(!on));
    sw.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOn(!on); } });
    ctx.registerReset(() => setOn(false));

    const frame = EFZ.sim.frame({ title: "กดสวิตช์ แล้วสังเกตหลอดไฟ", badge: "TRY IT", hint: "แตะสวิตช์บนผนัง", stage: svg, controls: status });

    const pred = ui.predict({
      question: "คิดว่าอะไรทำให้หลอดไฟสว่าง?",
      options: [
        { label: "สวิตช์ปล่อยไฟฟ้าออกมาเอง", correct: false, feedback: "สวิตช์ไม่ได้ผลิตไฟฟ้า มันทำหน้าที่แค่ <b>ต่อ</b> หรือ <b>ตัด</b> เส้นทาง" },
        { label: "เกิดเส้นทางครบรอบ ให้ไฟฟ้าไหลผ่านหลอดไฟได้", correct: true },
        { label: "หลอดไฟเก็บไฟฟ้าไว้ข้างในอยู่แล้ว", correct: false, feedback: "หลอดไฟไม่ได้เก็บไฟฟ้า มันแค่ <b>ใช้</b> พลังงานไฟฟ้าที่ไหลผ่านมา" },
      ],
      explain: "เมื่อกดสวิตช์ เส้นทางของไฟฟ้า <b>ครบรอบ</b> ประจุไฟฟ้าจึงเคลื่อนที่ผ่านหลอดไฟได้ — บทนี้เราจะมาดูกันว่า “ไฟฟ้า” ที่ไหลอยู่นั้นคืออะไร",
      onAnswer: (o, ok) => ctx.say([{ pose: ok ? "happy" : "explain", text: ok ? "เก่งมาก! คำสำคัญของบทนี้คือ <b>เส้นทางครบรอบ</b>" : "ไม่เป็นไร! คำตอบคือ <b>เส้นทางครบรอบ</b> — เดี๋ยวเราจะเห็นกันชัด ๆ" }]),
    });
    el.append(frame, pred.el);
  }

  /* =========================================================
     STEP 2 — CONCEPT: Atom → Electron → Charge
     ========================================================= */
  function renderConcept(el, ctx) {
    const CX = 160, CY = 150;
    const orbits = [
      { rx: 128, ry: 46, rot: 25, n: 2, speed: 1.1 },
      { rx: 128, ry: 46, rot: -25, n: 2, speed: 0.85 },
      { rx: 60, ry: 60, rot: 0, n: 2, speed: 1.6 },
    ];
    const svg = s("svg", { viewBox: "0 0 320 300", class: "atom", role: "img", "aria-label": "แบบจำลองอะตอมอย่างง่าย" });
    const gOrb = s("g", { class: "atom-orbits" });
    orbits.forEach((o) => gOrb.appendChild(s("ellipse", { cx: CX, cy: CY, rx: o.rx, ry: o.ry, transform: `rotate(${o.rot} ${CX} ${CY})` })));
    const nucleus = svgFrag(`
      <circle cx="${CX}" cy="${CY}" r="34" class="atom-nuc-halo"/>
      ${[[-9, -8, "p"], [9, -9, "n"], [0, 8, "p"], [-12, 9, "n"], [12, 8, "p"], [1, -16, "n"]].map(([dx, dy, t]) =>
        `<g transform="translate(${CX + dx} ${CY + dy})"><circle r="10" class="${t === "p" ? "atom-p" : "atom-n"}"/>${t === "p" ? '<path d="M-4 0h8M0 -4v8" class="atom-sign"/>' : ""}</g>`).join("")}`, { class: "atom-nucleus" });
    const gE = s("g", { class: "atom-electrons" });
    const electrons = [];
    orbits.forEach((o, oi) => {
      for (let k = 0; k < o.n; k++) {
        const e = svgFrag('<circle r="9" class="atom-e"/><rect x="-4.5" y="-1.2" width="9" height="2.4" rx="1" fill="#fff"/>');
        gE.appendChild(e);
        electrons.push({ e, o, phase: (k / o.n) * Math.PI * 2 + oi });
      }
    });
    const labels = svgFrag(`
      <g class="atom-label atom-label--nuc"><line x1="${CX + 20}" y1="${CY + 22}" x2="200" y2="266"/><text x="186" y="284">นิวเคลียส (+)</text></g>
      <g class="atom-label atom-label--e"><line x1="60" y1="70" x2="40" y2="34"/><text x="16" y="26">อิเล็กตรอน (−)</text></g>`);
    svg.append(gOrb, nucleus, gE, labels);
    ctx.loop((dt, t) => {
      for (const it of electrons) {
        const { rx, ry, rot, speed } = it.o;
        const ph = it.phase + t * speed;
        const th = rot * Math.PI / 180;
        const x = CX + rx * Math.cos(ph) * Math.cos(th) - ry * Math.sin(ph) * Math.sin(th);
        const y = CY + rx * Math.cos(ph) * Math.sin(th) + ry * Math.sin(ph) * Math.cos(th);
        it.e.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      }
    });

    // charge demo (attract / repel)
    const charge = s("svg", { viewBox: "0 0 320 110", class: "charges", role: "img", "aria-label": "ประจุต่างชนิดดูดกัน ประจุชนิดเดียวกันผลักกัน" });
    const qa = svgFrag('<circle r="20" class="q-plus"/><path d="M-8 0h16M0 -8v16" class="q-sign"/>');
    const qb = svgFrag('<circle r="20" class="q-minus"/><path d="M-8 0h16" class="q-sign"/>');
    const arrows = s("g", { class: "q-arrows" });
    const capt = s("text", { x: 160, y: 102, "text-anchor": "middle", class: "q-cap" });
    charge.append(arrows, qa, qb, capt);
    let mode = "attract";
    ctx.loop((dt, t) => {
      const cyc = (t % 2.6) / 2.6;
      const e = cyc < 0.75 ? cyc / 0.75 : 1;
      const ease = e * e * (3 - 2 * e);
      const gap = mode === "attract" ? 150 - 92 * ease : 60 + 110 * ease;
      qa.setAttribute("transform", `translate(${160 - gap / 2} 50)`);
      qb.setAttribute("transform", `translate(${160 + gap / 2} 50)`);
      const dir = mode === "attract" ? 1 : -1;
      arrows.innerHTML = `<path d="M${160 - gap / 2 + 26 * dir} 50 l${10 * dir} 0 m${-5 * dir} -5 l${5 * dir} 5 l${-5 * dir} 5" /><path d="M${160 + gap / 2 - 26 * dir} 50 l${-10 * dir} 0 m${5 * dir} -5 l${-5 * dir} 5 l${5 * dir} 5"/>`;
    });
    function setMode(m) {
      mode = m;
      qb.innerHTML = m === "attract" ? '<circle r="20" class="q-minus"/><path d="M-8 0h16" class="q-sign"/>' : '<circle r="20" class="q-plus"/><path d="M-8 0h16M0 -8v16" class="q-sign"/>';
      capt.textContent = m === "attract" ? "ประจุต่างชนิด (+ กับ −) → ดูดกัน" : "ประจุชนิดเดียวกัน (+ กับ +) → ผลักกัน";
    }
    setMode("attract");

    const TABS = [
      { key: "atom", label: "① อะตอม", title: "อะตอม (Atom)", pose: "explain",
        body: "ทุกสิ่งรอบตัว ทั้งโต๊ะ น้ำ สายไฟ หรือตัวเราเอง สร้างจากอนุภาคเล็กมาก ๆ ที่เรียกว่า <b>อะตอม</b> — เล็กจนมองไม่เห็นด้วยตาเปล่า",
        say: "ทุกอย่างสร้างจาก <b>อะตอม</b> — ตรงกลางคือ <b>นิวเคลียส</b> และมีอนุภาคเล็ก ๆ อยู่รอบ ๆ" },
      { key: "electron", label: "② อิเล็กตรอน", title: "อิเล็กตรอน (Electron)", pose: "point",
        body: "อนุภาคเล็ก ๆ สีฟ้าที่เคลื่อนที่รอบนิวเคลียสคือ <b>อิเล็กตรอน</b> มีประจุไฟฟ้า <b>ลบ (−)</b> ส่วนนิวเคลียสมีโปรตอนซึ่งมีประจุ <b>บวก (+)</b>",
        say: "จุดสีฟ้าคือ <b>อิเล็กตรอน</b> มีประจุ <b>ลบ (−)</b> — ตัวนี้แหละคือพระเอกของเรื่องไฟฟ้าในสายโลหะ" },
      { key: "charge", label: "③ ประจุไฟฟ้า", title: "ประจุไฟฟ้า (Electric Charge)", pose: "idea",
        body: "ประจุไฟฟ้ามี 2 ชนิด: <b>บวก (+)</b> และ <b>ลบ (−)</b> — ต่างชนิดกัน <b>ดูดกัน</b> ชนิดเดียวกัน <b>ผลักกัน</b><br><b>ไฟฟ้า คือการเคลื่อนที่ของประจุไฟฟ้า</b>",
        say: "ประจุต่างชนิดดูดกัน ชนิดเดียวกันผลักกัน และเมื่อประจุ <b>เคลื่อนที่</b> — นั่นคือ <b>ไฟฟ้า</b>!" },
    ];
    const panelTitle = h("div", { class: "card__title" });
    const panelBody = h("p");
    const chargeWrap = h("div", { class: "charge-wrap", hidden: true },
      ui.segmented([{ value: "attract", label: "+ กับ −" }, { value: "repel", label: "+ กับ +" }], "attract", setMode, { label: "ชนิดประจุ" }).el,
      charge);
    const panel = h("div", { class: "card concept-panel" }, panelTitle, panelBody, chargeWrap,
      h("p", { class: "muted", style: { fontSize: "var(--fs-xs)", margin: 0 } }, "* ภาพนี้เป็นแบบจำลองอย่างง่ายเพื่อให้เข้าใจ อะตอมจริงไม่ได้หน้าตาเป๊ะแบบนี้"));
    function showTab(k, speak) {
      const t = TABS.find((x) => x.key === k);
      panelTitle.textContent = t.title;
      panelBody.innerHTML = t.body;
      svg.dataset.focus = k;
      chargeWrap.hidden = k !== "charge";
      if (speak) ctx.say([{ pose: t.pose, text: t.say }]);
    }
    const tabs = ui.segmented(TABS.map((t) => ({ value: t.key, label: t.label })), "atom", (v) => showTab(v, true), { label: "หัวข้อ", size: "lg" });
    showTab("atom");
    ctx.registerReset(() => { tabs.set("atom"); showTab("atom"); });

    el.append(
      h("div", { class: "concept-tabs" }, tabs.el),
      h("div", { class: "concept-grid" },
        h("div", { class: "card card--flat atom-card" }, svg),
        panel),
      ui.callout("tip", "จำง่าย ๆ", "<b>ไฟฟ้า = ประจุไฟฟ้าที่เคลื่อนที่</b> — ในสายไฟโลหะ ตัวที่เคลื่อนที่คือ <b>อิเล็กตรอน</b>"));
  }

  /* =========================================================
     STEP 3 — VISUAL ANALOGY: free electrons in a conductor
     ========================================================= */
  function renderAnalogy(el, ctx) {
    const W = 600, H = 196, X0 = 40, X1 = 560, Y0 = 50, Y1 = 150;
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "wire-x", role: "img", "aria-label": "ภาพขยายภายในลวดทองแดง" });
    svg.innerHTML = `
      <rect x="${X0 - 14}" y="${Y0 - 14}" width="${X1 - X0 + 28}" height="${Y1 - Y0 + 28}" rx="24" class="wx-insul"/>
      <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="14" class="wx-core"/>
      <text x="${X0 - 4}" y="${Y0 - 22}" class="wx-tag">ฉนวนพลาสติก</text>
      <text x="${X0 - 4}" y="${Y1 + 34}" class="wx-tag wx-tag--in">ภายใน: ลวดทองแดง (ตัวนำ) · ⊕ = อะตอมทองแดงที่อยู่กับที่</text>`;
    const ions = s("g", { class: "wx-ions" });
    for (let gx = X0 + 30; gx < X1 - 10; gx += 44) for (let gy = Y0 + 28; gy < Y1; gy += 34) {
      ions.appendChild(svgFrag(`<circle r="8" class="wx-ion"/><path d="M-3.5 0h7M0 -3.5v7" class="wx-ion-sign"/>`, { transform: `translate(${gx} ${gy})` }));
    }
    svg.appendChild(ions);
    const gE = s("g");
    svg.appendChild(gE);
    const ends = svgFrag(`
      <g class="wx-end wx-end--minus"><circle cx="16" cy="100" r="15"/><text x="16" y="101">−</text></g>
      <g class="wx-end wx-end--plus"><circle cx="584" cy="100" r="15"/><text x="584" y="101">+</text></g>`, { class: "wx-ends" });
    svg.appendChild(ends);
    const E = [];
    for (let i = 0; i < 34; i++) {
      const g = svgFrag('<circle r="6" class="cx-e-c"/><rect x="-3" y="-0.9" width="6" height="1.8" rx=".8" fill="#fff"/>');
      gE.appendChild(g);
      E.push({ g, x: X0 + 12 + Math.random() * (X1 - X0 - 24), y: Y0 + 10 + Math.random() * (Y1 - Y0 - 20), vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60 });
    }
    let connected = false;
    ctx.loop((dt) => {
      for (const p of E) {
        p.vx += (Math.random() - 0.5) * 240 * dt;
        p.vy += (Math.random() - 0.5) * 240 * dt;
        p.vx = clamp(p.vx, -55, 55); p.vy = clamp(p.vy, -55, 55);
        p.x += (p.vx + (connected ? 34 : 0)) * dt;
        p.y += p.vy * dt;
        if (p.y < Y0 + 8) { p.y = Y0 + 8; p.vy = Math.abs(p.vy); }
        if (p.y > Y1 - 8) { p.y = Y1 - 8; p.vy = -Math.abs(p.vy); }
        if (connected) {
          if (p.x > X1 - 6) p.x = X0 + 6; // continues around the circuit
        } else {
          if (p.x < X0 + 8) { p.x = X0 + 8; p.vx = Math.abs(p.vx); }
          if (p.x > X1 - 8) { p.x = X1 - 8; p.vx = -Math.abs(p.vx); }
        }
        p.g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      }
    });

    const r1 = ui.readout("แหล่งจ่ายไฟ", "ยังไม่ต่อ");
    const r2 = ui.readout("การเคลื่อนที่ของอิเล็กตรอน", "สั่นไปมาแบบสุ่ม — ไม่ไหลไปทางไหน");
    function setConn(v) {
      connected = v;
      svg.classList.toggle("is-connected", v);
      r1.set(v ? "ต่อกับแบตเตอรี่แล้ว" : "ยังไม่ต่อ", v ? "good" : null);
      r2.set(v ? "ค่อย ๆ ไหลไปทางขั้วบวก (+)" : "สั่นไปมาแบบสุ่ม — ไม่ไหลไปทางไหน", v ? "blue" : null);
      if (v) ctx.say([{ pose: "point", text: "พอต่อแหล่งจ่ายไฟ อิเล็กตรอน<b>ทั้งเส้น</b>จะถูกผลักให้ค่อย ๆ ไหลไปทางขั้ว <b>บวก (+)</b> พร้อมกัน" }]);
    }
    const toggle = ui.segmented([{ value: false, label: "ไม่ต่อแหล่งจ่ายไฟ" }, { value: true, label: "ต่อแหล่งจ่ายไฟ", tone: "blue" }], false, setConn, { label: "แหล่งจ่าย" });
    setConn(false);
    ctx.registerReset(() => { toggle.set(false); setConn(false); });

    const frame = EFZ.sim.frame({
      title: "ภายในลวดทองแดง (ขยายหลายล้านเท่า)", stage: svg,
      controls: [toggle.el],
      readouts: [r1.el, r2.el],
    });

    // Marble tube analogy
    const tube = s("svg", { viewBox: "0 0 600 120", class: "tube", role: "img", "aria-label": "ท่อที่มีลูกแก้วเต็มท่อ" });
    tube.innerHTML = `<rect x="60" y="34" width="480" height="52" rx="26" class="tube-glass"/>
      <text x="60" y="22" class="tube-tag">ดันเข้า →</text><text x="540" y="22" text-anchor="end" class="tube-tag">→ ออกทันที</text>`;
    const gM = s("g");
    tube.appendChild(gM);
    const D = 46;
    let marbles = [];
    function buildMarbles() {
      gM.innerHTML = ""; marbles = [];
      for (let i = 0; i < 10; i++) addMarble(86 + i * D, i === 0 ? "first" : "");
    }
    function addMarble(x, cls) {
      const m = s("circle", { cx: 0, cy: 0, r: 21, class: "marble " + (cls || ""), transform: `translate(${x} 60)` });
      gM.appendChild(m);
      marbles.push({ m, x });
      return m;
    }
    buildMarbles();
    let busy = false;
    function push() {
      if (busy) return;
      busy = true;
      const fresh = addMarble(86 - D, "fresh");
      fresh.style.opacity = "0";
      requestAnimationFrame(() => {
        fresh.style.opacity = "1";
        marbles.forEach((it) => { it.x += D; it.m.setAttribute("transform", `translate(${it.x} 60)`); });
        const out = marbles.shift();
        out.m.classList.add("out");
        ctx.timeout(() => { out.m.remove(); busy = false; }, 520);
      });
      ctx.say([{ pose: "idea", text: "ลูกที่หลุดออกปลายท่อ <b>ไม่ใช่</b> ลูกที่เราเพิ่งดันเข้าไป — แต่มันออกมา <b>ทันที</b> เพราะท่อเต็มอยู่แล้ว" }]);
    }
    const tubeCard = h("div", { class: "card" },
      h("div", { class: "card__title" }, EFZ.icon("bulb"), "ภาพเปรียบเทียบ: ท่อที่มีลูกแก้วเต็มท่อ"),
      tube,
      h("div", { class: "btn-row" },
        ui.button("TRY IT · ดันลูกแก้ว 1 ลูก", { variant: "primary", icon: "hand", onClick: push }),
        ui.button("เริ่มใหม่", { icon: "replay", size: "sm", onClick: () => { buildMarbles(); busy = false; } })),
      h("p", { class: "muted", style: { marginTop: "12px", marginBottom: 0 },
        html: "สายไฟก็เช่นกัน — ข้างในมีอิเล็กตรอนอยู่เต็มแล้ว เมื่อแบตเตอรี่ผลัก อิเล็กตรอนทั้งเส้นขยับพร้อมกัน ไฟจึงติด <b>แทบทันที</b> แม้อิเล็กตรอนแต่ละตัวจะเคลื่อนที่ <b>ช้ามาก</b>" }));

    el.append(frame,
      h("div", { class: "grid-2" },
        ui.callout("info", "ตัวนำไฟฟ้า (Conductor)", "โลหะอย่าง <b>ทองแดง</b> มี <b>อิเล็กตรอนอิสระ</b> จำนวนมากที่ขยับไปมาได้ ประจุจึงเคลื่อนที่ผ่านได้ง่าย"),
        ui.callout("tip", "สังเกตไหม?", "ตอนยังไม่ต่อแหล่งจ่าย อิเล็กตรอนก็ <b>ขยับอยู่แล้ว</b> แต่ไปมั่ว ๆ ไม่มีทิศ — จึง <b>ยังไม่มีกระแสไฟฟ้า</b>")),
      tubeCard);
  }

  /* =========================================================
     STEP 4 — TECHNICAL VIEW: real parts → circuit
     ========================================================= */
  function renderTechnical(el, ctx) {
    const c = mainCircuit(ctx, { switchClickable: false, circuit: { flow: "none" } });
    const LEGEND = [
      { ids: ["bat"], name: "แหล่งจ่ายไฟ", en: "Power Source", desc: "แบตเตอรี่ให้ <b>พลังงาน</b> ผลักประจุให้เคลื่อนที่ มีขั้ว <b>+</b> และ <b>−</b>", pose: "point" },
      { ids: ["w1", "w2", "w3", "w4"], name: "สายไฟ", en: "Wire / Conductor", desc: "เป็น <b>เส้นทาง</b> ให้ประจุเดินทางไปและกลับ", pose: "explain" },
      { ids: ["sw"], name: "สวิตช์", en: "Switch", desc: "<b>ต่อ</b> หรือ <b>ตัด</b> เส้นทาง — ไม่ได้สร้างไฟฟ้าเอง", pose: "point" },
      { ids: ["led"], name: "โหลด (LED)", en: "Load", desc: "อุปกรณ์ที่ <b>ใช้พลังงานไฟฟ้า</b> แล้วเปลี่ยนเป็นแสง", pose: "idea" },
      { ids: ["r1"], name: "ตัวต้านทาน", en: "Resistor", desc: "ช่วย <b>จำกัดกระแส</b> ให้ LED ปลอดภัย — เรียนละเอียดในบทที่ 04 และ 10", pose: "explain" },
    ];
    const items = LEGEND.map((L) => {
      const b = h("button", { type: "button", class: "part-item" },
        h("span", { class: "part-item__name" }, L.name, " ", h("span", { class: "en part-item__en" }, L.en)),
        h("span", { class: "part-item__desc", html: L.desc }));
      const on = () => { items.forEach((x) => x.classList.remove("is-on")); b.classList.add("is-on"); c.highlight(L.ids); };
      b.addEventListener("mouseenter", on);
      b.addEventListener("focus", on);
      b.addEventListener("click", () => { on(); ctx.say([{ pose: L.pose, text: `<b>${L.name}</b> (${L.en}): ${L.desc}` }]); });
      return b;
    });
    const view = viewToggle(c);
    ctx.registerReset(() => { c.highlight(null); items.forEach((x) => x.classList.remove("is-on")); view.set("real"); c.setStyle("real"); });

    const frame = EFZ.sim.frame({
      title: "ส่วนประกอบของวงจร", badge: "TECHNICAL", hint: "แตะชื่ออุปกรณ์เพื่อดูตำแหน่ง",
      stage: c.el, controls: [h("span", { class: "muted", style: { fontSize: "var(--fs-sm)" } }, "มุมมอง:"), view.el],
    });
    el.append(
      h("div", { class: "tech-grid" }, frame, h("div", { class: "part-list" }, items)),
      ui.callout("info", "วงจรไฟฟ้า (Electric Circuit) คืออะไร?", "<b>เส้นทางที่ประจุไฟฟ้าเคลื่อนที่ออกจากแหล่งจ่าย → ผ่านอุปกรณ์ → แล้วกลับเข้าแหล่งจ่าย</b> ครบเป็นวง<br>ลองกด “สัญลักษณ์วงจร” ดูสิ — วิศวกรวาดวงจรเดียวกันนี้ด้วยสัญลักษณ์แบบนี้"));
  }

  /* =========================================================
     STEP 5 — SIMULATION: OPEN vs CLOSED circuit
     ========================================================= */
  function renderSimulation(el, ctx) {
    let predicted = false;
    const statePanel = h("div", { class: "status-line" });
    const rPath = ui.readout("เส้นทาง (Path)", "");
    const rLed = ui.readout("LED", "");
    const rE = ui.readout("อิเล็กตรอน", "");
    const explain = h("div");

    const c = mainCircuit(ctx, {
      closed: false,
      circuit: {
        onSwitch: (p, api) => { if (!predicted) { nudge(); return; } api.set("sw", { closed: !p.state.closed }); },
        onChange: (st) => update(st),
      },
    });
    const toggle = ui.segmented([
      { value: "open", label: "OPEN CIRCUIT · วงจรเปิด", tone: "red" },
      { value: "closed", label: "CLOSED CIRCUIT · วงจรปิด", tone: "green" },
    ], "open", (v) => { if (!predicted) { toggle.set("open"); nudge(); return; } c.set("sw", { closed: v === "closed" }); }, { label: "สถานะวงจร", size: "lg" });
    const speed = ui.slider({ label: "ความเร็วแอนิเมชัน", min: 0.25, max: 2, step: 0.25, value: 1, format: (v) => v + "×", onInput: (v) => c.setSpeed(v) });
    const view = viewToggle(c);

    function update(st) {
      const closed = st.closed;
      toggle.set(c.parts.sw.state.closed ? "closed" : "open");
      statePanel.innerHTML = "";
      statePanel.appendChild(ledState(st.ledOn));
      rPath.set(closed ? "ครบรอบ (Complete)" : "ขาด (Broken)", closed ? "good" : "bad");
      rLed.set(st.ledOn ? "ON — สว่าง" : "OFF — ดับ", st.ledOn ? "good" : null);
      rE.set(closed ? "เคลื่อนที่เป็นวง − → +" : "สั่นอยู่กับที่ ไม่ไหล", closed ? "blue" : null);
      explain.innerHTML = "";
      explain.appendChild(closed
        ? ui.callout("safe", "CLOSED CIRCUIT — วงจรปิด", "เส้นทาง <b>ครบรอบ</b> → ประจุไหลออกจากแบตเตอรี่ ผ่าน LED แล้ว <b>กลับเข้าแบตเตอรี่</b> → <b>LED ON</b>")
        : ui.callout("danger", "OPEN CIRCUIT — วงจรเปิด", "เส้นทาง <b>ขาด</b> ที่สวิตช์ → ประจุไหลครบรอบไม่ได้ → <b>LED OFF</b><br>อิเล็กตรอนยังอยู่ในสายไฟ แต่แค่สั่นอยู่กับที่"));
      if (predicted) ctx.say(closed
        ? [{ pose: "happy", text: "เส้นทางครบรอบแล้ว! อิเล็กตรอนเคลื่อนที่เป็นวง และ <b>LED ติด</b>" }]
        : [{ pose: "explain", text: "สวิตช์เปิด = เส้นทาง <b>ขาด</b> อิเล็กตรอนไปต่อไม่ได้ <b>LED จึงดับ</b>" }]);
    }
    function nudge() {
      ctx.say([{ pose: "point", text: "ก่อนกด ลองตอบคำถามด้านล่างก่อนนะ — <b>คิดว่าจะเกิดอะไรขึ้น?</b>" }]);
      pred.el.scrollIntoView({ behavior: "smooth", block: "center" });
      pred.el.classList.remove("attn"); void pred.el.offsetWidth; pred.el.classList.add("attn");
    }

    const pred = ui.predict({
      question: "คิดว่าจะเกิดอะไรขึ้น ถ้าเปลี่ยนเป็น CLOSED CIRCUIT?",
      options: [
        { label: "LED ติด และอิเล็กตรอนเคลื่อนที่เป็นวง", correct: true },
        { label: "LED ยังดับเหมือนเดิม", correct: false },
        { label: "LED ติดแวบเดียวแล้วดับ", correct: false },
      ],
      explain: "ลองดูผลในวงจรด้านบนได้เลย — แล้วสลับ OPEN / CLOSED เอง หรือแตะที่สวิตช์ในภาพก็ได้",
      allowRetry: false,
      onAnswer: () => { predicted = true; lock.remove(); c.set("sw", { closed: true }); },
    });
    const lock = h("span", { class: "tag tag--purple" }, EFZ.icon("lock"), "ตอบคำถามด้านล่างก่อน แล้วลองกดเอง");

    ctx.registerReset(() => { c.reset(); speed.set(1); c.setSpeed(1); });

    const frame = EFZ.sim.frame({
      title: "วงจรเปิด vs วงจรปิด", hint: "ลองเปลี่ยนค่าเอง",
      stage: c.el,
      controls: [toggle.el, lock, h("span", { style: { flex: 1 } }), statePanel],
      readouts: [rPath.el, rLed.el, rE.el],
      footer: h("div", { class: "sim__controls" }, speed.el, h("span", { class: "muted", style: { fontSize: "var(--fs-sm)" } }, "มุมมอง:"), view.el, flowLegend()),
    });
    update(c.state);
    el.append(frame, pred.el, explain,
      h("p", { class: "muted", style: { fontSize: "var(--fs-xs)", margin: 0 } }, "* ความเร็วในแอนิเมชันถูกทำให้เห็นได้ชัด — อิเล็กตรอนจริงเคลื่อนที่ช้ากว่านี้มาก"));
  }

  /* =========================================================
     STEP 6 — DIRECTION: Electron Flow vs Conventional Current
     ========================================================= */
  function renderDirection(el, ctx) {
    const c = mainCircuit(ctx, { switchClickable: false, circuit: { flow: "electron" } });
    const cards = {
      electron: h("div", { class: "dir-card dir-card--e" },
        h("div", { class: "dir-card__head" }, h("span", { class: "dir-dot" }), "Electron Flow · การไหลของอิเล็กตรอน"),
        h("div", { class: "dir-card__rule" }, "ขั้วลบ (−) ", h("b", null, "→"), " ขั้วบวก (+)"),
        h("p", { html: "สิ่งที่ <b>เกิดขึ้นจริง</b> ในสายโลหะ: อิเล็กตรอนมีประจุลบ จึงถูกดูดไปทางขั้วบวก" })),
      conventional: h("div", { class: "dir-card dir-card--c" },
        h("div", { class: "dir-card__head" }, h("span", { class: "dir-arrow" }, "➜"), "Conventional Current · กระแสสมมติ"),
        h("div", { class: "dir-card__rule" }, "ขั้วบวก (+) ", h("b", null, "→"), " ขั้วลบ (−)"),
        h("p", { html: "<b>ข้อตกลง</b> ที่นักวิทยาศาสตร์ตั้งไว้ <b>ก่อน</b> จะค้นพบอิเล็กตรอน และยังใช้กันมาจนถึงทุกวันนี้" })),
    };
    function setFlow(v, speak) {
      c.setFlow(v);
      cards.electron.classList.toggle("is-dim", v === "conventional");
      cards.conventional.classList.toggle("is-dim", v === "electron");
      if (!speak) return;
      const lines = {
        electron: [{ pose: "point", text: "จุดสีฟ้า = <b>อิเล็กตรอน</b> ไหลออกจากขั้ว <b>−</b> วนไปเข้าขั้ว <b>+</b>" }],
        conventional: [{ pose: "explain", text: "ลูกศรสีส้ม = <b>Conventional Current</b> ไหลจากขั้ว <b>+</b> ไปขั้ว <b>−</b> — ทิศตรงข้ามกับอิเล็กตรอน" }],
        both: [{ pose: "idea", text: "เห็นไหม? สองแบบไหล <b>สวนทางกัน</b> แต่เป็นวงจรเดียวกัน และ LED ก็ติดเหมือนเดิม" }],
      };
      ctx.say(lines[v]);
    }
    const flow = ui.segmented([
      { value: "electron", label: "Electron Flow", tone: "blue" },
      { value: "conventional", label: "Conventional Current", tone: "orange" },
      { value: "both", label: "แสดงทั้งสอง" },
    ], "electron", (v) => setFlow(v, true), { label: "ทิศการไหล", size: "lg" });
    setFlow("electron");
    const view = viewToggle(c);
    ctx.registerReset(() => { flow.set("electron"); setFlow("electron"); view.set("real"); c.setStyle("real"); });

    const frame = EFZ.sim.frame({
      title: "ทิศของการไหลในวงจร", hint: "สลับดูทีละแบบ",
      stage: c.el, controls: [flow.el],
      footer: h("div", { class: "sim__controls" }, h("span", { class: "muted", style: { fontSize: "var(--fs-sm)" } }, "มุมมอง:"), view.el, flowLegend()),
    });
    const pred = ui.predict({
      question: "ลองดูวงจรแล้วตอบ: ลูกศรสีส้ม (Conventional Current) ไหลออกจากขั้วไหนของแบตเตอรี่?",
      inline: true,
      options: [{ label: "ขั้วบวก (+)", correct: true }, { label: "ขั้วลบ (−)", correct: false }],
      explain: "Conventional Current ไหล <b>ออกจากขั้วบวก (+)</b> ผ่านวงจร แล้ว <b>กลับเข้าขั้วลบ (−)</b> — ตรงข้ามกับอิเล็กตรอน",
      onAnswer: (o, ok) => { flow.set("conventional"); setFlow("conventional"); ctx.say([{ pose: ok ? "happy" : "explain", text: ok ? "ถูกต้อง! ออกจาก <b>+</b> กลับเข้า <b>−</b>" : "ดูลูกศรสีส้มอีกครั้ง — มันออกจากขั้ว <b>+</b> นะ" }]); },
    });
    el.append(frame,
      h("div", { class: "grid-2" }, cards.electron, cards.conventional),
      ui.callout("info", "วงจรในงานวิศวกรรมใช้แบบไหน?", "แผนผังวงจร (Schematic) ใช้ <b>Conventional Current (+ → −)</b> เป็นหลัก เช่น ลูกศรในสัญลักษณ์ LED ชี้ไปทางที่กระแสสมมติไหล<br>ในคอร์สนี้ เมื่อพูดว่า <b>“กระแสไหล”</b> จะหมายถึง Conventional Current"),
      ui.callout("safe", "ไม่ต้องกังวล!", "ทั้งสองแบบอธิบาย <b>วงจรเดียวกัน</b> แค่มองคนละมุม ผลลัพธ์ (LED ติด/ไม่ติด) <b>เหมือนกันทุกประการ</b>"),
      pred.el);
  }

  /* =========================================================
     STEP 7 — REAL HARDWARE: circuits around us + ESP32 preview
     ========================================================= */
  function renderHardware(el, ctx) {
    const houseSvg = svgFrag(`
      <rect x="10" y="10" width="200" height="120" rx="12" fill="#eef3fb"/>
      <rect x="30" y="50" width="34" height="50" rx="6" fill="#fff" stroke="#94a3b8" stroke-width="2"/><rect x="38" y="58" width="18" height="16" rx="3" fill="#cbd5e1"/>
      <path d="M47 50 V26 H150 V48" stroke="#f97316" stroke-width="3" fill="none" stroke-dasharray="6 5"/>
      <path d="M140 48 h20 l-5 -10 h-10z" fill="#334155"/><circle cx="150" cy="62" r="13" fill="#fde047" stroke="#a16207" stroke-width="2"/>
      <text x="110" y="122" text-anchor="middle" class="hw-cap">สวิตช์ = ต่อ/ตัดเส้นทาง</text>`);
    const torchSvg = svgFrag(`
      <rect x="10" y="10" width="200" height="120" rx="12" fill="#eef3fb"/>
      <rect x="24" y="48" width="130" height="40" rx="10" fill="#334155"/><path d="M154 44 L186 32 V104 L154 92Z" fill="#475569"/>
      <rect x="34" y="56" width="44" height="24" rx="5" fill="#f59e0b"/><rect x="82" y="56" width="44" height="24" rx="5" fill="#f59e0b"/>
      <rect x="132" y="40" width="14" height="8" rx="2" fill="#ef4444"/>
      <path d="M190 44 l16 -8 M190 68 h18 M190 92 l16 8" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
      <text x="110" y="122" text-anchor="middle" class="hw-cap">แบตเตอรี่ + สวิตช์ + หลอดไฟ</text>`);
    const mini = (g, label) => { const v = s("svg", { viewBox: "0 0 220 140", role: "img", "aria-label": label }); v.appendChild(g); return v; };

    // ESP32 preview circuit (power comes from the board's 3V3 and returns to GND)
    const BN = { v: [176, 82], g: [176, 214], a: [250, 82], b: [360, 82], c: [450, 82], d: [450, 130], e: [450, 190], f: [450, 214] };
    const esp = ctx.circuit({
      width: 520, height: 266, nodes: BN, style: "real", flow: "conventional", spacing: 24,
      label: "บอร์ด ESP32 จ่ายไฟจากขา 3V3 ผ่านตัวต้านทานและ LED แล้วกลับที่ขา GND",
      parts: [
        { id: "src", type: "source", plus: "v", minus: "g", hidden: true },
        { id: "w1", type: "wire", from: "v", to: "a", color: "red" },
        { id: "r1", type: "resistor", from: "a", to: "b", label: "330Ω", labelSide: -1, labelOffset: 22 },
        { id: "w2", type: "wire", from: "b", to: "d", via: ["c"], color: "red" },
        { id: "led", type: "led", from: "d", to: "e", label: "LED", labelSide: 1, labelOffset: 30 },
        { id: "w3", type: "wire", from: "e", to: "g", via: ["f"], color: "black", missingLabel: "สาย GND ถูกถอด" },
      ],
      loops: [["w1", "r1", "w2", "led", "w3"]],
      background: (g) => {
        g.appendChild(svgFrag(`
          <rect x="22" y="28" width="160" height="214" rx="10" fill="#111827" stroke="#020617" stroke-width="2"/>
          <rect x="36" y="40" width="80" height="66" rx="4" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/>
          <text x="76" y="78" text-anchor="middle" font-family="Prompt,sans-serif" font-weight="700" font-size="15" fill="#334155">ESP32</text>
          <rect x="80" y="226" width="40" height="16" rx="3" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
          <text x="100" y="258" text-anchor="middle" class="hw-cap">USB (ไฟเลี้ยงบอร์ด)</text>
          ${Array.from({ length: 9 }, (_, i) => `<rect x="168" y="${76 + i * 16.5}" width="12" height="11" rx="2" fill="#475569"/>`).join("")}
          <rect x="166" y="74" width="16" height="16" rx="3" fill="#facc15" stroke="#a16207" stroke-width="1.5"/>
          <rect x="166" y="206" width="16" height="16" rx="3" fill="#facc15" stroke="#a16207" stroke-width="1.5"/>
          <text x="158" y="86" text-anchor="end" font-family="Prompt,sans-serif" font-weight="700" font-size="14" fill="#fca5a5">3V3</text>
          <text x="158" y="218" text-anchor="end" font-family="Prompt,sans-serif" font-weight="700" font-size="14" fill="#e2e8f0">GND</text>
          <text x="100" y="150" text-anchor="middle" font-family="IBM Plex Sans Thai,sans-serif" font-size="11" fill="#94a3b8">(ภาพประกอบ</text><text x="100" y="166" text-anchor="middle" font-family="IBM Plex Sans Thai,sans-serif" font-size="11" fill="#94a3b8">ไม่ใช่ผังขาจริง)</text>`));
      },
      onChange: (st) => {
        stEl.innerHTML = ""; stEl.appendChild(ledState(st.ledOn));
        btn.querySelector("span").textContent = st.ledOn ? "TRY IT · ถอดสาย GND" : "TRY IT · เสียบสาย GND กลับ";
        ctx.say(st.ledOn
          ? [{ pose: "happy", text: "ต่อ GND แล้ว — เส้นทางกลับครบ <b>LED ติด</b>" }]
          : [{ pose: "warning", text: "ไม่มีเส้นทางกลับที่ <b>GND</b> = วงจรเปิด → <b>LED ดับ</b>" }]);
      },
    });
    esp.el.style.maxWidth = "640px";
    const stEl = h("div", { class: "status-line" }, ledState(true));
    const btn = ui.button("TRY IT · ถอดสาย GND", { variant: "warn", icon: "hand", onClick: () => esp.set("w3", { missing: !esp.parts.w3.state.missing }) });
    ctx.registerReset(() => esp.reset());

    el.append(
      h("div", { class: "grid-2" },
        h("div", { class: "card hw-card" }, mini(houseSvg, "สวิตช์ไฟในบ้าน"), h("div", { class: "card__title" }, "สวิตช์ไฟในบ้าน"),
          h("p", { html: "กดสวิตช์ = ต่อหรือตัดเส้นทาง หลอดไฟจึงติดหรือดับ — <b>หลักการเดียวกับวงจรของเรา</b> (แต่ไฟบ้าน 220V อันตราย ห้ามทดลองเอง!)" })),
        h("div", { class: "card hw-card" }, mini(torchSvg, "ไฟฉาย"), h("div", { class: "card__title" }, "ไฟฉาย"),
          h("p", { html: "ข้างในคือวงจรแบบเดียวกับใน Simulation: <b>แบตเตอรี่ → สวิตช์ → หลอดไฟ → กลับแบตเตอรี่</b>" }))),
      EFZ.sim.frame({
        title: "บน ESP32 ก็ต้องมีเส้นทางครบรอบ", badge: "REAL HARDWARE", hint: "ลองถอดสาย GND",
        stage: esp.el, controls: [btn, h("span", { style: { flex: 1 } }), stEl],
      }),
      ui.callout("info", "ตัวอย่างล่วงหน้า (Final Project)", "ตอนท้าย Part 1 เราจะใช้ไฟ <b>3.3V</b> จากขา <b>3V3</b> ของบอร์ด ESP32 เลี้ยง LED — ไฟต้องออกจาก 3V3 ผ่านตัวต้านทานและ LED แล้ว <b>กลับที่ขา GND</b> ให้ครบวงจร (เรื่อง GND จะเรียนละเอียดในบทที่ 07)"),
      ui.callout("warn", "ตำแหน่งขาบนบอร์ดจริง", "บอร์ด ESP32 แต่ละรุ่นวางขาไม่เหมือนกัน ภาพนี้จึงเป็นภาพประกอบ — <b>ให้อ่านตัวอักษรที่พิมพ์ข้างขาบนบอร์ดของคุณเสมอ</b> และยังไม่ต้องต่อของจริงตอนนี้"));
  }

  /* =========================================================
     STEP 8 — WHAT IF? conductor vs insulator in the gap
     ========================================================= */
  const MATERIALS = [
    { id: "copper", name: "ลวดทองแดง", en: "Copper wire", conductor: true,
      art: () => `<rect x="-26" y="-4" width="52" height="8" rx="4" fill="#d97706" stroke="#92400e" stroke-width="1.2"/><path d="M-22 -1.5h44" stroke="#fcd34d" stroke-width="1.6" stroke-linecap="round"/>` },
    { id: "clip", name: "คลิปหนีบกระดาษ", en: "Metal paper clip", conductor: true,
      art: () => `<path d="M-24 4 H16 a6 6 0 0 0 0 -12 H-18 a4.5 4.5 0 0 0 0 9 H12" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><path d="M-24 4 H16 a6 6 0 0 0 0 -12" fill="none" stroke="#e2e8f0" stroke-width="1" />` },
    { id: "coin", name: "เหรียญ", en: "Metal coin", conductor: true,
      art: () => `<circle r="16" fill="#e5e7eb" stroke="#6b7280" stroke-width="2"/><circle r="11" fill="none" stroke="#9ca3af" stroke-width="1.5"/><text y="1" text-anchor="middle" dominant-baseline="middle" font-family="Prompt,sans-serif" font-weight="800" font-size="11" fill="#6b7280">10</text>` },
    { id: "straw", name: "หลอดพลาสติก", en: "Plastic straw", conductor: false,
      art: () => `<rect x="-26" y="-6" width="52" height="12" rx="6" fill="#fff" stroke="#93c5fd" stroke-width="1.5"/><path d="M-18 -6 l-6 12 M-6 -6 l-6 12 M6 -6 l-6 12 M18 -6 l-6 12" stroke="#ef4444" stroke-width="3"/>` },
    { id: "wood", name: "ไม้บรรทัดไม้", en: "Wooden ruler", conductor: false,
      art: () => `<rect x="-26" y="-8" width="52" height="16" rx="2" fill="#d6a76c" stroke="#8a5a2b" stroke-width="1.4"/><path d="M-20 -8v6M-12 -8v4M-4 -8v6M4 -8v4M12 -8v6M20 -8v4" stroke="#6b4423" stroke-width="1.2"/>` },
    { id: "eraser", name: "ยางลบ", en: "Rubber eraser", conductor: false,
      art: () => `<rect x="-22" y="-9" width="44" height="18" rx="4" fill="#f9a8d4" stroke="#be185d" stroke-width="1.4"/><rect x="2" y="-9" width="20" height="18" rx="3" fill="#60a5fa" stroke="#1d4ed8" stroke-width="1.4"/>` },
  ];

  function renderWhatIf(el, ctx) {
    const parts = circuitParts({ switchClickable: false });
    const swIdx = parts.findIndex((p) => p.id === "sw");
    parts[swIdx] = { id: "slot", type: "slot", from: "s1", to: "s2", label: "ช่องทดลอง", labelSide: -1, labelOffset: 34 };
    const c = ctx.circuit({ width: 640, height: 340, nodes: NODES, parts, loops: [["w1", "slot", "w2", "r1", "w3", "led", "w4"]], style: "real", flow: "electron", label: "วงจรที่มีช่องว่างให้ทดลองวางวัสดุ" });

    const results = {};
    const table = h("div", { class: "mat-results" });
    const work = h("div", { class: "whatif-work" });
    const status = h("div", { class: "status-line" }, ledState(false));
    const palette = h("div", { class: "mat-grid" });
    const insight = h("div");

    function matIcon(m) {
      const v = s("svg", { viewBox: "-32 -20 64 40", class: "mat-ico", "aria-hidden": "true" });
      v.innerHTML = m.art("real");
      return v;
    }
    MATERIALS.forEach((m) => {
      const b = h("button", { type: "button", class: "mat-btn", "data-id": m.id, onClick: () => choose(m) },
        matIcon(m), h("span", { class: "mat-btn__name" }, m.name), h("span", { class: "mat-btn__en" }, m.en));
      palette.appendChild(b);
    });

    function choose(m) {
      [...palette.children].forEach((b) => b.classList.toggle("is-sel", b.dataset.id === m.id));
      c.set("slot", { material: null });
      status.innerHTML = ""; status.appendChild(ledState(false));
      work.innerHTML = "";
      const pred = ui.predict({
        question: `ถ้าวาง “${m.name}” ในช่องทดลอง — คิดว่า LED จะติดไหม?`,
        inline: true,
        options: [{ label: "LED ติด", correct: m.conductor }, { label: "LED ไม่ติด", correct: !m.conductor }],
        explain: m.conductor
          ? `<b>${m.name}</b> ทำจาก <b>โลหะ</b> ซึ่งเป็น <b>ตัวนำไฟฟ้า (Conductor)</b> → เส้นทางครบรอบ → LED ติด`
          : `<b>${m.name}</b> เป็น <b>ฉนวนไฟฟ้า (Insulator)</b> ไม่มีอิเล็กตรอนอิสระให้เคลื่อนที่ → เส้นทางยังขาด → LED ไม่ติด`,
        allowRetry: false,
        onAnswer: (o, ok) => {
          c.set("slot", { material: m });
          status.innerHTML = ""; status.appendChild(ledState(m.conductor));
          results[m.id] = { m, ok };
          renderTable();
          ctx.say([{ pose: ok ? "happy" : "explain", text: (ok ? "ทายถูก! " : "ไม่เป็นไร! ") + (m.conductor ? `${m.name} เป็น <b>ตัวนำ</b> — LED ติด` : `${m.name} เป็น <b>ฉนวน</b> — LED ไม่ติด`) }]);
        },
      });
      work.appendChild(pred.el);
    }
    function renderTable() {
      table.innerHTML = "";
      const list = Object.values(results);
      if (!list.length) { table.appendChild(h("p", { class: "muted", style: { margin: 0 } }, "ยังไม่มีผลการทดลอง — เลือกวัสดุด้านบนเพื่อเริ่ม")); return; }
      list.forEach(({ m, ok }) => table.appendChild(h("div", { class: "mat-row" },
        h("span", { class: "mat-row__name" }, m.name),
        ui.tag(m.conductor ? "ตัวนำ · LED ติด" : "ฉนวน · LED ไม่ติด", m.conductor ? "green" : "red"),
        h("span", { class: "mat-row__pred " + (ok ? "is-ok" : "is-no"), title: ok ? "ทายถูก" : "ทายผิด" }, EFZ.icon(ok ? "check" : "x")))));
      insight.innerHTML = "";
      if (list.length >= 4) {
        insight.appendChild(ui.callout("tip", "ข้อสรุปจากการทดลอง", "<b>โลหะ</b> (ทองแดง คลิป เหรียญ) เป็น <b>ตัวนำ</b> ให้ประจุไหลผ่านได้ ส่วน <b>พลาสติก ไม้ ยาง</b> เป็น <b>ฉนวน</b><br>สายไฟจึงมี <b>ทองแดงอยู่ข้างใน</b> และ <b>หุ้มพลาสติกไว้ข้างนอก</b> — ให้ไฟไหลในเส้นทางที่ต้องการ และปลอดภัยเวลาจับ"));
        ctx.say([{ pose: "summary", text: "สรุปได้แล้ว! โลหะ = <b>ตัวนำ</b> · พลาสติก ไม้ ยาง = <b>ฉนวน</b>" }]);
      }
    }
    renderTable();
    ctx.registerReset(() => {
      Object.keys(results).forEach((k) => delete results[k]);
      c.reset(); work.innerHTML = ""; insight.innerHTML = "";
      [...palette.children].forEach((b) => b.classList.remove("is-sel"));
      status.innerHTML = ""; status.appendChild(ledState(false));
      renderTable();
    });

    el.append(
      EFZ.sim.frame({ title: "ถ้าเปลี่ยนสิ่งที่อยู่ในช่องว่างล่ะ?", badge: "WHAT IF?", hint: "เลือกวัสดุ → ทาย → ดูผล", stage: c.el, controls: [status] }),
      h("div", { class: "card" }, h("div", { class: "card__title" }, EFZ.icon("target"), "1) เลือกวัสดุที่จะวางในช่องทดลอง"), palette),
      work,
      h("div", { class: "card card--tint" }, h("div", { class: "card__title" }, EFZ.icon("book"), "ผลการทดลอง"), table),
      insight,
      ui.callout("safe", "ทดลองของจริงได้ไหม?", "ทำได้ <b>เฉพาะกับแบตเตอรี่แรงดันต่ำ</b> (เช่น ถ่าน AA) และต้องมีตัวต้านทานในวงจรเสมอ — <b>ห้ามทดลองกับปลั๊กไฟบ้านเด็ดขาด</b>"));
  }

  /* =========================================================
     STEP 9 — COMMON MISTAKE: no return path
     ========================================================= */
  function renderMistake(el, ctx) {
    const c = mainCircuit(ctx, { switchClickable: false, w4State: { missing: true }, circuit: { flow: "electron" } });
    const status = h("div", { class: "status-line" }, ledState(false));
    const fixRow = h("div", { class: "btn-row" });
    c.on((st) => { status.innerHTML = ""; status.appendChild(ledState(st.ledOn)); });

    const pred = ui.predict({
      question: "มือใหม่ต่อสายจากขั้ว + ไปจนถึง LED แล้ว แต่ขาอีกข้างของ LED ไม่ได้ต่อกลับขั้ว − — คิดว่า LED จะติดไหม?",
      inline: true,
      options: [
        { label: "ติด เพราะไฟไปถึง LED แล้ว", correct: false },
        { label: "ไม่ติด เพราะไม่มีเส้นทางกลับ", correct: true },
      ],
      explain: "ไฟฟ้าต้องการ <b>เส้นทางครบรอบ</b> — ออกจากแบตเตอรี่แล้วต้อง <b>กลับเข้าแบตเตอรี่</b> สายเส้นเดียวจึงไม่พอ",
      onAnswer: () => {
        fixRow.innerHTML = "";
        fixRow.appendChild(ui.button("แก้ไข: ต่อสายกลับเข้าขั้วลบ (−)", { variant: "go", icon: "check", onClick: () => {
          c.set("w4", { missing: false });
          ctx.say([{ pose: "happy", text: "ต่อสายกลับแล้ว เส้นทาง <b>ครบรอบ</b> — LED ติด!" }]);
          fixRow.innerHTML = "";
          fixRow.appendChild(ui.feedback("good", "เส้นทางครบรอบแล้ว!", "ออกจากขั้ว + → ผ่าน LED → กลับเข้าขั้ว − ✔"));
        } }));
      },
      onReset: () => { c.reset(); fixRow.innerHTML = ""; },
    });
    ctx.registerReset(() => { c.reset(); pred.reset(); fixRow.innerHTML = ""; });

    el.append(
      EFZ.sim.frame({ title: "ความผิดพลาด #1: ต่อสายไปแต่ไม่ต่อกลับ", badge: "MISTAKE", hint: "ทายก่อน แล้วลองแก้", stage: c.el, controls: [status] }),
      pred.el, fixRow,
      h("h3", { style: { marginTop: "8px" } }, "ความเข้าใจผิดอีก 2 ข้อ (แตะการ์ดเพื่อพลิก)"),
      h("div", { class: "grid-2" },
        ui.flipCard({
          front: "<p><b>“แบตเตอรี่ปล่อยอิเล็กตรอนออกไป แล้วอิเล็กตรอนก็ถูก LED ใช้จนหมด”</b></p>",
          back: "<p>อิเล็กตรอน <b>ไม่ได้ถูกใช้หมด</b> — มันเคลื่อนที่ <b>วนเป็นวง</b> สิ่งที่แบตเตอรี่ให้คือ <b>พลังงาน</b> ที่ผลักประจุ เมื่อพลังงานเคมีในแบตหมด แบตจึงหมด</p>",
        }),
        ui.flipCard({
          front: "<p><b>“เปิดไฟ” = วงจรเปิด</b> ใช่ไหม?</p><p class='muted'>คำภาษาไทยชวนสับสนมาก!</p>",
          back: "<p><b>เปิดไฟ (ไฟติด)</b> = <b>วงจรปิด</b> (Closed Circuit) — เส้นทางครบ</p><p><b>ปิดไฟ (ไฟดับ)</b> = <b>วงจรเปิด</b> (Open Circuit) — เส้นทางขาด</p>",
        })));
  }

  /* =========================================================
     STEP 10 — MINI CHALLENGE: break the circuit anywhere
     ========================================================= */
  function renderChallenge(el, ctx) {
    const wrap = h("div", { class: "stack" });
    el.appendChild(wrap);
    const state = ctx.lessonState.challenge || (ctx.lessonState.challenge = { tried: {}, round: 1 });

    function roundOne() {
      wrap.innerHTML = "";
      const panel = h("div", { class: "chal-panel" });
      const score = h("div", { class: "chal-score" });
      let pending = null;
      const status = h("div", { class: "status-line" }, ledState(true));
      const c = mainCircuit(ctx, {
        switchClickable: false,
        circuit: {
          interactiveBreaks: true, flow: "electron",
          onBreak: (p) => ask(p),
          onChange: (st) => { status.innerHTML = ""; status.appendChild(ledState(st.ledOn)); },
        },
      });
      function ask(p) {
        if (p.state.broken) { c.reset(); pending = null; renderIdle(); return; }
        // only one cut at a time in round 1
        c.reset();
        pending = p.id;
        c.setProp(p.id, "handleState", "pending");
        panel.innerHTML = "";
        panel.appendChild(ui.predict({
          question: `ถ้าตัดสายที่จุด ${p.breakLabel} — LED จะยังติดอยู่ไหม?`,
          context: describe(p.breakLabel),
          inline: true,
          options: [{ label: "ยังติด", correct: false }, { label: "ดับ", correct: true }],
          explain: "วงจรนี้มี <b>เส้นทางเดียว</b> — ตัดตรงไหนก็ทำให้เส้นทาง <b>ไม่ครบรอบ</b> (วงจรเปิด) LED จึงดับ",
          allowRetry: false,
          onAnswer: (o, ok) => {
            c.setProp(p.id, "handleState", null);
            c.set(p.id, { broken: true });
            state.tried[p.breakLabel] = ok;
            renderScore();
            ctx.say([{ pose: ok ? "happy" : "explain", text: ok ? `ใช่เลย! ตัดที่จุด ${p.breakLabel} ก็ดับ` : `ดับนะ! แม้ตัดที่จุด ${p.breakLabel} เส้นทางก็ไม่ครบรอบแล้ว` }]);
            panel.appendChild(h("div", { class: "btn-row", style: { marginTop: "10px" } },
              ui.button("ต่อสายกลับ แล้วลองจุดอื่น", { icon: "replay", size: "sm", onClick: () => { c.reset(); renderIdle(); } })));
          },
        }).el);
      }
      function describe(L) {
        return { A: "จุด A อยู่ <b>ก่อน</b> สวิตช์ ใกล้ขั้ว +", B: "จุด B อยู่ <b>หลัง</b> สวิตช์ ก่อนถึงตัวต้านทาน", C: "จุด C อยู่ระหว่างตัวต้านทานกับ LED", D: "จุด D อยู่ <b>หลัง LED</b> บนสายเส้นกลับเข้าขั้ว −" }[L];
      }
      function renderIdle() {
        panel.innerHTML = "";
        panel.appendChild(h("div", { class: "chal-idle" }, EFZ.icon("scissors"), h("div", null,
          h("b", null, "ภารกิจ: "), "แตะวงกลม ", h("b", null, "A B C D"), " บนวงจรเพื่อเลือกจุดที่จะ “ตัดสาย” — แต่ต้อง ", h("b", null, "ทายก่อน"), " ว่า LED จะยังติดไหม")));
      }
      function renderScore() {
        score.innerHTML = "";
        ["A", "B", "C", "D"].forEach((L) => {
          const v = state.tried[L];
          score.appendChild(h("span", { class: "chal-chip " + (v === undefined ? "" : v ? "is-ok" : "is-no") }, L, v === undefined ? null : EFZ.icon(v ? "check" : "x")));
        });
        const n = Object.keys(state.tried).length;
        if (n >= 4) {
          after.innerHTML = "";
          after.append(
            ui.callout("tip", "ค้นพบแล้ว!", "ในวงจรที่มี <b>เส้นทางเดียว</b> ตัดตรงไหน LED ก็ดับ — ไม่ว่าจะ <b>ก่อน</b> หรือ <b>หลัง</b> LED เพราะประจุต้องไหล <b>ครบรอบ</b>"),
            h("div", { class: "btn-row" }, ui.button("BONUS ROUND · วงจรที่มีสายกลับ 2 เส้น", { variant: "navy", icon: "next", iconRight: true, onClick: () => { state.round = 2; roundTwo(); } })));
          ctx.say([{ pose: "idea", text: "ครบทั้ง 4 จุดแล้ว! ลอง <b>BONUS ROUND</b> ดูไหม — วงจรนี้มีเส้นทางกลับ 2 เส้น" }]);
        }
      }
      const after = h("div", { class: "stack" });
      renderIdle(); renderScore();
      ctx.registerReset(() => { state.tried = {}; c.reset(); renderIdle(); renderScore(); after.innerHTML = ""; });
      wrap.append(
        EFZ.sim.frame({ title: "ตัดสายตรงไหน LED ก็ดับ?", badge: "CHALLENGE", hint: "แตะวงกลม A–D", stage: c.el, controls: [h("span", { class: "muted", style: { fontSize: "var(--fs-sm)" } }, "ลองแล้ว:"), score, h("span", { style: { flex: 1 } }), status] }),
        panel, after);
    }

    function roundTwo() {
      wrap.innerHTML = "";
      const N2 = Object.assign({}, NODES, { d1: [260, 334], d2: [130, 334] });
      const parts = circuitParts({ switchClickable: false, ledLabelUp: true }).filter((p) => p.id !== "w4");
      parts.forEach((p) => { p.breakable = false; });
      parts.push(
        { id: "w4a", type: "wire", from: "lc", to: "bl", color: "black", breakable: true, breakAt: 0.5, breakLabel: "E" },
        { id: "w4b", type: "wire", from: "lc", to: "bl", via: ["d1", "d2"], color: "black", breakable: true, breakAt: 0.5, breakLabel: "F" },
        { id: "wup", type: "wire", from: "bl", to: "n", color: "black", breakable: true, breakAt: 0.5, breakLabel: "G" });
      const base = ["w1", "sw", "w2", "r1", "w3", "led"];
      const panel = h("div", { class: "chal-panel" });
      const status = h("div", { class: "status-line" }, ledState(true));
      const found = h("div");
      const c = ctx.circuit({
        width: 640, height: 360, nodes: N2, parts, style: "real", flow: "electron", interactiveBreaks: true,
        loops: [base.concat(["w4a", "wup"]), base.concat(["w4b", "wup"])],
        label: "วงจรที่มีสายเส้นกลับ 2 เส้นขนานกัน",
        onBreak: (p) => ask(p),
        onChange: (st) => {
          status.innerHTML = ""; status.appendChild(ledState(st.ledOn));
          const br = (id) => c.parts[id].state.broken;
          if ((br("w4a") !== br("w4b")) && !br("wup")) {
            found.innerHTML = "";
            found.appendChild(ui.callout("tip", "LED ยังติด! เพราะอะไร?", "ยังมี <b>อีกเส้นทางหนึ่ง</b> ที่ครบรอบอยู่ — LED ติดได้ <b>ตราบใดที่มีเส้นทางครบรอบอย่างน้อย 1 เส้น</b><br>วงจรที่มีหลายเส้นทางแบบนี้ เราจะเรียนต่อในบท <b>Series vs Parallel</b>"));
          }
        },
      });
      function ask(p) {
        if (p.state.broken) { c.set(p.id, { broken: false }); return; }
        c.setProp(p.id, "handleState", "pending");
        // predict using the real model: would a complete path remain?
        const before = {};
        Object.keys(c.parts).forEach((k) => { before[k] = c.parts[k].state.broken; });
        const willBeOn = (() => {
          const b = (id) => (id === p.id ? true : before[id]);
          return !b("wup") && (!b("w4a") || !b("w4b"));
        })();
        panel.innerHTML = "";
        panel.appendChild(ui.predict({
          question: `ถ้าตัดสายที่จุด ${p.breakLabel} — LED จะยังติดอยู่ไหม?`,
          inline: true,
          options: [{ label: "ยังติด", correct: willBeOn }, { label: "ดับ", correct: !willBeOn }],
          explain: willBeOn ? "ยังมีเส้นทางกลับอีกเส้นที่ <b>ครบรอบ</b> อยู่" : "ไม่เหลือเส้นทางที่ครบรอบแล้ว — ทุกเส้นทางต้องผ่านสายที่ถูกตัด",
          allowRetry: false,
          onAnswer: (o, ok) => {
            c.setProp(p.id, "handleState", null);
            c.set(p.id, { broken: true });
            ctx.say([{ pose: ok ? "happy" : "thinking", text: ok ? "ทายถูก! สังเกตเส้นทางที่ยังเหลืออยู่นะ" : "ลองไล่นิ้วตามเส้นทางจาก + ไป − ดู — ยังมีทางไปถึงไหม?" }]);
          },
        }).el);
      }
      panel.appendChild(h("div", { class: "chal-idle" }, EFZ.icon("scissors"), h("div", null,
        h("b", null, "BONUS: "), "สายกลับเข้าขั้ว − มี ", h("b", null, "2 เส้น (E และ F)"), " แล้วมารวมกันที่ G — ลองตัดทีละจุด แล้วทายผลก่อนทุกครั้ง")));
      ctx.registerReset(() => { c.reset(); found.innerHTML = ""; });
      wrap.append(
        EFZ.sim.frame({ title: "BONUS: มีเส้นทางกลับ 2 เส้น", badge: "CHALLENGE", hint: "แตะ E, F หรือ G", stage: c.el, controls: [status] }),
        panel, found,
        h("div", { class: "btn-row" }, ui.button("กลับไปรอบแรก", { icon: "back", size: "sm", onClick: () => { state.round = 1; roundOne(); } })));
    }

    if (state.round === 2) roundTwo(); else roundOne();
  }

  /* =========================================================
     STEP 11 — QUICK CHECK (3 questions)
     ========================================================= */
  function renderQuiz(el, ctx) {
    const q = ui.quiz({
      questions: [
        {
          q: "วงจรแบบไหนที่ทำให้ LED ติดได้?",
          choices: ["วงจรเปิด (Open Circuit)", "วงจรปิด (Closed Circuit)", "วงจรที่มีสายจากขั้วบวกไป LED เพียงเส้นเดียว"],
          answer: 1,
          explain: "LED ติดเมื่อเส้นทาง <b>ครบรอบ</b> = <b>วงจรปิด (Closed Circuit)</b> ส่วนวงจรเปิดคือเส้นทางขาด",
        },
        {
          q: "ในสายไฟโลหะ อิเล็กตรอนเคลื่อนที่ไปทางไหน?",
          choices: ["จากขั้วลบ (−) ไปขั้วบวก (+)", "จากขั้วบวก (+) ไปขั้วลบ (−)", "ไม่เคลื่อนที่เลย"],
          answer: 0,
          explain: "อิเล็กตรอน (ประจุลบ) ไหลจาก <b>− ไป +</b> ส่วน <b>Conventional Current</b> ที่ใช้ในแผนผังวงจรไหลจาก <b>+ ไป −</b>",
        },
        {
          q: "ในวงจรที่มีเส้นทางเดียว ถ้าตัดสายที่อยู่ “หลัง” LED (ระหว่าง LED กับขั้วลบ) จะเกิดอะไรขึ้น?",
          choices: ["LED ยังติด เพราะไฟผ่าน LED ไปแล้ว", "LED ดับ เพราะเส้นทางไม่ครบรอบ", "LED สว่างขึ้นกว่าเดิม"],
          answer: 1,
          explain: "ตำแหน่งที่ตัดไม่สำคัญ — ถ้าเส้นทาง <b>ไม่ครบรอบ</b> ประจุก็ไหลไม่ได้ทั้งวง LED จึงดับ",
        },
      ],
      onFinish: (score, total) => {
        ctx.setQuiz(score, total);
        ctx.say(score === total
          ? [{ pose: "happy", text: `เต็ม ${total}/${total}! เยี่ยมมาก ไปสรุปบทเรียนกันเลย` }]
          : [{ pose: "explain", text: `ได้ ${score}/${total} — อ่านคำอธิบายแล้วกด <b>TRY AGAIN</b> ได้เสมอนะ` }]);
      },
    });
    ctx.registerReset(() => q.reset());
    el.append(q.el);
  }

  /* =========================================================
     STEP 12 — SUMMARY + Next Lesson
     ========================================================= */
  function renderSummary(el, ctx) {
    ctx.complete();
    const next = EFZ.nextLessonMeta("01");
    const glossary = [
      ["Atom", "อะตอม"], ["Electron", "อิเล็กตรอน (−)"], ["Electric Charge", "ประจุไฟฟ้า"], ["Circuit", "วงจรไฟฟ้า"],
      ["Open Circuit", "วงจรเปิด (เส้นทางขาด)"], ["Closed Circuit", "วงจรปิด (เส้นทางครบ)"],
      ["Conductor", "ตัวนำไฟฟ้า"], ["Insulator", "ฉนวนไฟฟ้า"], ["Electron Flow", "− → +"], ["Conventional Current", "+ → −"],
    ];
    const quiz = EFZ.store.lesson("01").quiz;
    el.append(
      h("div", { class: "summary-banner" },
        h("div", null,
          h("div", { class: "summary-banner__kicker" }, "LESSON 01 COMPLETE"),
          h("div", { class: "summary-banner__title" }, "ไฟฟ้า = ประจุไฟฟ้าที่เคลื่อนที่ ในเส้นทางที่ครบรอบ"),
          quiz ? h("div", { class: "summary-banner__score" }, "Quick Check: " + quiz.score + "/" + quiz.total) : null),
        h("div", { class: "summary-banner__icon" }, EFZ.icon("bolt"))),
      ui.keyPoints([
        "ทุกสิ่งสร้างจาก <b>อะตอม</b> — <b>อิเล็กตรอน</b> มีประจุ <b>ลบ (−)</b>",
        "<b>ไฟฟ้า</b> คือการเคลื่อนที่ของ <b>ประจุไฟฟ้า</b> (ในสายโลหะคืออิเล็กตรอน)",
        "วงจรต้องเป็น <b>เส้นทางครบรอบ</b>: แหล่งจ่าย → อุปกรณ์ → กลับแหล่งจ่าย",
        "<b>Open Circuit</b> = เส้นทางขาด → LED OFF · <b>Closed Circuit</b> = ครบรอบ → LED ON",
        "<b>Electron Flow</b>: − → + · <b>Conventional Current</b>: + → − (ใช้ในแผนผังวงจร)",
        "<b>ตัวนำ</b> (โลหะ) ให้ประจุไหลผ่านได้ · <b>ฉนวน</b> (พลาสติก ไม้ ยาง) ไม่ให้ไหล",
      ]),
      h("div", { class: "card card--flat" },
        h("div", { class: "card__title" }, EFZ.icon("book"), "คำศัพท์ในบทนี้"),
        h("div", { class: "glossary" }, glossary.map(([en, th]) => h("span", { class: "gloss" }, h("b", { class: "en" }, en), h("span", null, th))))),
      next ? h("div", { class: "next-card" },
        h("div", null,
          h("div", { class: "next-card__kicker" }, "บทถัดไป · " + next.minutes + " นาที"),
          h("div", { class: "next-card__title" }, "บทที่ " + next.id + ": " + next.title),
          h("p", { class: "muted", style: { margin: 0 } }, "อะไรคือ “แรงดัน” ที่ผลักประจุให้เคลื่อนที่? ทำไมต้องวัดระหว่าง 2 จุด?")),
        h("div", { class: "btn-row" },
          ui.button("ทบทวนบทนี้", { icon: "replay", onClick: () => { location.hash = "#/lesson/01/1"; } }),
          ui.button("NEXT LESSON · บทถัดไป", { variant: "go", size: "lg", icon: "next", iconRight: true, onClick: () => ctx.nextLesson() }))) : null);
  }

  /* =========================================================
     Lesson definition
     ========================================================= */
  EFZ.registerLesson({
    id: "01",
    title: "Electricity คืออะไร",
    minutes: 8,
    steps: [
      { phase: "hook", time: "0.5", title: "อะไรทำให้หลอดไฟติด?", lead: "เริ่มจากสิ่งที่เห็นทุกวัน — กดสวิตช์แล้วไฟติด แต่ข้างในเกิดอะไรขึ้น?",
        ta: [{ pose: "neutral", text: "สวัสดี! ยินดีต้อนรับสู่ <b>Electronics from ZERO</b> บทแรกเริ่มจากคำถามง่าย ๆ" }, { pose: "point", text: "ลองแตะ <b>สวิตช์บนผนัง</b> แล้วสังเกตหลอดไฟดูสิ" }, { pose: "thinking", text: "แล้วตอบคำถามด้านล่าง: <b>อะไรทำให้หลอดไฟสว่าง?</b>" }],
        render: renderHook },
      { phase: "concept", time: "1", title: "อะตอม · อิเล็กตรอน · ประจุไฟฟ้า", lead: "รู้จักอนุภาคเล็ก ๆ ที่อยู่เบื้องหลังไฟฟ้าทั้งหมด — แบบง่ายที่สุด",
        ta: [{ pose: "explain", text: "ไฟฟ้าเริ่มจากสิ่งที่เล็กมาก ๆ เรียกว่า <b>อะตอม</b>" }, { pose: "point", text: "แตะหัวข้อ ① ② ③ ทีละอัน เพื่อดูว่าแต่ละส่วนคืออะไร" }],
        render: renderConcept },
      { phase: "analogy", time: "1", title: "อิเล็กตรอนในสายไฟ", lead: "ทำไมกดสวิตช์ปุ๊บ ไฟติดปั๊บ ทั้งที่อิเล็กตรอนเคลื่อนที่ช้ามาก?",
        ta: [{ pose: "explain", text: "นี่คือภาพขยายภายใน <b>ลวดทองแดง</b> — จุดสีฟ้าคืออิเล็กตรอนอิสระ" }, { pose: "point", text: "ลองกด <b>ต่อแหล่งจ่ายไฟ</b> แล้วดูว่าอิเล็กตรอนเปลี่ยนไปอย่างไร" }],
        render: renderAnalogy },
      { phase: "technical", time: "0.5", title: "จากของจริง สู่วงจรไฟฟ้า", lead: "วงจรพื้นฐานมี 4 ส่วน: แหล่งจ่าย · สายไฟ · สวิตช์ · โหลด",
        ta: [{ pose: "point", text: "แตะชื่ออุปกรณ์ทางขวา เพื่อดูว่าอยู่ตรงไหนในวงจร" }, { pose: "idea", text: "แล้วลองสลับเป็น <b>สัญลักษณ์วงจร</b> — นี่คือภาษาที่วิศวกรใช้วาดวงจร" }],
        render: renderTechnical },
      { phase: "simulation", time: "1", title: "OPEN CIRCUIT vs CLOSED CIRCUIT", lead: "วงจรเปิด = เส้นทางขาด · วงจรปิด = เส้นทางครบรอบ",
        ta: [{ pose: "explain", text: "ตอนนี้สวิตช์ <b>เปิด</b> อยู่ — เส้นทางขาด" }, { pose: "thinking", text: "ก่อนลองกด ตอบคำถามด้านล่างก่อน: <b>คิดว่าจะเกิดอะไรขึ้น?</b>" }],
        render: renderSimulation },
      { phase: "concept", time: "1", title: "Electron Flow vs Conventional Current", lead: "ไฟฟ้าไหลไปทางไหน? คำตอบมี 2 แบบ — และถูกทั้งคู่",
        ta: [{ pose: "explain", text: "อิเล็กตรอนไหลจาก <b>− ไป +</b> แต่วิศวกรวาดกระแสจาก <b>+ ไป −</b>" }, { pose: "point", text: "ลองสลับ 3 ปุ่มด้านบนวงจร แล้วเปรียบเทียบทิศดู" }],
        render: renderDirection },
      { phase: "hardware", time: "0.5", title: "วงจรรอบตัวเรา และบน ESP32", lead: "หลักการ “เส้นทางครบรอบ” อยู่ในทุกอุปกรณ์ไฟฟ้า",
        ta: [{ pose: "esp32", text: "นี่คือบอร์ด <b>ESP32</b> ที่เราจะใช้ในคอร์สนี้" }, { pose: "point", text: "ลองกด <b>ถอดสาย GND</b> ดูว่าจะเกิดอะไรขึ้นกับ LED" }],
        render: renderHardware },
      { phase: "whatif", time: "1", title: "ถ้าเปลี่ยนสิ่งที่อยู่ในช่องว่าง?", lead: "วัสดุทุกชนิดให้ไฟฟ้าไหลผ่านได้หรือเปล่า?",
        ta: [{ pose: "thinking", text: "ถ้าเอาของต่าง ๆ มาวางเชื่อมช่องว่างในวงจร LED จะติดไหมนะ?" }, { pose: "point", text: "เลือกวัสดุ → <b>ทายก่อน</b> → แล้วดูผล" }],
        render: renderWhatIf },
      { phase: "mistake", time: "0.5", title: "ข้อผิดพลาดที่มือใหม่เจอบ่อย", lead: "ต่อสายไปถึง LED แล้ว ทำไมไม่ติด?",
        ta: [{ pose: "warning", text: "ระวัง! นี่คือความผิดพลาดที่มือใหม่ทำบ่อยที่สุด" }, { pose: "thinking", text: "ดูวงจรแล้วทายว่า LED จะติดไหม?" }],
        render: renderMistake },
      { phase: "challenge", time: "1", title: "ภารกิจ: ตัดสายตรงไหน LED ก็ดับ?", lead: "ตัดสายที่ตำแหน่งต่าง ๆ — ทายก่อนทุกครั้ง",
        ta: [{ pose: "point", text: "แตะวงกลม <b>A B C D</b> บนวงจร เพื่อเลือกจุดที่จะตัดสาย" }, { pose: "thinking", text: "ข้อควรคิด: ถ้าตัด <b>หลัง</b> LED ไฟผ่าน LED ไปแล้ว… จะยังติดไหม?" }],
        render: renderChallenge },
      { phase: "quiz", time: "0.5", title: "Quick Check — 3 ข้อ", lead: "ทบทวนความเข้าใจ ไม่ใช่การท่องจำ",
        ta: [{ pose: "thinking", text: "มาทบทวนกัน 3 ข้อ — ตอบผิดก็ไม่เป็นไร อ่านคำอธิบายแล้วลองใหม่ได้" }],
        render: renderQuiz },
      { phase: "summary", time: "0.5", title: "สรุปบทที่ 01", lead: "สิ่งที่ต้องจำจากบทนี้",
        ta: [{ pose: "summary", text: "เยี่ยมมาก! เรียนจบบทที่ 01 แล้ว" }, { pose: "explain", text: "จำไว้: <b>ไฟฟ้าไหลได้เมื่อเส้นทางครบรอบ</b>" }, { pose: "point", text: "บทต่อไป เราจะดูว่าอะไรเป็น “แรงผลัก” ให้ประจุเคลื่อนที่ — <b>Voltage</b>" }],
        render: renderSummary },
    ],
  });
})();
