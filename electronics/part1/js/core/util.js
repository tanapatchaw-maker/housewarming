/* =========================================================
   Core utilities shared by every module.
   Plain scripts on a single global (EFZ) so the course runs
   straight from the file system — no build step, no server.
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});
  const SVG_NS = "http://www.w3.org/2000/svg";

  function applyAttrs(el, attrs, isSvg) {
    if (!attrs) return;
    for (const key of Object.keys(attrs)) {
      const val = attrs[key];
      if (val === undefined || val === null || val === false) continue;
      if (key === "class") el.setAttribute("class", Array.isArray(val) ? val.filter(Boolean).join(" ") : val);
      else if (key === "style" && typeof val === "object") Object.assign(el.style, val);
      else if (key === "dataset") Object.assign(el.dataset, val);
      else if (key === "html") el.innerHTML = val;
      else if (key === "text") el.textContent = val;
      else if (key.startsWith("on") && typeof val === "function") el.addEventListener(key.slice(2).toLowerCase(), val);
      else if (!isSvg && key in el && typeof val !== "string" && key !== "list") el[key] = val;
      else el.setAttribute(key, val === true ? "" : val);
    }
  }

  function append(el, children) {
    for (const child of children.flat(Infinity)) {
      if (child === null || child === undefined || child === false) continue;
      el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  /** h("div", {class:"x", onClick}, ...children) → HTMLElement */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    applyAttrs(el, attrs, false);
    return append(el, children);
  }

  /** s("circle", {cx, cy, r}) → SVGElement */
  function s(tag, attrs, ...children) {
    const el = document.createElementNS(SVG_NS, tag);
    applyAttrs(el, attrs, true);
    return append(el, children);
  }

  /** Parse an SVG fragment string into a <g>. */
  function svgFrag(markup, attrs) {
    const g = s("g", attrs);
    const tmp = document.createElementNS(SVG_NS, "svg");
    tmp.innerHTML = markup;
    while (tmp.firstChild) g.appendChild(tmp.firstChild);
    return g;
  }

  /** Collects cleanup callbacks so a lesson step can be torn down safely. */
  function disposer() {
    let fns = [];
    return {
      add(fn) { if (typeof fn === "function") fns.push(fn); return fn; },
      run() {
        const list = fns; fns = [];
        for (let i = list.length - 1; i >= 0; i--) { try { list[i](); } catch (e) { console.error(e); } }
      },
    };
  }

  function listen(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    return () => target.removeEventListener(type, fn, opts);
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mod = (n, m) => ((n % m) + m) % m;
  const reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad2 = (n) => String(n).padStart(2, "0");

  /** Split text into grapheme clusters so Thai vowels/tone marks never render detached. */
  function graphemes(text) {
    if (window.Intl && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text), (x) => x.segment);
    }
    return Array.from(text);
  }

  EFZ.util = { h, s, svgFrag, disposer, listen, clamp, lerp, mod, reducedMotion, pad2, graphemes, SVG_NS };
})();
