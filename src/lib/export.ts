import path from "node:path";
import { drawPortrait, emotionStrip, FRAMES, sheetRaster, SIZE } from "../shared/art.js";
import { blinkPeriod, frameAt, seedOf, TIMING } from "../shared/engine.js";
import { DIALOGUE_EMOTIONS, EMOTION_TH, EMOTIONS, EXPORT_PRESETS, type Emotion, type ExportPreset, type PortraitSpec } from "../shared/types.js";
import type { Raster } from "../shared/raster.js";
import { FONT_DIR, resolveInside, RUNTIME_DIR, Writer } from "./fsx.js";
import { encodePng } from "./png.js";
import { dirs, emotionsOf, loadPortraitsStrict } from "./workspace.js";

export { EXPORT_PRESETS, type ExportPreset };
export const VERSION = "0.1.0";

export interface ExportOptions {
  preset?: ExportPreset;
  out?: string;
  ids?: string[];
  /** dialogue preset: only the 7 Easy Dialogue emotions (default) or every emotion. */
  allEmotions?: boolean;
  trustedPaths?: boolean;
}

export interface ExportResult {
  dirs: string[];
  files: string[];
  portraits: number;
  images: number;
  warnings: string[];
}

export const png = (r: Raster) => encodePng(r.width, r.height, r.data);

/** The index every runtime loads. */
export function indexJson(specs: PortraitSpec[]) {
  return {
    format: "easyportrait-index/1",
    version: VERSION,
    size: SIZE,
    frames: [...FRAMES],
    timing: { ...TIMING },
    emotionsTh: EMOTION_TH,
    portraits: specs.map((s) => ({ id: s.id, name: s.name ?? { th: s.id, en: s.id }, emotions: emotionsOf(s), seed: seedOf(s.id), ...(s.from ? { from: s.from } : {}) })),
  };
}

/** Reference frames test_portrait.gd checks the GDScript timing against. */
export function parityData(specs: PortraitSpec[]) {
  const frames: Array<[string, number, boolean, string, string]> = [];
  for (const s of specs.slice(0, 6))
    for (let t = 0; t < 12; t += 0.07) {
      const tt = Math.round(t * 1000) / 1000;
      for (const talking of [false, true]) frames.push([s.id, tt, talking, "neutral", frameAt(tt, seedOf(s.id), talking)]);
    }
  frames.push([specs[0]?.id ?? "x", 3.19, false, "sleepy", frameAt(3.19, seedOf(specs[0]?.id ?? "x"), false, "sleepy")]);
  return { frames, seeds: Object.fromEntries(specs.map((s) => [s.id, seedOf(s.id)])), periods: Object.fromEntries(specs.map((s) => [s.id, blinkPeriod(seedOf(s.id))])) };
}

/**
 * Write one character in the Easy Dialogue layout: <id>/<emotion>.png (64×64, what Easy Dialogue lists),
 * <id>/frames/<emotion>.png (192×64 strip: base, blink, talk) and <id>/portrait.json.
 */
export async function writeCharacter(w: Writer, sub: string, s: PortraitSpec, emotions: readonly Emotion[]) {
  for (const e of emotions) {
    await w.write(`${sub}${s.id}/${e}.png`, png(drawPortrait(s, e, "base")));
    await w.write(`${sub}${s.id}/frames/${e}.png`, png(emotionStrip(s, e)));
  }
  await w.write(
    `${sub}${s.id}/portrait.json`,
    `${JSON.stringify(
      {
        format: "easydialogue-portrait/1",
        id: s.id,
        source: "easyportrait",
        generator: `easyportrait ${VERSION}`,
        size: SIZE,
        emotions,
        ...(s.name ? { name: s.name } : {}),
        frames: { file: "frames/<emotion>.png", order: [...FRAMES], width: SIZE, timing: { ...TIMING, seed: seedOf(s.id) } },
        ...(s.from ? { easysprite: s.from } : {}),
      },
      null,
      2,
    )}\n`,
  );
}

