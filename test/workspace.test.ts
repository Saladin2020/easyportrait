import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { exportPortraits, indexJson, parityData } from "../src/lib/export.js";
import { decodePng } from "../src/lib/png.js";
import { renderPng } from "../src/lib/render.js";
import { checkWorkspace, getPortrait, loadPortraitsStrict, portraitFromSprite, removePortrait, upsertPortrait, workspaceSummary } from "../src/lib/workspace.js";
import { tempWorkspace } from "./helpers.js";

let root: string;
let cleanup: () => Promise<void>;
beforeAll(async () => ({ root, cleanup } = await tempWorkspace()));
afterAll(() => cleanup());

describe("workspace", () => {
  it("init + check", async () => {
    const s = await workspaceSummary(root);
    expect(s.portraits.length).toBe(20);
    expect(s.sprites.length).toBe(25);
    expect((await checkWorkspace(root)).ok).toBe(true);
  });
  it("upsert / duplicate ids / remove", async () => {
    const r = await upsertPortrait(root, { id: "new_kid", name: { th: "บีม", en: "Beam" }, body: "child", skin: "#d9a77a", hair: "#2a221c", hairStyle: "spiky", shirt: "hoodie", shirtColor: "#4a8a5a" }, "extra");
    expect(r.created).toBe(true);
    await expect(upsertPortrait(root, { ...(await getPortrait(root, "town_monk")), doc: undefined } as never, "extra")).rejects.toThrow(/already exists/);
    await expect(upsertPortrait(root, { id: "x", body: "adult", skin: "nope" } as never)).rejects.toThrow(/skin/);
    await removePortrait(root, "new_kid");
    await expect(getPortrait(root, "new_kid")).rejects.toThrow(/No portrait/);
  });
  it("from sprite (local project)", async () => {
    const r = await portraitFromSprite(root, "noodle_auntie", { id: "auntie2", write: false });
    expect(r.spec.id).toBe("auntie2");
    expect(r.file).toBeUndefined();
    await expect(portraitFromSprite(root, "../../etc/passwd.json")).rejects.toThrow(/outside/);
  });
  it("renders PNGs", async () => {
    const specs = await loadPortraitsStrict(root);
    const one = decodePng(renderPng(specs.slice(0, 1), { emotion: "โกรธ", scale: 2 }));
    expect([one.width, one.height]).toEqual([128, 128]);
    const strip = decodePng(renderPng(specs.slice(0, 1), { kind: "strip" }));
    expect(strip.width).toBe(192);
    expect(() => renderPng(specs, { emotion: "flying" , kind: "portrait"})).toThrow(/Unknown emotion/);
  });
});

describe("export", () => {
  it("dialogue preset is the Easy Dialogue layout", async () => {
    const out = path.join(root, "exports", "dlg");
    const r = await exportPortraits(root, { preset: "dialogue", out, ids: ["town_kopiah_boy", "town_monk"] });
    expect(r.portraits).toBe(2);
    const files = readdirSync(path.join(out, "town_kopiah_boy")).sort();
    expect(files).toEqual(["angry.png", "frames", "happy.png", "neutral.png", "portrait.json", "sad.png", "shy.png", "surprised.png", "thinking.png"]);
    const meta = JSON.parse(readFileSync(path.join(out, "town_kopiah_boy", "portrait.json"), "utf8"));
    expect(meta.format).toBe("easydialogue-portrait/1");
    expect(meta.size).toBe(64);
    const strip = decodePng(readFileSync(path.join(out, "town_kopiah_boy", "frames", "happy.png")));
    expect([strip.width, strip.height]).toEqual([192, 64]);
  });
  it("all presets; --out refuses paths outside the workspace", async () => {
    const r = await exportPortraits(root, { preset: "all" });
    expect(r.dirs.length).toBe(4);
    for (const f of ["easyportrait-godot/project.godot", "easyportrait-godot/easyportrait/portraits.json", "easyportrait-pixi/index.html", "easyportrait-pixi/easyportrait-core.js", "easyportrait-png/sheet.png"]) expect(existsSync(path.join(root, "exports", f)), f).toBe(true);
    await expect(exportPortraits(root, { preset: "png", out: "/tmp/elsewhere" })).rejects.toThrow(/outside/);
    await expect(exportPortraits(root, { preset: "all", out: "x" })).rejects.toThrow(/single preset/);
  });
  it("index + parity data", async () => {
    const specs = await loadPortraitsStrict(root);
    const idx = indexJson(specs);
    expect(idx.portraits.length).toBe(20);
    expect(idx.portraits[0]!.emotions.length).toBe(9);
    expect(parityData(specs).frames.length).toBeGreaterThan(1000);
  });
});
