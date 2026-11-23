/* Easy Portrait — PixiJS v8 runtime. MIT.
 *   const lib = await loadPortraits(PIXI, "portraits.json");
 *   const p = await lib.portrait("town_kopiah_boy", { emotion: "ดีใจ", scale: 3, label: "th" });
 *   app.stage.addChild(p.container); app.ticker.add((t) => p.update(t.deltaMS / 1000));
 *   p.say(1.5); p.setEmotion("surprised");
 */
import { frameAt, FRAME_INDEX, normalizeEmotion, seedOf } from "./easyportrait-core.js";

export async function loadPortraits(PIXI, url = "portraits.json") {
  const base = new URL(url, location.href);
  const index = await (await fetch(base)).json();
  const byId = new Map(index.portraits.map((p) => [p.id, p]));
  const cache = new Map();
  const size = index.size ?? 64;

  /** [base, blink, talk] textures for one emotion (cached; nearest-neighbour). */
  async function strip(id, emotion) {
    const key = `${id}/${emotion}`;
    if (cache.has(key)) return cache.get(key);
    const tex = await PIXI.Assets.load(new URL(`portraits/${id}/frames/${emotion}.png`, base).href);
    tex.source.scaleMode = "nearest";
    const frames = [0, 1, 2].map((i) => new PIXI.Texture({ source: tex.source, frame: new PIXI.Rectangle(i * size, 0, size, size) }));
    cache.set(key, frames);
    return frames;
  }

  function resolve(id, emotion) {
    const p = byId.get(id);
    const e = normalizeEmotion(emotion ?? "neutral");
    return p.emotions.includes(e) ? e : p.emotions.includes("neutral") ? "neutral" : p.emotions[0];
  }

  async function portrait(id, opts = {}) {
    const meta = byId.get(id);
    if (!meta) throw new Error(`Easy Portrait: no portrait "${id}"`);
    const seed = meta.seed ?? seedOf(id);
    const scale = opts.scale ?? 1;
    const container = new PIXI.Container();
    const sprite = new PIXI.Sprite();
    sprite.scale.set(scale);
    container.addChild(sprite);
    let label = null;
    if (opts.label) {
      label = new PIXI.Text({ text: meta.name[opts.label] ?? meta.name.th, style: { fontFamily: "Kanit, sans-serif", fontSize: 12, fill: "#f7ebd3", align: "center" } });
      label.anchor.set(0.5, 0);
      label.position.set((size * scale) / 2, size * scale + 2);
      container.addChild(label);
    }
    const listeners = {};
    const v = {
      id, meta, container, sprite, label, seed,
      time: opts.time ?? 0,
      emotion: resolve(id, opts.emotion),
      talking: !!opts.talking,
      animate: opts.animate ?? true,
      frame: "base",
      frames: await strip(id, resolve(id, opts.emotion)),
      sayLeft: 0,
      async setEmotion(e) { v.emotion = resolve(id, e); v.frames = await strip(id, v.emotion); apply(); },
      setTalking(on) { v.talking = !!on; v.sayLeft = 0; apply(); },
      say(seconds) { v.talking = true; v.sayLeft = seconds; },
      setLang(lang) { if (label) label.text = meta.name[lang] ?? meta.name.th; },
      update(dt) {
        v.time += dt;
        if (v.sayLeft > 0) { v.sayLeft -= dt; if (v.sayLeft <= 0) { v.talking = false; (listeners.done ?? []).forEach((f) => f(v)); } }
        apply();
      },
      on(ev, fn) { (listeners[ev] ??= []).push(fn); return v; },
      destroy() { container.destroy({ children: true }); },
    };
    function apply() {
      v.frame = v.animate ? frameAt(v.time, seed, v.talking, v.emotion) : "base";
      sprite.texture = v.frames[FRAME_INDEX[v.frame]];
    }
    apply();
    return v;
  }

  return { index, portrait, strip, resolve, normalizeEmotion, frameAt };
}