export async function exportPortraits(root: string, opts: ExportOptions = {}): Promise<ExportResult> {
  let specs = await loadPortraitsStrict(root);
  if (opts.ids?.length) {
    const missing = opts.ids.filter((i) => !specs.some((s) => s.id === i));
    if (missing.length) throw new Error(`No portrait ${missing.join(", ")}`);
    specs = specs.filter((s) => opts.ids!.includes(s.id));
  }
  if (!specs.length) throw new Error("No portraits to export (run: easyportrait init)");
  const preset = opts.preset ?? "all";
  if (!EXPORT_PRESETS.includes(preset)) throw new Error(`Unknown preset ${preset} (${EXPORT_PRESETS.join(", ")})`);
  if (preset === "all" && opts.out) throw new Error("--out needs a single preset (dialogue, godot, pixi or png)");
  const presets: ExportPreset[] = preset === "all" ? ["dialogue", "godot", "pixi", "png"] : [preset];
  const res: ExportResult = { dirs: [], files: [], portraits: specs.length, images: 0, warnings: [] };
  for (const p of presets) {
    const out = opts.out ? (opts.trustedPaths ? path.resolve(root, opts.out) : resolveInside(root, opts.out)) : path.join(dirs(root).exports, `easyportrait-${p}`);
    const w = new Writer(out);
    if (p === "dialogue") for (const s of specs) await writeCharacter(w, "", s, opts.allEmotions ? emotionsOf(s) : emotionsOf(s).filter((e) => DIALOGUE_EMOTIONS.includes(e)));
    if (p === "png") await exportPng(w, specs);
    if (p === "pixi") await exportPixi(w, specs);
    if (p === "godot") await exportGodot(w, specs);
    res.dirs.push(out);
    res.files.push(...w.files);
  }
  res.images = res.files.filter((f) => f.endsWith(".png")).length;
  return res;
}

async function exportPng(w: Writer, specs: PortraitSpec[]) {
  const s1 = sheetRaster(specs, EMOTIONS);
  await w.write("sheet.png", png(s1));
  await w.write("sheet@3x.png", png(s1.scaled(3)));
  const cast = sheetRaster(specs, ["neutral"], "#2a1d13", 4);
  await w.write("cast.png", png(cast.scaled(2)));
  for (const s of specs) await w.write(`characters/${s.id}@4x.png`, png(sheetRaster([s], EMOTIONS).scaled(4)));
  await w.write("sheet.json", `${JSON.stringify({ format: "easyportrait-sheet/1", cell: SIZE, gap: 4, rows: specs.map((s) => s.id), columns: [...EMOTIONS] }, null, 2)}\n`);
}

async function exportPixi(w: Writer, specs: PortraitSpec[]) {
  for (const s of specs) await writeCharacter(w, "portraits/", s, emotionsOf(s));
  await w.write("portraits.json", `${JSON.stringify(indexJson(specs))}\n`);
  await w.copy(path.join(RUNTIME_DIR, "pixi", "easyportrait-core.js"), "easyportrait-core.js");
  await w.copy(path.join(RUNTIME_DIR, "pixi", "easyportrait-pixi.js"), "easyportrait-pixi.js");
  for (const f of ["Kanit-Regular.ttf", "OFL.txt"]) await w.copy(path.join(FONT_DIR, f), `fonts/${f}`);
  await w.write("index.html", pixiDemo());
  await w.write(
    "README.txt",
    `Easy Portrait ${VERSION} — PixiJS v8 export
Serve this folder over HTTP (fetch needs it):  python3 -m http.server   then open index.html

  portraits.json          index: ids, names (th/en/ms), emotions, blink seed, timing
  portraits/<id>/         <emotion>.png 64×64 (Easy Dialogue layout) + frames/<emotion>.png 192×64 (base, blink, talk)
  easyportrait-core.js    timing (frameAt, seedOf, normalizeEmotion) — same code as the CLI; also runs in Node
  easyportrait-pixi.js    loadPortraits(PIXI, "portraits.json") → { index, portrait(id, opts) }
                          portrait: { container, setEmotion(e), setTalking(bool), say(seconds), update(dtSeconds), frame }
  fonts/                  Kanit (SIL OFL 1.1) for Thai names

Emotion names accept Thai / Malay aliases (ดีใจ, marah …) like Easy Dialogue.
`,
  );
}

