extends Node
## Easy Portrait autoload ("Portraits"). Loads res://easyportrait/portraits.json and the Easy Dialogue-layout
## folders next to it. Timing (frame_at / seed_of) matches the TypeScript engine; test_portrait.gd checks parity.

const BASE := "res://easyportrait/"
const FRAMES := ["base", "blink", "talk"]
const ALIASES := {
	"ปกติ": "neutral", "เฉย": "neutral", "ดีใจ": "happy", "ยิ้ม": "happy", "สุข": "happy", "เศร้า": "sad", "เสียใจ": "sad",
	"ตกใจ": "surprised", "แปลกใจ": "surprised", "โกรธ": "angry", "โมโห": "angry", "คิด": "thinking", "สงสัย": "thinking",
	"เขิน": "shy", "อาย": "shy", "กังวล": "worried", "ห่วง": "worried", "ง่วง": "sleepy",
	"gembira": "happy", "sedih": "sad", "terkejut": "surprised", "marah": "angry", "fikir": "thinking", "malu": "shy",
	"risau": "worried", "mengantuk": "sleepy", "smile": "happy", "joy": "happy", "surprise": "surprised", "mad": "angry",
	"think": "thinking", "embarrassed": "shy", "worry": "worried", "tired": "sleepy",
}

var index: Dictionary = {}
var timing: Dictionary = {"blinkEvery": 3.2, "blinkSpread": 0.35, "blinkLength": 0.14, "talkStep": 0.12}
var _by_id: Dictionary = {}
var _strips: Dictionary = {}


func _ready() -> void:
	load_index(BASE + "portraits.json")


func load_index(path: String) -> bool:
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		push_warning("Easy Portrait: %s not found" % path)
		return false
	index = JSON.parse_string(f.get_as_text())
	timing = index.get("timing", timing)
	_by_id.clear()
	_strips.clear()
	for p in index.get("portraits", []):
		_by_id[p.id] = p
	return true


func ids() -> Array:
	return _by_id.keys()


func has(id: String) -> bool:
	return _by_id.has(id)


func name_of(id: String, lang := "th") -> String:
	var p = _by_id.get(id)
	if p == null:
		return id
	return str(p.name.get(lang, p.name.get("th", id)))


func emotions_of(id: String) -> Array:
	var p = _by_id.get(id)
	return p.emotions if p else []


func seed_of_id(id: String) -> int:
	var p = _by_id.get(id)
	return int(p.seed) if p else seed_of(id)


static func normalize_emotion(e: String) -> String:
	var k := e.strip_edges()
	if ALIASES.has(k):
		return ALIASES[k]
	if ALIASES.has(k.to_lower()):
		return ALIASES[k.to_lower()]
	return k.to_lower()


## Falls back to neutral when the character has no such emotion.
func resolve_emotion(id: String, emotion: String) -> String:
	var e := normalize_emotion(emotion)
	var list := emotions_of(id)
	return e if list.has(e) else ("neutral" if list.has("neutral") else (list[0] if list.size() else e))


func texture(id: String, emotion := "neutral") -> Texture2D:
	return strip(id, emotion)[0]


## [base, blink, talk] AtlasTextures of one emotion (cached).
func strip(id: String, emotion := "neutral") -> Array:
	var e := resolve_emotion(id, emotion)
	var key := id + "/" + e
	if _strips.has(key):
		return _strips[key]
	var tex: Texture2D = load(BASE + "portraits/%s/frames/%s.png" % [id, e])
	var out := []
	if tex:
		var s := int(index.get("size", 64))
		for i in 3:
			var a := AtlasTexture.new()
			a.atlas = tex
			a.region = Rect2(i * s, 0, s, s)
			out.append(a)
	_strips[key] = out
	return out


## FNV-1a over UTF-16 code units → 0..6 (same as seedOf in TypeScript).
static func seed_of(id: String) -> int:
	var h := 0x811c9dc5
	for i in id.length():
		h = h ^ id.unicode_at(i)
		h = (h * 0x01000193) & 0xffffffff
	return h % 7


func blink_period(seed: int) -> float:
	return float(timing.blinkEvery) + seed * float(timing.blinkSpread)


func frame_at(t: float, seed: int, talking: bool, emotion := "neutral") -> String:
	var p := blink_period(seed)
	var phase := fmod(fmod(t + seed * 0.53, p) + p, p)
	if emotion != "sleepy" and phase > p - float(timing.blinkLength):
		return "blink"
	if talking and int(floor(t / float(timing.talkStep))) % 2 == 0:
		return "talk"
	return "base"
