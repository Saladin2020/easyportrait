# Easy Portrait studio install plan (prepared, NOT applied)

Nothing below has been run against `/workspace/indie-studio`. Apply only after the user approves.

1. `git clone /workspace/easy-new/easyportrait /workspace/indie-studio/tools/easyportrait && cd $_ && git checkout --detach <SHA>`
2. `npm ci && npm run build && npm test` (Godot test skipped unless `GODOT=…`).
3. Copy `install-plan/easyportrait-cli.mjs` → `/workspace/indie-studio/tools/easyportrait-cli.mjs`.
4. Copy `install-plan/EASYPORTRAIT.md` → `/workspace/indie-studio/tools/EASYPORTRAIT.md` and replace `<SHA>`.
5. Smoke: `node /workspace/indie-studio/tools/easyportrait-cli.mjs init --workspace /workspace/indie-studio/projects/_smoke_portrait`
   then `check` and `export --preset dialogue --out /workspace/indie-studio/projects/_smoke_portrait/dlg`.
6. Optional: regenerate Easy Dialogue's sample `portraits/town_*` with `export --preset dialogue --ids town_… --out
   <easydialogue>/samples/portraits` (replaces the 32×32 crops with native 64×64 busts; review first).
7. Shared skill: install `SKILL.draft.md` as `easyportrait-dialogue-portraits` (the parent agent does this).
8. Once a GitHub repo exists (user's call): add it as a remote in the install.

Ports: editor 8968, MCP HTTP 8969, Vite 5196.
