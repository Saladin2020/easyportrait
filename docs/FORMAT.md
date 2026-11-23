# Easy Portrait format

## Source: `portraits/<doc>.easyportrait.json`

```json
{
  "format": "easyportrait/1",
  "portraits": [
    {
      "id": "town_kopiah_boy",
      "name": { "th": "อาดัม", "en": "Adam", "ms": "Adam" },
      "body": "child",
      "skin": "#e8c4a0",
      "hair": "#2a221c",
      "hairStyle": "crop",
      "headwear": "kopiah",
      "headwearColor": "#f2efe6",
      "shirt": "baju_melayu",
      "shirtColor": "#3f8a5a",
      "from": "kopiah_boy"
    }
  ]
}
```

Every document in `portraits/` is loaded; ids must be unique across them.

| Field | Values |
|---|---|
| `id` | `a-z 0-9 _ -`; becomes the folder name (`portraits/<id>/`) |
| `name` | `{ th, en, ms? }` — Thai in Thai script |
| `body` | `adult` · `child` · `elder` · `stocky` |
| `skin`, `hair`, `shirtColor` | `#rrggbb` |
| `hairStyle` | `crop` `messy` `spiky` `curly` `bob` `long` `ponytail` `bun` `twintails` `balding` `shaved` |
| `headwear` | `none` · coverings `hijab` `tudung_school` `tudung_sarung` `shawl` (hide the hair) · hats `kopiah` `songkok` `serban` `cap` `ngob` `pha_khao_ma` `flower` |
| `headwearColor`, `headwearAccent` | `#rrggbb` (accent = songkok band, cap brim, pha khao ma check) |
| `shirt` | `baju_melayu` `baju_kurung` `jubah` `monk_robe` `mohom` `farmer` `tshirt` `hoodie` `blazer` `apron` `dress` `cardigan` `armor` `tank` |
| `accent` | trim / buttons / apron / inner shirt colour |
| `eyes` | iris colour |
| `features` | `beard` `mustache` `glasses` `lashes` `freckles` `wrinkles` `mole` |
| `bg` | `#rrggbb` patterned background, or `null` / omitted for transparent |
| `emotions` | subset of `neutral happy sad surprised angry thinking shy worried sleepy` (default all) |
| `from` | the Easy Sprite project it was built from (informational) |

## From Easy Sprite

`from-sprite <project>` reads `sprites/<project>.json` (or a `.json` path, or asks the `easysprite` CLI):

- `body_<type>_<tone>` → `body` and skin (the project's `colors.body` wins)
- `hair_<style>_front` → `hairStyle`; `hair_hijab*` / `hair_tudung_*` → `headwear` with `colors.hair_front`
- `acc_kopiah` / `acc_songkok` / `acc_cap` / `acc_ngob` / `acc_flower` → `headwear`; other props are noted and skipped
- `face_beard` / `face_mustache` / `face_glasses` / `face_lashes` / `face_elder` → `features`
- `shirt_<x>` → `shirt` with `colors.shirt`

Animal bodies are refused.

## Frames and timing

Each emotion has three 64×64 frames: `base`, `blink` (eyes closed), `talk` (mouth open). Strips are 192×64 in that
order. Timing (seconds): blink every `3.2 + 0.35 × seed`, phase offset `0.53 × seed`, length `0.14`; `seed` =
FNV-1a(id) mod 7. Talking alternates talk / base every `0.12`, starting open. Blink wins over talk; `sleepy` never blinks.

## Exports

- `portrait.json` (per character): `{ format: "easydialogue-portrait/1", id, source: "easyportrait", size: 64, emotions, name, frames: { file: "frames/<emotion>.png", order, width, timing } }`
- `portraits.json` (Godot / Pixi index): `{ format: "easyportrait-index/1", size, frames, timing, emotionsTh, portraits: [{ id, name, emotions, seed, from? }] }`
- `parity.json` (Godot): reference `[id, t, talking, emotion, frame]` rows for `test_portrait.gd`.
