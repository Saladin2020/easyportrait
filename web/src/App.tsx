import { useCallback, useEffect, useMemo, useState } from "react";
import { frameAt, seedOf } from "../../src/shared/engine";
import { validateSpec } from "../../src/shared/validate";
import type { Emotion, PortraitSpec } from "../../src/shared/types";
import { get, post, type Diag, type Loaded, type Summary } from "./api";
import { Portrait } from "./Portrait";

const TABS = ["editor", "sheet", "sprites", "check"] as const;
type Tab = (typeof TABS)[number];
const TAB_TH: Record<Tab, string> = { editor: "แก้ไข", sheet: "ทั้งหมด", sprites: "จาก Easy Sprite", check: "ตรวจ" };
const HW_TH: Record<string, string> = { none: "ไม่มี", hijab: "ฮิญาบ", tudung_school: "ผ้าคลุมนักเรียน", tudung_sarung: "ผ้าคลุมสวม", shawl: "ผ้าคลุมไหล่", kopiah: "หมวกกปิเยาะห์", songkok: "ซองก๊อก", serban: "ผ้าโพก", cap: "หมวกแก๊ป", ngob: "งอบ", pha_khao_ma: "ผ้าขาวม้า", flower: "ดอกไม้" };

export function App() {
  const [ws, setWs] = useState<Summary | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [tab, setTab] = useState<Tab>("editor");
  const [status, setStatus] = useState("");
  const [sel, setSel] = useState("town_kopiah_boy");
  const [lang, setLang] = useState<"th" | "en" | "ms">("th");
  const reload = useCallback(async () => {
    try {
      setWs(await get<Summary>("/api/workspace"));
      setData(await get<Loaded>("/api/portraits"));
    } catch (e) {
      setStatus((e as Error).message);
    }
  }, []);
  useEffect(() => void reload(), [reload]);
  if (!ws || !data) return <div className="loading">Loading… {status}</div>;
  const cur = data.portraits.find((p) => p.id === sel) ?? data.portraits[0];
  return (
    <>
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" />
          <div>
            <h1 className="brand">Easy <span>Portrait</span></h1>
            <p className="brand-th">ภาพหน้าตัวละคร · {data.portraits.length} portraits · {ws.enums.emotions.length} emotions × blink / talk</p>
          </div>
        </div>
        <div className="status">{status || ws.root}</div>
      </header>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)} data-tab={t}>{TAB_TH[t]} · {t}</button>
        ))}
        <span style={{ flex: 1 }} />
        {(["th", "en", "ms"] as const).map((l) => (
          <button key={l} className={l === lang ? "on" : ""} onClick={() => setLang(l)}>{l}</button>
        ))}
      </nav>
      {tab === "editor" && cur && (
        <div className="layout">
          <aside className="panel list">
            <h3>Portraits</h3>
            <div className="cast">
              {data.portraits.map((p) => (
                <button key={p.id} className={`item-btn${p.id === cur.id ? " on" : ""}`} onClick={() => setSel(p.id)} data-id={p.id}>
                  <Portrait spec={p} scale={1} />
                  <span><b>{p.name?.[lang] ?? p.id}</b><small className="mono">{p.id}</small></span>
                </button>
              ))}
            </div>
          </aside>
          <Editor key={cur.id} spec={cur} ws={ws} lang={lang} onSaved={(m, id) => { setStatus(m); if (id) setSel(id); void reload(); }} />
        </div>
      )}
      {tab === "sheet" && <Sheet data={data} ws={ws} lang={lang} />}
      {tab === "sprites" && <Sprites ws={ws} onSaved={(m, id) => { setStatus(m); setSel(id); setTab("editor"); void reload(); }} />}
      {tab === "check" && <Check onStatus={setStatus} />}
    </>
  );
}

