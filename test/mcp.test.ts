import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MCP_TOOL_NAMES, createEasyPortraitMcp } from "../src/mcp/server.js";
import { createApp } from "../src/server/app.js";
import { tempWorkspace } from "./helpers.js";

let root: string;
let cleanup: () => Promise<void>;
let client: Client;
beforeAll(async () => {
  ({ root, cleanup } = await tempWorkspace());
  const server = createEasyPortraitMcp(root);
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  client = new Client({ name: "test", version: "0.0.1" });
  await client.connect(b);
});
afterAll(async () => {
  await client.close();
  await cleanup();
});
const body = (res: unknown) => JSON.parse(((res as { content: Array<{ text: string }> }).content[0]!).text);
const call = (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args });

describe("MCP server", () => {
  it("lists the tools", async () => {
    expect((await client.listTools()).tools.map((t) => t.name).sort()).toEqual([...MCP_TOOL_NAMES].sort());
  });
  it("info → get → write → from sprite → render → check → export", async () => {
    const info = body(await call("workspace_info"));
    expect(info.portraits.length).toBe(20);
    expect(info.format).toMatch(/sacred/);
    expect(body(await call("get_portrait", { id: "town_monk" })).shirt).toBe("monk_robe");
    const bad = await call("write_portrait", { spec: { id: "x", body: "adult", skin: "red" } });
    expect(bad.isError).toBe(true);
    const w = body(await call("write_portrait", { spec: { id: "pak_lah", name: { th: "ปะลาห์", en: "Pak Lah" }, body: "stocky", skin: "#a87050", hair: "#2a221c", hairStyle: "crop", headwear: "songkok", shirt: "baju_melayu", shirtColor: "#2b5a8a", features: ["mustache"] } }));
    expect(w.created).toBe(true);
    const fs = body(await call("from_sprite", { sprite: "grandma", id: "yai2", write: false }));
    expect(fs.spec.body).toBe("elder");
    for (const kind of ["portrait", "strip", "sheet"]) {
      const r = await call("render_portrait", { ids: ["pak_lah"], kind, emotion: "ดีใจ" });
      expect((r.content as Array<{ type: string }>)[0]!.type, kind).toBe("image");
    }
    expect(body(await call("check_portraits")).ok).toBe(true);
    const exp = body(await call("export_portraits", { preset: "dialogue", ids: ["pak_lah"] }));
    expect(exp.images).toBe(14);
  }, 60_000);
});

describe("web API", () => {
  it("serves portraits / renders and guards writes", async () => {
    const app = createApp({ workspaceRoot: root, webRoot: "/nonexistent", dev: true, host: "127.0.0.1" });
    const h = { host: "127.0.0.1:8968" };
    const ws = (await (await app.request("http://127.0.0.1/api/workspace", { headers: h })).json()) as { portraits: unknown[]; enums: { headwear: string[] } };
    expect(ws.portraits.length).toBeGreaterThanOrEqual(20);
    expect(ws.enums.headwear).toContain("hijab");
    const png = await app.request("http://127.0.0.1/api/render.png?ids=town_kid&emotion=happy&scale=2", { headers: h });
    expect(png.headers.get("content-type")).toBe("image/png");
    const evil = await app.request("http://127.0.0.1/api/portrait", { method: "POST", headers: { ...h, origin: "https://evil.example", "content-type": "application/json" }, body: "{}" });
    expect(evil.status).toBe(403);
    const dev = await app.request("http://127.0.0.1/api/check", { headers: { ...h, origin: "http://localhost:5196" } });
    expect(dev.status).toBe(200);
    const out = await app.request("http://127.0.0.1/api/export", { method: "POST", headers: { ...h, "content-type": "application/json" }, body: JSON.stringify({ preset: "png", out: "/etc/x" }) });
    expect(out.status).toBe(400);
  });
});
