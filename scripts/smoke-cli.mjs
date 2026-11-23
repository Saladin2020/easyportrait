/** CLI smoke test: init a temp workspace and drive every command through the real CLI. */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ws = mkdtempSync(path.join(os.tmpdir(), "easynpc-cli-"));
const cli = (...args) => execFileSync("npx", ["tsx", "src/cli.ts", ...args, "--workspace", ws], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
let failed = false;
const ok = (cond, label) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${label}`);
  if (!cond) failed = true;
};
const png = (f) => existsSync(f) && readFileSync(f).toString("ascii", 1, 4) === "PNG";

cli("init");
ok(existsSync(path.join(ws, "npcs", "village.easynpc.json")) && existsSync(path.join(ws, "maps", "multicultural_village.tilemap.json")), "init copies the village sample");
ok(/10 NPCs · 18 places/.test(cli("info")), "info");
const npcs = JSON.parse(cli("list", "npcs", "--json")).npcs;
ok(npcs.length === 10 && npcs.some((n) => n.id === "monk" && /หลวงพี่/.test(n.th)), "list npcs (Thai names in Thai script)");
ok(JSON.parse(cli("list", "places", "--json")).places.length === 18, "list places");
const plan = JSON.parse(cli("schedule", "kakna", "--day", "4", "--json"));
ok(plan.weekday === "fri" && plan.entries.some((e) => e.place === "stall_roti"), "schedule kakna (Friday)");
const where = JSON.parse(cli("where", "--day", "4", "--at", "12:45", "--json"));
ok(where.npcs.filter((s) => s.place === "mosque").length >= 2, "where: Friday prayer at the mosque");
ok(/^\d+ tiles: /.test(cli("path", "temple", "boats")), "path temple → boats");
ok(/day 4 .*Friend|day 4 .*Familiar/.test(cli("bond", "fatimah", "--days", "5", "--gift", "kurma")), "bond: affinity grows with loved gifts");
ok(/0 errors, 0 warnings/.test(cli("check")), "check: clean");
ok(/valid \(dry run/.test(cli("set-entry", "adam", "17:00", "beach", "play", "--days", "sun", "--dry-run")), "set-entry --dry-run");
cli("set-entry", "adam", "17:00", "beach", "play", "--days", "sun");
ok(JSON.parse(cli("schedule", "adam", "--day", "6", "--json")).entries.some((e) => e.at === "17:00" && e.place === "beach"), "set-entry saved (Sunday only)");
cli("remove-entry", "adam", "17:00", "--days", "sun");
ok(!JSON.parse(cli("schedule", "adam", "--day", "6", "--json")).entries.some((e) => e.at === "17:00"), "remove-entry");
let out = "";
try {
  cli("set-entry", "adam", "17:00", "moon", "play");
} catch (e) {
  out = String(e.stdout) + String(e.stderr);
}
ok(/unknown place "moon"/.test(out), "set-entry refuses an unknown place");
cli("render", "map", "--day", "4", "--at", "07:30", "--out", path.join(ws, "map.png"), "--scale", "2");
cli("render", "map", "--day", "4", "--at", "21:00", "--night", "true", "--out", path.join(ws, "night.png"));
cli("render", "timeline", "--day", "4", "--out", path.join(ws, "tl.png"));
ok(png(path.join(ws, "map.png")) && png(path.join(ws, "night.png")) && png(path.join(ws, "tl.png")), "render map / night / timeline");
const doc = JSON.parse(readFileSync(path.join(ws, "npcs", "village.easynpc.json"), "utf8"));
doc.npcs.find((n) => n.id === "pakcik").affinity.gifts.liked.push("beer");
writeFileSync(path.join(ws, "npcs", "broken.easynpc.json"), JSON.stringify({ format: "easynpc/1", npcs: [] }));
writeFileSync(path.join(ws, "npcs", "village.easynpc.json"), JSON.stringify(doc));
out = "";
try {
  cli("check");
} catch (e) {
  out = String(e.stdout) + String(e.stderr);
}
ok(/non-halal/.test(out), "check refuses a non-halal gift for a Malay-Muslim NPC");
rmSync(path.join(ws, "npcs", "broken.easynpc.json"));
cli("init", "--force");
cli("export", "--preset", "all");
for (const f of ["exports/easynpc-godot/project.godot", "exports/easynpc-godot/easynpc/npc_engine.gd", "exports/easynpc-godot/easynpc/parity.json", "exports/easynpc-godot/test_npc.gd", "exports/easynpc-pixi/easynpc.world.json", "exports/easynpc-pixi/easynpc-pixi.js", "exports/easynpc-pixi/index.html", "exports/easynpc-png/map-night.png", "exports/easynpc-json/easynpc.world.json"]) ok(existsSync(path.join(ws, f)), `export → ${f}`);

rmSync(ws, { recursive: true, force: true });
console.log(failed ? "CLI smoke FAILED" : "CLI smoke OK");
process.exit(failed ? 1 : 0);