function Editor({ spec: initial, ws, lang, onSaved }: { spec: PortraitSpec & { doc: string }; ws: Summary; lang: string; onSaved: (m: string, id?: string) => void }) {
  const { doc, ...rest } = initial;
  const [s, setS] = useState<PortraitSpec>(rest);
  const [emotion, setEmotion] = useState<Emotion>("happy");
  const [talking, setTalking] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      setT((performance.now() - t0) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const v = useMemo(() => validateSpec(s, s.id), [s]);
  const set = (k: keyof PortraitSpec, val: unknown) => setS((o) => {
    const n = { ...o } as Record<string, unknown>;
    if (val === undefined || val === "") delete n[k];
    else n[k] = val;
    return n as unknown as PortraitSpec;
  });
  const toggle = (f: string) => {
    const cur = new Set(s.features ?? []);
    if (cur.has(f as never)) cur.delete(f as never);
    else cur.add(f as never);
    set("features", cur.size ? [...cur] : undefined);
  };
  const frame = v.errors.length ? "base" : frameAt(t, seedOf(s.id), talking, emotion);
  const save = () => post<{ file: string; created: boolean }>("/api/portrait", { spec: s, doc }).then((r) => onSaved(`${r.created ? "added" : "saved"} ${s.id} → ${r.file}`, s.id)).catch((e: Error) => onSaved(e.message));
  const sel = (k: keyof PortraitSpec, list: string[], labels?: Record<string, string>) => (
    <select value={String(s[k] ?? (k === "headwear" ? "none" : ""))} onChange={(e) => set(k, k === "headwear" && e.target.value === "none" ? undefined : e.target.value)} data-field={k}>
      {list.map((x) => <option key={x} value={x}>{labels?.[x] ? `${labels[x]} · ${x}` : x}</option>)}
    </select>
  );
  const color = (k: keyof PortraitSpec, label: string) => (
    <label className="swatch">
      <input type="color" value={String(s[k] ?? "#000000")} onChange={(e) => set(k, e.target.value)} />
      <span>{label}</span>
    </label>
  );
  return (
    <>
      <section className="panel">
        <div className="hero-portrait">
          <div className="big"><Portrait spec={s} emotion={emotion} frame={frame} scale={4} /></div>
          <div>
            <h2>{s.name?.[lang as "th"] ?? s.id} <small className="mono">{s.id}{s.from ? ` ← ${s.from}` : ""}</small></h2>
            <div className="chips">
              {ws.enums.emotions.map((e) => (
                <button key={e} className={e === emotion ? "on" : ""} onClick={() => setEmotion(e as Emotion)} data-emotion={e}>{ws.enums.emotionsTh[e]} · {e}</button>
              ))}
            </div>
            <div className="row">
              <button className={talking ? "primary" : ""} onClick={() => setTalking(!talking)}>{talking ? "■ หยุดพูด" : "▶ พูด / talk"}</button>
              <span className="hint">frame: {frame} · blink every {(3.2 + seedOf(s.id) * 0.35).toFixed(2)} s</span>
            </div>
            <div className="frames">
              {(["base", "blink", "talk"] as const).map((f) => <figure key={f}><Portrait spec={s} emotion={emotion} frame={f} scale={2} /><figcaption>{f}</figcaption></figure>)}
            </div>
          </div>
        </div>
        <h4>ทุกอารมณ์ · all emotions</h4>
        <div className="emotion-row">
          {ws.enums.emotions.map((e) => <figure key={e} onClick={() => setEmotion(e as Emotion)}><Portrait spec={s} emotion={e as Emotion} scale={1.5} /><figcaption>{ws.enums.emotionsTh[e]}</figcaption></figure>)}
        </div>
      </section>
      <aside className="panel form">
        <h3>Spec</h3>
        <div className="grid2">
          <label>ชื่อไทย<input value={s.name?.th ?? ""} onChange={(e) => set("name", { ...(s.name ?? { en: s.id }), th: e.target.value })} /></label>
          <label>English<input value={s.name?.en ?? ""} onChange={(e) => set("name", { ...(s.name ?? { th: s.id }), en: e.target.value })} /></label>
          <label>Melayu<input value={s.name?.ms ?? ""} onChange={(e) => set("name", { ...(s.name ?? { th: s.id, en: s.id }), ms: e.target.value })} /></label>
          <label>body{sel("body", ws.enums.bodies)}</label>
          <label>hair style{sel("hairStyle", ws.enums.hairStyles)}</label>
          <label>headwear{sel("headwear", ws.enums.headwear, HW_TH)}</label>
          <label>shirt{sel("shirt", ws.enums.shirts)}</label>
        </div>
        <div className="ramp-row">
          {color("skin", "skin")}
          {color("hair", "hair")}
          {color("headwearColor", "headwear")}
          {color("headwearAccent", "hw accent")}
          {color("shirtColor", "shirt")}
          {color("accent", "accent")}
          {color("eyes", "eyes")}
        </div>
        <h4>features</h4>
        <div className="chips">
          {ws.enums.features.map((f) => <button key={f} className={s.features?.includes(f as never) ? "on" : ""} onClick={() => toggle(f)}>{f}</button>)}
        </div>
        <div className="row">
          <label><input type="checkbox" checked={!!s.bg} onChange={(e) => set("bg", e.target.checked ? "#3a2819" : undefined)} /> background</label>
          {s.bg && color("bg", "bg")}
        </div>
        <div className="diag">
          {v.errors.map((d: Diag, i) => <p key={i} className="err">{d.path}: {d.message}</p>)}
          {v.warnings.map((d: Diag, i) => <p key={i} className="warn">{d.path}: {d.message}</p>)}
        </div>
        <div className="row">
          <button className="primary" disabled={v.errors.length > 0} onClick={save}>Save · บันทึก</button>
          <button onClick={() => setS(rest)}>Revert</button>
          <button onClick={() => { const id = prompt("New id (a-z0-9_)", `${s.id}_2`); if (id) setS({ ...s, id, from: undefined }); }}>Duplicate</button>
        </div>
        <h4>Export</h4>
        <div className="row">
          {["dialogue", "godot", "pixi", "png", "all"].map((p) => (
            <button key={p} onClick={() => post<{ dirs: string[]; files: number }>("/api/export", { preset: p }).then((r) => onSaved(`exported ${r.files} files → ${r.dirs.join(", ")}`)).catch((e: Error) => onSaved(e.message))}>{p}</button>
          ))}
        </div>
      </aside>
    </>
  );
}

function Sheet({ data, ws, lang }: { data: Loaded; ws: Summary; lang: string }) {
  return (
    <div className="layout one">
      <section className="panel">
        <table className="sheet">
          <thead>
            <tr><th />{ws.enums.emotions.map((e) => <th key={e}>{ws.enums.emotionsTh[e]}<br /><small>{e}</small></th>)}</tr>
          </thead>
          <tbody>
            {data.portraits.map((p) => (
              <tr key={p.id}>
                <td><b>{p.name?.[lang as "th"] ?? p.id}</b><br /><small className="mono">{p.id}</small></td>
                {ws.enums.emotions.map((e) => <td key={e}><Portrait spec={p} emotion={e as Emotion} scale={1} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Sprites({ ws, onSaved }: { ws: Summary; onSaved: (m: string, id: string) => void }) {
  const [preview, setPreview] = useState<{ spec: PortraitSpec; notes: string[] } | null>(null);
  const [sprite, setSprite] = useState("");
  const [id, setId] = useState("");
  const [err, setErr] = useState("");
  const load = (sp: string) => {
    setSprite(sp);
    setId(sp);
    post<{ spec: PortraitSpec; notes: string[] }>("/api/from-sprite", { sprite: sp, write: false }).then((r) => { setPreview(r); setErr(""); }).catch((e: Error) => setErr(e.message));
  };
  return (
    <div className="layout">
      <aside className="panel list">
        <h3>Easy Sprite projects</h3>
        {ws.sprites.map((s) => <button key={s} className={`item-btn${s === sprite ? " on" : ""}`} onClick={() => load(s)} data-sprite={s}><b>{s}</b></button>)}
      </aside>
      <section className="panel">
        {err && <p className="err">{err}</p>}
        {preview && (
          <>
            <div className="emotion-row">
              {(["neutral", "happy", "sad", "surprised", "angry", "thinking", "shy"] as Emotion[]).map((e) => <figure key={e}><Portrait spec={preview.spec} emotion={e} scale={2} /><figcaption>{e}</figcaption></figure>)}
            </div>
            {preview.notes.map((n) => <p key={n} className="warn">{n}</p>)}
            <div className="row">
              <label>portrait id <input value={id} onChange={(e) => setId(e.target.value)} className="mono" /></label>
              <button className="primary" onClick={() => post<{ file: string }>("/api/from-sprite", { sprite, id, write: true }).then((r) => onSaved(`saved ${id} → ${r.file}`, id)).catch((e: Error) => setErr(e.message))}>Add portrait</button>
            </div>
            <pre className="json">{JSON.stringify(preview.spec, null, 2)}</pre>
          </>
        )}
        {!preview && !err && <p className="hint">Pick an Easy Sprite paperdoll project: body, skin, hair, hijab / kopiah / songkok / ngob, glasses / beard and the shirt carry over.</p>}
      </section>
    </div>
  );
}

function Check({ onStatus }: { onStatus: (m: string) => void }) {
  const [r, setR] = useState<{ ok: boolean; portraits: number; errors: Diag[]; warnings: Diag[] } | null>(null);
  useEffect(() => void get<typeof r>("/api/check").then(setR).catch((e: Error) => onStatus(e.message)), [onStatus]);
  if (!r) return null;
  return (
    <div className="layout one">
      <section className="panel diag">
        <h3>{r.ok ? `✓ ${r.portraits} portraits OK` : `${r.errors.length} errors`}</h3>
        {r.errors.map((d, i) => <p key={i} className="err">{d.path}: {d.message}</p>)}
        {r.warnings.map((d, i) => <p key={i} className="warn">{d.path}: {d.message}</p>)}
      </section>
    </div>
  );
}
