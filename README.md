<!-- easy-suite:header:start -->
<p align="center">
  <a href="#easy-suite"><img src="docs/brand/banner-portrait.png" width="100%" alt="Easy Portrait: 64px dialogue portraits: 9 emotions, blink and talk" /></a>
</p>

<p align="center">
  <b>Easy Portrait</b> · ภาพหน้าตัวละคร 9 อารมณ์ กะพริบตา · 64px dialogue portraits: 9 emotions, blink and talk<br />
  <sub>Part of <a href="#easy-suite"><b>Easy Suite</b></a>: Thai-friendly pixel-art game dev tools for Godot 4.3+ and PixiJS v8</sub>
</p>

<p align="center">
  <a href="https://github.com/Saladin2020/easyportrait/actions/workflows/ci.yml"><img src="https://github.com/Saladin2020/easyportrait/actions/workflows/ci.yml/badge.svg" alt="CI" /></a> <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2e2014?style=flat-square" alt="MIT license" /></a> <img src="https://img.shields.io/badge/Godot-4.3%2B-478cbf?style=flat-square&logo=godotengine&logoColor=white" alt="Godot 4.3+" /> <img src="https://img.shields.io/badge/PixiJS-v8-e72264?style=flat-square" alt="PixiJS v8" /> <a href="docs/MCP.md"><img src="https://img.shields.io/badge/MCP-server-c45c26?style=flat-square" alt="MCP server" /></a> <img src="https://img.shields.io/badge/Thai-ready-f4ae3d?style=flat-square" alt="Thai-ready" />
</p>

<p align="center">
  <a href="https://github.com/Saladin2020/easysprite"><img src="docs/brand/logo-sprite-96.png" width="32" alt="Easy Sprite" title="Easy Sprite" /></a>
  <a href="https://github.com/Saladin2020/easyscene"><img src="docs/brand/logo-scene-96.png" width="32" alt="Easy Scene" title="Easy Scene" /></a>
  <a href="https://github.com/Saladin2020/easytilemap"><img src="docs/brand/logo-tilemap-96.png" width="32" alt="Easy Tilemap" title="Easy Tilemap" /></a>
  <a href="https://github.com/Saladin2020/easydialogue"><img src="docs/brand/logo-dialogue-96.png" width="32" alt="Easy Dialogue" title="Easy Dialogue" /></a>
  <a href="https://github.com/Saladin2020/easyquest"><img src="docs/brand/logo-quest-96.png" width="32" alt="Easy Quest" title="Easy Quest" /></a>
  <a href="https://github.com/Saladin2020/easyui"><img src="docs/brand/logo-ui-96.png" width="32" alt="Easy UI" title="Easy UI" /></a>
  <a href="https://github.com/Saladin2020/easysfx"><img src="docs/brand/logo-sfx-96.png" width="32" alt="Easy SFX" title="Easy SFX" /></a>
  <a href="https://github.com/Saladin2020/easyfx"><img src="docs/brand/logo-fx-96.png" width="32" alt="Easy FX" title="Easy FX" /></a>
  <a href="https://github.com/Saladin2020/easymusic"><img src="docs/brand/logo-music-96.png" width="32" alt="Easy Music" title="Easy Music" /></a>
  <a href="https://github.com/Saladin2020/easyanim"><img src="docs/brand/logo-anim-96.png" width="32" alt="Easy Anim" title="Easy Anim" /></a>
  <a href="https://github.com/Saladin2020/easyitems"><img src="docs/brand/logo-items-96.png" width="32" alt="Easy Items" title="Easy Items" /></a>
  <a href="https://github.com/Saladin2020/easysave"><img src="docs/brand/logo-save-96.png" width="32" alt="Easy Save" title="Easy Save" /></a>
  <a href="https://github.com/Saladin2020/easykit"><img src="docs/brand/logo-kit-96.png" width="32" alt="Easy Kit" title="Easy Kit" /></a>
  <a href="https://github.com/Saladin2020/easybattle"><img src="docs/brand/logo-battle-96.png" width="32" alt="Easy Battle" title="Easy Battle" /></a>
  <a href="https://github.com/Saladin2020/easyfont"><img src="docs/brand/logo-font-96.png" width="32" alt="Easy Font" title="Easy Font" /></a>
  <a href="https://github.com/Saladin2020/easynpc"><img src="docs/brand/logo-npc-96.png" width="32" alt="Easy NPC" title="Easy NPC" /></a>
  <a href="https://github.com/Saladin2020/easyportrait"><img src="docs/brand/logo-portrait-96.png" width="40" alt="Easy Portrait" title="Easy Portrait (this repo)" /></a>
  <a href="https://github.com/Saladin2020/easyship"><img src="docs/brand/logo-ship-96.png" width="32" alt="Easy Ship" title="Easy Ship" /></a>
</p>
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
## Easy Suite

<img src="docs/brand/logo-suite-96.png" width="48" align="right" alt="Easy Suite" />

Eighteen small, local-first tools that share one look (teak, lantern gold, Kanit, 16/48px pixels), one
workflow (CLI · web editor · MCP server) and the same targets (**Godot 4.3+** and **PixiJS v8**).
ชุดเครื่องมือทำเกมพิกเซลสไตล์ไทย ใช้ร่วมกันได้ทั้งชุด · the samples share one multicultural southern Thai village.

