/* =========================================================
   Course manifest + lesson registry.
   Lessons register themselves with EFZ.registerLesson(def);
   anything not yet registered shows as "coming soon".
   ========================================================= */
(function () {
  "use strict";
  const EFZ = (window.EFZ = window.EFZ || {});

  EFZ.course = {
    title: "Electronics from ZERO",
    subtitle: "สิ่งที่ต้องรู้ก่อนจับ ESP32",
    part: "PART 1",
    totalMinutes: 126,
    goals: [
      "อธิบาย Electricity, Voltage, Current และ Resistance ได้",
      "เข้าใจ Ohm's Law",
      "เข้าใจกำลังไฟฟ้า (Power)",
      "เข้าใจความต่างพื้นฐานของ AC และ DC",
      "เข้าใจ Positive, Negative และ GND",
      "เข้าใจว่าทำไม ESP32 ใช้ลอจิก 3.3V",
      "เข้าใจว่าแรงดันเกินทำให้ ESP32 เสียหายได้อย่างไร",
      "แยก LED และตัวต้านทาน (Resistor) ได้",
      "เข้าใจขั้วของ LED (Polarity)",
      "เข้าใจการเชื่อมต่อภายในของ Breadboard",
      "เลือกสาย Jumper พื้นฐานได้",
      "เข้าใจวงจร Series และ Parallel เบื้องต้น",
      "ใช้มัลติมิเตอร์วัดค่าแรงดันต่ำพื้นฐานได้",
      "ต่อวงจร LED อย่างปลอดภัยด้วยไฟ 3.3V จาก ESP32",
    ],
    lessons: [
      { id: "01", title: "Electricity คืออะไร", minutes: 8 },
      { id: "02", title: "Voltage (V) คืออะไร", minutes: 8 },
      { id: "03", title: "Current (I) คืออะไร", minutes: 8 },
      { id: "04", title: "Resistance (R) คืออะไร", minutes: 8 },
      { id: "05", title: "Ohm's Law + Power", minutes: 10 },
      { id: "06", title: "AC vs DC", minutes: 7 },
      { id: "07", title: "Positive / Negative / GND", minutes: 7 },
      { id: "08", title: "ทำไม ESP32 ใช้ 3.3V", minutes: 8 },
      { id: "09", title: "ถ้าแรงดันสูงเกินจะเกิดอะไรขึ้น?", minutes: 7 },
      { id: "10", title: "Resistor + LED", minutes: 10 },
      { id: "11", title: "Breadboard", minutes: 10 },
      { id: "12", title: "Jumper Wires", minutes: 5 },
      { id: "13", title: "Series vs Parallel", minutes: 7 },
      { id: "14", title: "Multimeter เบื้องต้น", minutes: 8 },
      { id: "final", title: "Final Project + Failure Lab", minutes: 15, short: "FINAL" },
    ],
  };

  EFZ.lessons = {};
  EFZ.registerLesson = function (def) { EFZ.lessons[def.id] = def; };
  EFZ.lessonMeta = (id) => EFZ.course.lessons.find((l) => l.id === id);
  EFZ.nextLessonMeta = (id) => {
    const i = EFZ.course.lessons.findIndex((l) => l.id === id);
    return i >= 0 ? EFZ.course.lessons[i + 1] : null;
  };

  /** Standard 11-phase lesson flow → label + colour class */
  EFZ.PHASES = {
    hook: { label: "HOOK", th: "คำถามชวนคิด" },
    concept: { label: "CONCEPT", th: "แนวคิด" },
    analogy: { label: "VISUAL ANALOGY", th: "ภาพเปรียบเทียบ" },
    technical: { label: "TECHNICAL VIEW", th: "มุมมองทางเทคนิค" },
    simulation: { label: "SIMULATION", th: "ลองเล่นจำลอง" },
    hardware: { label: "REAL HARDWARE", th: "ของจริงรอบตัว" },
    whatif: { label: "WHAT IF?", th: "ถ้า…จะเป็นอย่างไร" },
    mistake: { label: "COMMON MISTAKE", th: "ข้อผิดพลาดที่พบบ่อย" },
    challenge: { label: "MINI CHALLENGE", th: "ภารกิจท้าทาย" },
    quiz: { label: "QUICK CHECK", th: "ทบทวน 3 ข้อ" },
    summary: { label: "SUMMARY", th: "สรุปบทเรียน" },
  };
})();
