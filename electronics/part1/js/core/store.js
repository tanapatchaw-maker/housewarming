/* =========================================================
   Progress store — per-learner, per-browser convenience only.
   Every access is guarded: private windows or blocked storage
   simply fall back to in-memory state.
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});
  const KEY = "efz.part1.progress.v1";
  let memory = { lessons: {} };

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) memory = Object.assign({ lessons: {} }, JSON.parse(raw));
    } catch (e) { /* storage unavailable — keep memory copy */ }
    return memory;
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(memory)); } catch (e) { /* ignore */ }
  }
  function lesson(id) {
    if (!memory.lessons[id]) memory.lessons[id] = { seen: [], lastStep: 0, completed: false, quiz: null };
    return memory.lessons[id];
  }

  const listeners = new Set();
  function emit() { listeners.forEach((fn) => fn(memory)); }

  EFZ.store = {
    load,
    lesson,
    markSeen(id, stepIndex) {
      const l = lesson(id);
      if (!l.seen.includes(stepIndex)) l.seen.push(stepIndex);
      l.lastStep = stepIndex;
      save(); emit();
    },
    setQuiz(id, score, total) {
      const l = lesson(id);
      l.quiz = { score, total, best: Math.max(score, (l.quiz && l.quiz.best) || 0) };
      save(); emit();
    },
    complete(id) { lesson(id).completed = true; save(); emit(); },
    isComplete(id) { return !!(memory.lessons[id] && memory.lessons[id].completed); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { memory = { lessons: {} }; save(); emit(); },
  };
  load();
})();
