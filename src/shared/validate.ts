import { BODIES, EMOTIONS, FEATURES, FORMAT, HAIR_STYLES, HEADWEAR, SHIRTS, type Diagnostic, type PortraitDoc, type PortraitSpec } from "./types.js";

const HEX = /^#[0-9a-fA-F]{6}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9_-]*$/;
const THAI = /[\u0E00-\u0E7F]/;
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
/** Portraits are of ordinary villagers: no prophets or other sacred figures. */
export const SACRED = /\b(prophet|nabi|muhammad|allah|jesus|christ|buddha|bodhisattva|god|goddess)\b|นบี|ศาสดา|อัลลอฮ์|พระพุทธเจ้า|พระเยซู|เทพเจ้า/i;

/** Validate one spec. `at` prefixes every diagnostic path. */
export function validateSpec(s: PortraitSpec, at: string): { errors: Diagnostic[]; warnings: Diagnostic[] } {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];
  const err = (p: string, m: string) => errors.push({ path: `${at}${p}`, message: m });
  const warn = (p: string, m: string) => warnings.push({ path: `${at}${p}`, message: m });
  if (typeof s !== "object" || !s) return err("", "portrait must be an object"), { errors, warnings };
  if (typeof s.id !== "string" || !SAFE_ID.test(s.id)) err(".id", `invalid id ${JSON.stringify(s.id)} (a-z, 0-9, _ or -)`);
  const enumOk = (k: keyof PortraitSpec, list: readonly string[], required = true) => {
    const v = s[k];
    if (v === undefined && !required) return;
    if (typeof v !== "string" || !list.includes(v)) err(`.${k}`, `${JSON.stringify(v)} is not one of ${list.join("|")}`);
  };
  enumOk("body", BODIES);
  enumOk("hairStyle", HAIR_STYLES);
  enumOk("headwear", HEADWEAR, false);
  enumOk("shirt", SHIRTS);
  for (const k of ["skin", "hair", "shirtColor"] as const) if (typeof s[k] !== "string" || !HEX.test(s[k])) err(`.${k}`, `${JSON.stringify(s[k])} is not #rrggbb`);
  for (const k of ["headwearColor", "headwearAccent", "accent", "eyes"] as const) if (s[k] !== undefined && !HEX.test(String(s[k]))) err(`.${k}`, `${JSON.stringify(s[k])} is not #rrggbb`);
  if (s.bg !== undefined && s.bg !== null && !HEX.test(String(s.bg))) err(".bg", "bg must be #rrggbb or null");
  if (s.features !== undefined) {
    if (!Array.isArray(s.features)) err(".features", "features must be an array");
    else for (const f of s.features) if (!(FEATURES as readonly string[]).includes(f)) err(".features", `unknown feature ${JSON.stringify(f)} (${FEATURES.join("|")})`);
  }
  if (s.emotions !== undefined) {
    if (!Array.isArray(s.emotions) || !s.emotions.length) err(".emotions", "emotions must be a non-empty array");
    else for (const e of s.emotions) if (!(EMOTIONS as readonly string[]).includes(e)) err(".emotions", `unknown emotion ${JSON.stringify(e)} (${EMOTIONS.join("|")})`);
  }
  if (s.name !== undefined) {
    if (typeof s.name !== "object" || typeof s.name.th !== "string" || typeof s.name.en !== "string" || !s.name.th || !s.name.en) err(".name", "name needs th and en");
    else {
      if (!THAI.test(s.name.th)) warn(".name.th", `"${s.name.th}" is not written in Thai script`);
      for (const [k, v] of Object.entries(s.name)) {
        if (typeof v !== "string") continue;
        if (ARABIC.test(v)) err(`.name.${k}`, "Arabic script is not used in names (no calligraphy); write a romanised or Thai name");
        if (SACRED.test(v)) err(`.name.${k}`, "portraits are for ordinary characters, not prophets or sacred figures");
      }
    }
  } else warn(".name", "no display name (Easy Dialogue will show the id)");
  if (SACRED.test(s.id ?? "")) err(".id", "portraits are for ordinary characters, not prophets or sacred figures");
  if (s.headwear && ["hijab", "tudung_school", "tudung_sarung", "shawl"].includes(s.headwear) && s.features?.includes("beard")) warn(".features", "beard under a hijab is hidden");
  return { errors, warnings };
}

export function validateDoc(doc: PortraitDoc, file: string): { errors: Diagnostic[]; warnings: Diagnostic[] } {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];
  if (!doc || typeof doc !== "object") return { errors: [{ path: file, message: "not an object" }], warnings };
  if (doc.format !== FORMAT) errors.push({ path: file, message: `format must be "${FORMAT}"` });
  if (!Array.isArray(doc.portraits)) return errors.push({ path: file, message: "portraits must be an array" }), { errors, warnings };
  doc.portraits.forEach((p, i) => {
    const r = validateSpec(p, `${file}:portraits[${i}]${p && typeof p.id === "string" ? `(${p.id})` : ""}`);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  });
  return { errors, warnings };
}
