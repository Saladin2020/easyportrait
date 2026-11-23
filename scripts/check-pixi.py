"""Headless Chrome check of a PixiJS export: every portrait loads, blinks on the shared timing, talks, and switches
emotion (Thai / Malay aliases too).

  python3 scripts/check-pixi.py <pixi-export-dir> [screenshot.png]

Serves the folder on 127.0.0.1:8997. Prints a JSON report; exit 1 on problems or console errors.
"""
import asyncio, json, os, subprocess, sys, time
from playwright.async_api import async_playwright

DIR = sys.argv[1]
SHOT = sys.argv[2] if len(sys.argv) > 2 else None
PORT = 8997
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"], cwd=DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROME_PATH", "/usr/bin/google-chrome"), args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width": 1000, "height": 900})
        errs, problems = [], []
        pg.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("response", lambda r: errs.append(f"http {r.status}: {r.url}") if r.status >= 400 and not r.url.endswith("/pixi.min.js") else None)
        await pg.goto(f"http://127.0.0.1:{PORT}/index.html?cols=5&scale=2")
        await pg.wait_for_function("window.__ready === true", timeout=40000)
        n = await pg.evaluate("window.__portraits.views.length")
        total = await pg.evaluate("window.__portraits.lib.index.portraits.length")
        if n != total or n == 0:
            problems.append(f"{n} views for {total} portraits")
        # timing: drive every view by hand and compare with the core
        bad = await pg.evaluate("""(() => { const P = window.__portraits; P.app.ticker.stop(); const bad = [];
          const seen = { base: 0, blink: 0, talk: 0 };
          for (const v of P.views) { v.time = 0; v.setTalking(false);
            for (let i = 0; i < 300; i++) { v.update(1 / 30); const want = P.lib.frameAt(v.time, v.seed, false, v.emotion);
              if (v.frame !== want) bad.push([v.id, v.time, v.frame, want]); seen[v.frame]++; } }
          return { bad: bad.slice(0, 5), seen }; })()""")
        if bad["bad"]:
            problems.append(f"frame mismatch {bad['bad']}")
        if bad["seen"]["blink"] == 0:
            problems.append("nobody blinked in 10 s")
        talk = await pg.evaluate("""(() => { const v = window.__portraits.views[0]; v.say(0.5); const fr = [];
          let done = 0; v.on('done', () => done++); for (let i = 0; i < 20; i++) { v.update(0.05); fr.push(v.frame); } return { fr, done, talking: v.talking }; })()""")
        if "talk" not in talk["fr"] or talk["done"] != 1 or talk["talking"]:
            problems.append(f"say(): {talk}")
        emo = await pg.evaluate("""(async () => { const v = window.__portraits.views[1]; const t0 = v.sprite.texture.source.label || v.sprite.texture.source.uid;
          await v.setEmotion('ดีใจ'); const a = v.emotion; await v.setEmotion('marah'); const b = v.emotion; await v.setEmotion('no-such'); const c = v.emotion;
          return [a, b, c, (v.sprite.texture.source.uid !== undefined)]; })()""")
        if emo[:3] != ["happy", "angry", "neutral"]:
            problems.append(f"emotion aliases: {emo}")
        if SHOT:
            await pg.evaluate("""(async () => { const P = window.__portraits; for (const v of P.views) { v.time = 0.2; await v.setEmotion('happy'); v.update(0); } P.app.render(); })()""")
            await pg.wait_for_timeout(300)
            await pg.locator("canvas").screenshot(path=SHOT)
            await pg.goto(f"http://127.0.0.1:{PORT}/index.html?cols=4&scale=3&lang=en&emotion=surprised&ids=town_kopiah_boy,town_hijab_teacher,town_monk,town_vendor&paused=1")
            await pg.wait_for_function("window.__ready === true", timeout=40000)
            await pg.wait_for_timeout(400)
            await pg.locator("canvas").screenshot(path=SHOT.replace(".png", "-en.png"))
        real = [e for e in errs if "GL Driver Message" not in e and "Failed to load resource" not in e]
        report = {"views": n, "frames": bad["seen"], "say": talk["fr"][:12], "emotions": emo[:3], "problems": problems, "errors": real}
        print(json.dumps(report, ensure_ascii=False))
        await b.close()
        if problems or real:
            sys.exit(1)


try:
    asyncio.run(main())
finally:
    srv.terminate()
