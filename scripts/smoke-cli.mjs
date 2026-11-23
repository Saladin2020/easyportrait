/** CLI smoke test: init a temp workspace and drive every command through the real CLI. */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ws = mkdtempSync(path.join(os.tmpdir(), "easyportrait-cli-"));
const cli = (...args) => execFileSync("npx", ["tsx", "src/cli.ts", ...args, "--workspace", ws], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
let failed = false;
const ok = (cond, label) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${label}`);
  if (!cond) failed = true;
};
const png = (f) => existsSync(f) && readFileSync(f).toString("ascii", 1, 4) === "PNG";
const fails = (...args) => {
  try {
    cli(...args);
    return "";
  } catch (e) {
    return String(e.stdout) + String(e.stderr);
  }
};

cli("init");
ok(existsSync(path.join(ws, "portraits", "village.easyportrait.json")) && existsSync(path.join(ws, "sprites", "kopiah_boy.json")), "init copies the sample");
ok(/20 portraits .* 25 Easy Sprite projects/.test(cli("info")), "info");
const list = JSON.parse(cli("list", "--json"));
ok(list.length === 20 && list.some((p) => p.id === "town_monk" && /หลวงพี่/.test(p.name.th)), "list (Thai names in Thai script)");
ok(JSON.parse(cli("show", "town_hijab_teacher")).headwear === "hijab", "show");
ok(/songkok/.test(cli("options")), "options");
ok(/ok — 20 portraits/.test(cli("check")), "check: clean");
ok(/"headwear": "songkok"/.test(cli("from-sprite", "songkok_groom", "--dry-run")), "from-sprite --dry-run");
cli("from-sprite", "teen_runner", "--id", "runner", "--th", "นนท์", "--en", "Non");
ok(JSON.parse(cli("show", "runner")).name.th === "นนท์", "from-sprite saves");
cli("set", "runner", "--headwear", "cap", "--headwear-color", "#c84040", "--features", "freckles");
ok(JSON.parse(cli("show", "runner")).headwear === "cap", "set changes fields");
ok(/skin/.test(fails("set", "runner", "--skin", "pink")), "set refuses a bad colour");
cli("remove", "runner");
ok(/No portrait/.test(fails("show", "runner")), "remove");
cli("render", "town_kopiah_boy", "--emotion", "ดีใจ", "--out", path.join(ws, "one.png"));
cli("render", "town_kopiah_boy", "--kind", "strip", "--out", path.join(ws, "strip.png"));
cli("render", "--scale", "1", "--out", path.join(ws, "sheet.png"));
ok(png(path.join(ws, "one.png")) && png(path.join(ws, "strip.png")) && png(path.join(ws, "sheet.png")), "render portrait / strip / sheet");
const doc = JSON.parse(readFileSync(path.join(ws, "portraits", "village.easyportrait.json"), "utf8"));
writeFileSync(path.join(ws, "portraits", "bad.easyportrait.json"), JSON.stringify({ format: "easyportrait/1", portraits: [{ ...doc.portraits[0], name: { th: "x", en: "Prophet" } }] }));
const out = fails("check");
ok(/duplicate id/.test(out) && /sacred/.test(out), "check refuses duplicates and sacred figures");
rmSync(path.join(ws, "portraits", "bad.easyportrait.json"));
cli("export", "--preset", "all");
for (const f of ["exports/easyportrait-dialogue/town_kid/neutral.png", "exports/easyportrait-dialogue/town_kid/frames/neutral.png", "exports/easyportrait-dialogue/town_kid/portrait.json", "exports/easyportrait-godot/project.godot", "exports/easyportrait-godot/easyportrait/parity.json", "exports/easyportrait-godot/test_portrait.gd", "exports/easyportrait-pixi/easyportrait-pixi.js", "exports/easyportrait-pixi/index.html", "exports/easyportrait-png/sheet.png"]) ok(existsSync(path.join(ws, f)), `export → ${f}`);
ok(!existsSync(path.join(ws, "exports/easyportrait-dialogue/town_kid/sleepy.png")), "dialogue preset: Easy Dialogue's 7 emotions only");

rmSync(ws, { recursive: true, force: true });
console.log(failed ? "CLI smoke FAILED" : "CLI smoke OK");
process.exit(failed ? 1 : 0);
