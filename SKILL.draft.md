---
name: easyportrait-dialogue-portraits
description: Use when a game needs dialogue portraits (64×64 busts with emotions, blink and talk frames) for Easy Dialogue, Godot or PixiJS, especially built from Easy Sprite characters.
---

# Easy Portrait — dialogue portraits

Tool: `node /workspace/indie-studio/tools/easyportrait-cli.mjs <cmd> --workspace /abs/project/portraits-src` (absolute paths).

1. `init` (sample cast + Easy Sprite projects) or start empty.
2. For each speaking character: `from-sprite <easysprite project> --id <portrait id> --th "<ชื่อไทย>" --en "<English>"`
   (use the same id as the `.ezd` `@char … portrait=<id>`), or `set <id> --body … --headwear … --shirt …`.
3. `render <id> --kind strip --emotion happy --out /abs/x.png` and look at it; adjust colours / features with `set`.
4. `check` must be clean.
5. `export --preset dialogue --out /abs/<easydialogue workspace>/portraits` (Easy Dialogue picks them up), and/or
   `--preset godot|pixi --out /abs/dir` for the runtime node that blinks and talks.

Rules: Thai names in Thai script; hijab / tudung for characters who wear them in their Easy Sprite look; never portray
prophets or sacred figures; no Arabic calligraphy.
