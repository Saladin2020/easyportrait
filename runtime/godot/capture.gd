extends SceneTree
## Frame capture for previews (needs a renderer, e.g. xvfb-run … --rendering-driver opengl3):
##   godot --path <export> --script res://capture.gd -- frames=60 out=/tmp/portrait-frames [emotion=happy] [talk=1] [lang=th]
## Runs the demo scene, cycling emotions every 15 frames when emotion=cycle, at 1/30 s per frame.

var _args := {}
var _frame := 0
var _saved := 0
var _main


func _init() -> void:
	for a in OS.get_cmdline_user_args():
		var kv := a.split("=", true, 1)
		_args[kv[0]] = kv[1] if kv.size() > 1 else "1"
	DirAccess.make_dir_recursive_absolute(_args.get("out", "/tmp/easyportrait-frames"))
	await process_frame
	_main = load("res://main.tscn").instantiate()
	get_root().add_child(_main)
	await process_frame
	_main.lang = _args.get("lang", "th")
	for v in _main.views:
		v.autoplay = false
	if _args.get("emotion", "neutral") != "cycle":
		_main.set_emotion(_args.get("emotion", "neutral"))
	_main.set_talking(_args.has("talk"))


func _process(_delta: float) -> bool:
	_frame += 1
	var frames := int(_args.get("frames", "60"))
	if _frame > 3:
		if _args.get("emotion", "") == "cycle" and _saved % 15 == 0:
			var all := ["neutral", "happy", "sad", "surprised", "angry", "thinking", "shy", "worried", "sleepy"]
			_main.set_emotion(all[(_saved / 15) % all.size()])
		for v in _main.views:
			v.step(1.0 / 30.0)
		var img := get_root().get_texture().get_image()
		img.save_png("%s/frame_%04d.png" % [_args.get("out", "/tmp/easyportrait-frames"), _saved])
		_saved += 1
	if _saved >= frames:
		print("saved %d frames" % _saved)
		return true
	return false
