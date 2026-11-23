export const FORMAT = "easyportrait/1";
export const EXPORT_PRESETS = ["dialogue", "godot", "pixi", "png", "all"] as const;
export type ExportPreset = (typeof EXPORT_PRESETS)[number];

/** The seven Easy Dialogue emotions first (same names), then extras. */
export const EMOTIONS = ["neutral", "happy", "sad", "surprised", "angry", "thinking", "shy", "worried", "sleepy"] as const;
export type Emotion = (typeof EMOTIONS)[number];
export const DIALOGUE_EMOTIONS: readonly Emotion[] = ["neutral", "happy", "sad", "surprised", "angry", "thinking", "shy"];
export const EMOTION_TH: Record<Emotion, string> = { neutral: "ปกติ", happy: "ดีใจ", sad: "เศร้า", surprised: "ตกใจ", angry: "โกรธ", thinking: "คิด", shy: "เขิน", worried: "กังวล", sleepy: "ง่วง" };

export const BODIES = ["adult", "child", "elder", "stocky"] as const;
export type Body = (typeof BODIES)[number];
export const HAIR_STYLES = ["crop", "messy", "spiky", "curly", "bob", "long", "ponytail", "bun", "twintails", "balding", "shaved"] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
/** Head coverings. Hijab styles hide the hair. */
export const HEADWEAR = ["none", "hijab", "tudung_school", "tudung_sarung", "shawl", "kopiah", "songkok", "serban", "cap", "ngob", "pha_khao_ma", "flower"] as const;
export type Headwear = (typeof HEADWEAR)[number];
export const COVERING: readonly Headwear[] = ["hijab", "tudung_school", "tudung_sarung", "shawl"];
export const SHIRTS = ["baju_melayu", "baju_kurung", "jubah", "monk_robe", "mohom", "farmer", "tshirt", "hoodie", "blazer", "apron", "dress", "cardigan", "armor", "tank"] as const;
export type Shirt = (typeof SHIRTS)[number];
export const FEATURES = ["beard", "mustache", "glasses", "lashes", "freckles", "wrinkles", "mole"] as const;
export type Feature = (typeof FEATURES)[number];

export interface Name {
  th: string;
  en: string;
  ms?: string;
}

export interface PortraitSpec {
  id: string;
  name?: Name;
  body: Body;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  headwear?: Headwear;
  headwearColor?: string;
  /** Second colour of the headwear (songkok band, cap brim, pha khao ma check). */
  headwearAccent?: string;
  shirt: Shirt;
  shirtColor: string;
  /** Trim / buttons / pattern colour. */
  accent?: string;
  eyes?: string;
  features?: Feature[];
  /** Portrait background (null / omitted = transparent). */
  bg?: string | null;
  /** Which emotions to export (default all). */
  emotions?: Emotion[];
  /** Easy Sprite project this was built from. */
  from?: string;
}

export interface PortraitDoc {
  format: string;
  portraits: PortraitSpec[];
}

export interface Diagnostic {
  path: string;
  message: string;
}
