export { get, post } from "./api.base";
import type { PortraitSpec } from "../../src/shared/types";
export type { PortraitSpec };
export type Name = { th: string; en: string; ms?: string };
export interface Diag { path: string; message: string }
export interface Summary {
  root: string;
  docs: string[];
  portraits: Array<{ id: string; doc: string; name?: Name; body: string; headwear: string; shirt: string; emotions: number; from?: string }>;
  sprites: string[];
  errors: number;
  warnings: number;
  enums: { bodies: string[]; hairStyles: string[]; headwear: string[]; shirts: string[]; features: string[]; emotions: string[]; emotionsTh: Record<string, string> };
}
export interface Loaded { portraits: Array<PortraitSpec & { doc: string }>; errors: Diag[]; warnings: Diag[] }
