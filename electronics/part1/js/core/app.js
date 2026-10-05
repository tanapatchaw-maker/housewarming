/* =========================================================
   App shell: hash router, sidebar navigation, home page and
   "coming soon" placeholder. Routes:
     #/                     → course home
     #/lesson/01            → lesson 01, resume step
     #/lesson/01/3          → lesson 01, step 3
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});
  const { h, pad2 } = EFZ.util;
  const ui = EFZ.ui;
  const course = EFZ.course;

  const view = document.getElementById("view");
  const nav = document.getElementById("nav");
  const meter = document.getElementById("course-meter");
  const meterText = document.getElementById("course-meter-text");
  let current = null; // mounted player

  /* ---------- sidebar ---------- */
  function lessonStatus(l) {
    if (EFZ.store.isComplete(l.id)) return "done";
    return EFZ.lessons[l.id] ? "ready" : "soon";
  }
  function renderNav(activeId) {
    nav.innerHTML = "";
    nav.appendChild(h("li", { class: "nav__home" },
      h("a", { class: ["nav__link", activeId === "home" && "is-active"], href: "#/" },
        h("span", { class: "nav__num", style: { background: "var(--navy-800)" } }, EFZ.icon("home")),
        h("span", { class: "nav__title" }, "หน้าหลักคอร์ส"), h("span"))));
    course.lessons.forEach((l) => {
      const st = lessonStatus(l);
      const isFinal = l.id === "final";
      nav.appendChild(h("li", null,
        h("a", {
          class: ["nav__link", activeId === l.id && "is-active", st === "soon" && "is-soon", st === "done" && "is-done"],
          href: "#/lesson/" + l.id,
          "aria-current": activeId === l.id ? "page" : null,
        },
          h("span", { class: ["nav__num", isFinal && "nav__num--final"] }, st === "done" ? EFZ.icon("check") : (l.short || l.id)),
          h("span", { class: "nav__title" }, l.title),
          h("span", { class: "nav__meta" }, st === "soon" ? EFZ.icon("lock") : null, l.minutes + "′"))));
    });
    const done = course.lessons.filter((l) => EFZ.store.isComplete(l.id)).length;
    meter.style.width = (done / course.lessons.length) * 100 + "%";
    meterText.textContent = "เรียนแล้ว " + done + "/" + course.lessons.length;
  }

  /* ---------- views ---------- */
  function renderHome() {
    const heroTA = EFZ.TA.create({ pose: "neutral", lines: ["สวัสดี! พร้อมเริ่มเรียนไฟฟ้าจากศูนย์กันหรือยัง?", "ไม่ต้องมีพื้นฐานเลย — เราจะเรียนทีละขั้นด้วยการลองเล่นจริง"] });
    const hero = h("section", { class: "hero" },
      h("div", null,
        h("span", { class: "part-badge" }, course.part),
        h("h1", null, course.title, h("br"), h("span", { style: { fontSize: "0.62em", fontWeight: 600 } }, "— " + course.subtitle)),
        h("p", { class: "hero__sub" }, "คอร์สสำหรับมือใหม่ที่ไม่มีพื้นฐานเลย เข้าใจไฟฟ้าให้ชัดก่อนเริ่มเขียนโปรแกรม ESP32"),
        h("div", { class: "hero__stats" },
          h("span", { class: "hero__stat" }, EFZ.icon("book"), "14 บทเรียน + Final Project"),
          h("span", { class: "hero__stat" }, EFZ.icon("clock"), "ประมาณ " + course.totalMinutes + " นาที (~2 ชั่วโมง)"),
          h("span", { class: "hero__stat" }, EFZ.icon("shield"), "ใช้ไฟ DC แรงดันต่ำเท่านั้น")),
        h("div", { class: "btn-row" },
          h("a", { class: "btn btn--go btn--lg", href: "#/lesson/01" }, EFZ.icon("play"), "เริ่มบทที่ 01"),
          h("button", { type: "button", class: "btn btn--lg", onClick: () => document.getElementById("goals").scrollIntoView({ behavior: "smooth" }), style: { background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.35)" } }, "ดูเป้าหมายคอร์ส"))),
      h("div", { class: "hero__ta" }, heroTA.el));

    const grid = h("div", { class: "lesson-grid" }, course.lessons.map((l) => {
      const st = lessonStatus(l);
      const statusTag = st === "done" ? ui.tag("เรียนแล้ว", "green", "check") : st === "ready" ? ui.tag("พร้อมเรียน", "blue", "play") : ui.tag("เร็ว ๆ นี้", null, "lock");
      return h("a", { class: ["lesson-card", st === "soon" && "is-soon"], href: "#/lesson/" + l.id },
        h("div", { class: "lesson-card__top" },
          h("span", { class: ["nav__num", l.id === "final" && "nav__num--final"], style: st === "soon" ? { background: "var(--ink-300)" } : null }, l.short || l.id),
          statusTag),
        h("div", { class: "lesson-card__title" }, l.title),
        h("div", { class: "lesson-card__foot" }, h("span", { style: { display: "inline-flex", gap: "4px", alignItems: "center" } }, EFZ.icon("clock"), l.minutes + " นาที")));
    }));

    const goals = h("ul", { class: "goals" }, course.goals.map((g) => h("li", null, EFZ.icon("check"), h("span", null, g))));

    view.innerHTML = "";
    view.append(
      hero,
      h("section", { class: "section" },
        h("div", { class: "section__head" }, h("h2", null, "บทเรียนใน Part 1"), h("span", { class: "muted" }, "แต่ละบทมี: ผู้ช่วยสอน · แอนิเมชัน · Simulation · ภารกิจ · แบบทดสอบ")),
        grid),
      h("section", { class: "section", id: "goals" },
        h("div", { class: "section__head" }, h("h2", null, "จบ Part 1 แล้วคุณจะทำได้")),
        h("div", { class: "card card--flat" }, goals)),
      h("section", { class: "section" },
        ui.callout("safe", "ความปลอดภัยมาก่อน", "การทดลองทั้งหมดใน Part 1 ใช้ <b>ไฟ DC แรงดันต่ำ</b> จาก USB / แบตเตอรี่เท่านั้น — <b>ห้ามทดลองกับไฟบ้าน 220V</b> และ Part 1 <b>ยังไม่มีการเขียนโปรแกรม</b>")),
      h("p", { class: "footer-note" }, "Electronics from ZERO · Part 1 — ภาพในคอร์สสร้างด้วย SVG เพื่อให้เคลื่อนไหวและโต้ตอบได้"));
    return heroTA;
  }

  function renderSoon(meta) {
    const ta = EFZ.TA.create({ pose: "laptop", lines: ["บท " + meta.title + " กำลังอยู่ระหว่างพัฒนา", "ระหว่างนี้ลองทบทวนบทที่เรียนไปแล้วก่อนได้เลย!"] });
    view.innerHTML = "";
    view.appendChild(h("section", { class: "soon" },
      h("span", { class: "lesson-num", style: { background: "var(--ink-300)" } }, meta.short || meta.id),
      h("h1", { style: { fontSize: "var(--fs-2xl)" } }, meta.title),
      ui.tag("เร็ว ๆ นี้ · " + meta.minutes + " นาที", null, "lock"),
      ta.el,
      h("div", { class: "btn-row", style: { justifyContent: "center" } },
        h("a", { class: "btn", href: "#/" }, EFZ.icon("home"), "หน้าหลัก"),
        h("a", { class: "btn btn--primary", href: "#/lesson/01" }, EFZ.icon("replay"), "ทบทวนบทที่ 01"))));
    return ta;
  }

  /* ---------- router ---------- */
  let softTA = null;
  function route() {
    document.body.classList.remove("nav-open");
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (parts[0] === "lesson" && parts[1]) {
      const id = parts[1];
      const meta = EFZ.lessonMeta(id);
      const lesson = EFZ.lessons[id];
      const stepNum = parts[2] ? parseInt(parts[2], 10) - 1 : null;
      renderNav(id);
      if (lesson) {
        if (current && current.lessonId === id) { current.show(stepNum == null ? 0 : stepNum); return; }
        teardown();
        const resume = stepNum == null ? 0 : stepNum;
        current = EFZ.player.mount(view, lesson, resume);
        document.title = "บทที่ " + id + " · " + lesson.title + " — Electronics from ZERO";
        window.scrollTo(0, 0);
        return;
      }
      teardown();
      if (meta) { softTA = renderSoon(meta); document.title = meta.title + " — Electronics from ZERO"; return; }
    }
    teardown();
    renderNav("home");
    softTA = renderHome();
    document.title = "Electronics from ZERO — Part 1";
    window.scrollTo(0, 0);
  }
  function teardown() {
    if (current) { current.destroy(); current = null; }
    if (softTA) { softTA.destroy(); softTA = null; }
  }

  window.addEventListener("hashchange", route);
  EFZ.store.onChange(() => {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    renderNav(parts[0] === "lesson" ? parts[1] : "home");
  });

  document.getElementById("menu-btn").addEventListener("click", () => document.body.classList.toggle("nav-open"));
  document.getElementById("scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));

  route();
})();
