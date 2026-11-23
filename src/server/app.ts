import { Hono } from "hono";
import { BODIES, EMOTION_TH, EMOTIONS, FEATURES, HAIR_STYLES, HEADWEAR, SHIRTS, type PortraitSpec } from "../shared/types.js";
import { exportPortraits, type ExportPreset } from "../lib/export.js";
import { renderPng, type RenderKind } from "../lib/render.js";
import { checkWorkspace, getPortrait, loadPortraits, loadPortraitsStrict, portraitFromSprite, removePortrait, upsertPortrait, workspaceSummary } from "../lib/workspace.js";
import { errMsg, useGuard, useWeb, type BaseOptions } from "./base.js";

export type CreateAppOptions = BaseOptions;

export function createApp(o: CreateAppOptions): Hono {
  const app = new Hono();
  const root = o.workspaceRoot;
  useGuard(app, o);
  app.get("/api/workspace", async (c) => c.json({ ...(await workspaceSummary(root)), enums: { bodies: BODIES, hairStyles: HAIR_STYLES, headwear: HEADWEAR, shirts: SHIRTS, features: FEATURES, emotions: EMOTIONS, emotionsTh: EMOTION_TH } }));
  app.get("/api/portraits", async (c) => {
    const r = await loadPortraits(root);
    return c.json(r);
  });
  app.get("/api/check", async (c) => c.json(await checkWorkspace(root)));
  app.get("/api/portrait/:id", async (c) => {
    try {
      return c.json(await getPortrait(root, c.req.param("id")));
    } catch (e) {
      return c.json({ error: errMsg(e) }, 404);
    }
  });
  app.post("/api/portrait", async (c) => {
    try {
      const body = (await c.req.json()) as { spec: PortraitSpec; doc?: string };
      const r = await upsertPortrait(root, body.spec, body.doc);
      return c.json({ ok: true, ...r });
    } catch (e) {
      return c.json({ error: errMsg(e) }, 400);
    }
  });
  app.post("/api/portrait/remove", async (c) => {
    try {
      const body = (await c.req.json()) as { id: string };
      return c.json({ ok: true, file: await removePortrait(root, body.id) });
    } catch (e) {
      return c.json({ error: errMsg(e) }, 400);
    }
  });
  app.post("/api/from-sprite", async (c) => {
    try {
      const body = (await c.req.json()) as { sprite: string; id?: string; doc?: string; write?: boolean };
      return c.json(await portraitFromSprite(root, body.sprite, { id: body.id, doc: body.doc, write: body.write }));
    } catch (e) {
      return c.json({ error: errMsg(e) }, 400);
    }
  });
  app.get("/api/render.png", async (c) => {
    try {
      const all = await loadPortraitsStrict(root);
      const ids = (c.req.query("ids") ?? "").split(",").filter(Boolean);
      const specs = ids.length ? all.filter((s) => ids.includes(s.id)) : all;
      const buf = renderPng(specs, { kind: c.req.query("kind") as RenderKind | undefined, emotion: c.req.query("emotion"), emotions: c.req.query("emotions")?.split(",").filter(Boolean), scale: Number(c.req.query("scale") ?? 1) });
      return c.body(new Uint8Array(buf), 200, { "Content-Type": "image/png", "Cache-Control": "no-cache" });
    } catch (e) {
      return c.json({ error: errMsg(e) }, 400);
    }
  });
  app.post("/api/export", async (c) => {
    try {
      const body = (await c.req.json()) as { preset?: ExportPreset; out?: string; ids?: string[]; allEmotions?: boolean };
      const res = await exportPortraits(root, { preset: body.preset, out: body.out, ids: body.ids, allEmotions: body.allEmotions });
      return c.json({ ok: true, ...res, files: res.files.length });
    } catch (e) {
      return c.json({ error: errMsg(e) }, 400);
    }
  });
  useWeb(app, o);
  return app;
}
