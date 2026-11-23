/** Build a PortraitSpec from an Easy Sprite paperdoll project (selections + colors). Pure. */
import { BODIES, HAIR_STYLES, SHIRTS, type Body, type Feature, type HairStyle, type Headwear, type PortraitSpec, type Shirt } from "./types.js";

export interface SpriteProject {
  id: string;
  name?: string;
  view?: string;
  selections: Record<string, string | undefined>;
  colors?: Record<string, string | undefined>;
}

const SKIN: Record<string, string> = { light: "#e8c4a0", tan: "#c9956c", deep: "#8a5a3c" };
const SHIRT_DEFAULT: Partial<Record<Shirt, string>> = { monk_robe: "#e0841f", jubah: "#e8e6e0", mohom: "#2b3a67", armor: "#8a939d", baju_melayu: "#3f8a5a", baju_kurung: "#c8506a" };
const ACCESSORY_HAT: Record<string, Headwear> = { acc_kopiah: "kopiah", acc_songkok: "songkok", acc_cap: "cap", acc_ngob: "ngob", acc_flower: "flower" };
const COVER: Record<string, Headwear> = { hijab: "hijab", hijab_shawl: "shawl", tudung_school: "tudung_school", tudung_sarung: "tudung_sarung" };
const FACE: Record<string, Feature[]> = { face_beard: ["beard"], face_mustache: ["mustache"], face_glasses: ["glasses"], face_lashes: ["lashes"], face_elder: ["wrinkles"] };

export interface FromSpriteResult {
  spec: PortraitSpec;
  notes: string[];
}

export function specFromSprite(p: SpriteProject, id = p.id): FromSpriteResult {
  const sel = p.selections ?? {};
  const col = p.colors ?? {};
  const notes: string[] = [];
  const bodyId = sel.body ?? "body_light";
  if (bodyId.startsWith("animal_") || bodyId.includes("animal")) throw new Error(`${p.id}: animal bodies have no portrait (${bodyId})`);
  const parts = bodyId.replace(/^side_/, "").split("_");
  const body: Body = (BODIES as readonly string[]).includes(parts[1] ?? "") ? (parts[1] as Body) : "adult";
  const tone = parts[parts.length - 1] ?? "light";
  const skin = col.body ?? SKIN[tone] ?? SKIN.light!;
  const hairId = (sel.hair_front ?? "").replace(/^side_/, "").replace(/^hair_/, "").replace(/_front$/, "");
  let hairStyle: HairStyle = body === "elder" ? "balding" : "crop";
  let headwear: Headwear = "none";
  let headwearColor: string | undefined;
  let hair = col.hair_front ?? col.hair_back ?? (body === "elder" ? "#c8c4bc" : "#2a221c");
  if (COVER[hairId]) {
    headwear = COVER[hairId]!;
    headwearColor = col.hair_front;
    hair = "#2a221c";
    hairStyle = "long";
  } else if ((HAIR_STYLES as readonly string[]).includes(hairId)) hairStyle = hairId as HairStyle;
  else if (hairId) notes.push(`hair ${sel.hair_front} has no portrait style; using ${hairStyle}`);
  else if (body !== "elder") hairStyle = "shaved";
  const acc = sel.accessory?.replace(/^side_/, "");
  if (acc && ACCESSORY_HAT[acc]) {
    if (headwear === "none") {
      headwear = ACCESSORY_HAT[acc]!;
      headwearColor = col.accessory;
    } else notes.push(`${acc} ignored under ${headwear}`);
  } else if (acc) notes.push(`${acc} is a prop, not drawn in the portrait`);
  const features: Feature[] = [...(FACE[sel.face?.replace(/^side_/, "") ?? ""] ?? [])];
  if (body === "elder" && !features.includes("wrinkles")) features.push("wrinkles");
  const shirtId = (sel.shirt ?? "shirt_tshirt").replace(/^side_/, "").replace(/^shirt_/, "");
  const shirt: Shirt = (SHIRTS as readonly string[]).includes(shirtId) ? (shirtId as Shirt) : "tshirt";
  if (shirt !== shirtId) notes.push(`shirt ${sel.shirt} → tshirt`);
  const spec: PortraitSpec = {
    id,
    body,
    skin,
    hair,
    hairStyle,
    ...(headwear !== "none" ? { headwear } : {}),
    ...(headwearColor ? { headwearColor } : {}),
    shirt,
    shirtColor: col.shirt ?? SHIRT_DEFAULT[shirt] ?? "#6e8a9e",
    ...(features.length ? { features } : {}),
    from: p.id,
  };
  if (shirt === "apron" && col.shirt) spec.accent = "#efe6d2";
  return { spec, notes };
}
