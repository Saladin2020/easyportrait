/** Bundle src/shared/engine.ts into runtime/pixi/easyportrait-core.js (the Pixi runtime runs the same engine).
 *   node scripts/build-core.mjs [--check]   (--check: exit 1 when the committed file is stale) */
import { readFileSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

const out = "runtime/pixi/easyportrait-core.js";
const res = await build({ entryPoints: ["src/shared/engine.ts"], bundle: true, format: "esm", platform: "neutral", write: false, legalComments: "none", target: "es2020" });
const body = `/* Easy Portrait core — generated from src/shared/engine.ts by scripts/build-core.mjs. Do not edit. MIT. */\n${res.outputFiles[0].text}`;
if (process.argv.includes("--check")) {
  const cur = readFileSync(out, "utf8");
  if (cur !== body) {
    console.error(`${out} is stale: run node scripts/build-core.mjs`);
    process.exit(1);
  }
  console.log(`${out} up to date`);
} else {
  writeFileSync(out, body);
  console.log(`wrote ${out} (${body.length} bytes)`);
}
