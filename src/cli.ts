#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { serve } from "@hono/node-server";
import { Command } from "commander";
import open from "open";
import { createApp } from "./server/app.js";
import { defaultWebRoot } from "./server/base.js";
import { resolveToken } from "./shared/requestGuard.js";
import { BODIES, EMOTION_TH, EMOTIONS, FEATURES, HAIR_STYLES, HEADWEAR, SHIRTS, type PortraitSpec } from "./shared/types.js";
import { EXPORT_PRESETS, exportPortraits, type ExportPreset } from "./lib/export.js";
import { renderPng, type RenderKind } from "./lib/render.js";
import { checkWorkspace, getPortrait, initWorkspace, loadPortraitsStrict, portraitFromSprite, removePortrait, resolveWorkspace, upsertPortrait, workspaceSummary } from "./lib/workspace.js";

const program = new Command();

function workspaceOf(cli?: string): string {
  const v = cli?.trim() || process.env.EASYPORTRAIT_WORKSPACE?.trim() || process.env.EASYPORTRAIT_HOME?.trim() || process.cwd();
  return resolveWorkspace(v);
}
const fail = (e: unknown) => {
  console.error(`error: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
};
const list = (v?: string) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined);
type Nm = { th: string; en: string; ms?: string };
const nm = (n: Nm | undefined, lang = "th") => (n ? (n as unknown as Record<string, string>)[lang] || n.th : "");

program.name("easyportrait").description("64×64 pixel bust portraits with emotions, blink and talk frames (hijab, kopiah, songkok, ngob…) from Easy Sprite characters → Easy Dialogue, Godot 4.3+, PixiJS v8").version("0.1.0");

program
  .command("init")
  .description("Create portraits/ and sprites/ with the village sample (20 portraits, 11 matching Easy Dialogue's town_* sets)")
  .option("--force", "Overwrite sample files")
  .option("--workspace <path>")
  .action(async (o: { force?: boolean; workspace?: string }) => {
    try {
      const root = workspaceOf(o.workspace);
      const written = await initWorkspace(root, { force: o.force });
      const s = await workspaceSummary(root);
      console.log(`Initialized Easy Portrait workspace at ${root} (${written.length} files)`);
      console.log(`  portraits/  ${s.docs.map((d) => `${d}.easyportrait.json`).join(", ")} — ${s.portraits.length} portraits`);
      console.log(`  sprites/    ${s.sprites.length} Easy Sprite projects to build from · exports/`);
    } catch (e) {
      fail(e);
    }
  });

program
  .command("info")
  .description("Workspace summary")
  .option("--workspace <path>")
  .option("--json")
  .action(async (o: { workspace?: string; json?: boolean }) => {
    const s = await workspaceSummary(workspaceOf(o.workspace));
    if (o.json) return console.log(JSON.stringify(s, null, 2));
    console.log(`Easy Portrait workspace ${s.root}`);
    console.log(`  ${s.portraits.length} portraits in ${s.docs.length} document(s) · ${s.sprites.length} Easy Sprite projects · ${s.errors} errors, ${s.warnings} warnings`);
  });

program
  .command("list")
  .description("Every portrait")
  .option("--lang <l>", "th | en | ms", "th")
  .option("--workspace <path>")
  .option("--json")
  .action(async (o: { lang: string; workspace?: string; json?: boolean }) => {
    const s = await workspaceSummary(workspaceOf(o.workspace));
    if (o.json) return console.log(JSON.stringify(s.portraits, null, 2));
    for (const p of s.portraits) console.log(`${p.id.padEnd(20)} ${nm(p.name, o.lang).padEnd(16)} ${p.body.padEnd(7)} ${p.headwear.padEnd(14)} ${p.shirt.padEnd(12)} ${p.from ? `← ${p.from}` : ""}`);
  });

program
  .command("show <id>")
  .description("One portrait's spec")
  .option("--workspace <path>")
  .action(async (id: string, o: { workspace?: string }) => {
    try {
      console.log(JSON.stringify(await getPortrait(workspaceOf(o.workspace), id), null, 2));
    } catch (e) {
      fail(e);
    }
  });

program
  .command("options")
  .description("Bodies, hair styles, headwear, shirts, features, emotions")
  .action(() => {
    console.log(`bodies     ${BODIES.join(", ")}\nhair       ${HAIR_STYLES.join(", ")}\nheadwear   ${HEADWEAR.join(", ")}\nshirts     ${SHIRTS.join(", ")}\nfeatures   ${FEATURES.join(", ")}`);
    console.log(`emotions   ${EMOTIONS.map((e) => `${e} (${EMOTION_TH[e]})`).join(", ")}`);
  });

program
  .command("from-sprite <sprite>")
  .description("Build a portrait from an Easy Sprite project: sprites/<id>.json, a .json path, or a project id via the easysprite CLI")
  .option("--id <id>", "Portrait id (default: the project id; use town_* ids to replace Easy Dialogue's sample sets)")
  .option("--th <name>")
  .option("--en <name>")
  .option("--ms <name>")
  .option("--doc <doc>", "Document", "village")
  .option("--dry-run", "Print the spec without saving")
  .option("--workspace <path>")
  .action(async (sprite: string, o: { id?: string; th?: string; en?: string; ms?: string; doc: string; dryRun?: boolean; workspace?: string }) => {
    try {
      const name = o.th && o.en ? { th: o.th, en: o.en, ...(o.ms ? { ms: o.ms } : {}) } : undefined;
      const r = await portraitFromSprite(workspaceOf(o.workspace), sprite, { id: o.id, name, doc: o.doc, write: !o.dryRun, trustedPaths: true });
      console.log(JSON.stringify(r.spec, null, 2));
      for (const n of r.notes) console.log(`note: ${n}`);
      if (r.file) console.log(`${r.created ? "added to" : "updated in"} ${r.file}`);
    } catch (e) {
      fail(e);
    }
  });

program
  .command("set <id>")
  .description("Create or change a portrait: --body adult --skin '#c9956c' --headwear kopiah …")
  .option("--doc <doc>", "Document for a new portrait", "village")
  .option("--th <name>")
  .option("--en <name>")
  .option("--ms <name>")
  .option("--body <b>")
  .option("--skin <hex>")
  .option("--hair <hex>")
  .option("--hair-style <s>")
  .option("--headwear <h>")
  .option("--headwear-color <hex>")
  .option("--headwear-accent <hex>")
  .option("--shirt <s>")
  .option("--shirt-color <hex>")
  .option("--accent <hex>")
  .option("--eyes <hex>")
  .option("--features <list>", "Comma list, e.g. glasses,beard ('' clears)")
  .option("--emotions <list>", "Comma list ('' = all)")
  .option("--bg <hex|none>")
  .option("--workspace <path>")
  .action(async (id: string, o: Record<string, string | undefined>) => {
    try {
      const root = workspaceOf(o.workspace);
      const cur = await getPortrait(root, id).catch(() => null);
      const base: PortraitSpec = cur ? (({ doc: _d, ...s }) => s)(cur) : { id, body: "adult", skin: "#d9a77a", hair: "#2a221c", hairStyle: "crop", shirt: "tshirt", shirtColor: "#6e8a9e" };
      const s: PortraitSpec = { ...base };
      if (o.th || o.en || o.ms) s.name = { th: o.th ?? base.name?.th ?? id, en: o.en ?? base.name?.en ?? id, ...((o.ms ?? base.name?.ms) ? { ms: o.ms ?? base.name?.ms } : {}) };
      const set = <K extends keyof PortraitSpec>(k: K, v: unknown) => {
        if (v !== undefined) (s as unknown as Record<string, unknown>)[k] = v;
      };
      set("body", o.body);
      set("skin", o.skin);
      set("hair", o.hair);
      set("hairStyle", o.hairStyle);
      set("headwear", o.headwear);
      set("headwearColor", o.headwearColor);
      set("headwearAccent", o.headwearAccent);
      set("shirt", o.shirt);
      set("shirtColor", o.shirtColor);
      set("accent", o.accent);
      set("eyes", o.eyes);
      if (o.features !== undefined) s.features = list(o.features) as PortraitSpec["features"];
      if (o.emotions !== undefined) {
        const e = list(o.emotions);
        if (e?.length) s.emotions = e as PortraitSpec["emotions"];
        else delete s.emotions;
      }
      if (o.bg !== undefined) s.bg = o.bg === "none" ? null : o.bg;
      const r = await upsertPortrait(root, s, cur?.doc ?? o.doc);
      console.log(`${r.created ? "added" : "updated"} ${id} in ${r.file}`);
      for (const w of r.warnings) console.log(`  warning: ${w.path}: ${w.message}`);
    } catch (e) {
      fail(e);
    }
  });

program
  .command("remove <id>")
  .description("Delete a portrait from its document")
  .option("--workspace <path>")
  .action(async (id: string, o: { workspace?: string }) => {
    try {
      console.log(`removed ${id} from ${await removePortrait(workspaceOf(o.workspace), id)}`);
    } catch (e) {
      fail(e);
    }
  });

program
  .command("render [ids]")
  .description("PNG of one portrait, its base/blink/talk strip, or a sheet (comma-separated ids; none = all)")
  .option("--kind <k>", "portrait | strip | sheet")
  .option("--emotion <e>", "Emotion (Thai / Malay aliases work)", "neutral")
  .option("--emotions <list>", "Sheet columns")
  .option("--frame <f>", "base | blink | talk", "base")
  .option("--scale <n>", "1–8", "4")
  .option("--out <file>", "Output PNG", "portrait.png")
  .option("--workspace <path>")
  .action(async (ids: string | undefined, o: { kind?: RenderKind; emotion: string; emotions?: string; frame: "base" | "blink" | "talk"; scale: string; out: string; workspace?: string }) => {
    try {
      const all = await loadPortraitsStrict(workspaceOf(o.workspace));
      const want = list(ids);
      const specs = want ? want.map((i) => all.find((s) => s.id === i) ?? (() => { throw new Error(`No portrait ${i}`); })()) : all;
      const buf = renderPng(specs, { kind: o.kind, emotion: o.emotion, emotions: list(o.emotions), frame: o.frame, scale: Number(o.scale) });
      await writeFile(path.resolve(o.out), buf);
      console.log(`wrote ${path.resolve(o.out)} (${specs.length} portrait${specs.length > 1 ? "s" : ""})`);
    } catch (e) {
      fail(e);
    }
  });

program
  .command("check")
  .description("Validate every spec (exit 1 on errors)")
  .option("--workspace <path>")
  .option("--json")
  .action(async (o: { workspace?: string; json?: boolean }) => {
    const r = await checkWorkspace(workspaceOf(o.workspace));
    if (o.json) console.log(JSON.stringify(r, null, 2));
    else {
      for (const e of r.errors) console.log(`error   ${e.path}: ${e.message}`);
      for (const w of r.warnings) console.log(`warning ${w.path}: ${w.message}`);
      console.log(r.ok ? `ok — ${r.portraits} portraits, ${r.warnings.length} warnings` : `${r.errors.length} errors`);
    }
    if (!r.ok) process.exit(1);
  });

program
  .command("export")
  .description(`Export: ${EXPORT_PRESETS.join(" | ")} (dialogue = Easy Dialogue portraits/ folders)`)
  .option("--preset <p>", "Preset", "all")
  .option("--out <dir>", "Output folder (single preset); e.g. your Easy Dialogue workspace's portraits/")
  .option("--ids <list>", "Only these portraits")
  .option("--all-emotions", "dialogue: include worried / sleepy too")
  .option("--workspace <path>")
  .option("--json")
  .action(async (o: { preset: ExportPreset; out?: string; ids?: string; allEmotions?: boolean; workspace?: string; json?: boolean }) => {
    try {
      const res = await exportPortraits(workspaceOf(o.workspace), { preset: o.preset, out: o.out, ids: list(o.ids), allEmotions: o.allEmotions, trustedPaths: true });
      if (o.json) return console.log(JSON.stringify({ ...res, files: res.files.length }, null, 2));
      for (const d of res.dirs) console.log(`exported ${d}`);
      console.log(`  ${res.files.length} files · ${res.portraits} portraits · ${res.images} PNGs`);
      for (const w of res.warnings) console.log(`  warning: ${w}`);
    } catch (e) {
      fail(e);
    }
  });

program
  .command("serve")
  .description("Web editor + API (default http://127.0.0.1:8968)")
  .option("--port <n>", "Port", "8968")
  .option("--host <h>", "Host", "127.0.0.1")
  .option("--dev", "API only (use the Vite UI on :5196)")
  .option("--no-open")
  .option("--workspace <path>")
  .action(async (o: { port: string; host: string; dev?: boolean; open: boolean; workspace?: string }) => {
    const root = workspaceOf(o.workspace);
    const token = resolveToken(o.host);
    const app = createApp({ workspaceRoot: root, webRoot: defaultWebRoot(), dev: o.dev, host: o.host, token });
    serve({ fetch: app.fetch, port: Number(o.port), hostname: o.host });
    const url = `http://${o.host === "0.0.0.0" ? "127.0.0.1" : o.host}:${o.port}/${token ? `?token=${token}` : ""}`;
    console.log(`Easy Portrait ${o.dev ? "API" : "editor"} on http://${o.host}:${o.port} · workspace ${root}`);
    if (token) console.log(`Token (needed off loopback): ${token}`);
    if (o.open && !o.dev && process.stdout.isTTY) await open(url).catch(() => {});
  });

program.parseAsync().catch(fail);