| | Tool | What it does | Repo |
|:-:|---|---|---|
| <img src="docs/brand/logo-sprite-96.png" width="40" alt="" /> | [**Easy Sprite**](https://github.com/Saladin2020/easysprite) | Compose modular 48px chibi characters (top-down + side-view) and export sheets. | [`easysprite`](https://github.com/Saladin2020/easysprite) |
| <img src="docs/brand/logo-scene-96.png" width="40" alt="" /> | [**Easy Scene**](https://github.com/Saladin2020/easyscene) | Side-view levels: parallax layers, 16px autotiles, Thai town props. | [`easyscene`](https://github.com/Saladin2020/easyscene) |
| <img src="docs/brand/logo-tilemap-96.png" width="40" alt="" /> | [**Easy Tilemap**](https://github.com/Saladin2020/easytilemap) | Top-down 16px maps: blob-47 autotiles, objects, collision, spawns. | [`easytilemap`](https://github.com/Saladin2020/easytilemap) |
| <img src="docs/brand/logo-dialogue-96.png" width="40" alt="" /> | [**Easy Dialogue**](https://github.com/Saladin2020/easydialogue) | Branching `.ezd` dialogue with Thai-safe text, portraits and choices. | [`easydialogue`](https://github.com/Saladin2020/easydialogue) |
| <img src="docs/brand/logo-quest-96.png" width="40" alt="" /> | [**Easy Quest**](https://github.com/Saladin2020/easyquest) | Text `.ezq` quests: steps, flags, items, rewards, linked to dialogue. | [`easyquest`](https://github.com/Saladin2020/easyquest) |
| <img src="docs/brand/logo-ui-96.png" width="40" alt="" /> | [**Easy UI**](https://github.com/Saladin2020/easyui) | Nine-slice pixel UI kit: panels, bars, inventory, menus, 30 icons. | [`easyui`](https://github.com/Saladin2020/easyui) |
| <img src="docs/brand/logo-sfx-96.png" width="40" alt="" /> | [**Easy SFX**](https://github.com/Saladin2020/easysfx) | Deterministic 8-bit SFX and 4-channel chiptune loops, typing blips. | [`easysfx`](https://github.com/Saladin2020/easysfx) |
| <img src="docs/brand/logo-fx-96.png" width="40" alt="" /> | [**Easy FX**](https://github.com/Saladin2020/easyfx) | Pixel particles: sparks, fire, rain, lanterns, Raya pelita; sheets + Godot particles. | [`easyfx`](https://github.com/Saladin2020/easyfx) |
| <img src="docs/brand/logo-music-96.png" width="40" alt="" /> | [**Easy Music**](https://github.com/Saladin2020/easymusic) | Seeded Thai loop music: ranat, khong wong, saw, khim, pi, kompang; seamless WAV/OGG loops. | [`easymusic`](https://github.com/Saladin2020/easymusic) |
| <img src="docs/brand/logo-anim-96.png" width="40" alt="" /> | [**Easy Anim**](https://github.com/Saladin2020/easyanim) | Cutscene timelines: actors, camera, dialogue, FX and music cues; Godot + Pixi runners. | [`easyanim`](https://github.com/Saladin2020/easyanim) |
| <img src="docs/brand/logo-items-96.png" width="40" alt="" /> | [**Easy Items**](https://github.com/Saladin2020/easyitems) | Item database, shops, inventory, loot tables and crafting; 44 starter items with pixel icons. | [`easyitems`](https://github.com/Saladin2020/easyitems) |
| <img src="docs/brand/logo-save-96.png" width="40" alt="" /> | [**Easy Save**](https://github.com/Saladin2020/easysave) | Versioned save slots with migrations and checksums; Thai / English / Malay string tables. | [`easysave`](https://github.com/Saladin2020/easysave) |
| <img src="docs/brand/logo-kit-96.png" width="40" alt="" /> | [**Easy Kit**](https://github.com/Saladin2020/easykit) | One command drives the Easy tools into a playable Godot 4.3+ and PixiJS game (portraits, schedules, battles, Thai pixel font) and ships it with Easy Ship; unified MCP server and `doctor`. | [`easykit`](https://github.com/Saladin2020/easykit) |
| <img src="docs/brand/logo-battle-96.png" width="40" alt="" /> | [**Easy Battle**](https://github.com/Saladin2020/easybattle) | Turn-based battles: party, bestiary, skills, statuses, bosses; seeded simulator; Godot + Pixi runtimes. | [`easybattle`](https://github.com/Saladin2020/easybattle) |
| <img src="docs/brand/logo-font-96.png" width="40" alt="" /> | [**Easy Font**](https://github.com/Saladin2020/easyfont) | Pixel bitmap fonts for Thai, Latin and Malay: stacking vowels and tones, BMFont / TTF for Godot + Pixi. | [`easyfont`](https://github.com/Saladin2020/easyfont) |
| <img src="docs/brand/logo-npc-96.png" width="40" alt="" /> | [**Easy NPC**](https://github.com/Saladin2020/easynpc) | NPC daily schedules with A* on Easy Tilemap maps, day / night, affinity, dialogue and quest hooks. | [`easynpc`](https://github.com/Saladin2020/easynpc) |
| <img src="docs/brand/logo-portrait-96.png" width="40" alt="" /> | **Easy Portrait** ← you are here | 64×64 dialogue portraits with 9 emotions, blink and talk frames, from Easy Sprite characters. | [`easyportrait`](https://github.com/Saladin2020/easyportrait) |
| <img src="docs/brand/logo-ship-96.png" width="40" alt="" /> | [**Easy Ship**](https://github.com/Saladin2020/easyship) | Toolchain doctor, web / Windows / Linux / Android builds, itch.io zips and butler plans; dry run by default. | [`easyship`](https://github.com/Saladin2020/easyship) |
<!-- easy-suite:table:end -->

## Credits

Portrait art is generated by this tool's code (MIT). Sample sprite projects come from Easy Sprite. Kanit font: SIL OFL
1.1. See [CREDITS.md](CREDITS.md).
