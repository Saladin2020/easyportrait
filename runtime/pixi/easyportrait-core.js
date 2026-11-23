/* Easy Portrait core — generated from src/shared/engine.ts by scripts/build-core.mjs. Do not edit. MIT. */
// src/shared/engine.ts
var TIMING = {
  /** Seconds between blinks before the per-character offset. */
  blinkEvery: 3.2,
  /** Extra seconds added per seed step (0..6) so a cast does not blink in sync. */
  blinkSpread: 0.35,
  blinkLength: 0.14,
  /** Mouth open/closed half-period while talking. */
  talkStep: 0.12
};
function seedOf(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 7;
}
function blinkPeriod(seed) {
  return TIMING.blinkEvery + seed * TIMING.blinkSpread;
}
function frameAt(t, seed, talking, emotion = "neutral") {
  const p = blinkPeriod(seed);
  const phase = ((t + seed * 0.53) % p + p) % p;
  if (emotion !== "sleepy" && phase > p - TIMING.blinkLength) return "blink";
  if (talking && Math.floor(t / TIMING.talkStep) % 2 === 0) return "talk";
  return "base";
}
var FRAME_INDEX = { base: 0, blink: 1, talk: 2 };
var EMOTION_ALIASES = {
  \u0E1B\u0E01\u0E15\u0E34: "neutral",
  \u0E40\u0E09\u0E22: "neutral",
  \u0E14\u0E35\u0E43\u0E08: "happy",
  \u0E22\u0E34\u0E49\u0E21: "happy",
  \u0E2A\u0E38\u0E02: "happy",
  \u0E40\u0E28\u0E23\u0E49\u0E32: "sad",
  \u0E40\u0E2A\u0E35\u0E22\u0E43\u0E08: "sad",
  \u0E15\u0E01\u0E43\u0E08: "surprised",
  \u0E41\u0E1B\u0E25\u0E01\u0E43\u0E08: "surprised",
  \u0E42\u0E01\u0E23\u0E18: "angry",
  \u0E42\u0E21\u0E42\u0E2B: "angry",
  \u0E04\u0E34\u0E14: "thinking",
  \u0E2A\u0E07\u0E2A\u0E31\u0E22: "thinking",
  \u0E40\u0E02\u0E34\u0E19: "shy",
  \u0E2D\u0E32\u0E22: "shy",
  \u0E01\u0E31\u0E07\u0E27\u0E25: "worried",
  \u0E2B\u0E48\u0E27\u0E07: "worried",
  \u0E07\u0E48\u0E27\u0E07: "sleepy",
  gembira: "happy",
  sedih: "sad",
  terkejut: "surprised",
  marah: "angry",
  fikir: "thinking",
  malu: "shy",
  risau: "worried",
  mengantuk: "sleepy",
  smile: "happy",
  joy: "happy",
  surprise: "surprised",
  mad: "angry",
  think: "thinking",
  embarrassed: "shy",
  worry: "worried",
  tired: "sleepy"
};
function normalizeEmotion(e) {
  const k = e.trim();
  return EMOTION_ALIASES[k] ?? EMOTION_ALIASES[k.toLowerCase()] ?? k.toLowerCase();
}
export {
  EMOTION_ALIASES,
  FRAME_INDEX,
  TIMING,
  blinkPeriod,
  frameAt,
  normalizeEmotion,
  seedOf
};
