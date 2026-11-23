import { useEffect, useRef } from "react";
import { drawPortrait, type Frame } from "../../src/shared/art";
import type { Emotion, PortraitSpec } from "../../src/shared/types";

/** Draws a portrait client-side with the same code the CLI uses. */
export function Portrait({ spec, emotion = "neutral", frame = "base", scale = 2, title }: { spec: PortraitSpec; emotion?: Emotion; frame?: Frame; scale?: number; title?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    try {
      const r = drawPortrait(spec, emotion, frame);
      c.width = r.width;
      c.height = r.height;
      const ctx = c.getContext("2d")!;
      ctx.putImageData(new ImageData(new Uint8ClampedArray(r.data), r.width, r.height), 0, 0);
    } catch {
      /* invalid spec while editing */
    }
  }, [spec, emotion, frame]);
  return <canvas ref={ref} className="portrait" title={title} style={{ width: 64 * scale, height: 64 * scale }} />;
}
