#!/usr/bin/env node
/**
 * Easy Portrait MCP server (stdio by default; optional Streamable HTTP).
 *
 *   npx tsx src/mcp/server.ts
 *   npx tsx src/mcp/server.ts --http --port 8969
 *
 * Env: EASYPORTRAIT_WORKSPACE  absolute path to the workspace (default: cwd)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { BODIES, EMOTIONS, FEATURES, FORMAT, HAIR_STYLES, HEADWEAR, SHIRTS, type PortraitSpec } from "../shared/types.js";
import { EXPORT_PRESETS, exportPortraits } from "../lib/export.js";
import { renderPng } from "../lib/render.js";
import { checkWorkspace, getPortrait, loadPortraitsStrict, portraitFromSprite, resolveWorkspace, upsertPortrait, workspaceSummary } from "../lib/workspace.js";
import { isEntry, mcpErr as err, mcpMsg as msg, mcpText as text, parseMcpArgs, startHttp } from "./http.js";

export const MCP_TOOL_NAMES = ["workspace_info", "get_portrait", "write_portrait", "from_sprite", "render_portrait", "check_portraits", "export_portraits"] as const;

const IdSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/, "Use a-z, 0-9, _ or -");
const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "#rrggbb");
const NameSchema = z.object({ th: z.string().min(1), en: z.string().min(1), ms: z.string().optional() });
const SpecSchema = z.object({
  id: IdSchema,
  name: NameSchema.optional(),
  body: z.enum(BODIES),
  skin: Hex,
  hair: Hex,
  hairStyle: z.enum(HAIR_STYLES),
  headwear: z.enum(HEADWEAR).optional(),
  headwearColor: Hex.optional(),
  headwearAccent: Hex.optional(),
  shirt: z.enum(SHIRTS),
  shirtColor: Hex,
  accent: Hex.optional(),
  eyes: Hex.optional(),
  features: z.array(z.enum(FEATURES)).optional(),
  bg: Hex.nullable().optional(),
  emotions: z.array(z.enum(EMOTIONS)).optional(),
  from: z.string().optional(),
});

export const FORMAT_CHEATSHEET = `Source portraits/<doc>.easyportrait.json (${FORMAT}): { format, portraits: [spec] }; ids unique across documents.
  spec: { id, name {th, en, ms?}, body ${BODIES.join("|")}, skin #hex, hair #hex, hairStyle ${HAIR_STYLES.join("|")},
          headwear? ${HEADWEAR.join("|")} (hijab styles hide the hair), headwearColor?, headwearAccent?,
          shirt ${SHIRTS.join("|")}, shirtColor, accent?, eyes?, features? [${FEATURES.join(", ")}], bg? #hex|null, emotions? [${EMOTIONS.join(", ")}], from? (Easy Sprite project) }
Every portrait is 64×64 with three frames per emotion: base, blink, talk. Export "dialogue" writes the Easy Dialogue layout
portraits/<id>/<emotion>.png (+ frames/<emotion>.png strips, portrait.json), so ids like town_kopiah_boy drop straight in.
Rules: Thai names in Thai script; no prophets or sacred figures; no Arabic script / calligraphy in names.`;

const png = (buf: Buffer, extra: unknown) => ({ content: [{ type: "image" as const, data: buf.toString("base64"), mimeType: "image/png" }, { type: "text" as const, text: JSON.stringify(extra) }] });

export function createEasyPortraitMcp(workspaceRoot: string): McpServer {
  const root = resolveWorkspace(workspaceRoot);
  const server = new McpServer({ name: "easyportrait", version: "0.1.0" });

  server.registerTool("workspace_info", { title: "Workspace info", description: "Portraits (id, names, body, headwear, shirt, source sprite), available Easy Sprite projects and the spec format. Call this first.", inputSchema: {} }, async () => text({ name: "easyportrait", ...(await workspaceSummary(root)), format: FORMAT_CHEATSHEET }));

  server.registerTool("get_portrait", { title: "Get portrait", description: "One portrait's full spec and the document it lives in.", inputSchema: { id: IdSchema } }, async ({ id }) => {
    try {
      return text(await getPortrait(root, id));
    } catch (e) {
      return err(msg(e));
    }
  });

  server.registerTool(
    "write_portrait",
    { title: "Write portrait", description: "Create or replace a portrait spec in portraits/<doc>.easyportrait.json (default village). Validated first; returns warnings.", inputSchema: { spec: SpecSchema, doc: IdSchema.optional() } },
    async ({ spec, doc }) => {
      try {
        const r = await upsertPortrait(root, spec as PortraitSpec, doc);
        return text({ ok: true, file: r.file, created: r.created, warnings: r.warnings });
      } catch (e) {
        return err(msg(e));
      }
    },
  );

  server.registerTool(
    "from_sprite",
    { title: "From Easy Sprite", description: "Build a portrait from an Easy Sprite paperdoll project (sprites/<id>.json, a .json path in the workspace, or the easysprite CLI): body, skin, hair, hijab/kopiah/songkok/cap/ngob, face features, shirt and colours. write=false previews without saving.", inputSchema: { sprite: z.string().min(1), id: IdSchema.optional(), name: NameSchema.optional(), doc: IdSchema.optional(), write: z.boolean().optional() } },
    async ({ sprite, id, name, doc, write }) => {
      try {
        return text(await portraitFromSprite(root, sprite, { id, name, doc, write }));
      } catch (e) {
        return err(msg(e));
      }
    },
  );

  server.registerTool(
    "render_portrait",
    { title: "Render", description: "PNG of one portrait (kind=portrait, optional frame base|blink|talk), its 3-frame strip, or a sheet of several portraits × emotions. Emotions accept Thai / Malay aliases.", inputSchema: { ids: z.array(IdSchema).optional(), kind: z.enum(["portrait", "strip", "sheet"]).optional(), emotion: z.string().optional(), emotions: z.array(z.string()).optional(), frame: z.enum(["base", "blink", "talk"]).optional(), scale: z.number().int().min(1).max(8).optional() } },
    async ({ ids, kind, emotion, emotions, frame, scale }) => {
      try {
        const all = await loadPortraitsStrict(root);
        const specs = ids?.length ? ids.map((i) => all.find((s) => s.id === i) ?? (() => { throw new Error(`No portrait ${i}`); })()) : all;
        return png(renderPng(specs, { kind, emotion, emotions, frame, scale: scale ?? (kind === "sheet" || (!kind && specs.length > 1) ? 1 : 3) }), { ids: specs.map((s) => s.id) });
      } catch (e) {
        return err(msg(e));
      }
    },
  );

  server.registerTool("check_portraits", { title: "Check", description: "Validate every spec: enums, colours, unique ids, Thai-script names, content rules.", inputSchema: {} }, async () => text(await checkWorkspace(root)));

  server.registerTool(
    "export_portraits",
    { title: "Export", description: "Write exports/easyportrait-<preset>/: dialogue (Easy Dialogue portraits/ folders), godot (Portraits autoload, EasyPortrait node, demo, parity test), pixi (runtime + demo), png (sheets), all.", inputSchema: { preset: z.enum(EXPORT_PRESETS).optional(), ids: z.array(IdSchema).optional(), allEmotions: z.boolean().optional() } },
    async ({ preset, ids, allEmotions }) => {
      try {
        const r = await exportPortraits(root, { preset: preset ?? "all", ids, allEmotions });
        return text({ dirs: r.dirs, files: r.files.length, images: r.images, portraits: r.portraits, warnings: r.warnings });
      } catch (e) {
        return err(msg(e));
      }
    },
  );

  return server;
}

if (isEntry() >= 0) {
  const a = parseMcpArgs(process.argv.slice(isEntry() + 1), 8969);
  if (a.http) await startHttp(() => createEasyPortraitMcp(a.workspace), a.workspace, a.host, a.port);
  else await createEasyPortraitMcp(a.workspace).connect(new StdioServerTransport());
}
