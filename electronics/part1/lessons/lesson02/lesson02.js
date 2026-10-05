/* =========================================================
   LESSON 02 — Voltage (V) คืออะไร (8 นาที)
   Goal: voltage is an electrical potential difference
   measured BETWEEN two points — the "push" on charge.
   Not "the amount of electricity".
   ========================================================= */
(function () {
  "use strict";
  const EFZ = window.EFZ;
  const { h, s, svgFrag } = EFZ.util;
  const ui = EFZ.ui;
  const { ledState, flowLegend, gauge, dcSupply } = EFZ.kit;

  const SOURCES = [
    { v: 1.5, label: "1.5V", name: "ถ่าน AA", en: "AA battery" },
    { v: 3.3, label: "3.3V", name: "ESP32 (ขา 3V3)", en: "ESP32 logic" },
    { v: 5.0, label: "5V", name: "USB", en: "USB supply" },
  ];
  const pushWord = (v) => (v <= 0.05 ? "ไม่มีแรงผลัก" : v < 2 ? "เบา" : v < 4 ? "ปานกลาง" : "แรง");

  /* ---------------------------------------------------------
     DC supply → (optional LED) → resistor → back
     --------------------------------------------------------- */
  function supplyCircuit(ctx, o = {}) {
    const N = { p: [180, 110], n: [180, 220], a: [262, 110], b: [392, 110], c: [500, 110], e: [500, 140], f: [500, 200], d: [500, 220] };
    let display = null;
    const parts = [
      { id: "src", type: "source", plus: "p", minus: "n", hidden: true },
      { id: "w1", type: "wire", from: "p", to: "a", color: "red" },
      { id: "r1", type: "resistor", from: "a", to: "b", label: o.rLabel || "ตัวต้านทาน 1kΩ", labelSide: -1, labelOffset: 28 },
    ];
    let loop;
    if (o.withLed) {
      parts.push(
        { id: "w2", type: "wire", from: "b", to: "e", via: ["c"], color: "red" },
        { id: "led", type: "led", from: "e", to: "f", label: "LED สีแดง", labelSide: -1, labelOffset: 30 },
        { id: "w3", type: "wire", from: "f", to: "n", via: ["d"], color: "black" });
      loop = ["w1", "r1", "w2", "led", "w3"];
    } else {
      parts.push(
        { id: "w2", type: "wire", from: "b", to: "d", via: ["c"], color: "red" },
        { id: "w3", type: "wire", from: "d", to: "n", color: "black" });
      loop = ["w1", "r1", "w2", "w3"];
    }
    const c = ctx.circuit({
      width: 600, height: 270, nodes: N, parts, loops: [loop], style: "real", flow: o.flow || "electron",
      label: o.withLed ? "แหล่งจ่ายไฟ DC ต่อกับตัวต้านทานและ LED" : "แหล่งจ่ายไฟ DC ต่อกับตัวต้านทาน",
      background: (g) => { display = dcSupply(g, { x: 30, y: 70, w: 150, hgt: 180, plusY: 110, minusY: 220 }); },
    });
    c.el.classList.add("l2-bright");
    return { c, setValue: (v) => display && display.setValue(v) };
  }

  /* =========================================================
     STEP 1 — HOOK: ตัวเลข V บนแบตเตอรี่บอกอะไร?
     ========================================================= */
  function itemArt(kind) {
    const v = s("svg", { viewBox: "0 0 160 110", class: "item-art", "aria-hidden": "true" });
    v.innerHTML = {
      aa: `<rect x="22" y="38" width="104" height="34" rx="8" fill="#1e293b"/><rect x="96" y="38" width="30" height="34" rx="6" fill="#f59e0b"/><rect x="126" y="48" width="8" height="14" rx="2" fill="#cbd5e1" stroke="#64748b"/><path d="M34 46h40" stroke="rgba(255,255,255,.35)" stroke-width="4" stroke-linecap="round"/>`,
      esp: `<rect x="26" y="20" width="108" height="70" rx="6" fill="#111827"/><rect x="50" y="28" width="58" height="40" rx="3" fill="#cbd5e1" stroke="#64748b"/><text x="79" y="53" text-anchor="middle" font-family="Prompt,sans-serif" font-weight="700" font-size="12" fill="#334155">ESP32</text>${Array.from({ length: 12 }, (_, i) => `<rect x="${30 + i * 8.5}" y="16" width="4" height="6" fill="#facc15"/><rect x="${30 + i * 8.5}" y="88" width="4" height="6" fill="#facc15"/>`).join("")}<rect x="68" y="74" width="22" height="12" rx="2" fill="#94a3b8"/>`,
      usb: `<rect x="40" y="18" width="80" height="56" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/><rect x="66" y="32" width="28" height="12" rx="2" fill="#334155"/><path d="M80 74 v14" stroke="#334155" stroke-width="6"/><rect x="70" y="86" width="20" height="14" rx="3" fill="#64748b"/>`,
    }[kind];
    return v;
  }

  function renderHook(el, ctx) {
    const items = [
      { k: "aa", name: "ถ่าน AA", v: "1.5V" },
      { k: "esp", name: "บอร์ด ESP32 (ขา 3V3)", v: "3.3V" },
      { k: "usb", name: "หัวชาร์จ / พอร์ต USB", v: "5V" },
    ];
    let revealed = 0;
    const cards = items.map((it) => {
      const tagEl = h("span", { class: "volt-tag is-hidden" }, it.v);
      const b = h("button", { type: "button", class: "item-card" }, itemArt(it.k), h("span", { class: "item-card__name" }, it.name), tagEl,
        h("span", { class: "item-card__hint" }, "แตะเพื่อดูตัวเลข"));
      b.addEventListener("click", () => {
        if (!tagEl.classList.contains("is-hidden")) return;
        tagEl.classList.remove("is-hidden");
        b.classList.add("is-open");
        revealed++;
        ctx.say([{ pose: revealed === 3 ? "thinking" : "point", text: revealed === 3 ? "ทุกอันมีตัวเลขหน่วย <b>V</b> — แล้วตัวเลขนี้บอกอะไรเรา?" : `${it.name} เขียนไว้ว่า <b>${it.v}</b>` }]);
      });
      return b;
    });
    ctx.registerReset(() => { revealed = 0; cards.forEach((b) => { b.classList.remove("is-open"); b.querySelector(".volt-tag").classList.add("is-hidden"); }); });

    const pred = ui.predict({
      question: "คิดว่าตัวเลข “V” บนอุปกรณ์เหล่านี้บอกอะไร?",
      options: [
        { label: "ปริมาณไฟฟ้าที่เก็บไว้ข้างใน", correct: false, feedback: "ปริมาณพลังงานที่เก็บไว้ใช้หน่วยอื่น (เช่น mAh) — ไม่ใช่ V" },
        { label: "แรงผลักประจุไฟฟ้า ระหว่างขั้วสองขั้ว", correct: true },
        { label: "ความเร็วของไฟฟ้า", correct: false, feedback: "V ไม่ใช่ความเร็ว — บทนี้จะเห็นว่ามันคือ “แรงดัน”" },
      ],
      explain: "V ย่อมาจาก <b>Volt</b> — หน่วยของ <b>แรงดันไฟฟ้า (Voltage)</b> ซึ่งบอกว่าแหล่งจ่าย <b>ผลักประจุ</b> ได้แรงแค่ไหน ระหว่างขั้ว + กับขั้ว −",
      onAnswer: (o, ok) => ctx.say([{ pose: ok ? "happy" : "explain", text: ok ? "ใช่เลย! V คือ <b>แรงผลัก</b> ไม่ใช่ปริมาณไฟ" : "คำตอบคือ <b>แรงผลักประจุระหว่างสองขั้ว</b> — มาดูกันว่าทำไม" }]),
    });
    el.append(
      EFZ.sim.frame({ title: "อุปกรณ์รอบตัวที่มีตัวเลข V", badge: "TRY IT", hint: "แตะการ์ดทีละใบ", stage: h("div", { class: "item-row" }, cards) }),
      pred.el);
  }

  /* =========================================================
     STEP 2 — CONCEPT: Voltage = potential difference
     ========================================================= */
  function renderConcept(el, ctx) {
    // Two points on a "level" scale; voltage is the gap between them.
    const svg = s("svg", { viewBox: "0 0 560 300", class: "levels", role: "img", "aria-label": "แรงดันคือความต่างระหว่างจุด A และจุด B" });
    const Y = (v) => 260 - v * 44; // 0..5 V → y
    let grid = "";
    for (let v = 0; v <= 5; v++) grid += `<line x1="70" x2="520" y1="${Y(v)}" y2="${Y(v)}" class="lv-grid"/><text x="58" y="${Y(v) + 5}" class="lv-num">${v}V</text>`;
    svg.appendChild(svgFrag(grid));
    const gA = svgFrag(`<line x1="150" x2="250" class="lv-bar lv-bar--a"/><circle cx="200" r="16" class="lv-dot lv-dot--a"/><text x="200" class="lv-name">A</text>`);
    const gB = svgFrag(`<line x1="330" x2="430" class="lv-bar lv-bar--b"/><circle cx="380" r="16" class="lv-dot lv-dot--b"/><text x="380" class="lv-name">B</text>`);
    const gap = svgFrag(`<line x1="290" x2="290" class="lv-gap"/><path class="lv-arrow"/><text x="300" class="lv-gaptxt"/>`);
    svg.append(gA, gB, gap);
    let va = 3.3, vb = 0;
    const rV = ui.readout("แรงดันระหว่าง A กับ B  (V = A − B)", "");
    function draw() {
      [[gA, va], [gB, vb]].forEach(([g, v]) => {
        g.querySelector("line").setAttribute("y1", Y(v)); g.querySelector("line").setAttribute("y2", Y(v));
        g.querySelector("circle").setAttribute("cy", Y(v));
        g.querySelector("text").setAttribute("y", Y(v) + 5);
      });
      const top = Math.min(Y(va), Y(vb)), bot = Math.max(Y(va), Y(vb));
      const L = gap.querySelector("line");
      L.setAttribute("y1", top); L.setAttribute("y2", bot);
      gap.querySelector(".lv-arrow").setAttribute("d", bot - top > 14 ? `M284 ${top + 9} L290 ${top} L296 ${top + 9} M284 ${bot - 9} L290 ${bot} L296 ${bot - 9}` : "");
      const t = gap.querySelector("text");
      t.setAttribute("y", (top + bot) / 2 + 5);
      const d = va - vb;
      t.textContent = Math.abs(d) < 0.05 ? "ไม่มีความต่าง" : Math.abs(d).toFixed(1) + " V";
      rV.set((d >= 0 ? "" : "−") + Math.abs(d).toFixed(1) + " V", Math.abs(d) < 0.05 ? null : "blue");
    }
    const sA = ui.slider({ label: "ระดับของจุด A", min: 0, max: 5, step: 0.1, value: va, format: (v) => v.toFixed(1) + " V", onInput: (v) => { va = v; draw(); talk(); } });
    const sB = ui.slider({ label: "ระดับของจุด B", min: 0, max: 5, step: 0.1, value: vb, format: (v) => v.toFixed(1) + " V", onInput: (v) => { vb = v; draw(); talk(); } });
    let lastTalk = null;
    function talk() {
      const same = Math.abs(va - vb) < 0.05;
      const key = same ? "same" : "diff";
      if (key === lastTalk) return;
      lastTalk = key;
      ctx.say(same
        ? [{ pose: "idea", text: "A กับ B อยู่ระดับเดียวกัน = <b>แรงดัน 0V</b> — แม้ทั้งคู่จะสูงแค่ไหนก็ตาม!" }]
        : [{ pose: "point", text: "แรงดันคือ <b>ระยะห่าง</b> ระหว่าง A กับ B ไม่ใช่ความสูงของจุดใดจุดหนึ่ง" }]);
    }
    draw();
    ctx.registerReset(() => { va = 3.3; vb = 0; sA.set(va); sB.set(vb); lastTalk = null; draw(); });

    el.append(
      h("div", { class: "grid-2 concept-cards" },
        h("div", { class: "card" }, h("div", { class: "card__title" }, "แรงดันไฟฟ้า ", h("span", { class: "en muted" }, "Voltage")),
          h("p", { html: "คือ <b>ความต่างศักย์ไฟฟ้า (Potential Difference)</b> ระหว่าง <b>2 จุด</b> — บอกว่าประจุไฟฟ้าถูก <b>ผลัก</b> จากจุดหนึ่งไปอีกจุดหนึ่งแรงแค่ไหน" })),
        h("div", { class: "card" }, h("div", { class: "card__title" }, "หน่วย: โวลต์ ", h("span", { class: "en muted" }, "Volt (V)")),
          h("p", { html: "สัญลักษณ์ในสูตรคือ <b>V</b> และหน่วยก็คือ <b>V</b> เช่น ถ่าน AA = <b>1.5 V</b><br>ยิ่งตัวเลขมาก แรงผลักยิ่งมาก" }))),
      EFZ.sim.frame({
        title: "แรงดัน = ความต่างระหว่างสองจุด", hint: "ลากแถบเลื่อน A และ B", stage: svg,
        controls: [sA.el, sB.el], readouts: [rV.el],
      }),
      ui.callout("tip", "ลองดู", "ตั้ง A และ B ให้ <b>สูงเท่ากันทั้งคู่</b> (เช่น 5V กับ 5V) — แรงดันระหว่างสองจุดจะเป็น <b>0V</b> เพราะไม่มีความต่าง"));
  }

  /* =========================================================
     STEP 3 — VISUAL ANALOGY: water tanks
     ========================================================= */
  function renderAnalogy(el, ctx) {
    const svg = s("svg", { viewBox: "0 0 600 300", class: "tanks", role: "img", "aria-label": "ถังน้ำสองใบเชื่อมกันด้วยท่อ" });
    const BOT = 250, TOP = 50, H = BOT - TOP;
    svg.innerHTML = `
      <defs><linearGradient id="l2-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#0284c7"/></linearGradient></defs>
      <rect x="40" y="${TOP}" width="140" height="${H}" rx="8" class="tk-wall"/>
      <rect x="420" y="${TOP}" width="140" height="${H}" rx="8" class="tk-wall"/>
      <rect x="46" class="tk-water tk-water--l" width="128" fill="url(#l2-water)"/>
      <rect x="426" class="tk-water tk-water--r" width="128" fill="url(#l2-water)"/>
      <rect x="176" y="${BOT - 30}" width="248" height="22" class="tk-pipe"/>
      <g class="tk-wheel" transform="translate(300 ${BOT - 19})"><circle r="17" class="tk-wheel__rim"/><g class="tk-wheel__spin"><path d="M0 -15 V15 M-15 0 H15 M-10.6 -10.6 L10.6 10.6 M-10.6 10.6 L10.6 -10.6"/></g></g>
      <text x="110" y="${TOP - 14}" class="tk-label">ถังซ้าย</text><text x="490" y="${TOP - 14}" class="tk-label">ถังขวา</text>
      <text x="300" y="${BOT + 34}" class="tk-label tk-label--sm">กังหันในท่อ: หมุนเมื่อมีน้ำไหลผ่าน</text>`;
    const wl = svg.querySelector(".tk-water--l"), wr = svg.querySelector(".tk-water--r");
    const spin = svg.querySelector(".tk-wheel__spin");
    const gP = s("g");
    svg.appendChild(gP);
    const drops = Array.from({ length: 12 }, (_, i) => { const c = s("circle", { r: 4.5, class: "tk-drop", cy: BOT - 19 }); gP.appendChild(c); return { c, x: 182 + i * 20 }; });
    const diffLine = svgFrag(`<line x1="200" x2="400" class="tk-dline"/><line x1="200" x2="400" class="tk-dline"/><path class="tk-darrow"/><text x="300" class="tk-dtxt"/>`);
    svg.appendChild(diffLine);

    let L = 4, R = 1, rot = 0;
    const lvY = (lv) => BOT - 6 - (lv / 5) * (H - 12);
    const rDiff = ui.readout("ความต่างของระดับน้ำ", "");
    const rFlow = ui.readout("การไหลของน้ำ", "");
    function draw() {
      [[wl, L], [wr, R]].forEach(([r, lv]) => { const y = lvY(lv); r.setAttribute("y", y); r.setAttribute("height", BOT - 6 - y); });
      const yl = lvY(L), yr = lvY(R);
      const [l1, l2] = diffLine.querySelectorAll("line");
      l1.setAttribute("y1", yl); l1.setAttribute("y2", yl); l2.setAttribute("y1", yr); l2.setAttribute("y2", yr);
      l1.setAttribute("x1", 180); l1.setAttribute("x2", 330); l2.setAttribute("x1", 270); l2.setAttribute("x2", 420);
      const top = Math.min(yl, yr), bot = Math.max(yl, yr);
      diffLine.querySelector(".tk-darrow").setAttribute("d", bot - top > 16 ? `M300 ${top} V${bot} M294 ${top + 8} L300 ${top} L306 ${top + 8} M294 ${bot - 8} L300 ${bot} L306 ${bot - 8}` : "");
      const t = diffLine.querySelector(".tk-dtxt");
      t.setAttribute("y", Math.min(top, bot) - 8);
      const d = L - R;
      t.textContent = Math.abs(d) < 0.05 ? "ระดับเท่ากัน" : "ต่างกัน " + Math.abs(d).toFixed(1) + " ระดับ";
      rDiff.set(Math.abs(d) < 0.05 ? "0 (เท่ากัน)" : Math.abs(d).toFixed(1) + " ระดับ", Math.abs(d) < 0.05 ? null : "blue");
      rFlow.set(Math.abs(d) < 0.05 ? "ไม่ไหล — ไม่มีความต่าง" : (d > 0 ? "ซ้าย → ขวา" : "ขวา → ซ้าย") + " (" + (Math.abs(d) < 1.6 ? "เบา" : Math.abs(d) < 3.2 ? "ปานกลาง" : "แรง") + ")", Math.abs(d) < 0.05 ? null : "good");
    }
    ctx.loop((dt) => {
      const d = L - R;
      const v = Math.abs(d) < 0.05 ? 0 : d * 26;
      rot += v * dt * 4;
      spin.setAttribute("transform", `rotate(${rot.toFixed(1)})`);
      for (const p of drops) {
        p.x += v * dt;
        if (p.x > 420) p.x -= 240;
        if (p.x < 180) p.x += 240;
        p.c.setAttribute("cx", p.x.toFixed(1));
      }
    });
    const sL = ui.slider({ label: "ระดับน้ำถังซ้าย", min: 0, max: 5, step: 0.5, value: L, format: (v) => v + " ระดับ", onInput: (v) => { L = v; draw(); } });
    const sR = ui.slider({ label: "ระดับน้ำถังขวา", min: 0, max: 5, step: 0.5, value: R, format: (v) => v + " ระดับ", onInput: (v) => { R = v; draw(); } });
    const setBoth = (l, r) => { L = l; R = r; sL.set(l); sR.set(r); draw(); };
    draw();
    ctx.registerReset(() => setBoth(4, 1));

    const pred = ui.predict({
      question: "ถ้าน้ำในถังทั้งสองใบ “สูงมากเท่ากัน” (5 กับ 5) — คิดว่าน้ำในท่อจะไหลไหม?",
      inline: true,
      options: [{ label: "ไหลแรงมาก เพราะน้ำเยอะ", correct: false }, { label: "ไม่ไหล เพราะระดับเท่ากัน", correct: true }],
      explain: "น้ำไหลเพราะ <b>ความต่างของระดับ</b> ไม่ใช่เพราะน้ำเยอะ — ไฟฟ้าก็เช่นกัน ต้องมี <b>ความต่างของแรงดัน</b> ระหว่างสองจุดจึงจะผลักประจุได้",
      onAnswer: (o, ok) => { setBoth(5, 5); ctx.say([{ pose: ok ? "happy" : "idea", text: "ดูสิ! น้ำเต็มทั้งสองถัง แต่ <b>กังหันไม่หมุนเลย</b> เพราะไม่มีความต่าง" }]); },
    });

    el.append(
      EFZ.sim.frame({
        title: "ถังน้ำสองใบ: ความต่างของระดับ = แรงดัน", hint: "ลองเปลี่ยนค่าเอง", stage: svg,
        controls: [sL.el, sR.el,
          h("div", { class: "btn-row" },
            ui.button("ซ้ายสูงกว่า", { size: "sm", onClick: () => setBoth(4.5, 0.5) }),
            ui.button("ต่างกันนิดเดียว", { size: "sm", onClick: () => setBoth(3, 2.5) }),
            ui.button("ขวาสูงกว่า", { size: "sm", onClick: () => setBoth(1, 4) }))],
        readouts: [rDiff.el, rFlow.el],
      }),
      pred.el,
      ui.callout("info", "ภาพเปรียบเทียบนี้บอกอะไร?", "ยิ่งระดับน้ำ <b>ต่างกันมาก</b> แรงดันน้ำในท่อยิ่งมาก น้ำยิ่ง <b>ถูกผลักแรง</b><br>สมมติว่ามีปั๊มคอยรักษาระดับน้ำให้คงที่ — เหมือนแบตเตอรี่ที่รักษาแรงดันระหว่างขั้วไว้"));
  }

  /* =========================================================
     STEP 4 — TECHNICAL: measure BETWEEN two points
     ========================================================= */
  function renderTechnical(el, ctx) {
    const P = { A: { x: 104, v: 0 }, B: { x: 300, v: 1.5 }, C: { x: 496, v: 3.0 } };
    const svg = s("svg", { viewBox: "0 0 600 280", class: "probe-sim", role: "img", "aria-label": "ถ่าน AA สองก้อนต่อกัน มีจุดวัด A B C" });
    svg.innerHTML = `
      <defs><linearGradient id="l2-cell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#475569"/><stop offset=".5" stop-color="#1e293b"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>
      <g class="pr-cells">
        ${[120, 316].map((x) => `<rect x="${x}" y="180" width="160" height="56" rx="10" fill="url(#l2-cell)" stroke="#0f172a" stroke-width="2"/>
          <rect x="${x + 116}" y="180" width="44" height="56" rx="8" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
          <rect x="${x + 160}" y="196" width="8" height="24" rx="2" fill="#cbd5e1" stroke="#64748b"/>
          <text x="${x + 58}" y="214" class="pr-cell-v">1.5V</text>
          <text x="${x + 138}" y="215" class="pr-cell-pol">+</text><text x="${x + 14}" y="215" class="pr-cell-pol pr-cell-pol--m">−</text>`).join("")}
      </g>
      ${Object.keys(P).map((k) => `<g class="pr-pt" data-pt="${k}"><circle cx="${P[k].x}" cy="208" r="11"/><text x="${P[k].x}" y="262" class="pr-pt-name">จุด ${k}</text></g>`).join("")}
      <rect x="215" y="16" width="170" height="78" rx="12" class="pr-meter"/>
      <rect x="229" y="28" width="142" height="40" rx="6" class="pr-screen"/>
      <text x="300" y="84" class="pr-meter-name">เครื่องวัดแรงดัน</text>`;
    const reading = s("text", { x: 300, y: 56, class: "pr-reading" });
    const red = s("path", { class: "pr-lead pr-lead--red" });
    const black = s("path", { class: "pr-lead pr-lead--black" });
    const tipR = s("circle", { r: 7, class: "pr-tip pr-tip--red" });
    const tipB = s("circle", { r: 7, class: "pr-tip pr-tip--black" });
    svg.append(black, red, tipB, tipR, reading);

    let rp = "C", bp = "A";
    const goals = [
      { id: "g3", text: "วัดให้ได้ 3.0 V", test: (v) => Math.abs(v - 3) < 0.01 },
      { id: "g15", text: "วัดให้ได้ 1.5 V", test: (v) => Math.abs(v - 1.5) < 0.01 },
      { id: "g0", text: "วัดให้ได้ 0 V", test: (v) => Math.abs(v) < 0.01 },
      { id: "gneg", text: "ทำให้ค่าติดลบ (สลับสาย)", test: (v) => v < -0.01 },
    ];
    const done = {};
    const goalList = h("div", { class: "goal-list" });
    function renderGoals() {
      goalList.innerHTML = "";
      goals.forEach((g) => goalList.appendChild(h("div", { class: "goal " + (done[g.id] ? "is-done" : "") }, EFZ.icon(done[g.id] ? "check" : "target"), g.text)));
    }
    const formula = h("div", { class: "formula" });
    function draw(speak) {
      const v = P[rp].v - P[bp].v;
      reading.textContent = (v < 0 ? "−" : "") + Math.abs(v).toFixed(2) + " V";
      const lead = (pt, x0) => `M${x0} 94 C ${x0} 140, ${P[pt].x} 140, ${P[pt].x} ${pt === rp && pt === bp && x0 > 300 ? 186 : 194}`;
      red.setAttribute("d", lead(rp, 340));
      black.setAttribute("d", lead(bp, 260));
      tipR.setAttribute("cx", P[rp].x + (rp === bp ? 7 : 0)); tipR.setAttribute("cy", 196);
      tipB.setAttribute("cx", P[bp].x - (rp === bp ? 7 : 0)); tipB.setAttribute("cy", 196);
      svg.querySelectorAll(".pr-pt").forEach((g) => g.classList.toggle("is-on", g.dataset.pt === rp || g.dataset.pt === bp));
      formula.innerHTML = `V = V(สายแดง ที่จุด ${rp}) − V(สายดำ ที่จุด ${bp}) = ${P[rp].v.toFixed(1)} − ${P[bp].v.toFixed(1)} = <b>${v.toFixed(1)} V</b>`;
      goals.forEach((g) => { if (g.test(v)) done[g.id] = true; });
      renderGoals();
      if (!speak) return;
      if (Math.abs(v) < 0.01) ctx.say([{ pose: "idea", text: "แตะจุดเดียวกัน = <b>0 V</b> — ไม่มีความต่าง จึงวัดแรงดันไม่ได้" }]);
      else if (v < 0) ctx.say([{ pose: "thinking", text: "ค่า <b>ติดลบ</b> แปลว่าจุดที่สายแดงแตะ <b>ต่ำกว่า</b> จุดที่สายดำแตะ — สลับสายกลับก็จะเป็นบวก" }]);
      else ctx.say([{ pose: "point", text: `ระหว่างจุด ${bp} กับจุด ${rp} มีแรงดัน <b>${v.toFixed(1)} V</b>` }]);
    }
    const opts = Object.keys(P).map((k) => ({ value: k, label: "จุด " + k }));
    const segR = ui.segmented(opts, rp, (v) => { rp = v; draw(true); }, { label: "สายสีแดงแตะที่" });
    const segB = ui.segmented(opts, bp, (v) => { bp = v; draw(true); }, { label: "สายสีดำแตะที่" });
    draw(false);
    ctx.registerReset(() => { rp = "C"; bp = "A"; segR.set(rp); segB.set(bp); Object.keys(done).forEach((k) => delete done[k]); draw(false); });

    el.append(
      EFZ.sim.frame({
        title: "วัดแรงดัน “ระหว่าง” สองจุด", badge: "TECHNICAL", hint: "เลือกจุดให้สายแดงและสายดำ", stage: svg,
        controls: [
          h("div", { class: "probe-ctl" }, h("span", { class: "probe-ctl__lbl probe-ctl__lbl--red" }, "สายสีแดง"), segR.el),
          h("div", { class: "probe-ctl" }, h("span", { class: "probe-ctl__lbl probe-ctl__lbl--black" }, "สายสีดำ"), segB.el)],
        footer: h("div", { class: "sim__controls" }, formula),
      }),
      h("div", { class: "card card--tint" }, h("div", { class: "card__title" }, EFZ.icon("target"), "ภารกิจเล็ก ๆ"), goalList),
      ui.callout("info", "จำให้ขึ้นใจ", "แรงดันไฟฟ้า <b>วัดระหว่างสองจุดเสมอ</b> — การพูดว่า “จุดนี้มีแรงดัน 3V” จริง ๆ แล้วหมายถึง “เทียบกับจุดอ้างอิง (มักเป็นขั้วลบ หรือ GND)”<br>เรื่องเครื่องวัดจริง (มัลติมิเตอร์) จะเรียนในบทที่ 14"));
  }

  /* =========================================================
     STEP 5 — SIMULATION: voltage slider 1.5 / 3.3 / 5V
     ========================================================= */
  function renderSimulation(el, ctx) {
    const { c, setValue } = supplyCircuit(ctx, { flow: "conventional" });
    const g = gauge({ min: 0, max: 5, unit: "V", label: "หน้าปัดแรงดัน", zones: [{ from: 0, to: 3.3, cls: "gz-blue" }, { from: 3.3, to: 5, cls: "gz-orange" }] });
    const rV = ui.readout("แรงดันระหว่างขั้ว + และ −", "");
    const rPush = ui.readout("แรงผลักประจุ", "");
    const rEx = ui.readout("ตัวอย่างแหล่งจ่าย", "");
    let predicted = false;
    function setV(v, from) {
      setValue(v);
      g.set(v);
      c.setSpeed(v / 3.3);
      rV.set(v.toFixed(1) + " V", "blue");
      rPush.set(pushWord(v), v < 0.05 ? null : "orange");
      const src = SOURCES.find((x) => Math.abs(x.v - v) < 0.05);
      rEx.set(src ? src.name : "—");
      if (from !== "slider") fine.set(v);
      if (from !== "seg") seg.set(src ? src.v : null);
    }
    const seg = ui.segmented(SOURCES.map((x) => ({ value: x.v, label: x.label + " · " + x.name })), 1.5, (v) => {
      if (!predicted && v !== 1.5) { seg.set(1.5); nudge(); return; }
      setV(v, "seg");
      ctx.say([{ pose: v >= 5 ? "point" : "explain", text: `ตั้งแรงดันเป็น <b>${v}V</b> — แรงผลัก<b>${pushWord(v)}</b> สังเกตลูกศรในวงจร` }]);
    }, { label: "เลือกแหล่งจ่าย", size: "lg" });
    const fine = ui.slider({ label: "ลองเปลี่ยนค่าเอง (0–5V)", min: 0, max: 5, step: 0.1, value: 1.5, format: (v) => v.toFixed(1) + " V", onInput: (v) => { if (!predicted) { fine.set(1.5); nudge(); return; } setV(v, "slider"); } });
    function nudge() {
      ctx.say([{ pose: "point", text: "ก่อนเพิ่มแรงดัน ตอบคำถามด้านล่างก่อนนะ — <b>คิดว่าจะเกิดอะไรขึ้น?</b>" }]);
      pred.el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const pred = ui.predict({
      question: "ถ้าเพิ่มแรงดันจาก 1.5V เป็น 5V (ตัวต้านทานเท่าเดิม) — คิดว่าการไหลในวงจรจะเป็นอย่างไร?",
      options: [
        { label: "ไหลมากขึ้น เพราะแรงผลักมากขึ้น", correct: true },
        { label: "เท่าเดิม เพราะเป็นวงจรเดิม", correct: false },
        { label: "ไหลน้อยลง", correct: false },
      ],
      explain: "แรงดันมากขึ้น = <b>แรงผลักมากขึ้น</b> ประจุจึงไหลผ่านตัวต้านทานตัวเดิมได้มากขึ้น — ลองกด 3.3V และ 5V ดูได้เลย (ตัวเลขการไหลจริงจะคำนวณได้ในบทที่ 05)",
      allowRetry: false,
      onAnswer: () => { predicted = true; lock.remove(); setV(5, "pred"); },
    });
    const lock = h("span", { class: "tag tag--purple" }, EFZ.icon("lock"), "ตอบคำถามด้านล่างก่อน แล้วลองเปลี่ยนค่าเอง");
    setV(1.5, "init");
    ctx.registerReset(() => setV(1.5, "reset"));

    el.append(
      h("div", { class: "sim-split" },
        EFZ.sim.frame({
          title: "เพิ่ม–ลดแรงดัน แล้วดูการไหล", hint: "ลองเปลี่ยนค่าเอง", stage: c.el,
          controls: [seg.el, lock], readouts: [rV.el, rPush.el, rEx.el],
          footer: h("div", { class: "sim__controls" }, fine.el, flowLegend()),
        }),
        h("div", { class: "card gauge-card" }, h("div", { class: "card__title" }, "หน้าปัดแรงดัน"), g.el,
          h("p", { class: "muted", style: { fontSize: "var(--fs-sm)", margin: 0 } }, "เข็มบอกแรงดันระหว่างขั้ว + และ − ของแหล่งจ่าย"))),
      pred.el,
      h("p", { class: "muted", style: { fontSize: "var(--fs-xs)", margin: 0 } }, "* ความเร็วลูกศรในภาพใช้เปรียบเทียบเท่านั้น — เรื่อง “ปริมาณการไหล” คือ Current ซึ่งจะเรียนในบทที่ 03"));
  }

  /* =========================================================
     STEP 6 — REAL HARDWARE: the voltage ladder
     ========================================================= */
  function renderHardware(el, ctx) {
    const Y = (v) => 360 - v * 60;
    const MARKS = [
      { v: 0, title: "0 V — จุดอ้างอิง (ขั้วลบ / GND)", text: "จุดที่เราใช้เทียบวัดแรงดันอื่น ๆ บนบอร์ด ESP32 คือขา <b>GND</b> (บทที่ 07)", cls: "mk-ref", pose: "explain" },
      { v: 1.5, title: "1.5 V — ถ่าน AA / AAA", text: "ถ่านไฟฉายทั่วไป 1 ก้อน ใช้ในรีโมต นาฬิกา ของเล่น", cls: "mk-aa", pose: "point" },
      { v: 3.3, title: "3.3 V — ลอจิกของ ESP32", text: "ชิป ESP32 และขา GPIO ทำงานที่ประมาณ <b>3.3V</b> — บนบอร์ดมีขาที่พิมพ์ว่า <b>3V3</b> (บทที่ 08)", cls: "mk-esp", pose: "esp32" },
      { v: 5, title: "5 V — USB", text: "พอร์ต USB ของคอมพิวเตอร์และหัวชาร์จส่วนใหญ่จ่าย <b>5V</b> เข้าบอร์ด แล้วบอร์ดจะแปลงลงเป็น 3.3V ให้ชิป", cls: "mk-usb", pose: "laptop" },
    ];
    const svg = s("svg", { viewBox: "0 0 420 400", class: "ladder", role: "img", "aria-label": "สเกลแรงดัน 0 ถึง 5 โวลต์" });
    let m = `<line x1="120" x2="120" y1="${Y(0)}" y2="${Y(5.4)}" class="ld-axis"/><path d="M114 ${Y(5.4) + 8} L120 ${Y(5.4)} L126 ${Y(5.4) + 8}" class="ld-axis"/>`;
    for (let v = 0; v <= 5; v++) m += `<line x1="112" x2="128" y1="${Y(v)}" y2="${Y(v)}" class="ld-tick"/><text x="100" y="${Y(v) + 5}" class="ld-num">${v} V</text>`;
    svg.appendChild(svgFrag(m));
    const detail = h("div", { class: "card ladder-detail" });
    const marks = MARKS.map((mk, i) => {
      const g = svgFrag(`<line x1="120" x2="190" y1="${Y(mk.v)}" y2="${Y(mk.v)}" class="ld-link"/><circle cx="120" cy="${Y(mk.v)}" r="8" class="ld-dot ${mk.cls}"/>
        <rect x="190" y="${Y(mk.v) - 17}" width="210" height="34" rx="17" class="ld-chip ${mk.cls}"/><text x="295" y="${Y(mk.v) + 5}" class="ld-chip-txt">${mk.title.split(" — ")[1]}</text>`,
      { class: "ld-mark", tabindex: "0", role: "button", "aria-label": mk.title });
      const pick = () => {
        marks.forEach((x) => x.classList.remove("is-on")); g.classList.add("is-on");
        detail.innerHTML = "";
        detail.append(h("div", { class: "card__title" }, mk.title), h("p", { html: mk.text, style: { margin: 0 } }));
        ctx.say([{ pose: mk.pose, text: mk.text }]);
      };
      g.addEventListener("click", pick);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      svg.appendChild(g);
      return g;
    });
    detail.append(h("div", { class: "card__title" }, "แตะป้ายบนสเกล"), h("p", { class: "muted", style: { margin: 0 } }, "เพื่อดูว่าแรงดันแต่ละค่าพบได้ที่ไหน"));
    ctx.registerReset(() => { marks.forEach((x) => x.classList.remove("is-on")); detail.innerHTML = ""; detail.append(h("div", { class: "card__title" }, "แตะป้ายบนสเกล")); });

    el.append(
      h("div", { class: "ladder-grid" },
        EFZ.sim.frame({ title: "สเกลแรงดันรอบตัวเรา", badge: "REAL HARDWARE", hint: "แตะป้าย", stage: svg }),
        h("div", { class: "stack" }, detail,
          ui.callout("info", "USB → ESP32", "สาย USB จ่าย <b>5V</b> เข้าบอร์ด → ตัวควบคุมแรงดันบนบอร์ดแปลงเป็น <b>3.3V</b> → ชิป ESP32 ใช้งาน<br>รายละเอียดเรียนในบทที่ 08"),
          ui.callout("danger", "ไฟบ้าน 220V ไม่อยู่บนสเกลนี้", "ไฟบ้านสูงกว่า 5V <b>มากกว่า 40 เท่า</b> และเป็นไฟ AC (บทที่ 06) — <b>อันตรายถึงชีวิต</b> การทดลองใน Part 1 ใช้ไฟ DC แรงดันต่ำเท่านั้น"))));
  }

  /* =========================================================
     STEP 7 — WHAT IF? LED at 1.5V / 3.3V / 5V
     ========================================================= */
  function renderWhatIf(el, ctx) {
    const { c, setValue } = supplyCircuit(ctx, { withLed: true, rLabel: "ตัวต้านทาน 330Ω", flow: "conventional" });
    const status = h("div", { class: "status-line" });
    const results = {};
    const table = h("div", { class: "mat-results" });
    const work = h("div");
    const OUT = {
      1.5: { on: false, scale: 0, word: "ไม่ติด", why: "LED สีแดงต้องการแรงดันขั้นต่ำประมาณ <b>1.8–2.0V</b> จึงจะเริ่มนำไฟ (เรียกว่า <b>Forward Voltage</b>) — 1.5V แรงผลักไม่พอ จึงแทบไม่มีกระแสไหล" },
      3.3: { on: true, scale: 0.75, word: "ติด", why: "3.3V มากกว่า Forward Voltage ของ LED → มีกระแสไหล LED <b>ติด</b> (ตัวต้านทานช่วยจำกัดกระแสให้ปลอดภัย)" },
      5: { on: true, scale: 1.3, word: "ติดสว่างกว่า", why: "5V ผลักแรงกว่า → กระแสผ่าน LED มากขึ้น LED จึง <b>สว่างกว่า</b> — ตัวต้านทาน 330Ω ยังจำกัดกระแสให้อยู่ในระดับปลอดภัย" },
    };
    function apply(v) {
      const o = OUT[v];
      setValue(v);
      c.set("led", { belowVf: !o.on });
      c.setSpeed(v / 3.3);
      c.el.style.setProperty("--led-s", o.scale || 1);
      status.innerHTML = ""; status.appendChild(ledState(o.on, o.on ? (v === 5 ? "LED สว่างมาก" : "LED ON") : "LED OFF"));
    }
    function choose(v) {
      seg.set(v);
      if (results[v]) { apply(v); work.innerHTML = ""; work.appendChild(ui.feedback(OUT[v].on ? "good" : "info", `${v}V → LED ${OUT[v].word}`, OUT[v].why)); return; }
      c.setSpeed(0); setValue(v);
      c.set("led", { belowVf: true });
      status.innerHTML = ""; status.appendChild(ledState(false, "รอคำตอบ…"));
      work.innerHTML = "";
      work.appendChild(ui.predict({
        question: `ถ้าใช้แหล่งจ่าย ${v}V กับ LED สีแดง + ตัวต้านทาน 330Ω — คิดว่า LED จะเป็นอย่างไร?`,
        inline: true,
        options: [
          { label: "ไม่ติด", correct: v === 1.5 },
          { label: "ติด", correct: v === 3.3 },
          { label: "ติดสว่างกว่า", correct: v === 5 },
        ],
        explain: OUT[v].why,
        allowRetry: false,
        onAnswer: (o, ok) => {
          results[v] = ok; apply(v); renderTable();
          ctx.say([{ pose: ok ? "happy" : (v === 1.5 ? "idea" : "explain"), text: v === 1.5 ? "เซอร์ไพรส์! วงจร <b>ครบรอบ</b> แต่แรงดัน 1.5V <b>ไม่พอ</b> ให้ LED ติด" : `${v}V → LED <b>${OUT[v].word}</b>` }]);
        },
      }).el);
    }
    function renderTable() {
      table.innerHTML = "";
      const ks = Object.keys(results).map(Number).sort((a, b) => a - b);
      if (!ks.length) { table.appendChild(h("p", { class: "muted", style: { margin: 0 } }, "ยังไม่มีผล — เลือกแรงดันด้านบน")); return; }
      ks.forEach((v) => table.appendChild(h("div", { class: "mat-row" },
        h("span", { class: "mat-row__name" }, v + " V"), ui.tag("LED " + OUT[v].word, OUT[v].on ? "green" : null),
        h("span", { class: "mat-row__pred " + (results[v] ? "is-ok" : "is-no") }, EFZ.icon(results[v] ? "check" : "x")))));
    }
    const seg = ui.segmented(SOURCES.map((x) => ({ value: x.v, label: x.label })), null, choose, { label: "แรงดันแหล่งจ่าย", size: "lg" });
    setValue(1.5); c.set("led", { belowVf: true }, true); c.setSpeed(0);
    status.appendChild(ledState(false, "เลือกแรงดันก่อน"));
    renderTable();
    ctx.registerReset(() => { Object.keys(results).forEach((k) => delete results[k]); seg.set(null); work.innerHTML = ""; c.set("led", { belowVf: true }); c.setSpeed(0); setValue(1.5); status.innerHTML = ""; status.appendChild(ledState(false, "เลือกแรงดันก่อน")); renderTable(); });

    el.append(
      EFZ.sim.frame({ title: "ถ้าเปลี่ยนแรงดันที่จ่ายให้ LED ล่ะ?", badge: "WHAT IF?", hint: "เลือกแรงดัน → ทาย → ดูผล", stage: c.el, controls: [seg.el, h("span", { style: { flex: 1 } }), status] }),
      work,
      h("div", { class: "card card--tint" }, h("div", { class: "card__title" }, EFZ.icon("book"), "ผลการทดลอง"), table),
      ui.callout("warn", "อย่าลองเพิ่มแรงดันเองกับของจริง", "LED และ ESP32 มีขีดจำกัดแรงดัน/กระแส — ในคอร์สนี้เราใช้ <b>3.3V จาก ESP32 + ตัวต้านทาน</b> เสมอ ส่วนการคำนวณค่าตัวต้านทานจะเรียนในบทที่ 10"));
  }

  /* =========================================================
     STEP 8 — COMMON MISTAKE: bigger battery = more volts?
     ========================================================= */
  function renderMistake(el, ctx) {
    const CELLS = [
      { k: "AAA", w: 26, hgt: 96, cap: 1 },
      { k: "AA", w: 34, hgt: 118, cap: 2.4 },
      { k: "C", w: 56, hgt: 112, cap: 6 },
      { k: "D", w: 70, hgt: 130, cap: 12 },
    ];
    const svg = s("svg", { viewBox: "0 0 520 260", class: "cells", role: "img", "aria-label": "ถ่าน AAA AA C D" });
    let x = 40;
    CELLS.forEach((cl) => {
      const cx = x + cl.w / 2, top = 200 - cl.hgt;
      svg.appendChild(svgFrag(`
        <rect x="${cx - 7}" y="${top - 8}" width="14" height="9" rx="2" fill="#cbd5e1" stroke="#64748b"/>
        <rect x="${x}" y="${top}" width="${cl.w}" height="${cl.hgt}" rx="7" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
        <rect x="${x}" y="${top}" width="${cl.w}" height="${cl.hgt * 0.28}" rx="7" fill="#f59e0b"/>
        <text x="${cx}" y="226" class="cell-name">${cl.k}</text>
        <g class="cell-v"><rect x="${cx - 26}" y="${top + cl.hgt * 0.45}" width="52" height="24" rx="12" class="cell-v__bg"/><text x="${cx}" y="${top + cl.hgt * 0.45 + 17}" class="cell-v__txt">1.5V</text></g>`));
      x += cl.w + 60;
    });
    const bars = h("div", { class: "cap-bars", hidden: true },
      h("div", { class: "card__title", style: { fontSize: "var(--fs-md)" } }, "สิ่งที่ต่างกันจริง ๆ: พลังงานที่เก็บได้ (ใช้งานได้นานแค่ไหน)"),
      CELLS.map((cl) => h("div", { class: "cap-row" }, h("span", { class: "cap-row__k" }, cl.k),
        h("span", { class: "cap-row__bar" }, h("i", { style: { width: (cl.cap / 12) * 100 + "%" } })))),
      h("p", { class: "muted", style: { fontSize: "var(--fs-xs)", margin: 0 } }, "* ความยาวแถบเป็นการเปรียบเทียบคร่าว ๆ ค่าจริงขึ้นกับยี่ห้อและชนิดถ่าน"));

    const pred = ui.predict({
      question: "ถ่าน 4 ขนาดนี้ (ถ่านอัลคาไลน์ทั่วไป) — ก้อนไหนมีแรงดันสูงที่สุด?",
      options: [
        { label: "D — เพราะใหญ่ที่สุด", correct: false },
        { label: "AAA — เพราะเล็ก แรงดันจึงอัดแน่น", correct: false },
        { label: "เท่ากันหมด คือ 1.5V", correct: true },
      ],
      explain: "ถ่านทุกขนาดนี้มีแรงดัน <b>1.5V เท่ากัน</b> เพราะใช้สารเคมีชนิดเดียวกัน — ขนาดที่ใหญ่ขึ้นทำให้ <b>เก็บพลังงานได้มากขึ้น ใช้ได้นานขึ้น</b> แต่ <b>ไม่ได้ผลักแรงขึ้น</b>",
      onAnswer: () => { svg.classList.add("is-revealed"); bars.hidden = false; },
      onReset: () => { svg.classList.remove("is-revealed"); bars.hidden = true; },
      alwaysRetry: true,
    });
    ctx.registerReset(() => { pred.reset(); svg.classList.remove("is-revealed"); bars.hidden = true; });

    el.append(
      EFZ.sim.frame({ title: "ถ่านก้อนใหญ่ = แรงดันมากกว่า?", badge: "MISTAKE", hint: "ทายก่อน แล้วดูเฉลย", stage: svg, footer: h("div", { class: "sim__controls" }, bars) }),
      pred.el,
      h("h3", { style: { marginTop: "8px" } }, "ความเข้าใจผิดอีก 2 ข้อ (แตะการ์ดเพื่อพลิก)"),
      h("div", { class: "grid-2" },
        ui.flipCard({
          front: "<p><b>“แรงดัน (V) คือปริมาณไฟฟ้า”</b></p><p class='muted'>เช่น 5V มีไฟเยอะกว่า 1.5V</p>",
          back: "<p>แรงดันคือ <b>แรงผลัก</b> ระหว่างสองจุด ส่วน <b>ปริมาณการไหล</b> คือ Current (บทที่ 03) และ <b>พลังงานที่เก็บไว้</b> บอกด้วยหน่วยอื่น เช่น mAh</p>",
        }),
        ui.flipCard({
          front: "<p><b>“สายไฟเส้นนี้มีแรงดัน 3.3V” — วัดที่จุดเดียวได้เลย</b></p>",
          back: "<p>แรงดันต้อง <b>วัดระหว่างสองจุด</b> เสมอ ประโยคนี้จริง ๆ หมายถึง “สายเส้นนี้สูงกว่า <b>GND</b> อยู่ 3.3V”</p>",
        })));
  }

  /* =========================================================
     STEP 9 — MINI CHALLENGE: rank + "between two points"
     ========================================================= */
  function renderChallenge(el, ctx) {
    const wrap = h("div", { class: "stack" });
    const ITEMS = [
      { id: "usb", v: 5, name: "USB", art: "usb" },
      { id: "aa", v: 1.5, name: "ถ่าน AA", art: "aa" },
      { id: "esp", v: 3.3, name: "ESP32 (3V3)", art: "esp" },
    ];
    let picked = [];
    const slots = h("div", { class: "rank-slots" });
    const pool = h("div", { class: "item-row" });
    const fb = h("div");
    const bonus = h("div", { class: "stack" });
    function render() {
      slots.innerHTML = "";
      ["ต่ำสุด", "กลาง", "สูงสุด"].forEach((lbl, i) => {
        const it = picked[i];
        slots.appendChild(h("div", { class: "rank-slot " + (it ? "is-filled" : "") }, h("span", { class: "rank-slot__n" }, (i + 1) + ". " + lbl), it ? h("b", null, it.name) : h("span", { class: "muted" }, "—")));
      });
      pool.innerHTML = "";
      ITEMS.forEach((it) => {
        const used = picked.includes(it);
        const b = h("button", { type: "button", class: "item-card item-card--sm" + (used ? " is-used" : ""), disabled: used }, itemArt(it.art), h("span", { class: "item-card__name" }, it.name));
        b.addEventListener("click", () => { picked.push(it); render(); if (picked.length === 3) check(); });
        pool.appendChild(b);
      });
    }
    function check() {
      const ok = picked[0].v < picked[1].v && picked[1].v < picked[2].v;
      fb.innerHTML = "";
      fb.appendChild(ui.feedback(ok ? "good" : "bad", ok ? "เรียงถูกต้อง!" : "ยังไม่ถูก — ลองใหม่อีกครั้ง",
        ok ? "ถ่าน AA <b>1.5V</b> &lt; ESP32 <b>3.3V</b> &lt; USB <b>5V</b>" : "ลองนึกถึงตัวเลขบนอุปกรณ์แต่ละชิ้น: AA, ESP32 (3V3), USB"));
      fb.appendChild(h("div", { class: "btn-row", style: { marginTop: "10px" } }, ui.button("TRY AGAIN · เรียงใหม่", { icon: "replay", size: "sm", onClick: () => { picked = []; fb.innerHTML = ""; render(); } })));
      ctx.say([{ pose: ok ? "happy" : "thinking", text: ok ? "เยี่ยม! ต่อด้วยโจทย์โบนัส: แรงดัน <b>ระหว่างสองจุด</b>" : "เกือบแล้ว! ลองดูตัวเลข V ของแต่ละอันอีกครั้ง" }]);
      if (ok && !bonus.childNodes.length) showBonus();
    }
    function showBonus() {
      const q = (question, options, explain) => ui.predict({ question, inline: true, options, explain });
      bonus.append(
        h("h3", { style: { margin: "4px 0 0" } }, "โบนัส: แรงดันระหว่างสองจุด"),
        q("จุด A = 5V และจุด B = 3.3V (เทียบกับ GND) — แรงดันระหว่าง A กับ B เท่ากับเท่าไร?",
          [{ label: "8.3 V", correct: false }, { label: "1.7 V", correct: true }, { label: "5 V", correct: false }],
          "แรงดันระหว่างสองจุด = <b>ผลต่าง</b>: 5 − 3.3 = <b>1.7 V</b>").el,
        q("จุด A = 3.3V และจุด B = 3.3V — แรงดันระหว่าง A กับ B เท่ากับเท่าไร?",
          [{ label: "6.6 V", correct: false }, { label: "3.3 V", correct: false }, { label: "0 V", correct: true }],
          "สองจุดอยู่ระดับเดียวกัน → <b>ไม่มีความต่าง = 0 V</b> (เหมือนถังน้ำที่ระดับเท่ากัน น้ำไม่ไหล)").el);
    }
    render();
    ctx.registerReset(() => { picked = []; fb.innerHTML = ""; bonus.innerHTML = ""; render(); });
    wrap.append(
      EFZ.sim.frame({ title: "เรียงลำดับแรงดัน จากต่ำไปสูง", badge: "CHALLENGE", hint: "แตะอุปกรณ์ตามลำดับ", stage: h("div", { class: "rank-stage" }, slots, pool) }),
      fb, bonus);
    el.appendChild(wrap);
  }

  /* =========================================================
     STEP 10 — QUICK CHECK
     ========================================================= */
  function renderQuiz(el, ctx) {
    const q = ui.quiz({
      questions: [
        {
          q: "ข้อใดอธิบาย “แรงดันไฟฟ้า (Voltage)” ได้ถูกต้องที่สุด?",
          choices: ["ปริมาณไฟฟ้าที่เก็บอยู่ในแบตเตอรี่", "ความต่างศักย์ไฟฟ้าระหว่างสองจุด ที่ผลักให้ประจุเคลื่อนที่", "ความเร็วของอิเล็กตรอนในสายไฟ"],
          answer: 1,
          explain: "Voltage คือ <b>ความต่างศักย์ระหว่างสองจุด</b> — เปรียบเหมือนความต่างของระดับน้ำที่ผลักให้น้ำไหล",
        },
        {
          q: "แรงดันไฟฟ้าใช้หน่วยอะไร?",
          choices: ["แอมแปร์ (A)", "โอห์ม (Ω)", "โวลต์ (V)"],
          answer: 2,
          explain: "หน่วยของแรงดันคือ <b>โวลต์ (Volt, V)</b> — ส่วน A คือหน่วยของกระแส และ Ω คือหน่วยของความต้านทาน (บทที่ 03–04)",
        },
        {
          q: "จุด A = 5V และจุด B = 5V (เทียบกับ GND) แรงดันระหว่าง A กับ B เท่ากับเท่าไร?",
          choices: ["10 V", "5 V", "0 V"],
          answer: 2,
          explain: "สองจุดสูงเท่ากัน จึง <b>ไม่มีความต่าง</b> → แรงดันระหว่างกัน = <b>0 V</b>",
        },
      ],
      onFinish: (score, total) => {
        ctx.setQuiz(score, total);
        ctx.say(score === total
          ? [{ pose: "happy", text: `เต็ม ${total}/${total}! เข้าใจเรื่องแรงดันแล้ว` }]
          : [{ pose: "explain", text: `ได้ ${score}/${total} — อ่านคำอธิบายแล้วกด <b>TRY AGAIN</b> ได้เลย` }]);
      },
    });
    ctx.registerReset(() => q.reset());
    el.append(q.el);
  }

  /* =========================================================
     STEP 11 — SUMMARY
     ========================================================= */
  function renderSummary(el, ctx) {
    ctx.complete();
    const next = EFZ.nextLessonMeta("02");
    const quiz = EFZ.store.lesson("02").quiz;
    const glossary = [["Voltage", "แรงดันไฟฟ้า"], ["Potential Difference", "ความต่างศักย์"], ["Volt (V)", "หน่วยของแรงดัน"], ["Reference point / GND", "จุดอ้างอิง 0V"], ["Forward Voltage", "แรงดันขั้นต่ำที่ LED เริ่มติด"]];
    el.append(
      h("div", { class: "summary-banner" },
        h("div", null,
          h("div", { class: "summary-banner__kicker" }, "LESSON 02 COMPLETE"),
          h("div", { class: "summary-banner__title" }, "Voltage = แรงผลักประจุ ที่วัดระหว่างสองจุด"),
          quiz ? h("div", { class: "summary-banner__score" }, "Quick Check: " + quiz.score + "/" + quiz.total) : null),
        h("div", { class: "summary-banner__icon" }, h("span", { class: "en", style: { fontSize: "1.6rem", color: "#fff" } }, "V"))),
      ui.keyPoints([
        "<b>Voltage (แรงดันไฟฟ้า)</b> คือ <b>ความต่างศักย์</b> ระหว่าง <b>2 จุด</b> — แรงที่ผลักประจุให้เคลื่อนที่",
        "หน่วยคือ <b>โวลต์ (V)</b>: ถ่าน AA ≈ <b>1.5V</b> · ESP32 ลอจิก = <b>3.3V</b> · USB = <b>5V</b>",
        "สองจุดที่ระดับเท่ากัน → แรงดันระหว่างกัน = <b>0V</b> (เหมือนถังน้ำที่ระดับเท่ากัน)",
        "แรงดันมากขึ้น (ตัวต้านทานเท่าเดิม) → ประจุถูกผลักให้ไหลได้มากขึ้น",
        "LED ต้องการแรงดันขั้นต่ำ (<b>Forward Voltage</b>) — 1.5V ไม่พอสำหรับ LED สีแดง",
        "แรงดัน <b>ไม่ใช่</b> ปริมาณไฟฟ้า — ถ่านใหญ่หรือเล็กก็ 1.5V เท่ากัน",
      ]),
      h("div", { class: "card card--flat" },
        h("div", { class: "card__title" }, EFZ.icon("book"), "คำศัพท์ในบทนี้"),
        h("div", { class: "glossary" }, glossary.map(([en, th]) => h("span", { class: "gloss" }, h("b", { class: "en" }, en), h("span", null, th))))),
      next ? h("div", { class: "next-card" },
        h("div", null,
          h("div", { class: "next-card__kicker" }, "บทถัดไป · " + next.minutes + " นาที"),
          h("div", { class: "next-card__title" }, "บทที่ " + next.id + ": " + next.title),
          h("p", { class: "muted", style: { margin: 0 } }, "ถ้าแรงดันคือ “แรงผลัก” แล้ว “ปริมาณที่ไหล” คืออะไร? รู้จัก Ampere และ mA")),
        h("div", { class: "btn-row" },
          ui.button("ทบทวนบทนี้", { icon: "replay", onClick: () => { location.hash = "#/lesson/02/1"; } }),
          ui.button("NEXT LESSON · บทถัดไป", { variant: "go", size: "lg", icon: "next", iconRight: true, onClick: () => ctx.nextLesson() }))) : null);
  }

  /* =========================================================
     Lesson definition
     ========================================================= */
  EFZ.registerLesson({
    id: "02",
    title: "Voltage (V) คืออะไร",
    minutes: 8,
    steps: [
      { phase: "hook", time: "0.5", title: "ตัวเลข V บนแบตเตอรี่บอกอะไร?", lead: "ถ่าน AA, บอร์ด ESP32 และพอร์ต USB ต่างก็มีตัวเลขหน่วย V",
        ta: [{ pose: "neutral", text: "ยินดีต้อนรับสู่ <b>บทที่ 02</b>! บทที่แล้วเรารู้ว่าไฟฟ้าต้องการเส้นทางครบรอบ" }, { pose: "point", text: "แตะการ์ดทั้ง 3 ใบ เพื่อดูตัวเลขที่เขียนอยู่บนอุปกรณ์" }],
        render: renderHook },
      { phase: "concept", time: "1", title: "แรงดัน = ความต่างระหว่างสองจุด", lead: "Voltage ไม่ได้อยู่ที่จุดเดียว — มันคือ “ความต่าง” เสมอ",
        ta: [{ pose: "explain", text: "แรงดันไฟฟ้า (Voltage) คือ <b>ความต่างศักย์</b> ระหว่างสองจุด" }, { pose: "point", text: "ลองเลื่อนระดับของจุด A และ B แล้วดูตัวเลขตรงกลาง" }],
        render: renderConcept },
      { phase: "analogy", time: "1", title: "ถังน้ำสองใบ", lead: "น้ำไหลเพราะ “ระดับต่างกัน” — ไม่ใช่เพราะน้ำเยอะ",
        ta: [{ pose: "explain", text: "ลองนึกถึงถังน้ำสองใบที่ต่อท่อถึงกัน" }, { pose: "point", text: "เลื่อนระดับน้ำ แล้วดูว่ากังหันในท่อหมุนเร็วหรือช้า" }],
        render: renderAnalogy },
      { phase: "technical", time: "1", title: "วัดแรงดัน “ระหว่าง” สองจุด", lead: "จากระดับน้ำ สู่แรงดันไฟฟ้าจริงในถ่าน AA สองก้อน",
        ta: [{ pose: "multimeter", text: "เครื่องวัดแรงดันมีสาย <b>2 เส้น</b> — แดงและดำ เพราะต้องวัดระหว่างสองจุด" }, { pose: "point", text: "เลือกจุดให้สายแดงและสายดำ แล้วทำภารกิจให้ครบ" }],
        render: renderTechnical },
      { phase: "simulation", time: "1", title: "1.5V · 3.3V · 5V", lead: "เพิ่มแรงดัน = เพิ่มแรงผลัก",
        ta: [{ pose: "explain", text: "นี่คือแหล่งจ่ายไฟ DC ต่อกับตัวต้านทาน ตอนนี้ตั้งไว้ที่ <b>1.5V</b>" }, { pose: "thinking", text: "ก่อนเพิ่มแรงดัน ลองทายก่อน: <b>คิดว่าจะเกิดอะไรขึ้น?</b>" }],
        render: renderSimulation },
      { phase: "hardware", time: "0.5", title: "สเกลแรงดันรอบตัวเรา", lead: "1.5V · 3.3V · 5V — แต่ละค่าพบได้ที่ไหน?",
        ta: [{ pose: "point", text: "แตะป้ายบนสเกลทีละอัน เพื่อดูว่าแรงดันแต่ละค่าอยู่ที่ไหน" }],
        render: renderHardware },
      { phase: "whatif", time: "1", title: "ถ้าเปลี่ยนแรงดันที่จ่ายให้ LED?", lead: "1.5V, 3.3V หรือ 5V — LED จะเป็นอย่างไร?",
        ta: [{ pose: "thinking", text: "ถ้าเปลี่ยนแรงดันที่จ่ายให้ LED ผลจะเหมือนกันไหมนะ?" }, { pose: "point", text: "เลือกแรงดัน → <b>ทายก่อน</b> → แล้วดูผล" }],
        render: renderWhatIf },
      { phase: "mistake", time: "0.5", title: "ถ่านก้อนใหญ่ แรงดันสูงกว่า?", lead: "ความเข้าใจผิดเรื่องแรงดันที่พบบ่อยที่สุด",
        ta: [{ pose: "warning", text: "หลายคนคิดว่าถ่านก้อนใหญ่ = แรงดันมากกว่า — จริงหรือ?" }],
        render: renderMistake },
      { phase: "challenge", time: "1", title: "ภารกิจ: อันไหนแรงดันสูงกว่า?", lead: "เรียงลำดับแรงดัน แล้วลองโจทย์โบนัส",
        ta: [{ pose: "point", text: "แตะอุปกรณ์ตามลำดับ จาก <b>แรงดันต่ำสุด</b> ไป <b>สูงสุด</b>" }],
        render: renderChallenge },
      { phase: "quiz", time: "0.5", title: "Quick Check — 3 ข้อ", lead: "ทบทวนความเข้าใจ ไม่ใช่การท่องจำ",
        ta: [{ pose: "thinking", text: "มาทบทวนเรื่องแรงดันกัน 3 ข้อ" }],
        render: renderQuiz },
      { phase: "summary", time: "0.5", title: "สรุปบทที่ 02", lead: "สิ่งที่ต้องจำจากบทนี้",
        ta: [{ pose: "summary", text: "เยี่ยมมาก! จบบทที่ 02 แล้ว" }, { pose: "explain", text: "จำไว้: <b>แรงดันวัดระหว่างสองจุดเสมอ</b>" }, { pose: "point", text: "บทต่อไป: ถ้าแรงดันคือแรงผลัก แล้ว “ปริมาณการไหล” ล่ะ? — <b>Current</b>" }],
        render: renderSummary },
    ],
  });
})();
