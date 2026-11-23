/**
 * Easy Portrait art: 64×64 pixel bust portraits drawn from a PortraitSpec (pure, no I/O — the web editor runs it too).
 *   drawPortrait(spec, emotion, frame) → Raster     frame: "base" | "blink" | "talk"
 */
import { hex, Raster, shade, type RGBA } from "./raster.js";
import { COVERING, type Body, type Emotion, type PortraitSpec } from "./types.js";

export const SIZE = 64;
export const FRAMES = ["base", "blink", "talk"] as const;
export type Frame = (typeof FRAMES)[number];

const INK = "#24160f";
interface Geo {
  hx: number;
  hy: number;
  hw: number;
  hh: number;
  eyeY: number;
  mouthY: number;
  /** left eye iris x (2 px wide); right eye mirrors: 63 - x - 1 */
  lx: number;
  irisH: number;
  torso: Array<[number, number]>;
  neck: [number, number, number, number];
}

function geo(body: Body): Geo {
  switch (body) {
    case "child":
      return { hx: 18, hy: 13, hw: 28, hh: 28, eyeY: 28, mouthY: 35, lx: 25, irisH: 4, torso: [[12, 64], [13, 55], [18, 49], [26, 46], [38, 46], [46, 49], [51, 55], [52, 64]], neck: [28, 38, 8, 9] };
    case "elder":
      return { hx: 19, hy: 11, hw: 26, hh: 30, eyeY: 28, mouthY: 35, lx: 25, irisH: 2, torso: [[7, 64], [9, 53], [15, 47], [26, 44], [38, 44], [49, 47], [55, 53], [57, 64]], neck: [28, 37, 8, 9] };
    case "stocky":
      return { hx: 18, hy: 10, hw: 28, hh: 30, eyeY: 27, mouthY: 34, lx: 24, irisH: 3, torso: [[4, 64], [6, 52], [13, 45], [25, 42], [39, 42], [51, 45], [58, 52], [60, 64]], neck: [27, 36, 10, 9] };
    default:
      return { hx: 19, hy: 10, hw: 26, hh: 30, eyeY: 27, mouthY: 34, lx: 25, irisH: 3, torso: [[7, 64], [9, 52], [15, 46], [26, 43], [38, 43], [49, 46], [55, 52], [57, 64]], neck: [28, 36, 8, 9] };
  }
}

const inEllipse = (x: number, y: number, ex: number, ey: number, ew: number, eh: number) => {
  const cx = ex + ew / 2 - 0.5;
  const cy = ey + eh / 2 - 0.5;
  const dx = (x - cx) / (ew / 2);
  const dy = (y - cy) / (eh / 2);
  return dx * dx + dy * dy <= 1;
};
/** Set both a pixel and its mirror across the vertical centre line. */
const sym = (r: Raster, x: number, y: number, c: string | RGBA) => {
  r.set(x, y, c);
  r.set(63 - x, y, c);
};

