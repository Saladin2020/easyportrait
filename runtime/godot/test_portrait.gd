extends SceneTree
## godot --headless --path . --script res://test_portrait.gd   → prints OK (exit 0) or FAIL lines (exit 1)

var fails := 0


func check(cond: bool, msg: String) -> void:
	if not cond:
		fails += 1
		if fails < 20:
			print("FAIL ", msg)


func _init() -> void:
	await process_frame
	var db = get_root().get_node("Portraits")
	var f := FileAccess.open("res://easyportrait/parity.json", FileAccess.READ)
	var parity: Dictionary = JSON.parse_string(f.get_as_text())
	for id in parity.seeds:
		check(db.seed_of(id) == int(parity.seeds[id]), "seed %s" % id)
		check(db.seed_of_id(id) == int(parity.seeds[id]), "index seed %s" % id)
		check(absf(db.blink_period(int(parity.seeds[id])) - float(parity.periods[id])) < 1e-9, "period %s" % id)
	print("S|seeds %d" % parity.seeds.size())
	var n := 0
	for row in parity.frames:
		var got: String = db.frame_at(float(row[1]), db.seed_of(row[0]), bool(row[2]), row[3])
		check(got == row[4], "frame %s t=%s talk=%s → %s (want %s)" % [row[0], row[1], row[2], got, row[4]])
		n += 1
	print("F|frames %d" % n)
	var imgs := 0
	for id in db.ids():
		check(db.name_of(id, "th") != "", "name %s" % id)
		for e in db.emotions_of(id):
			var s: Array = db.strip(id, e)
			check(s.size() == 3, "strip %s/%s" % [id, e])
			if s.size() == 3:
				check(s[0].atlas.get_width() == 192 and s[0].atlas.get_height() == 64, "strip size %s/%s" % [id, e])
				check(s[1].region.position.x == 64.0, "blink region %s/%s" % [id, e])
			var single: Texture2D = load("res://easyportrait/portraits/%s/%s.png" % [id, e])
			check(single != null and single.get_width() == 64, "single %s/%s" % [id, e])
			imgs += 1
	print("I|images %d" % imgs)
	check(db.normalize_emotion("ดีใจ") == "happy" and db.normalize_emotion("Marah") == "angry" and db.normalize_emotion("custom") == "custom", "aliases")
	var id0: String = db.ids()[0]
	check(db.resolve_emotion(id0, "nope") == "neutral", "fallback emotion")
	# the node: say() talks, then stops and emits finished_talking
	var p := EasyPortrait.new()
	p.animate = true
	get_root().add_child(p)
	p.character = id0
	p.emotion = "โกรธ"
	var done := [false]
	p.finished_talking.connect(func(): done[0] = true)
	p.say(0.5)
	var saw_talk := false
	for i in 10:
		p.step(0.06)
		if p.frame == "talk":
			saw_talk = true
	check(saw_talk, "node talks")
	check(done[0] and not p.talking, "say() ends")
	check(p.texture != null, "node texture")
	print("N|node ok")
	if fails == 0:
		print("OK")
		quit(0)
	else:
		print("FAILED %d" % fails)
		quit(1)
