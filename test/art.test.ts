import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { drawPortrait, emotionStrip, FRAMES, SIZE } from "../src/shared/art.js";
import { blinkPeriod, frameAt, normalizeEmotion, seedOf, TIMING } from "../src/shared/engine.js";
import { specFromSprite } from "../src/shared/fromSprite.js";
import { BODIES, EMOTIONS, HAIR_STYLES, HEADWEAR, SHIRTS, type PortraitSpec, type PortraitDoc } from "../src/shared/types.js";
import { validateSpec } from "../src/shared/validate.js";

const base: PortraitSpec = { id: "t", body: "adult", skin: "#c9956c", hair: "#2a221c", hairStyle: "crop", shirt: "tshirt", shirtColor: "#3f7fa6" };
const sample = JSON.parse(readFileSync("samples/portraits/village.easyportrait.json", "utf8")) as PortraitDoc;
const key = (r: { data: Uint8ClampedArray | Uint8Array }) => Buffer.from(r.data).toString("base64");
const opaque = (r: { data: Uint8ClampedArray | Uint8Array }) => { let n = 0; for (let i = 3; i < r.data.length; i += 4) if (r.data[i]! > 0) n++; return n; };

describe("art", () => {
  it("is deterministic and 64×64", () => {
    const a = drawPortrait(base, "happy");
    expect([a.width, a.height]).toEqual([SIZE, SIZE]);
    expect(key(a)).toBe(key(drawPortrait(base, "happy")));
  });

  it("every emotion and frame differs from neutral base", () => {
    const n = key(drawPortrait(base, "neutral"));
    for (const e of EMOTIONS.filter((x) => x !== "neutral")) expect(key(drawPortrait(base, e)), e).not.toBe(n);
    for (const f of FRAMES.filter((x) => x !== "base")) expect(key(drawPortrait(base, "neutral", f)), f).not.toBe(n);
  });

  it("draws every body × hair × headwear × shirt without throwing, filling a bust", () => {
    for (const body of BODIES) for (const hairStyle of HAIR_STYLES) for (const headwear of HEADWEAR) {
      const r = drawPortrait({ ...base, body, hairStyle, headwear, shirt: SHIRTS[(body.length + hairStyle.length + headwear.length) % SHIRTS.length]! }, "surprised", "talk");
      expect(opaque(r)).toBeGreaterThan(1200);
    }
    for (const shirt of SHIRTS) expect(opaque(drawPortrait({ ...base, shirt }))).toBeGreaterThan(1200);
  });

  it("a hijab hides the hair: hair colour never shows", () => {
    const red = { ...base, hair: "#ff0000", hairStyle: "long" as const, headwear: "hijab" as const, headwearColor: "#2e8a7a" };
    const r = drawPortrait(red, "neutral");
    let reds = 0;
    for (let i = 0; i < r.data.length; i += 4) if (r.data[i] === 255 && r.data[i + 1] === 0 && r.data[i + 2] === 0) reds++;
    expect(reds).toBe(0);
    expect(opaque(r)).toBeGreaterThan(1500);
  });

  it("strip is base | blink | talk", () => {
    const s = emotionStrip(base, "happy");
    expect([s.width, s.height]).toEqual([SIZE * 3, SIZE]);
  });

  it("background fills the square", () => {
    expect(opaque(drawPortrait({ ...base, bg: "#3a2819" }))).toBe(SIZE * SIZE);
  });
});

describe("timing", () => {
  it("seeds 0..6, stable", () => {
    expect(seedOf("town_kopiah_boy")).toBe(seedOf("town_kopiah_boy"));
    for (const p of sample.portraits) expect(seedOf(p.id)).toBeGreaterThanOrEqual(0), expect(seedOf(p.id)).toBeLessThan(7);
  });
  it("blinks once per period, briefly; sleepy never blinks; talk alternates", () => {
    const seed = 3;
    const p = blinkPeriod(seed);
    let blinks = 0;
    for (let t = 0; t < p * 4; t += 0.01) if (frameAt(t, seed, false) === "blink") blinks++;
    expect(blinks / 4).toBeGreaterThan(TIMING.blinkLength * 100 - 3);
    expect(blinks / 4).toBeLessThan(TIMING.blinkLength * 100 + 3);
    for (let t = 0; t < 10; t += 0.05) expect(frameAt(t, seed, false, "sleepy")).toBe("base");
    const talk = Array.from({ length: 20 }, (_, i) => frameAt(0.3 + i * TIMING.talkStep, 0, true));
    expect(new Set(talk.filter((f) => f !== "blink")).size).toBe(2);
  });
  it("aliases", () => {
    expect(normalizeEmotion("ดีใจ")).toBe("happy");
    expect(normalizeEmotion("Marah")).toBe("angry");
    expect(normalizeEmotion("custom")).toBe("custom");
  });
});

describe("validation", () => {
  it("sample is clean", () => {
    for (const p of sample.portraits) expect(validateSpec(p, p.id).errors, p.id).toEqual([]);
    expect(sample.portraits.filter((p) => p.id.startsWith("town_")).length).toBe(11);
  });
  it("catches bad enums, colours and content", () => {
    const v = validateSpec({ ...base, body: "giant" as never, skin: "red", name: { th: "Somchai", en: "Prophet X" } }, "x");
    expect(v.errors.map((e) => e.path)).toEqual(expect.arrayContaining(["x.body", "x.skin", "x.name.en"]));
    expect(v.warnings.some((w) => w.path === "x.name.th")).toBe(true);
    expect(validateSpec({ ...base, name: { th: "ทดสอบ", en: "x", ms: "\u0645\u062d\u0645\u062f" } }, "x").errors.length).toBe(1);
  });
});

describe("Easy Sprite import", () => {
  const proj = (id: string) => JSON.parse(readFileSync(`samples/sprites/${id}.json`, "utf8"));
  it("maps hijab, kopiah, glasses, elder", () => {
    expect(specFromSprite(proj("hijab_teacher")).spec).toMatchObject({ headwear: "hijab", body: "adult", shirt: "baju_kurung" });
    expect(specFromSprite(proj("kopiah_boy")).spec).toMatchObject({ headwear: "kopiah", body: "child", shirt: "baju_melayu" });
    const g = specFromSprite(proj("grandpa"));
    expect(g.spec).toMatchObject({ body: "elder", hairStyle: "balding" });
    expect(g.spec.features).toContain("wrinkles");
    expect(g.notes.join()).toMatch(/acc_cane/);
    expect(specFromSprite(proj("temple_monk")).spec).toMatchObject({ shirt: "monk_robe" });
  });
  it("every bundled human project gives a valid spec", () => {
    for (const f of ["kopiah_boy", "grandma", "tadika_girl", "songkok_groom", "young_knight", "village_guard", "teen_runner", "hoodie_kid"]) {
      const { spec } = specFromSprite(proj(f));
      expect(validateSpec(spec, f).errors, f).toEqual([]);
    }
  });
  it("refuses animals", () => {
    expect(() => specFromSprite({ id: "cat", selections: { body: "animal_cat" } })).toThrow(/animal/);
  });
});
