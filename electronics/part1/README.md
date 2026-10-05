# Electronics from ZERO — Part 1 (สิ่งที่ต้องรู้ก่อนจับ ESP32)

Interactive beginner course: Thai UI and narration, with technical terms kept in English. It's plain HTML/CSS/JS with no build step.

**Status:** course shell, design system, Teaching Assistant, simulation framework and **Lesson 01** are done. Lessons 02–14 and the Final Project show as "เร็ว ๆ นี้" (coming soon).

## Run

- Open `index.html` directly in a browser, **or**
- serve the folder: `npx http-server electronics/part1` → http://localhost:8080

Routes: `#/` (home), `#/lesson/01` and `#/lesson/01/5` (a specific step).
Keyboard: `←` / `→` move between steps, `P` pauses.

## Structure

```
index.html                  shell (top bar, sidebar, view)
css/tokens.css              design tokens (colours, type, spacing)
css/base.css                layout + responsive shell
css/components.css          buttons, callouts, predict, quiz, TA, sim frame
css/sim.css                 circuit engine graphics
css/lesson.css              lesson player, home, placeholder
js/core/util.js             DOM/SVG helpers, disposer, graphemes
js/core/store.js            progress (localStorage, safely guarded)
js/core/course.js           manifest (15 entries) + lesson registry + phases
js/core/player.js           lesson player + global controls
js/core/app.js              hash router, sidebar, home
js/components/icons.js      inline icon set
js/components/ui.js         segmented, slider, predict, quiz, flip card, readout…
js/components/assistant.js  Teaching Assistant (11 SVG poses + narration)
js/sim/framework.js         shared clock (global pause), path helper, sim frame
js/sim/circuit.js           circuit engine (real ⇄ symbol view, path check, particles)
lessons/lesson01/           Lesson 01 content, simulations, styles
```

## Adding a lesson

Create `lessons/lessonNN/lessonNN.js` and call `EFZ.registerLesson({ id, title, minutes, steps })`.
Each step is `{ phase, title, lead, time, ta: [{pose, text}], render(el, ctx) }`. `ctx` provides
`say`, `circuit`, `loop`, `timeout`, `registerReset`, `onCleanup`, `complete`, `setQuiz` and `nextLesson`.
Everything you create through `ctx` is torn down automatically when the step changes.
Add the `<script>` (and CSS, if any) to `index.html`.
