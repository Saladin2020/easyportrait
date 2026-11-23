# Easy Portrait MCP server

```bash
npx tsx src/mcp/server.ts --workspace ~/cast                     # stdio
npx tsx src/mcp/server.ts --http --port 8969 --workspace ~/cast  # Streamable HTTP at http://127.0.0.1:8969/mcp
```

Cursor / Claude config (stdio):

```json
{ "mcpServers": { "easyportrait": { "command": "node", "args": ["/path/to/easyportrait/dist/mcp/server.js", "--workspace", "/path/to/cast"] } } }
```

| Tool | Does |
|---|---|
| `workspace_info` | portraits, Easy Sprite projects, the spec format — call first |
| `get_portrait` | one spec |
| `write_portrait` | create / replace a spec (validated) |
| `from_sprite` | build a spec from an Easy Sprite project (`write: false` to preview) |
| `render_portrait` | PNG: one portrait (any frame), its strip, or a sheet; Thai / Malay emotion aliases |
| `check_portraits` | validation: enums, colours, unique ids, Thai-script names, content rules |
| `export_portraits` | dialogue / godot / pixi / png / all into `exports/` |

Off loopback, HTTP needs `Authorization: Bearer <token>` (printed at start).
