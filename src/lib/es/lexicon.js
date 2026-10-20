// The shared Spanish → Russian dictionary (src/data/dict.json, built by scripts/build-dict.mjs), most frequent first.
// Entry: { w: word, p: part of speech (n a v adv num pron prep conj intj), g: gender of a noun (m f mf c), m: meanings,
//   u: no plural, only: plural only (gafas), forms: the plural of a noun / "feminine masc.pl fem.pl" of an adjective, rank }
import RAW from "../../data/dict.json" with { type: "json" };

export const LEX = RAW.map(([w, p, g, m, f, forms], i) => ({ w, p, g, m, u: f.includes("u"), only: f.includes("p"), forms, rank: i + 1 }));
export const POS_RU = { n: "сущ.", a: "прил.", v: "гл.", adv: "нареч.", num: "числ.", pron: "мест.", prep: "предл.", conj: "союз", intj: "межд." };
const first = new Map();
for (const e of LEX) if (!first.has(e.w)) first.set(e.w, e);
export const entry = (w) => first.get(w);
// a short translation for a prompt: the first meaning, up to the first ";" and about 60 characters
export function gloss(e, max = 60) {
  const s = e.m[0].split(/;\s*/)[0];
  return s.length > max ? s.slice(0, max).replace(/[\s,]+\S*$/, "") + "…" : s;
}
