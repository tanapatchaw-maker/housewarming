/* =========================================================
   Lesson player — runs any registered lesson.
   Owns: step rail, Teaching Assistant dock, stage, and the
   global controls (BACK · PAUSE · REPLAY · RESET SIMULATION · NEXT).
   Each step gets a fresh ctx and is fully torn down on leave,
   so lessons stay modular and leak-free.
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});
  const { h, disposer, pad2 } = EFZ.util;
  const ui = () => EFZ.ui;

  function ctlButton(iconName, label, th, opts = {}) {
    const b = EFZ.ui.button(h("span", { class: "ctl-label" }, h("span", null, label), h("small", null, th)),
      { icon: iconName, variant: opts.variant, onClick: opts.onClick, title: th, class: opts.class, iconRight: opts.iconRight });
    b.setAttribute("aria-label", label + " " + th);
    return b;
  }

  function mount(container, lesson, startIndex) {
    const meta = EFZ.lessonMeta(lesson.id) || {};
    const steps = lesson.steps;
    let index = Math.max(0, Math.min(steps.length - 1, startIndex || 0));
    let stepDisposer = disposer();
    let resetters = [];
    let paused = false;
    const lessonState = {};

    /* ----- layout ----- */
    const rail = h("div", { class: "steps", role: "tablist", "aria-label": "ขั้นตอนของบทเรียน" });
    const head = h("header", { class: "lesson-head" },
      h("div", { class: "lesson-head__row" },
        h("span", { class: "lesson-num" }, lesson.id),
        h("h1", null, lesson.title),
        h("div", { class: "lesson-head__meta" },
          ui().tag(lesson.minutes + " นาที", "navy", "clock"),
          ui().tag(steps.length + " ขั้นตอน", null, "flag"))),
      rail);

    const ta = EFZ.TA.create({ pose: "neutral" });
    const taDock = h("aside", { class: "ta-dock", "aria-label": "ผู้ช่วยสอน" }, ta.el);
    const stepHead = h("div", { class: "step-head" });
    const stepContent = h("div", { class: "step-content" });
    const stage = h("div", { class: "stage" }, stepHead, stepContent);
    const body = h("div", { class: "lesson-body" }, taDock, stage);

    const backBtn = ctlButton("back", "BACK", "ย้อนกลับ", { onClick: () => go(index - 1) });
    const pauseBtn = ctlButton("pause", "PAUSE", "หยุดชั่วคราว", { onClick: togglePause });
    const replayBtn = ctlButton("replay", "REPLAY", "เล่นขั้นนี้ใหม่", { onClick: replay, class: "hide-xs" });
    const resetBtn = ctlButton("reset", "RESET", "รีเซ็ตการจำลอง", { onClick: resetSim, variant: "warn" });
    const count = h("span", { class: "controls__count" });
    const nextBtn = ctlButton("next", "NEXT", "ถัดไป", { onClick: () => next(), variant: "primary", iconRight: true });
    const controls = h("nav", { class: "controls", "aria-label": "ควบคุมบทเรียน" },
      backBtn, h("div", { class: "controls__mid" }, pauseBtn, replayBtn, resetBtn), count, nextBtn);

    const root = h("section", { class: "lesson" }, head, body, controls);
    container.innerHTML = "";
    container.appendChild(root);

    steps.forEach((st, i) => {
      const ph = EFZ.PHASES[st.phase] || { label: st.phase };
      rail.appendChild(h("button", { type: "button", class: "steps__item", role: "tab", title: st.title, onClick: () => go(i) },
        h("span", null, pad2(i + 1) + " " + ph.label), h("i")));
    });

    /* ----- step context ----- */
    function makeCtx() {
      const d = stepDisposer;
      return {
        lesson, index, lessonState, ta,
        say(lines, o) { ta.say(lines, o); },
        pose(p) { ta.setPose(p); },
        onCleanup(fn) { d.add(fn); },
        registerReset(fn) { resetters.push(fn); resetBtn.disabled = false; },
        loop(fn, o) { const l = EFZ.sim.loop(fn, o); d.add(() => l.destroy()); return l; },
        circuit(o) { const c = EFZ.sim.circuit(o); d.add(() => c.destroy()); return c; },
        timeout(fn, ms) { const t = setTimeout(fn, ms); d.add(() => clearTimeout(t)); return t; },
        next: () => next(),
        back: () => go(index - 1),
        complete() { EFZ.store.complete(lesson.id); },
        setQuiz(score, total) { EFZ.store.setQuiz(lesson.id, score, total); },
        nextLesson: () => goNextLesson(),
      };
    }

    function renderStep() {
      stepDisposer.run();
      stepDisposer = disposer();
      resetters = [];
      resetBtn.disabled = true;
      setPaused(false);

      const st = steps[index];
      const ph = EFZ.PHASES[st.phase] || { label: st.phase, th: "" };
      stepHead.innerHTML = "";
      stepHead.appendChild(h("div", { class: "step-head__phase" },
        h("span", { class: "tag phase--" + st.phase }, ph.label),
        h("span", { class: "muted", style: { fontSize: "var(--fs-xs)" } }, ph.th + (st.time ? " · ประมาณ " + st.time + " นาที" : ""))));
      stepHead.appendChild(h("h2", null, st.title));
      if (st.lead) stepHead.appendChild(h("p", { class: "step-head__lead", html: st.lead }));

      stepContent.innerHTML = "";
      // re-trigger entry animation
      stepContent.style.animation = "none"; void stepContent.offsetWidth; stepContent.style.animation = "";
      try {
        st.render(stepContent, makeCtx());
      } catch (e) {
        console.error(e);
        stepContent.appendChild(EFZ.ui.callout("danger", "เกิดข้อผิดพลาดในการแสดงขั้นตอนนี้", String(e && e.message)));
      }
      if (st.ta) ta.say(st.ta);

      [...rail.children].forEach((b, i) => {
        b.classList.toggle("is-current", i === index);
        b.setAttribute("aria-selected", String(i === index));
        b.classList.toggle("is-seen", EFZ.store.lesson(lesson.id).seen.includes(i) || i < index);
      });
      const cur = rail.children[index];
      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest", inline: "center" });

      backBtn.disabled = index === 0;
      const last = index === steps.length - 1;
      const nextMeta = EFZ.nextLessonMeta(lesson.id);
      nextBtn.querySelector(".ctl-label span").textContent = last ? "NEXT LESSON" : "NEXT";
      nextBtn.querySelector(".ctl-label small").textContent = last ? (nextMeta ? "บทถัดไป" : "กลับหน้าหลัก") : "ถัดไป";
      count.textContent = (index + 1) + " / " + steps.length;
      EFZ.store.markSeen(lesson.id, index);
    }

    function go(i) {
      if (i < 0 || i >= steps.length) return;
      const target = "#/lesson/" + lesson.id + "/" + (i + 1);
      if (location.hash !== target) location.hash = target; // router calls show()
      else show(i);
    }
    function show(i) {
      index = Math.max(0, Math.min(steps.length - 1, i));
      renderStep();
      const top = root.getBoundingClientRect().top + window.scrollY - 70;
      if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
    }
    function next() { if (index < steps.length - 1) go(index + 1); else goNextLesson(); }
    function goNextLesson() {
      const n = EFZ.nextLessonMeta(lesson.id);
      location.hash = n ? "#/lesson/" + n.id : "#/";
    }

    function setPaused(v) {
      paused = v;
      EFZ.sim.setPaused(v);
      document.body.classList.toggle("is-paused", v);
      if (v) ta.pause(); else ta.resume();
      pauseBtn.querySelector(".ctl-label span").textContent = v ? "PLAY" : "PAUSE";
      pauseBtn.querySelector(".ctl-label small").textContent = v ? "เล่นต่อ" : "หยุดชั่วคราว";
      const ic = pauseBtn.querySelector("svg");
      ic.replaceWith(EFZ.icon(v ? "play" : "pause"));
      pauseBtn.setAttribute("aria-pressed", String(v));
    }
    function togglePause() { setPaused(!paused); }
    function replay() { renderStep(); }
    function resetSim() { resetters.forEach((fn) => fn()); }

    function onKey(e) {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      else if (e.key === "p" || e.key === "P") togglePause();
    }
    document.addEventListener("keydown", onKey);

    renderStep();

    return {
      lessonId: lesson.id,
      show,
      destroy() {
        stepDisposer.run();
        ta.destroy();
        setPaused(false);
        document.removeEventListener("keydown", onKey);
      },
    };
  }

  EFZ.player = { mount };
})();
