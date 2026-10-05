/* =========================================================
   Reusable UI building blocks used by every lesson.
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});
  const { h } = EFZ.util;
  const icon = (n) => EFZ.icon(n);
  const KEYS = ["A", "B", "C", "D", "E", "F"];

  function toNode(content) {
    if (content === undefined || content === null) return null;
    if (content instanceof Node) return content;
    return h("div", { html: String(content) });
  }

  function button(label, opts = {}) {
    const b = h("button", {
      type: "button",
      class: ["btn", opts.variant && "btn--" + opts.variant, opts.size && "btn--" + opts.size, opts.class],
      onClick: opts.onClick,
      title: opts.title,
      "aria-label": opts.ariaLabel,
    });
    if (opts.icon && opts.iconRight !== true) b.appendChild(icon(opts.icon));
    if (label instanceof Node) b.appendChild(label); else if (label) b.appendChild(h("span", null, label));
    if (opts.icon && opts.iconRight === true) b.appendChild(icon(opts.icon));
    if (opts.disabled) b.disabled = true;
    return b;
  }

  function tag(text, tone, iconName) {
    return h("span", { class: ["tag", tone && "tag--" + tone] }, iconName ? icon(iconName) : null, text);
  }

  const CALLOUT_ICONS = { info: "info", tip: "bulb", safe: "shield", warn: "warn", danger: "warn" };
  function callout(type, title, body) {
    return h("div", { class: ["callout", type !== "info" && "callout--" + type], role: type === "danger" ? "alert" : null },
      h("div", { class: "callout__icon" }, icon(CALLOUT_ICONS[type] || "info")),
      h("div", null,
        title ? h("div", { class: "callout__title" }, title) : null,
        h("div", { class: "callout__body" }, toNode(body))));
  }

  /** Segmented toggle. options: [{value, label, tone}] */
  function segmented(options, value, onChange, opts = {}) {
    const el = h("div", { class: ["seg", opts.size === "lg" && "seg--lg"], role: "group", "aria-label": opts.label || null });
    let current = value;
    const buttons = options.map((o) => {
      const b = h("button", {
        type: "button", class: ["seg__btn", o.tone && "tone-" + o.tone],
        "aria-pressed": String(o.value === current),
        onClick: () => api.set(o.value, true),
      }, o.label);
      el.appendChild(b);
      return b;
    });
    const api = {
      el,
      get value() { return current; },
      set(v, fromUser) {
        current = v;
        buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(options[i].value === v)));
        if (fromUser && onChange) onChange(v);
      },
    };
    return api;
  }

  function slider({ label, min, max, step = 1, value, format = (v) => v, onInput }) {
    const out = h("span", { class: "slider__value" }, format(value));
    const input = h("input", { type: "range", min, max, step, value, "aria-label": label });
    input.addEventListener("input", () => {
      const v = parseFloat(input.value);
      out.textContent = format(v);
      if (onInput) onInput(v);
    });
    const el = h("label", { class: "slider" }, h("span", { class: "slider__head" }, h("span", null, label), out), input);
    return {
      el,
      set(v) { input.value = v; out.textContent = format(v); },
      get value() { return parseFloat(input.value); },
    };
  }

  function feedback(kind, title, body) {
    const ic = kind === "good" ? "check" : kind === "bad" ? "x" : "info";
    return h("div", { class: "feedback feedback--" + kind, role: "status" },
      h("div", { class: "feedback__title" }, icon(ic), title),
      body ? toNode(body) : null);
  }

  /**
   * Prediction card — "คิดว่าจะเกิดอะไรขึ้น?"
   * Learner must commit to an answer before the result is shown.
   */
  function predict(opts) {
    const el = h("div", { class: "predict" });
    let answered = false;
    function render() {
      el.innerHTML = "";
      answered = false;
      el.appendChild(h("div", { class: "predict__q" }, icon("question"), h("span", null, opts.question || "คิดว่าจะเกิดอะไรขึ้น?")));
      if (opts.context) el.appendChild(h("div", { class: "muted", style: { marginTop: "-6px", marginBottom: "10px", fontSize: "var(--fs-sm)" } }, toNode(opts.context)));
      const list = h("div", { class: ["predict__opts", opts.inline && "is-inline"] });
      const btns = opts.options.map((o, i) => {
        const b = h("button", { type: "button", class: "choice", onClick: () => choose(i) },
          h("span", { class: "choice__key" }, KEYS[i]), h("span", null, o.label));
        list.appendChild(b);
        return b;
      });
      el.appendChild(list);

      function choose(i) {
        if (answered) return;
        answered = true;
        const o = opts.options[i];
        const judged = opts.options.some((x) => x.correct !== undefined);
        btns.forEach((b, j) => {
          b.disabled = true;
          const oj = opts.options[j];
          if (judged) {
            if (oj.correct) b.classList.add("is-correct");
            else if (j === i) b.classList.add("is-wrong");
            else b.classList.add("is-dim");
          } else {
            b.classList.add(j === i ? "is-picked" : "is-dim");
          }
        });
        const isCorrect = judged ? !!o.correct : null;
        const body = h("div");
        if (o.feedback) body.appendChild(toNode(o.feedback));
        if (opts.explain) body.appendChild(toNode(typeof opts.explain === "function" ? opts.explain(o, isCorrect) : opts.explain));
        let fb;
        if (!judged) fb = feedback("info", opts.revealTitle || "บันทึกคำตอบแล้ว — มาดูผลกัน!", body);
        else if (isCorrect) fb = feedback("good", opts.correctTitle || "ถูกต้อง!", body);
        else fb = feedback("bad", opts.wrongTitle || "ยังไม่ใช่ — ลองดูเหตุผลนี้", body);
        el.appendChild(fb);
        if (opts.allowRetry !== false && (judged ? !isCorrect || opts.alwaysRetry : opts.alwaysRetry)) {
          el.appendChild(h("div", { class: "btn-row", style: { marginTop: "10px" } },
            button("TRY AGAIN · ลองใหม่", { icon: "replay", size: "sm", onClick: () => { render(); if (opts.onReset) opts.onReset(); } })));
        }
        if (opts.onAnswer) opts.onAnswer(o, isCorrect, i);
      }
    }
    render();
    return { el, reset: render, get answered() { return answered; } };
  }

  /** 3-question Quick Check with explanations, retry and score. */
  function quiz({ questions, onFinish, title }) {
    const el = h("div", { class: "quiz card" });
    let idx = 0;
    let results = [];

    function renderQuestion() {
      el.innerHTML = "";
      const q = questions[idx];
      const dots = h("div", { class: "quiz__dots", "aria-hidden": "true" },
        questions.map((_, i) => h("span", { class: ["quiz__dot", i === idx && "is-current", results[i] === true && "is-good", results[i] === false && "is-bad"] })));
      el.appendChild(h("div", { class: "quiz__top" }, tag((title || "QUICK CHECK") + " · ข้อ " + (idx + 1) + "/" + questions.length, "green", "check"), dots));
      el.appendChild(h("div", { class: "quiz__q" }, q.q));
      if (q.figure) el.appendChild(toNode(q.figure));
      const list = h("div", { class: "predict__opts" });
      let locked = false;
      const btns = q.choices.map((c, i) => {
        const b = h("button", { type: "button", class: "choice", onClick: () => pick(i) },
          h("span", { class: "choice__key" }, KEYS[i]), h("span", null, c));
        list.appendChild(b);
        return b;
      });
      el.appendChild(list);
      function pick(i) {
        if (locked) return;
        locked = true;
        const ok = i === q.answer;
        results[idx] = ok;
        btns.forEach((b, j) => {
          b.disabled = true;
          if (j === q.answer) b.classList.add("is-correct");
          else if (j === i) b.classList.add("is-wrong");
          else b.classList.add("is-dim");
        });
        el.appendChild(feedback(ok ? "good" : "bad", ok ? "ถูกต้อง!" : "ยังไม่ถูก — คำตอบที่ถูกคือ " + KEYS[q.answer], q.explain));
        const last = idx === questions.length - 1;
        el.appendChild(h("div", { class: "btn-row" },
          button(last ? "ดูผลคะแนน" : "ข้อต่อไป", { variant: "primary", icon: "next", iconRight: true, onClick: () => { if (last) renderResult(); else { idx++; renderQuestion(); } } })));
        if (q.onAnswer) q.onAnswer(ok);
      }
    }

    function renderResult() {
      const score = results.filter(Boolean).length;
      el.innerHTML = "";
      const perfect = score === questions.length;
      el.appendChild(h("div", { class: "quiz__result" },
        tag("ผลการทำ QUICK CHECK", perfect ? "green" : "orange"),
        h("div", { class: "quiz__score" }, score + " / " + questions.length),
        h("p", { class: "muted" }, perfect ? "ยอดเยี่ยม! เข้าใจครบทุกข้อแล้ว" : "ไม่เป็นไร — ลองอ่านคำอธิบายแล้วทำใหม่อีกครั้งได้เลย"),
        h("div", { class: "btn-row", style: { justifyContent: "center" } },
          button("TRY AGAIN · ทำใหม่", { icon: "replay", onClick: restart }))));
      if (onFinish) onFinish(score, questions.length);
    }

    function restart() { idx = 0; results = []; renderQuestion(); }
    renderQuestion();
    return { el, reset: restart };
  }

  function keyPoints(items) {
    return h("ol", { class: "keypoints" }, items.map((t, i) => h("li", null, h("span", { class: "kp-n" }, i + 1), h("div", { html: t }))));
  }

  /** Myth → fact card that flips on click / Enter. */
  function flipCard({ front, back, frontTitle = "ความเข้าใจผิด", backTitle = "ความจริง" }) {
    const el = h("button", { type: "button", class: "flip", "aria-pressed": "false" },
      h("div", { class: "flip__inner" },
        h("div", { class: "flip__face flip__front" },
          tag(frontTitle, "red", "x"), toNode(front),
          h("span", { class: "flip__hint" }, icon("replay"), "แตะเพื่อดูความจริง")),
        h("div", { class: "flip__face flip__back" },
          tag(backTitle, "green", "check"), toNode(back),
          h("span", { class: "flip__hint" }, icon("replay"), "แตะเพื่อพลิกกลับ"))));
    el.addEventListener("click", () => {
      const on = el.classList.toggle("is-flipped");
      el.setAttribute("aria-pressed", String(on));
    });
    return el;
  }

  function readout(label, value, tone) {
    const val = h("div", { class: "readout__value" }, h("span", { class: "dot" }), h("span", null, value));
    const el = h("div", { class: ["readout", tone && "is-" + tone] }, h("div", { class: "readout__label" }, label), val);
    return {
      el,
      set(v, t) {
        val.lastChild.textContent = v;
        el.className = "readout" + (t ? " is-" + t : "");
      },
    };
  }

  EFZ.ui = { button, tag, callout, segmented, slider, feedback, predict, quiz, keyPoints, flipCard, readout, toNode };
})();
