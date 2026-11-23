import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { specFromSprite, type SpriteProject } from "../shared/fromSprite.js";
import { EMOTIONS, FORMAT, type Diagnostic, type Emotion, type PortraitDoc, type PortraitSpec } from "../shared/types.js";
import { validateDoc, validateSpec } from "../shared/validate.js";
import { assertSafeId, resolveInside, resolveWorkspace, SAMPLES_DIR } from "./fsx.js";
import { runSibling, siblingCli } from "./siblings.js";

export { assertSafeId, resolveWorkspace, resolveInside };

export const dirs = (root: string) => ({ portraits: path.join(root, "portraits"), sprites: path.join(root, "sprites"), exports: path.join(root, "exports") });
const EXT = ".easyportrait.json";

export async function initWorkspace(root: string, opts: { force?: boolean } = {}) {
  const written: string[] = [];
  for (const sub of ["portraits", "sprites"]) {
    const src = path.join(SAMPLES_DIR, sub);
    const dst = path.join(root, sub);
    await mkdir(dst, { recursive: true });
    if (!existsSync(src)) continue;
    for (const f of await readdir(src)) {
      const t = path.join(dst, f);
      if (existsSync(t) && !opts.force) continue;
      await copyFile(path.join(src, f), t);
      written.push(t);
    }
  }
  return written;
}

export interface DocFile {
  id: string;
  file: string;
  doc?: PortraitDoc;
  parseError?: string;
}

