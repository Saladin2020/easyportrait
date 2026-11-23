/**
 * Runtime animation timing shared by the CLI previews, the PixiJS runtime (bundled into easyportrait-core.js)
 * and the Godot runtime (ported in easy_portrait.gd and parity-tested). Pure and deterministic.
 */
import type { Frame } from "./art.js";

export const TIMING = {
  /** Seconds between blinks before the per-character offset. */
  blinkEvery: 3.2,
  /** Extra seconds added per seed step (0..6) so a cast does not blink in sync. */
  blinkSpread: 0.35,
  blinkLength: 0.14,
  /** Mouth open/closed half-period while talking. */
  talkStep: 0.12,
} as const;

/** FNV-1a over the id → 0..6, the character's blink offset step. */
export function seedOf(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 7;
}

export function blinkPeriod(seed: number): number {
  return TIMING.blinkEvery + seed * TIMING.blinkSpread;
}

/** Which frame shows at time t (seconds since the portrait appeared). Blink wins over the open mouth. */
export function frameAt(t: number, seed: number, talking: boolean, emotion = "neutral"): Frame {
  const p = blinkPeriod(seed);
  const phase = (((t + seed * 0.53) % p) + p) % p;
  if (emotion !== "sleepy" && phase > p - TIMING.blinkLength) return "blink";
  if (talking && Math.floor(t / TIMING.talkStep) % 2 === 0) return "talk";
  return "base";
}

export const FRAME_INDEX: Record<Frame, number> = { base: 0, blink: 1, talk: 2 };

/** Thai / Malay / English aliases → emotion names (matches Easy Dialogue). Unknown names pass through. */
export const EMOTION_ALIASES: Record<string, string> = {
  ปกติ: "neutral", เฉย: "neutral", ดีใจ: "happy", ยิ้ม: "happy", สุข: "happy", เศร้า: "sad", เสียใจ: "sad", ตกใจ: "surprised", แปลกใจ: "surprised",
  โกรธ: "angry", โมโห: "angry", คิด: "thinking", สงสัย: "thinking", เขิน: "shy", อาย: "shy", กังวล: "worried", ห่วง: "worried", ง่วง: "sleepy",
  gembira: "happy", sedih: "sad", terkejut: "surprised", marah: "angry", fikir: "thinking", malu: "shy", risau: "worried", mengantuk: "sleepy",
  smile: "happy", joy: "happy", surprise: "surprised", mad: "angry", think: "thinking", embarrassed: "shy", worry: "worried", tired: "sleepy",
};
export function normalizeEmotion(e: string): string {
  const k = e.trim();
  return EMOTION_ALIASES[k] ?? EMOTION_ALIASES[k.toLowerCase()] ?? k.toLowerCase();
}
