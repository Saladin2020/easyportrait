/**
 * Optional Godot check: GODOT=/path/to/godot npx vitest run test/godot.test.ts
 * Exports the Godot project, imports it headless, then test_portrait.gd checks the blink/talk timing against the
 * TypeScript engine, every strip texture, emotion aliases and the EasyPortrait node.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { exportPortraits } from "../src/lib/export.js";
import { tempWorkspace } from "./helpers.js";

const GODOT = process.env.GODOT;
let root: string;
let cleanup: () => Promise<void>;
beforeAll(async () => {
  if (GODOT) ({ root, cleanup } = await tempWorkspace());
});
afterAll(() => cleanup?.());

describe.skipIf(!GODOT)("Godot export", () => {
  it("parity with the TS timing and the Portraits autoload", async () => {
    const out = path.join(root, "exports", "godot");
    await exportPortraits(root, { preset: "godot", out });
    for (let i = 0; i < 2; i++) spawnSync(GODOT!, ["--headless", "--editor", "--quit", "--path", out], { encoding: "utf8", timeout: 240_000 });
    const run = spawnSync(GODOT!, ["--headless", "--path", out, "--script", "res://test_portrait.gd"], { encoding: "utf8", timeout: 180_000 });
    expect(run.stdout + run.stderr).not.toMatch(/FAIL|SCRIPT ERROR/);
    expect(run.stdout).toMatch(/^S\|seeds 20$/m);
    expect(run.stdout).toMatch(/^F\|frames \d{4}$/m);
    expect(run.stdout).toMatch(/^I\|images 180$/m);
    expect(run.stdout).toMatch(/^OK$/m);
  }, 900_000);
});