export async function listDocs(root: string): Promise<DocFile[]> {
  const d = dirs(root).portraits;
  if (!existsSync(d)) return [];
  const out: DocFile[] = [];
  for (const f of (await readdir(d)).filter((x) => x.endsWith(EXT)).sort()) {
    const file = path.join(d, f);
    const id = f.slice(0, -EXT.length);
    try {
      out.push({ id, file, doc: JSON.parse(await readFile(file, "utf8")) as PortraitDoc });
    } catch (e) {
      out.push({ id, file, parseError: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}

export interface LoadResult {
  portraits: Array<PortraitSpec & { doc: string }>;
  errors: Diagnostic[];
  warnings: Diagnostic[];
}

/** Every portrait in every portraits/*.easyportrait.json, validated; ids must be unique across documents. */
export async function loadPortraits(root: string): Promise<LoadResult> {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];
  const portraits: LoadResult["portraits"] = [];
  const seen = new Map<string, string>();
  for (const d of await listDocs(root)) {
    const f = `portraits/${d.id}${EXT}`;
    if (d.parseError) {
      errors.push({ path: f, message: `JSON: ${d.parseError}` });
      continue;
    }
    const r = validateDoc(d.doc!, f);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    for (const p of Array.isArray(d.doc!.portraits) ? d.doc!.portraits : []) {
      if (!p || typeof p.id !== "string") continue;
      if (seen.has(p.id)) errors.push({ path: `${f}(${p.id})`, message: `duplicate id (also in ${seen.get(p.id)})` });
      else seen.set(p.id, f);
      portraits.push({ ...p, doc: d.id });
    }
  }
  return { portraits, errors, warnings };
}

export async function loadPortraitsStrict(root: string): Promise<PortraitSpec[]> {
  const r = await loadPortraits(root);
  if (r.errors.length) throw new Error(`workspace has ${r.errors.length} error(s): ${r.errors.slice(0, 3).map((e) => `${e.path}: ${e.message}`).join("; ")} (run: easyportrait check)`);
  return r.portraits.map(({ doc: _d, ...p }) => p);
}

export async function getPortrait(root: string, id: string): Promise<PortraitSpec & { doc: string }> {
  const r = await loadPortraits(root);
  const p = r.portraits.find((x) => x.id === id);
  if (!p) throw new Error(`No portrait "${id}" (have: ${r.portraits.map((x) => x.id).join(", ") || "none"})`);
  return p;
}

export const emotionsOf = (s: PortraitSpec): Emotion[] => (s.emotions?.length ? s.emotions : [...EMOTIONS]);

/** Insert or replace a portrait in a document (created if missing). Validates before writing. */
export async function upsertPortrait(root: string, spec: PortraitSpec, docId = "village"): Promise<{ file: string; created: boolean; warnings: Diagnostic[] }> {
  assertSafeId(docId, "document id");
  const v = validateSpec(spec, spec.id ?? "portrait");
  if (v.errors.length) throw new Error(v.errors.map((e) => `${e.path}: ${e.message}`).join("; "));
  const all = await loadPortraits(root);
  const other = all.portraits.find((p) => p.id === spec.id && p.doc !== docId);
  if (other) throw new Error(`"${spec.id}" already exists in portraits/${other.doc}${EXT}`);
  const file = path.join(dirs(root).portraits, `${docId}${EXT}`);
  const doc: PortraitDoc = existsSync(file) ? (JSON.parse(await readFile(file, "utf8")) as PortraitDoc) : { format: FORMAT, portraits: [] };
  const i = doc.portraits.findIndex((p) => p.id === spec.id);
  if (i >= 0) doc.portraits[i] = spec;
  else doc.portraits.push(spec);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(doc, null, 2) + "\n");
  return { file, created: i < 0, warnings: v.warnings };
}

export async function removePortrait(root: string, id: string): Promise<string> {
  const p = await getPortrait(root, id);
  const file = path.join(dirs(root).portraits, `${p.doc}${EXT}`);
  const doc = JSON.parse(await readFile(file, "utf8")) as PortraitDoc;
  doc.portraits = doc.portraits.filter((x) => x.id !== id);
  await writeFile(file, JSON.stringify(doc, null, 2) + "\n");
  return file;
}

/** Load an Easy Sprite project: a JSON file in the workspace, sprites/<id>.json, or via the easysprite CLI. */
export async function loadSpriteProject(root: string, ref: string, opts: { trustedPaths?: boolean } = {}): Promise<SpriteProject> {
  const asFile = ref.endsWith(".json") ? (opts.trustedPaths ? path.resolve(root, ref) : resolveInside(root, ref)) : null;
  const local = path.join(dirs(root).sprites, `${ref}.json`);
  const f = asFile ?? (existsSync(local) ? local : null);
  if (f) {
    if (!existsSync(f)) throw new Error(`${ref} not found`);
    return JSON.parse(await readFile(f, "utf8")) as SpriteProject;
  }
  assertSafeId(ref, "sprite project id");
  const cli = siblingCli("easysprite");
  if (!cli) throw new Error(`No sprites/${ref}.json and no easysprite CLI found (set EASYPORTRAIT_EASYSPRITE_CLI or copy the project JSON into sprites/)`);
  const { stdout } = await runSibling(cli, ["get", ref]);
  const p = JSON.parse(stdout) as SpriteProject;
  if (!p.selections) throw new Error(`easysprite get ${ref}: no selections in output`);
  return p;
}

export async function portraitFromSprite(root: string, ref: string, opts: { id?: string; name?: PortraitSpec["name"]; doc?: string; write?: boolean; trustedPaths?: boolean } = {}) {
  const proj = await loadSpriteProject(root, ref, opts);
  const { spec, notes } = specFromSprite(proj, assertSafeId(opts.id ?? proj.id, "portrait id"));
  if (opts.name) spec.name = opts.name;
  const res = opts.write === false ? null : await upsertPortrait(root, spec, opts.doc ?? "village");
  return { spec, notes, file: res?.file, created: res?.created };
}

export async function workspaceSummary(root: string) {
  const docs = await listDocs(root);
  const r = await loadPortraits(root);
  const sprites = existsSync(dirs(root).sprites) ? (await readdir(dirs(root).sprites)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)) : [];
  return {
    root,
    docs: docs.map((d) => d.id),
    portraits: r.portraits.map((p) => ({ id: p.id, doc: p.doc, name: p.name, body: p.body, headwear: p.headwear ?? "none", shirt: p.shirt, emotions: emotionsOf(p).length, from: p.from })),
    sprites,
    errors: r.errors.length,
    warnings: r.warnings.length,
  };
}

export async function checkWorkspace(root: string) {
  const r = await loadPortraits(root);
  return { ok: r.errors.length === 0, portraits: r.portraits.length, errors: r.errors, warnings: r.warnings };
}