// ------------------------------------------------------------------ head
function headMask(g: Geo): (x: number, y: number) => boolean {
  const { hx, hy, hw, hh, eyeY } = g;
  const jaw: Array<[number, number]> = [[hx + 0.5, eyeY - 2], [hx + 4, hy + hh - 4], [hx + hw / 2 - 4, hy + hh], [hx + hw / 2 + 4, hy + hh], [hx + hw - 4, hy + hh - 4], [hx + hw - 0.5, eyeY - 2]];
  const tmp = new Raster(SIZE, SIZE);
  tmp.ellipse(hx, hy, hw, hh - 5, "#ffffff");
  tmp.poly(jaw, "#ffffff");
  return (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE && tmp.get(x, y)[3] > 0;
}

function drawHead(r: Raster, g: Geo, s: PortraitSpec) {
  const skin = s.skin;
  const m = headMask(g);
  // ears
  r.ellipse(g.hx - 2, g.eyeY - 3, 5, 7, skin);
  r.ellipse(64 - g.hx - 3, g.eyeY - 3, 5, 7, skin);
  sym(r, g.hx - 1, g.eyeY - 1, shade(skin, -0.18));
  sym(r, g.hx - 1, g.eyeY, shade(skin, -0.18));
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (m(x, y)) r.set(x, y, skin);
  // jaw shadow on the right, cheek light on the left
  for (let y = g.eyeY; y < SIZE; y++)
    for (let x = 32; x < SIZE; x++) if (m(x, y) && !m(x + 1, y)) r.set(x, y, shade(skin, -0.12));
  for (let y = g.hy + 4; y < g.eyeY + 4; y++) for (let x = 0; x < 32; x++) if (m(x, y) && !m(x - 1, y)) r.set(x + 1, y, shade(skin, 0.1));
}

function drawNeckAndTorso(r: Raster, g: Geo, s: PortraitSpec) {
  const [nx, ny, nw, nh] = g.neck;
  r.rect(nx, ny, nw, nh, s.skin);
  r.rect(nx, ny, nw, 2, shade(s.skin, -0.25));
  drawShirt(r, g, s);
}

// ------------------------------------------------------------------ clothes
function drawShirt(r: Raster, g: Geo, s: PortraitSpec) {
  const c = s.shirtColor;
  const dark = shade(c, -0.25);
  const light = shade(c, 0.18);
  const acc = s.accent ?? "#e6c35c";
  const t = g.torso;
  const top = t[3]![1];
  const cx = 32;
  const body = () => r.poly(t, c);
  const folds = () => {
    for (let y = top + 6; y < 64; y++) {
      r.set(t[1]![0] + 4 + Math.floor((y - top) / 6), y, dark);
      r.set(63 - (t[1]![0] + 4 + Math.floor((y - top) / 6)), y, dark);
    }
    for (let x = t[2]![0] + 1; x < t[3]![0]; x++) r.set(x, top + 2 + Math.floor((t[3]![0] - x) / 4), light);
  };
  switch (s.shirt) {
    case "monk_robe": {
      r.poly(t, s.skin);
      const robe: Array<[number, number]> = [[t[0]![0], 64], [t[1]![0], t[1]![1]], [t[2]![0], t[2]![1]], [t[3]![0], t[3]![1]], [t[3]![0] + 6, top + 1], [42, top + 9], [50, 56], [53, 64]];
      r.poly(robe, c);
      for (let k = 0; k < 4; k++) r.line(t[3]![0] + 4 - k * 4, top + 3 + k * 2, 30 + k * 5, 64, dark);
      r.line(t[3]![0] + 6, top + 1, 53, 64, shade(c, -0.35));
      for (let y = top + 3; y < 60; y++) r.set(t[6]![0] - 4, y, shade(s.skin, -0.15));
      return;
    }
    case "tank": {
      r.poly(t, s.skin);
      r.poly([[t[0]![0] + 8, 64], [t[1]![0] + 8, t[1]![1] + 2], [22, top + 1], [25, top + 1], [cx - 4, top + 6], [cx + 3, top + 6], [38, top + 1], [41, top + 1], [63 - t[1]![0] - 8, t[1]![1] + 2], [63 - t[0]![0] - 8, 64]], c);
      return;
    }
    default:
      body();
  }
  folds();
  switch (s.shirt) {
    case "baju_melayu": {
      // stand collar (cekak musang) + placket with buttons
      r.rect(27, top - 1, 10, 3, c);
      r.rect(27, top - 1, 10, 1, light);
      r.line(cx, top + 2, cx, 64, dark);
      for (const y of [top + 4, top + 8, top + 12]) r.set(cx - 1, y, acc), r.set(cx - 1, y + 1, shade(acc, -0.3));
      break;
    }
    case "baju_kurung":
    case "dress": {
      r.ellipse(27, top - 2, 10, 7, s.skin);
      r.rect(27, top - 2, 10, 2, s.skin);
      for (let x = 26; x < 38; x++) if (!inEllipse(x, top + 1, 27, top - 2, 10, 7) && inEllipse(x, top, 26, top - 3, 12, 9)) r.set(x, top + 1, acc);
      for (let k = 0; k < 6; k++) r.set(14 + k * 7, top + 12 + (k % 2) * 5, shade(acc, 0.1));
      if (s.shirt === "dress") r.line(16, 60, 48, 60, acc);
      break;
    }
    case "jubah": {
      r.rect(28, top - 1, 8, 2, light);
      r.line(cx, top + 1, cx, 64, dark);
      r.line(cx - 1, top + 1, cx - 1, top + 10, light);
      break;
    }
    case "mohom": {
      // indigo farmer shirt: crossed V neck, chest pocket
      r.poly([[27, top - 1], [cx, top + 8], [37, top - 1]], s.skin);
      r.line(27, top - 1, cx, top + 8, light);
      r.line(37, top - 1, cx, top + 8, dark);
      r.frame(39, top + 8, 7, 6, dark);
      break;
    }
    case "farmer":
    case "tshirt":
    case "apron":
    case "armor": {
      r.ellipse(27, top - 3, 10, 6, s.skin);
      r.line(26, top + 1, 37, top + 1, dark);
      if (s.shirt === "farmer") {
        r.poly([[24, top], [cx - 1, top + 5], [27, top + 1]], light);
        r.poly([[40, top], [cx, top + 5], [37, top + 1]], light);
        r.frame(39, top + 8, 7, 6, dark);
        for (let y = top + 2; y < 64; y += 4) r.line(t[1]![0] + 2, y, 63 - t[1]![0] - 2, y, shade(c, -0.1));
      }
      if (s.shirt === "apron") {
        r.poly([[22, 64], [22, top + 9], [24, top + 6], [40, top + 6], [42, top + 9], [42, 64]], acc);
        r.line(24, top + 6, 20, top + 1, shade(acc, -0.3));
        r.line(40, top + 6, 44, top + 1, shade(acc, -0.3));
        r.frame(27, top + 13, 10, 6, shade(acc, -0.2));
      }
      if (s.shirt === "armor") {
        for (let y = top + 6; y < 64; y += 5) r.line(t[1]![0] + 1, y, 63 - t[1]![0] - 1, y, dark);
        r.ellipse(t[1]![0] - 1, t[2]![1] - 1, 12, 9, light);
        r.ellipse(63 - t[1]![0] - 10, t[2]![1] - 1, 12, 9, light);
        r.set(16, top + 8, "#ffffff");
      }
      break;
    }
    case "hoodie": {
      r.ellipse(18, top - 4, 28, 9, dark);
      r.ellipse(26, top - 3, 12, 6, s.skin);
      r.line(29, top + 4, 29, top + 12, light);
      r.line(34, top + 4, 34, top + 12, light);
      r.rect(22, 58, 20, 6, dark);
      break;
    }
    case "blazer":
    case "cardigan": {
      const inner = s.shirt === "blazer" ? "#f2eee6" : (s.accent ?? "#f2eee6");
      r.poly([[26, top - 1], [cx, top + 14], [38, top - 1]], inner);
      r.line(cx, top + 14, cx, 64, dark);
      r.poly([[25, top], [cx - 1, top + 14], [24, top + 10]], s.shirt === "blazer" ? dark : light);
      r.poly([[39, top], [cx, top + 14], [40, top + 10]], dark);
      if (s.shirt === "blazer") r.poly([[cx - 1, top + 2], [cx + 1, top + 2], [cx + 1, top + 10], [cx, top + 12], [cx - 1, top + 10]], acc);
      else for (const y of [top + 16, top + 20]) r.set(cx + 2, y, acc);
      break;
    }
  }
}

// ------------------------------------------------------------------ hair
function hairEdge(style: string, x: number, g: Geo): number {
  const base = g.hy + ({ crop: 7, messy: 9, spiky: 8, curly: 8, bob: 9, long: 9, ponytail: 7, bun: 6, twintails: 9, balding: 0, shaved: 6 } as Record<string, number>)[style]!;
  const rel = x - g.hx;
  switch (style) {
    case "messy":
      return base + [0, 1, 2, 1][rel % 4]! - (rel > g.hw / 2 ? 1 : 0);
    case "spiky":
      return base + [0, 2, 3, 1][rel % 4]!;
    case "curly":
      return base + [0, 1, 1, 0, -1][rel % 5]!;
    case "crop":
      return base + (rel > 6 && rel < 10 ? -2 : 0) + (rel < 3 || rel > g.hw - 3 ? 3 : 0);
    case "long":
    case "twintails":
      return base + (Math.abs(x - 31.5) < 2 ? -3 : 0) + (rel < 3 || rel > g.hw - 3 ? 4 : 0);
    case "bob":
      return base + (rel < 3 || rel > g.hw - 3 ? 6 : 0);
    case "ponytail":
      return base + Math.floor((g.hw - rel) / 6);
    default:
      return base;
  }
}

function drawHairBack(r: Raster, g: Geo, s: PortraitSpec) {
  const c = shade(s.hair, -0.12);
  const { hx, hy, hw, eyeY } = g;
  switch (s.hairStyle) {
    case "long":
      r.poly([[hx - 3, hy + 6], [hx - 4, 54], [hx + 6, 56], [hx + hw - 6, 56], [hx + hw + 4, 54], [hx + hw + 3, hy + 6]], c);
      r.ellipse(hx - 3, hy - 2, hw + 6, 22, c);
      break;
    case "bob":
      r.ellipse(hx - 3, hy - 2, hw + 6, eyeY - hy + 12, c);
      break;
    case "ponytail":
      r.ellipse(hx + hw - 2, hy + 6, 9, 22, c);
      r.ellipse(hx + hw - 1, hy + 4, 6, 6, shade(s.accent ?? "#e5806c", 0));
      break;
    case "bun":
      r.ellipse(hx + hw / 2 - 6, hy - 7, 12, 11, s.hair);
      r.ellipse(hx + hw / 2 - 3, hy - 6, 4, 3, shade(s.hair, 0.25));
      break;
    case "twintails":
      for (const side of [-1, 1]) {
        const x = side < 0 ? hx - 8 : hx + hw - 1;
        r.ellipse(x, hy + 6, 9, 26, c);
        r.ellipse(side < 0 ? hx - 3 : hx + hw - 2, hy + 5, 5, 5, s.accent ?? "#e5806c");
      }
      break;
    case "curly":
      for (let k = 0; k < 9; k++) {
        const a = Math.PI * (0.9 + (k / 8) * 1.2);
        r.ellipse(Math.round(31.5 + Math.cos(a) * (hw / 2 + 1)) - 4, Math.round(hy + 12 + Math.sin(a) * 13) - 4, 9, 9, c);
      }
      break;
  }
}

function drawHairFront(r: Raster, g: Geo, s: PortraitSpec, covered: "none" | "top" | "all") {
  if (covered === "all") return;
  const { hx, hy, hw, eyeY } = g;
  const hair = s.hair;
  const hi = shade(hair, 0.28);
  const lo = shade(hair, -0.22);
  const m = headMask(g);
  const style = s.hairStyle;
  if (style === "shaved") {
    for (let y = hy - 1; y < hy + 7; y++) for (let x = hx; x < hx + hw; x++) if (m(x, y) && (x + y) % 2 === 0 && y < hairEdge("shaved", x, g)) r.set(x, y, shade(s.skin, -0.14));
    return;
  }
  if (style === "balding") {
    // a fringe of hair round the sides and back, inside the head outline, above the ears
    for (let y = g.hy + 8; y < eyeY + 1; y++)
      for (let x = hx - 1; x < hx + 4; x++) {
        if (!m(x, y)) continue;
        const k = x - hx;
        const edge = !m(x - 1, y) || !m(x - 2, y);
        if (edge || (k < 2 && y > g.hy + 10)) {
          r.set(x, y, edge ? hair : lo);
          r.set(63 - x, y, edge ? hair : lo);
        }
      }
    for (let x = hx + 6; x < hx + hw - 6; x += 3) r.set(x, hy + 3, shade(s.skin, -0.1));
    return;
  }
  const capTop = covered === "top" ? hy + 5 : hy - 2;
  for (let x = hx - 2; x < hx + hw + 2; x++) {
    const edge = hairEdge(style, x, g);
    for (let y = capTop; y < edge; y++) {
      if (!inEllipse(x, y, hx - 1, hy - 2, hw + 2, (eyeY - hy) * 2 + 2)) continue;
      r.set(x, y, hair);
    }
    if (inEllipse(x, edge - 1, hx - 1, hy - 2, hw + 2, (eyeY - hy) * 2 + 2) && edge - 1 >= capTop) r.set(x, edge - 1, lo);
    // skin shadow under the fringe
    if (m(x, edge) && edge > capTop) r.set(x, edge, shade(s.skin, -0.16));
  }
  // side locks
  if (["bob", "long", "twintails", "curly"].includes(style)) {
    const len = style === "bob" ? eyeY + 6 : style === "curly" ? eyeY + 2 : eyeY + 10;
    for (let y = hy + 6; y < len; y++)
      for (let k = 0; k < 3; k++) {
        sym(r, hx - 1 + k, y, k === 2 ? lo : hair);
      }
  }
  if (style === "spiky") for (let k = 0; k < 5; k++) r.poly([[hx + 2 + k * 5, hy + 2], [hx + 4 + k * 5, hy - 5 + (k % 2) * 2], [hx + 7 + k * 5, hy + 2]], hair);
  if (style === "curly") for (let x = hx; x < hx + hw; x += 4) r.ellipse(x, hairEdge("curly", x, g) - 4, 4, 4, hair);
  // shine
  if (covered === "none") for (let k = 0; k < 6; k++) r.set(hx + 5 + k, hy + 2 + Math.abs(3 - k) / 2, hi);
}

// ------------------------------------------------------------------ headwear
function faceOpening(g: Geo): (x: number, y: number) => boolean {
  return (x, y) => inEllipse(x, y, g.hx + 3, g.hy + 6, g.hw - 6, g.hh - 5);
}

function drawCovering(r: Raster, g: Geo, s: PortraitSpec, kind: string) {
  const c = s.headwearColor ?? (kind === "tudung_school" ? "#f4f1ea" : "#3f8a8c");
  const dark = shade(c, -0.2);
  const light = shade(c, 0.22);
  const { hx, hy, hw, eyeY } = g;
  const face = faceOpening(g);
  const shape = new Raster(SIZE, SIZE);
  shape.ellipse(hx - 4, hy - 4, hw + 8, g.hh + 2, "#fff");
  const top = g.torso[3]![1];
  if (kind === "tudung_school") shape.poly([[hx - 4, eyeY], [hx - 6, top + 4], [31.5, 62], [63 - hx + 6, top + 4], [63 - hx + 4, eyeY]], "#fff");
  else if (kind === "tudung_sarung") shape.poly([[hx - 4, eyeY], [hx - 9, top + 10], [hx - 4, 60], [63 - hx + 4, 60], [63 - hx + 9, top + 10], [63 - hx + 4, eyeY]], "#fff");
  else if (kind === "shawl") {
    shape.poly([[hx - 4, eyeY], [hx - 6, top + 6], [hx + 2, 64], [hx + 10, 64], [hx + 8, top + 2]], "#fff");
    shape.poly([[63 - hx + 4, eyeY], [63 - hx + 7, top + 4], [63 - hx + 10, 64], [63 - hx + 3, 64]], "#fff");
  } else shape.poly([[hx - 4, eyeY], [hx - 7, top + 6], [hx, 58], [63 - hx, 58], [63 - hx + 7, top + 6], [63 - hx + 4, eyeY]], "#fff");
  const open = kind === "shawl" ? (x: number, y: number) => face(x, y) || inEllipse(x, y, hx + 4, hy + 3, hw - 8, 10) : face;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      if (!shape.get(x, y)[3] || open(x, y)) continue;
      const nearFace = open(x - 1, y) || open(x + 1, y) || open(x, y - 1) || open(x, y + 1);
      r.set(x, y, nearFace ? dark : c);
    }
  // folds + light
  for (let k = 0; k < 5; k++) r.set(hx - 1 + k, hy + 1 - Math.floor(k / 2), light);
  r.line(hx - 2, eyeY + 4, hx + 4, top + 8, dark);
  r.line(63 - hx + 2, eyeY + 4, 63 - hx - 4, top + 8, dark);
  if (kind === "tudung_sarung") {
    r.rect(hx + 4, hy + 3, hw - 8, 2, light);
    r.rect(hx + 4, hy + 5, hw - 8, 1, dark);
  }
  if (kind === "tudung_school") r.line(31, eyeY + 12, 31, 60, dark);
  if (s.headwearAccent) for (let x = hx; x < hx + hw; x += 3) r.set(x, hy + 4, s.headwearAccent);
}

