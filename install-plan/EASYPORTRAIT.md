# Easy Portrait (studio tool)

Install: `/workspace/indie-studio/tools/easyportrait` (detached at `<SHA>`). Wrapper: `node /workspace/indie-studio/tools/easyportrait-cli.mjs`.
Always pass `--workspace /workspace/indie-studio/projects/<Name>/portraits-src` and absolute `--out` paths.

| Command | |
|---|---|
| `init` | sample cast: 20 portraits (11 Easy Dialogue `town_*` ids) + 25 Easy Sprite projects |
| `list` / `show <id>` / `options` | browse |
| `from-sprite <project> --id <id> --th … --en …` | portrait from an Easy Sprite paperdoll |
| `set <id> --body … --headwear … --features …` | edit |
| `render [ids] --kind portrait\|strip\|sheet --emotion … --out /abs/x.png` | PNG |
| `check` | validation + content rules |
| `export --preset dialogue\|godot\|pixi\|png --out /abs/dir` | Easy Dialogue folders / engine export |

MCP: `node tools/easyportrait/dist/mcp/server.js --workspace …` (stdio) or `--http --port 8969`.
Godot: autoload `res://easyportrait/portraits.gd` as `Portraits`; `godot --headless --path <export> --script res://test_portrait.gd` → `OK`.
