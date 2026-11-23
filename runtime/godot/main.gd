extends Control
## Demo: every portrait in a grid with its name. 1–9 = emotion, Space = talk, L = language.

var views: Array = []
var labels: Array = []
var lang := "th"
var emotion := "neutral"
var talking := false
var hud: Label


func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color("#140e0a")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var font: Font = load("res://easyportrait/fonts/Kanit-Regular.ttf")
	var ids: Array = Portraits.ids()
	var cols := 7
	for i in ids.size():
		var v := EasyPortrait.new()
		v.custom_minimum_size = Vector2(80, 80)
		v.size = Vector2(80, 80)
		v.position = Vector2(16 + (i % cols) * 100, 40 + (i / cols) * 112)
		add_child(v)
		v.character = ids[i]
		v.time = i * 0.41
		views.append(v)
		var l := Label.new()
		l.add_theme_font_override("font", font)
		l.add_theme_font_size_override("font_size", 12)
		l.position = v.position + Vector2(-6, 82)
		l.size = Vector2(92, 18)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		add_child(l)
		labels.append(l)
	hud = Label.new()
	hud.add_theme_font_override("font", font)
	hud.add_theme_font_size_override("font_size", 14)
	hud.position = Vector2(16, 8)
	add_child(hud)
	_update()


func set_emotion(e: String) -> void:
	emotion = e
	for v in views:
		v.emotion = e
	_update()


func set_talking(on: bool) -> void:
	talking = on
	for v in views:
		v.talking = on
	_update()


func _update() -> void:
	for i in views.size():
		labels[i].text = Portraits.name_of(views[i].character, lang)
	hud.text = "Easy Portrait · %s%s   (1–9 emotion · Space talk · L lang)" % [emotion, " · talking" if talking else ""]


func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed:
		var all := ["neutral", "happy", "sad", "surprised", "angry", "thinking", "shy", "worried", "sleepy"]
		if e.keycode >= KEY_1 and e.keycode <= KEY_9:
			set_emotion(all[e.keycode - KEY_1])
		elif e.keycode == KEY_SPACE:
			set_talking(not talking)
		elif e.keycode == KEY_L:
			lang = {"th": "en", "en": "ms", "ms": "th"}[lang]
			_update()