function pixiDemo(): string {
  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>Easy Portrait · PixiJS demo</title>
  <style>
    @font-face { font-family: Kanit; src: url(fonts/Kanit-Regular.ttf); }
    html, body { margin: 0; min-height: 100vh; background: #140e0a; color: #f7ebd3; font-family: Kanit, system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
    #bar { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; justify-content: center; max-width: 900px; }
    button { background: #3a2819; color: #f7ebd3; border: 1px solid #523822; padding: 3px 8px; font: inherit; cursor: pointer; }
    button.on { background: #f4ae3d; color: #2a1606; }
    canvas { image-rendering: pixelated; }
  </style>
</head>
<body>
  <div id="bar"></div>
  <div id="stage"></div>
  <script type="module">
    async function pixi() {
      try { await import("./pixi.min.js"); if (globalThis.PIXI) return globalThis.PIXI; } catch {}
      return await import("https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs");
    }
    const PIXI = await pixi();
    await document.fonts.load("12px Kanit").catch(() => {});
    const { loadPortraits } = await import("./easyportrait-pixi.js");
    const lib = await loadPortraits(PIXI, "portraits.json");
    const q = new URLSearchParams(location.search);
    const cols = Number(q.get("cols") ?? 5), scale = Number(q.get("scale") ?? 2), lang = q.get("lang") ?? "th";
    const ids = (q.get("ids") ?? "").split(",").filter(Boolean);
    const list = ids.length ? lib.index.portraits.filter((p) => ids.includes(p.id)) : lib.index.portraits;
    const cw = 64 * scale + 16, ch = 64 * scale + 34, rows = Math.ceil(list.length / cols);
    const app = new PIXI.Application();
    await app.init({ width: cols * cw + 8, height: rows * ch + 8, background: "#140e0a", antialias: false, resolution: 1 });
    document.getElementById("stage").appendChild(app.canvas);
    let emotion = q.get("emotion") ?? "neutral", talking = q.has("talk");
    const views = [];
    for (const [i, p] of list.entries()) {
      const v = await lib.portrait(p.id, { emotion, scale, label: lang, talking });
      v.container.position.set(8 + (i % cols) * cw, 8 + Math.floor(i / cols) * ch);
      app.stage.addChild(v.container);
      views.push(v);
    }
    const bar = document.getElementById("bar");
    const emotions = [...new Set(lib.index.portraits.flatMap((p) => p.emotions))];
    for (const e of emotions) {
      const b = document.createElement("button");
      b.textContent = lib.index.emotionsTh[e] ?? e; b.dataset.e = e;
      b.onclick = () => { emotion = e; views.forEach((v) => v.setEmotion(e)); draw(); };
      bar.appendChild(b);
    }
    const tb = document.createElement("button"); tb.textContent = "พูด / talk"; tb.id = "talk";
    tb.onclick = () => { talking = !talking; views.forEach((v) => v.setTalking(talking)); draw(); };
    bar.appendChild(tb);
    const draw = () => { bar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.e === emotion || (b.id === "talk" && talking))); };
    draw();
    app.ticker.add((t) => { if (!q.has("paused")) views.forEach((v) => v.update(t.deltaMS / 1000)); });
    window.__portraits = { lib, views, app };
    window.__ready = true;
  </script>
</body>
</html>
`;
}

async function exportGodot(w: Writer, specs: PortraitSpec[]) {
  const g = path.join(RUNTIME_DIR, "godot");
  for (const s of specs) await writeCharacter(w, "easyportrait/portraits/", s, emotionsOf(s));
  await w.write("easyportrait/portraits.json", `${JSON.stringify(indexJson(specs))}\n`);
  await w.write("easyportrait/parity.json", `${JSON.stringify(parityData(specs))}\n`);
  for (const f of ["portraits.gd", "easy_portrait.gd"]) await w.copy(path.join(g, f), `easyportrait/${f}`);
  for (const f of ["Kanit-Regular.ttf", "OFL.txt"]) await w.copy(path.join(FONT_DIR, f), `easyportrait/fonts/${f}`);
  for (const f of ["main.gd", "test_portrait.gd", "capture.gd"]) await w.copy(path.join(g, f), f);
  await w.write(
    "main.tscn",
    `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://main.gd" id="1"]

[node name="Main" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("1")
`,
  );
  await w.write(
    "project.godot",
    `; Engine configuration file.
config_version=5

[application]

config/name="Easy Portrait demo"
run/main_scene="res://main.tscn"
config/features=PackedStringArray("4.3")

[autoload]

Portraits="*res://easyportrait/portraits.gd"

[display]

window/size/viewport_width=720
window/size/viewport_height=480
window/stretch/mode="canvas_items"

[rendering]

textures/canvas_textures/default_texture_filter=0
renderer/rendering_method="gl_compatibility"
renderer/rendering_method.mobile="gl_compatibility"
`,
  );
  await w.write(
    "README.txt",
    `Easy Portrait ${VERSION} — Godot 4.3+ export
Open this folder in Godot 4.3+ and press F5 (every portrait; 1–9 = emotion, Space = talk), or copy easyportrait/
into your game and add  Project Settings → Autoload → res://easyportrait/portraits.gd as "Portraits"

  easyportrait/portraits.gd        Portraits autoload: ids(), name_of(id, lang), emotions_of(id),
                                   texture(id, emotion) (64×64), strip(id, emotion) (base|blink|talk AtlasTextures),
                                   frame_at(t, seed, talking, emotion) (parity-tested with the TypeScript timing)
  easyportrait/easy_portrait.gd    EasyPortrait (TextureRect): character, emotion, talking, blinks on its own;
                                   say(seconds) talks for a while. Emotion names accept Thai / Malay aliases.
  easyportrait/portraits/<id>/     <emotion>.png + frames/<emotion>.png + portrait.json — the Easy Dialogue layout,
                                   so the same folder works as an Easy Dialogue portraits/ set
  test_portrait.gd                 godot --headless --path . --script res://test_portrait.gd   → prints OK
  capture.gd                       frame capture for previews (needs a renderer)
`,
  );
}
