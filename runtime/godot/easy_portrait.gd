@tool
class_name EasyPortrait
extends TextureRect
## A 64×64 Easy Portrait that blinks on its own and moves its mouth while `talking`.
## Needs the Portraits autoload (res://easyportrait/portraits.gd).

signal finished_talking

@export var character := "":
	set(v):
		character = v
		_refresh()
@export var emotion := "neutral":
	set(v):
		emotion = v
		_refresh()
@export var talking := false
@export var animate := true
## Advance time in _process (turn off to drive it with step()).
@export var autoplay := true

var time := 0.0
var frame := "base"
var _say_left := 0.0
var _strip: Array = []


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	if custom_minimum_size == Vector2.ZERO:
		custom_minimum_size = Vector2(64, 64)
	_refresh()


func _db():
	return get_node_or_null("/root/Portraits")


func _refresh() -> void:
	var db = _db()
	if db == null or character == "" or not is_inside_tree():
		return
	_strip = db.strip(character, emotion)
	_apply()


## Talk for `seconds`, then stop (emits finished_talking).
func say(seconds: float) -> void:
	_say_left = seconds
	talking = true


func step(delta: float) -> void:
	time += delta
	if _say_left > 0.0:
		_say_left -= delta
		if _say_left <= 0.0:
			talking = false
			finished_talking.emit()
	_apply()


func _apply() -> void:
	var db = _db()
	if db == null or _strip.is_empty():
		return
	frame = db.frame_at(time, db.seed_of_id(character), talking, db.resolve_emotion(character, emotion)) if animate else "base"
	texture = _strip[db.FRAMES.find(frame)]


func _process(delta: float) -> void:
	if autoplay and not Engine.is_editor_hint():
		step(delta)
