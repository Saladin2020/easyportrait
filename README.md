<!-- easy-suite:header:start -->
<!-- easy-suite:header:end -->

# Easy Portrait

**ภาพหน้าตัวละคร 64×64 · 9 อารมณ์ · กะพริบตา / ขยับปาก · ฮิญาบ กปิเยาะห์ ซองก๊อก งอบ · ไทย Bahasa Melayu English**  
Dialogue portraits for your cast, drawn natively at 64×64 rather than upscaled from a walking sprite: nine emotions
(the seven [Easy Dialogue](../easydialogue) ones plus worried and sleepy), each with a **base, blink and talk** frame.
Build a portrait straight from an [Easy Sprite](../easysprite) paperdoll (body, skin, hair, hijab / tudung / kopiah /
songkok / cap / ngob, glasses and beard, shirt and colours carry over) or set it up by hand. Export to the **Easy
Dialogue portraits layout** (drop-in for the `town_*` sets), a **Godot 4.3+** `Portraits` autoload with an
`EasyPortrait` node that blinks and talks on its own, a **PixiJS v8** runtime, or PNG sheets. CLI, web editor and MCP
server; local only, no network.

<p align="center"><img src="docs/assets/godot-demo.gif" width="70%" alt="Godot demo: twenty portraits blinking and talking while the emotion changes" /></p>

| In Easy Dialogue (drop-in `town_kopiah_boy`) | PixiJS v8 demo, English names | base · blink · talk |
|---|---|---|
| <img src="docs/assets/easydialogue-line.png" alt="Easy Dialogue line with the new portrait" /> | <img src="docs/assets/pixi-surprised-en.png" alt="Pixi demo" /> | <img src="docs/assets/strip-kopiah-boy-happy.png" width="100%" alt="Adam happy: base, blink, talk" /> |

## The sample cast

`init` copies 20 portraits and the 25 Easy Sprite projects they come from. Eleven use Easy Dialogue's `town_*` ids
and the same names as its sample scripts, so exporting with `--out <easydialogue workspace>/portraits` replaces
those portraits in place:

<p align="center"><img src="docs/assets/sheet.png" width="88%" alt="All twenty sample portraits in seven emotions" /></p>

| id | Who | Look |
|---|---|---|
| `town_hijab_teacher` | ก๊ะฟาตีมะห์ (Kak Fatimah) | green hijab, baju kurung |
| `town_kopiah_boy` | อาดัม (Adam) | kopiah, baju melayu |
| `town_pak_cik` | ปะจิอิสมะแอ (Pak Cik Ismail) | kopiah, white beard, jubah |
| `town_roti_seller` | ก๊ะนะ (Kak Na) | shawl, apron |
| `town_tadika_girl` | ไอชะฮ์ (Aisyah) | white school tudung |
| `town_monk` | หลวงพี่ (Luang Phi) | shaved head, saffron robe |
| `town_farmer` | ลุงมี (Uncle Mee) | ngob hat, mohom shirt |
| `town_elder` | ตาเพิ่ม (Grandpa Poem) | balding, mustache |
| `town_kid` | ต้น (Ton) | blue cap, yellow T-shirt |
| `town_vendor` | ป้าแดง (Auntie Daeng) | hair bun, apron |
| `town_student` | พี่ฝน (Fon) | long hair, school blazer |
| `pak_hamid`, `mak_yah`, `yai`, `ah_kong`, `noodle_auntie`, `kru_ploy`, `ustaz_yusof`, `bang_man`, `young_knight` | ปะฮามิด, เมาะยะห์, ยาย, อากงเฮง, เจ๊หมวย, ครูพลอย, อุสตาซยูโซะ, บังมัน, อัศวินน้อย | songkok, tudung sarung, grey bun, glasses, flower, serban, pha khao ma, armour |

Thai names are written in Thai. `check` warns when a Thai name isn't in Thai script, refuses Arabic script in names
(no calligraphy) and refuses prophets or other sacred figures as portraits.

## Quick start

```bash
npm install
npx tsx src/cli.ts init --workspace ~/cast                         # portraits/ sprites/
npx tsx src/cli.ts list --workspace ~/cast
npx tsx src/cli.ts render town_kopiah_boy --emotion ดีใจ --kind strip --out adam.png --workspace ~/cast
npx tsx src/cli.ts from-sprite songkok_groom --id pak_lah --th "ปะลาห์" --en "Pak Lah" --workspace ~/cast
npx tsx src/cli.ts export --preset dialogue --out ~/my-dialogue/portraits --workspace ~/cast
npx tsx src/cli.ts export --workspace ~/cast                       # exports/easyportrait-{dialogue,godot,pixi,png}/
npx tsx src/cli.ts serve --workspace ~/cast                        # web editor on http://127.0.0.1:8968
```

Other commands: `info`, `show <id>`, `options`, `set <id> --headwear songkok --features glasses,beard …`,
`remove <id>`, `check`, `render [ids] --kind portrait|strip|sheet --frame blink --emotions …`.

## Portraits

