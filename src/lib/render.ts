import { drawPortrait, emotionStrip, sheetRaster, type Frame } from "../shared/art.js";
import { EMOTIONS, type Emotion, type PortraitSpec } from "../shared/types.js";
import { normalizeEmotion } from "../shared/engine.js";
import { encodePng } from "./png.js";

export type RenderKind = "portrait" | "strip" | "sheet";

export function asEmotion(e: string | undefined): Emotion {
  const n = normalizeEmotion(e ?? "neutral");
  if (!(EMOTIONS as readonly string[]).includes(n)) throw new Error(`Unknown emotion "${e}" (${EMOTIONS.join(", ")}; Thai / Malay aliases work too)`);
  return n as Emotion;
}

/** PNG of one portrait (64×64 × scale), its base/blink/talk strip, or a sheet of specs × emotions. */
export function renderPng(specs: PortraitSpec[], o: { kind?: RenderKind; emotion?: string; emotions?: string[]; frame?: Frame; scale?: number; bg?: string } = {}): Buffer {
  const scale = Math.max(1, Math.min(8, Math.round(o.scale ?? 1)));
  const kind = o.kind ?? (specs.length > 1 ? "sheet" : "portrait");
  if (!specs.length) throw new Error("nothing to render");
  let r;
  if (kind === "sheet") r = sheetRaster(specs, o.emotions?.length ? o.emotions.map(asEmotion) : EMOTIONS, o.bg ?? "#2a1d13");
  else if (kind === "strip") r = emotionStrip(specs[0]!, asEmotion(o.emotion));
  else r = drawPortrait(specs[0]!, asEmotion(o.emotion), o.frame ?? "base");
  const s = scale > 1 ? r.scaled(scale) : r;
  return encodePng(s.width, s.height, s.data);
}
