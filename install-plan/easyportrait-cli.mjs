#!/usr/bin/env node
/**
 * Studio CLI wrapper around Easy Portrait (info / list / show / from-sprite / set / render / check / export without MCP).
 *
 * Usage:
 *   node /workspace/indie-studio/tools/easyportrait-cli.mjs <command> [options]
 *
 * Install:  EASYPORTRAIT_HOME, else this folder's easyportrait/
 * The sample cast lives in the install (init copies it). Portrait documents and exports may be written under
 * /workspace/indie-studio/projects/<Name> (pre-allowed).
 * export --out (single preset) writes into that folder without deleting stale files; use a dedicated folder.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.resolve(process.env.EASYPORTRAIT_HOME?.trim() || path.join(here, "easyportrait"));
const STUDIO_PROJECTS = path.resolve(here, "..", "projects");
const cli = path.join(HOME, "dist", "cli.js");

if (!existsSync(cli)) {
  console.error(`Easy Portrait CLI not found at ${cli}. Set EASYPORTRAIT_HOME and run npm ci && npm run build there.`);
  process.exit(1);
}

const env = {
  ...process.env,
  EASYPORTRAIT_HOME: HOME,
  EASYPORTRAIT_WORKSPACE: process.env.EASYPORTRAIT_WORKSPACE?.trim() || HOME,
};
const allowed = new Set(
  (env.EASYPORTRAIT_ALLOWED_DIRS ?? "")
    .split(path.delimiter)
    .map((s) => s.trim())
    .filter(Boolean),
);
allowed.add(STUDIO_PROJECTS);
env.EASYPORTRAIT_ALLOWED_DIRS = [...allowed].join(path.delimiter);

const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: HOME,
  stdio: "inherit",
  env,
});
child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