A spec is a few fields — body (`adult`, `child`, `elder`, `stocky`), skin / hair / shirt colours, a hair style, an
optional headwear and face features — see [docs/FORMAT.md](docs/FORMAT.md). Hijab styles (`hijab`, `tudung_school`,
`tudung_sarung`, `shawl`) frame the face and hide the hair; hats (`kopiah`, `songkok`, `serban`, `cap`, `ngob`,
`pha_khao_ma`, `flower`) sit over it. Emotion names accept Thai and Malay aliases (`ดีใจ`, `marah`, `เขิน`) like Easy
Dialogue does.

Every portrait blinks on its own: every 3.2 s plus 0.35 s × a per-character seed (0–6, from the id), for 0.14 s, so
a cast on screen never blinks in sync. While talking the mouth alternates every 0.12 s. Sleepy portraits don't
blink. The same timing (`src/shared/engine.ts`) runs in the CLI, the Pixi runtime (bundled as
`easyportrait-core.js`) and GDScript, and the Godot test checks it frame by frame.

## Export

| Preset | Output |
|---|---|
| `dialogue` | Easy Dialogue layout: `<id>/<emotion>.png` (64×64; the 7 dialogue emotions, `--all-emotions` for all 9), `<id>/frames/<emotion>.png` (192×64: base, blink, talk; Easy Dialogue lists only top-level PNGs, so the strips don't show up as emotions), `<id>/portrait.json` |
| `godot` | Godot 4.3+ project: `easyportrait/` (`Portraits` autoload, `EasyPortrait` TextureRect, the same portrait folders, index, Kanit), demo `main.tscn` (1–9 emotion, Space talk, L language), `test_portrait.gd`, `capture.gd` |
| `pixi` | `easyportrait-core.js`, `easyportrait-pixi.js`, `portraits.json`, the portrait folders, demo `index.html` |
| `png` | `sheet.png` (everyone × every emotion), `sheet@3x.png`, `cast.png`, `characters/<id>@4x.png` |

## Godot 4.3+

```gdscript
# Project Settings → Autoload → res://easyportrait/portraits.gd as "Portraits"
var face := EasyPortrait.new()
face.custom_minimum_size = Vector2(128, 128)
add_child(face)
face.character = "town_kopiah_boy"
face.emotion = "ดีใจ"          # or "happy"
face.say(1.6)                  # talks for 1.6 s, then emits finished_talking
Portraits.name_of("town_kopiah_boy", "ms")   # "Adam"
```

`godot --headless --path exports/easyportrait-godot --script res://test_portrait.gd` prints `OK`.

## PixiJS v8

```js
import { loadPortraits } from "./easyportrait-pixi.js";
const lib = await loadPortraits(PIXI, "portraits.json");
const face = await lib.portrait("town_hijab_teacher", { emotion: "happy", scale: 3, label: "th" });
app.stage.addChild(face.container);
app.ticker.add((t) => face.update(t.deltaMS / 1000));
face.say(2); await face.setEmotion("terkejut");
```

`python3 scripts/check-pixi.py exports/easyportrait-pixi shot.png` loads the demo in headless Chrome and checks the
frames against the core timing, `say()` and the emotion aliases.

## Web editor

`serve` opens the cast list, a large live preview (blinking, ▶ talk), every emotion and frame side by side, the spec
form (names, body, hair, headwear, shirt, colours, features, background) validated as you type, a sheet of everyone,
an Easy Sprite importer and the check. Portraits are drawn in the browser by the same code as the CLI.

<p align="center"><img src="docs/assets/editor.png" width="88%" alt="Easy Portrait web editor" /></p>

## MCP server

`npm run mcp` (stdio) or `npm run mcp:http` (port 8969). Tools: `workspace_info`, `get_portrait`, `write_portrait`,
`from_sprite`, `render_portrait` (returns a PNG), `check_portraits`, `export_portraits`. See [docs/MCP.md](docs/MCP.md).

## Ports

| | Port |
|---|---|
| Web editor / API | 8968 |
| MCP Streamable HTTP | 8969 |
| Vite dev UI | 5196 |

Everything binds to 127.0.0.1; a non-loopback `--host` needs the printed token. Paths outside the workspace are refused
unless listed in `EASYPORTRAIT_ALLOWED_DIRS` (the CLI's own `--out` is trusted).

## Development

```bash
npm test                                                  # vitest
GODOT=/path/to/godot npx vitest run test/godot.test.ts    # headless Godot: timing parity, textures, EasyPortrait node
npm run typecheck
npm run smoke                                             # CLI + MCP (stdio and HTTP)
npm run check:pixi -- exports/easyportrait-pixi shot.png  # headless Chrome
node scripts/build-core.mjs                               # after editing src/shared/engine.ts
```

<!-- easy-suite:table:start -->
<!-- easy-suite:table:end -->

## Credits

Portrait art is generated by this tool's code (MIT). Sample sprite projects come from Easy Sprite. Kanit font: SIL OFL
1.1. See [CREDITS.md](CREDITS.md).