function drawHat(r: Raster, g: Geo, s: PortraitSpec, kind: string) {
  const { hx, hy, hw } = g;
  const cx = hx + hw / 2;
  switch (kind) {
    case "kopiah": {
      const c = s.headwearColor ?? "#f0eee8";
      r.poly([[hx + 2, hy + 6], [hx + 3, hy - 1], [hx + hw - 3, hy - 1], [hx + hw - 2, hy + 6]], c);
      r.ellipse(hx + 3, hy - 3, hw - 6, 5, c);
      for (let y = hy; y < hy + 6; y += 2) for (let x = hx + 4 + (y % 4 ? 1 : 0); x < hx + hw - 4; x += 3) r.set(x, y, shade(c, -0.15));
      r.line(hx + 2, hy + 6, hx + hw - 3, hy + 6, shade(c, -0.25));
      break;
    }
    case "songkok": {
      const c = s.headwearColor ?? "#1d1a22";
      r.poly([[hx + 2, hy + 6], [hx + 3, hy - 3], [hx + hw - 3, hy - 3], [hx + hw - 2, hy + 6]], c);
      r.ellipse(hx + 3, hy - 5, hw - 6, 5, shade(c, 0.12));
      r.line(hx + 5, hy - 2, hx + 5, hy + 4, shade(c, 0.3));
      if (s.headwearAccent) r.line(hx + 2, hy + 5, hx + hw - 3, hy + 5, s.headwearAccent);
      break;
    }
    case "serban": {
      const c = s.headwearColor ?? "#f2efe6";
      r.ellipse(hx - 2, hy - 6, hw + 4, 15, c);
      for (let k = 0; k < 4; k++) r.line(hx + k * 6, hy + 6, hx + 8 + k * 6, hy - 5, shade(c, -0.18));
      r.line(hx - 1, hy + 6, hx + hw, hy + 6, shade(c, -0.25));
      break;
    }
    case "cap": {
      const c = s.headwearColor ?? "#c8506a";
      r.ellipse(hx, hy - 3, hw, 14, c);
      r.rect(hx, hy + 3, hw, 3, c);
      r.ellipse(hx + 5, hy + 4, hw + 2, 5, s.headwearAccent ?? shade(c, -0.25));
      r.set(Math.round(cx), hy - 3, shade(c, 0.3));
      r.line(hx + 4, hy, hx + 8, hy - 2, shade(c, 0.25));
      break;
    }
    case "ngob": {
      const c = s.headwearColor ?? "#d8b76a";
      r.poly([[hx - 9, hy + 6], [cx - 6, hy - 7], [cx + 6, hy - 7], [hx + hw + 9, hy + 6], [hx + hw + 6, hy + 8], [hx - 6, hy + 8]], c);
      for (let k = -4; k <= 4; k++) r.line(cx + k * 2, hy - 6, cx + k * 5, hy + 7, shade(c, -0.15));
      r.line(hx - 8, hy + 7, hx + hw + 8, hy + 7, shade(c, -0.3));
      r.rect(cx - 7, hy - 1, 14, 2, s.headwearAccent ?? "#3a2819");
      break;
    }
    case "pha_khao_ma": {
      const a = s.headwearColor ?? "#c8506a";
      const b = s.headwearAccent ?? "#f2eee6";
      for (let x = hx; x < hx + hw; x++) for (let y = hy + 5; y < hy + 8; y++) r.set(x, y, (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? a : b);
      r.poly([[hx + hw - 1, hy + 6], [hx + hw + 4, hy + 12], [hx + hw + 2, hy + 13], [hx + hw - 2, hy + 8]], a);
      break;
    }
    case "flower": {
      const c = s.headwearColor ?? "#f0a0b8";
      const x = hx + hw - 6;
      const y = hy + 4;
      for (const [dx, dy] of [[0, -2], [2, 0], [0, 2], [-2, 0]]) r.ellipse(x + dx!, y + dy!, 3, 3, c);
      r.set(x + 1, y + 1, s.headwearAccent ?? "#f4ae3d");
      break;
    }
  }
}

// ------------------------------------------------------------------ face
const BROWS: Record<Emotion, number[]> = {
  neutral: [1, 0, 0, 0],
  happy: [0, -1, -1, 0],
  sad: [1, 1, 0, -1],
  surprised: [-1, -2, -2, -1],
  angry: [-1, 0, 1, 2],
  thinking: [1, 0, 0, 0],
  shy: [1, 0, 0, -1],
  worried: [1, 1, 0, -1],
  sleepy: [1, 1, 1, 1],
};

function drawEye(r: Raster, g: Geo, s: PortraitSpec, emotion: Emotion, frame: Frame, side: 0 | 1) {
  const X = (x: number) => (side ? 63 - x : x);
  const iris = s.eyes ?? "#3a2418";
  const lid = INK;
  const x0 = g.lx;
  const y0 = g.eyeY;
  const ih = g.irisH;
  const outer = x0 - 1;
  const inner = x0 + 2;
  const lashes = s.features?.includes("lashes");
  const closed = (curve: "flat" | "up" | "down") => {
    for (let k = 0; k < 4; k++) {
      const dy = curve === "up" ? (k === 0 || k === 3 ? 1 : 0) : curve === "down" ? (k === 0 || k === 3 ? 0 : 1) : 0;
      r.set(X(outer + k), y0 + 1 + dy, lid);
    }
    if (lashes) r.set(X(outer - 1), y0 + 1, lid);
  };
  if (frame === "blink" || emotion === "happy") return closed(emotion === "happy" ? "up" : emotion === "sleepy" ? "flat" : "down");
  if (emotion === "sleepy") {
    for (let k = 0; k < 4; k++) r.set(X(outer + k), y0 + 1, lid);
    r.set(X(x0), y0 + 2, iris);
    r.set(X(x0 + 1), y0 + 2, iris);
    return;
  }
  let iy = y0;
  let ix = x0;
  let h = ih;
  let lidY = y0 - 1;
  const lidD = [0, 0, 0, 0];
  if (emotion === "surprised") {
    for (let y = y0 - 1; y < y0 + ih; y++) for (let k = 0; k < 4; k++) r.set(X(outer + k), y, "#fbf6ee");
    lidY = y0 - 2;
    h = 2;
    iy = y0;
  } else {
    r.set(X(side ? inner : outer), y0, "#fbf6ee");
    r.set(X(side ? inner : outer), y0 + 1, "#fbf6ee");
  }
  if (emotion === "angry") {
    lidD.splice(0, 4, 0, 0, 1, 1);
    iy = y0 + 1;
    h = Math.max(2, ih - 1);
  }
  if (emotion === "sad") {
    lidD.splice(0, 4, 1, 0, 0, 0);
    iy = y0 + 1;
    h = Math.max(2, ih - 1);
  }
  if (emotion === "shy") {
    iy = y0 + 1;
    h = Math.max(2, ih - 1);
  }
  if (emotion === "thinking") ix = x0 + (side ? 1 : -1);
  for (let y = iy; y < iy + h; y++) for (let k = 0; k < 2; k++) r.set(X(ix + k), y, iris);
  r.set(X(ix + (side ? 1 : 0)), iy, "#fbf6ee");
  for (let k = 0; k < 4; k++) r.set(X(outer + k), lidY + lidD[k]!, lid);
  if (lashes) {
    r.set(X(outer - 1), lidY, lid);
    r.set(X(outer - 1), lidY - 1, lid);
  }
}

function drawBrows(r: Raster, g: Geo, s: PortraitSpec, emotion: Emotion) {
  const c = shade(s.hair, -0.2);
  const by = g.eyeY - 4 - (g.irisH > 3 ? 1 : 0);
  const d = BROWS[emotion];
  for (const side of [0, 1] as const) {
    const dd = emotion === "thinking" && side === 1 ? [-1, -2, -2, -1] : d;
    for (let k = 0; k < 4; k++) {
      const x = g.lx - 1 + k;
      r.set(side ? 63 - x : x, by + dd[k]!, c);
    }
  }
}

function drawMouth(r: Raster, g: Geo, s: PortraitSpec, emotion: Emotion, frame: Frame) {
  const y = g.mouthY;
  const dark = shade(s.skin, -0.55);
  const lip = shade(s.skin, -0.3);
  const tongue = "#d8707a";
  const talk = frame === "talk";
  const open = (x0: number, w: number, h: number) => {
    r.rect(x0, y, w, h, dark);
    if (h > 1) r.rect(x0 + 1, y + h - 1, w - 2, 1, tongue);
  };
  switch (emotion) {
    case "happy":
      if (talk) open(29, 6, 3);
      else {
        r.rect(29, y, 6, 1, dark);
        r.rect(30, y + 1, 4, 1, dark);
        r.rect(31, y + 1, 2, 1, tongue);
        sym(r, 28, y - 1, lip);
      }
      break;
    case "sad":
      if (talk) open(30, 4, 2);
      else {
        r.rect(30, y, 4, 1, dark);
        sym(r, 29, y + 1, dark);
      }
      break;
    case "surprised":
      r.rect(30, y, 4, talk ? 4 : 3, dark);
      r.rect(31, y - 1, 2, 1, dark);
      r.rect(31, y + (talk ? 4 : 3), 2, 1, dark);
      break;
    case "angry":
      if (talk) {
        open(28, 8, 3);
        r.rect(29, y, 6, 1, "#f4f0e8");
      } else {
        r.rect(29, y, 6, 3, dark);
        r.rect(30, y + 1, 4, 1, "#f4f0e8");
      }
      break;
    case "thinking":
      if (talk) open(31, 3, 2);
      else {
        r.rect(30, y + 1, 2, 1, dark);
        r.rect(32, y, 2, 1, dark);
      }
      break;
    case "shy":
    case "worried":
      if (talk) open(30, 4, 2);
      else for (let k = 0; k < (emotion === "worried" ? 6 : 4); k++) r.set((emotion === "worried" ? 29 : 30) + k, y + (k % 2), dark);
      break;
    case "sleepy":
      r.rect(31, y, 2, talk ? 3 : 2, dark);
      break;
    default:
      if (talk) open(30, 4, 2);
      else r.rect(30, y, 4, 1, dark);
  }
}

function drawFeatures(r: Raster, g: Geo, s: PortraitSpec, frame: Frame, emotion: Emotion) {
  const f = new Set(s.features ?? []);
  const y = g.mouthY;
  const nose = shade(s.skin, -0.22);
  r.set(32, g.eyeY + 3, nose);
  r.set(32, g.eyeY + 4, nose);
  r.set(31, g.eyeY + 4, shade(s.skin, -0.12));
  if (f.has("wrinkles") || s.body === "elder") {
    const w = shade(s.skin, -0.2);
    sym(r, g.lx - 3, g.eyeY + 1, w);
    sym(r, g.lx - 3, g.eyeY + 2, w);
    sym(r, 27, g.mouthY - 2, w);
    sym(r, 26, g.mouthY - 1, w);
    for (let x = 28; x < 36; x += 2) r.set(x, g.hy + 6, w);
  }
  if (f.has("freckles")) for (const [x, yy] of [[23, 2], [25, 3], [22, 4]] as const) sym(r, x, g.eyeY + yy, shade(s.skin, -0.25));
  if (f.has("mole")) r.set(37, g.mouthY - 1, shade(s.skin, -0.5));
  const hc = s.hair;
  if (f.has("beard")) {
    const m = headMask(g);
    for (let yy = y - 2; yy < g.hy + g.hh + 3; yy++)
      for (let x = g.hx; x < g.hx + g.hw; x++) {
        const edge = !m(x, yy - 2) || yy >= g.hy + g.hh - 1;
        if ((m(x, yy) || (edge && m(x, yy - 2))) && (yy > y + 1 || x < 28 || x > 35)) {
          if (yy >= y - 1 && (yy > y + 2 || Math.abs(x - 31.5) > 4)) r.set(x, yy, (x + yy) % 3 ? hc : shade(hc, 0.2));
        }
      }
  }
  if (f.has("mustache") || f.has("beard")) {
    for (let x = 28; x < 36; x++) r.set(x, y - 1, hc);
    sym(r, 28, y, hc);
  }
  if (f.has("glasses")) {
    const gc = "#3a3a44";
    for (const side of [0, 1]) {
      const X = (x: number) => (side ? 63 - x : x);
      for (let k = -2; k < 4; k++) {
        r.set(X(g.lx + k), g.eyeY - 2, gc);
        r.set(X(g.lx + k), g.eyeY + g.irisH, gc);
      }
      for (let yy = g.eyeY - 2; yy <= g.eyeY + g.irisH; yy++) {
        r.set(X(g.lx - 2), yy, gc);
        r.set(X(g.lx + 3), yy, gc);
      }
      r.set(X(g.lx + 1), g.eyeY - 1, "#ffffff");
    }
    r.line(29, g.eyeY - 1, 34, g.eyeY - 1, gc);
  }
  void frame;
  void emotion;
}

// ------------------------------------------------------------------ effects
function drawEffects(r: Raster, g: Geo, s: PortraitSpec, emotion: Emotion) {
  const blush = (a: number) => {
    for (const side of [0, 1]) {
      const x = side ? 63 - (g.lx - 2) - 3 : g.lx - 2;
      r.ellipse(x, g.eyeY + 3, 4, 2, [232, 110, 120, a]);
    }
  };
  if (emotion === "shy") blush(170);
  if (emotion === "happy") blush(90);
  if (emotion === "sad") {
    r.set(g.lx - 1, g.eyeY + g.irisH, "#8fd0f0");
    r.rect(g.lx - 1, g.eyeY + g.irisH + 1, 1, 2, "#6fb3e0");
    r.set(g.lx - 1, g.eyeY + g.irisH + 3, "#4f8fc0");
  }
  if (emotion === "worried") {
    const x = g.hx + g.hw - 1;
    const y = g.hy + 4;
    r.poly([[x + 2, y], [x + 4, y + 4], [x + 2, y + 6], [x, y + 4]], "#8fd0f0");
    r.set(x + 1, y + 3, "#ffffff");
  }
  if (emotion === "angry") {
    const x = g.hx + g.hw - 6;
    const y = g.hy + 1;
    for (const [dx, dy] of [[0, 1], [1, 0], [3, 0], [4, 1], [0, 3], [1, 4], [3, 4], [4, 3]] as const) r.set(x + dx, y + dy, "#d0473a");
  }
  if (emotion === "thinking") for (const [x, y] of [[50, 10], [54, 6], [58, 2]] as const) r.rect(x, y, 2, 2, "#f7ebd3");
  if (emotion === "sleepy") {
    for (const [x, y, n] of [[50, 8, 4], [56, 2, 3]] as const) {
      r.rect(x, y, n, 1, "#f7ebd3");
      for (let k = 0; k < n; k++) r.set(x + n - 1 - k, y + k, "#f7ebd3");
      r.rect(x, y + n - 1, n, 1, "#f7ebd3");
    }
  }
  if (emotion === "surprised") for (const [x, y] of [[g.hx - 4, g.hy + 2], [g.hx - 6, g.hy + 6], [g.hx + g.hw + 3, g.hy + 2], [g.hx + g.hw + 5, g.hy + 6]] as const) r.rect(x, y, 1, 3, "#f7ebd3");
  void s;
}

// ------------------------------------------------------------------ public
export function drawPortrait(s: PortraitSpec, emotion: Emotion = "neutral", frame: Frame = "base"): Raster {
  const g = geo(s.body);
  const hw = s.headwear ?? "none";
  const covering = COVERING.includes(hw);
  const fig = new Raster(SIZE, SIZE);
  if (!covering) drawHairBack(fig, g, s);
  drawNeckAndTorso(fig, g, s);
  drawHead(fig, g, s);
  drawFeatures(fig, g, s, frame, emotion);
  drawBrows(fig, g, s, emotion);
  drawEye(fig, g, s, emotion, frame, 0);
  drawEye(fig, g, s, emotion, frame, 1);
  drawMouth(fig, g, s, emotion, frame);
  const hatCovers = ["kopiah", "songkok", "serban", "cap", "ngob"].includes(hw);
  drawHairFront(fig, g, s, covering ? "all" : hatCovers ? "top" : "none");
  if (covering) drawCovering(fig, g, s, hw);
  else if (hw !== "none") drawHat(fig, g, s, hw);
  if (s.features?.includes("glasses") && covering) drawFeatures(fig, g, { ...s, features: ["glasses"] }, frame, emotion);
  fig.outline(INK);
  drawEffects(fig, g, s, emotion);
  if (!s.bg) return fig;
  const out = new Raster(SIZE, SIZE, s.bg);
  for (let y = 0; y < SIZE; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < SIZE; x += 4) out.set(x, y, shade(s.bg, 0.06));
  out.blit(fig, 0, 0);
  return out;
}

/** Frames of one emotion side by side: base, blink, talk (192×64). */
export function emotionStrip(s: PortraitSpec, emotion: Emotion): Raster {
  const r = new Raster(SIZE * FRAMES.length, SIZE);
  FRAMES.forEach((f, i) => r.blit(drawPortrait(s, emotion, f), i * SIZE, 0));
  return r;
}

/** Contact sheet: one row per portrait, one column per emotion (base frame). */
export function sheetRaster(specs: PortraitSpec[], emotions: readonly Emotion[], bg = "#2a1d13", gap = 4): Raster {
  const W = emotions.length * (SIZE + gap) + gap;
  const H = specs.length * (SIZE + gap) + gap;
  const r = new Raster(W, H, bg);
  specs.forEach((s, j) =>
    emotions.forEach((e, i) => {
      r.rect(gap + i * (SIZE + gap), gap + j * (SIZE + gap), SIZE, SIZE, shade(bg, 0.08));
      r.blit(drawPortrait(s, e), gap + i * (SIZE + gap), gap + j * (SIZE + gap));
    }),
  );
  return r;
}

export { hex };
