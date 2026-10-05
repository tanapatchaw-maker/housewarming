/* =========================================================
   Lesson kit — small visual helpers shared by several lessons
   (status chips, legends, view toggle, analog gauge, DC supply).
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});
  const { h, s, svgFrag } = EFZ.util;

  /** Big LED ON / OFF chip. level: optional "dim" | "bright" text suffix */
  function ledState(on, label) {
    return h("span", { class: "big-state " + (on ? "big-state--on" : "big-state--off") },
      h("span", { class: "lamp" }), label || (on ? "LED ON" : "LED OFF"));
  }

  function flowLegend() {
    return h("div", { class: "legend" },
      h("span", { class: "legend__item" }, h("span", { class: "legend__swatch", style: { background: "var(--c-electron)" } }), "อิเล็กตรอน (−)"),
      h("span", { class: "legend__item" }, h("span", { class: "legend__swatch", style: { background: "var(--c-current)", borderRadius: "3px" } }), "ลูกศร = Conventional Current"));
  }

  function viewToggle(c) {
    return EFZ.ui.segmented([
      { value: "real", label: "ของจริง" },
      { value: "symbol", label: "สัญลักษณ์วงจร" },
    ], c.style, (v) => c.setStyle(v), { label: "มุมมอง" });
  }

  /**
   * Semicircular analog gauge. Returns {el, set(value)}.
   * opts: {min, max, unit, ticks:[values], label, zones:[{from,to,cls}]}
   */
  function gauge(opts) {
    const { min = 0, max = 5, unit = "V", ticks = [0, 1, 2, 3, 4, 5], label = "" } = opts;
    const CX = 120, CY = 120, R = 92;
    const ang = (v) => Math.PI + ((v - min) / (max - min)) * Math.PI; // left → right
    const pt = (v, r) => [CX + r * Math.cos(ang(v)), CY + r * Math.sin(ang(v))];
    const svg = s("svg", { viewBox: "0 0 240 150", class: "gauge", role: "img", "aria-label": label });
    const arc = (a, b, r) => {
      const [x1, y1] = pt(a, r), [x2, y2] = pt(b, r);
      return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    };
    let markup = `<path d="${arc(min, max, R)}" class="gauge__track"/>`;
    (opts.zones || []).forEach((z) => { markup += `<path d="${arc(z.from, z.to, R)}" class="gauge__zone ${z.cls}"/>`; });
    ticks.forEach((t) => {
      const [x1, y1] = pt(t, R - 10), [x2, y2] = pt(t, R + 4), [tx, ty] = pt(t, R - 24);
      markup += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="gauge__tick"/>
        <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="gauge__num">${t}</text>`;
    });
    markup += `<text x="${CX}" y="${CY - 34}" class="gauge__unit">${unit}</text>`;
    svg.appendChild(svgFrag(markup));
    const needle = svgFrag(`<path d="M${CX - 4} ${CY} L${CX} ${CY - R + 14} L${CX + 4} ${CY} Z" class="gauge__needle"/><circle cx="${CX}" cy="${CY}" r="8" class="gauge__hub"/>`, { class: "gauge__rot" });
    needle.style.transformOrigin = `${CX}px ${CY}px`;
    svg.appendChild(needle);
    const val = s("text", { x: CX, y: CY + 26, class: "gauge__val" });
    svg.appendChild(val);
    return {
      el: svg,
      set(v, text) {
        const deg = ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 180 - 90;
        needle.style.transform = `rotate(${deg}deg)`;
        val.textContent = text != null ? text : v.toFixed(1) + " " + unit;
      },
    };
  }

  /**
   * Bench-style DC supply drawn into a circuit background group.
   * Box spans x..x+w, y..y+hgt; terminals sit on its right edge.
   * Returns {setValue(v)} to update the display.
   */
  function dcSupply(g, { x, y, w = 140, hgt = 150, plusY, minusY, title = "แหล่งจ่ายไฟ DC" }) {
    const right = x + w;
    g.appendChild(svgFrag(`
      <rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="12" class="dc-box"/>
      <text x="${x + w / 2}" y="${y + 22}" class="dc-title">${title}</text>
      <rect x="${x + 16}" y="${y + 34}" width="${w - 32}" height="46" rx="6" class="dc-screen"/>
      <circle cx="${right}" cy="${plusY}" r="9" class="dc-term dc-term--plus"/>
      <circle cx="${right}" cy="${minusY}" r="9" class="dc-term dc-term--minus"/>
      <text x="${right - 18}" y="${plusY + 1}" class="dc-pol dc-pol--plus">+</text>
      <text x="${right - 18}" y="${minusY + 1}" class="dc-pol dc-pol--minus">−</text>`));
    const txt = s("text", { x: x + w / 2, y: y + 58, class: "dc-value" });
    g.appendChild(txt);
    return { setValue(v) { txt.textContent = v.toFixed(1) + " V"; } };
  }

  EFZ.kit = { ledState, flowLegend, viewToggle, gauge, dcSupply };
})();
