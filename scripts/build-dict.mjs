// Builds src/data/dict.json — the shared Spanish → Russian dictionary of frequent words.
//
// Sources (both CC BY-SA, see src/data/README.md):
//   - Spanish entries of the Russian Wiktionary, machine-readable extract by kaikki.org (wiktextract)
//   - FrequencyWords by Hermit Dave, Spanish word frequencies from OpenSubtitles 2018 (top 50k)
//   - Spanish nouns and adjectives of the English Wiktionary (kaikki.org): gender where the Russian one has none,
//     plurals, and the four forms of adjectives
// A word gets in if it, or one of its forms, appears in the frequency list. Verb forms are mapped to the
// infinitive with our own conjugation engine; the engine's verbs always get in, with their curated meanings.
//
// Run: npm run build:dict   (downloads into .cache/ on first run; the output is committed)
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { REGULAR, IRR, TENSES, form, part, MEAN } from "../src/lib/conjugation.js";

const CACHE = new URL("../.cache/", import.meta.url);
const SRC = {
  wikt: ["ru-es.jsonl", "https://kaikki.org/ruwiktionary/%D0%98%D1%81%D0%BF%D0%B0%D0%BD%D1%81%D0%BA%D0%B8%D0%B9/kaikki.org-dictionary-%D0%98%D1%81%D0%BF%D0%B0%D0%BD%D1%81%D0%BA%D0%B8%D0%B9.jsonl"],
  enNoun: ["en-noun.jsonl", "https://kaikki.org/dictionary/Spanish/pos-noun/kaikki.org-dictionary-Spanish-by-pos-noun.jsonl"],
  enAdj: ["en-adj.jsonl", "https://kaikki.org/dictionary/Spanish/pos-adj/kaikki.org-dictionary-Spanish-by-pos-adj.jsonl"],
  freq: ["es_50k.txt", "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt"],
};
async function load([name, url]) {
  mkdirSync(CACHE, { recursive: true });
  const file = new URL(name, CACHE);
  if (!existsSync(file)) {
    console.log("downloading", url);
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " → " + r.status);
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  }
  return readFileSync(file, "utf8");
}

const POS = { noun: "n", adj: "a", verb: "v", adv: "adv", num: "num", pron: "pron", prep: "prep", conj: "conj", intj: "intj" };
// wiki leftovers: [[ ]], stray braces and brackets, footnote numbers like узел[2]
function cleanGloss(g) {
  let s = g.replace(/\[\[|\]\]|[{}]/g, "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
  s = s.replace(/^[\[\]]+|[\[\]]+$/g, "").trim();
  if (s.length > 110) { const cut = s.slice(0, 110).lastIndexOf(";"); s = (cut > 40 ? s.slice(0, cut) : s.slice(0, 107).replace(/\s+\S*$/, "")) + (cut > 40 ? "" : "…"); }
  return s;
}
function gender(e) {
  const c = (e.categories || []).map((x) => x.name);
  if (c.includes("Общий род/es")) return "c";
  const m = c.includes("Мужской род/es"), f = c.includes("Женский род/es");
  return m && f ? "mf" : m ? "m" : f ? "f" : "";
}

const freq = new Map();
for (const line of (await load(SRC.freq)).split("\n")) { const [w, c] = line.trim().split(" "); if (w) freq.set(w, +c); }

const entries = [], anyWord = new Set(); // anyWord: headwords of every part of speech, articles and phrases included
for (const line of (await load(SRC.wikt)).split("\n")) {
  if (!line.trim()) continue;
  const e = JSON.parse(line), p = POS[e.pos];
  anyWord.add(e.word);
  if (!p || !/^[a-záéíóúüñ]+$/.test(e.word)) continue; // single lowercase words only
  const senses = [...new Set((e.senses || []).flatMap((s) => s.glosses || []).map(cleanGloss).filter((g) => g.length > 1))].slice(0, 8);
  if (!senses.length) continue;
  // u: a noun without a plural (oxígeno, budismo) — Wiktionary writes "-" as its plural
  const u = p === "n" && (e.forms || []).some((f) => (f.tags || []).includes("plural") && f.form === "-");
  entries.push({ w: e.word, p, g: p === "n" ? gender(e) : "", u, m: senses, forms: (e.forms || []).map((f) => f.form).filter((f) => /^[a-záéíóúüñ]+$/.test(f)) });
}

// every form of the engine's verbs counts for its infinitive
const ENGINE = REGULAR.concat(Object.keys(IRR));
const verbForms = new Map(ENGINE.map((v) => {
  const fs = new Set([part(v)]);
  for (const T of TENSES) for (let p = 0; p < 6; p++) { const f = form(v, T.k, p); if (f) f.split(" ").forEach((x) => fs.add(x)); }
  return [v, fs];
}));
// a form that is a word of its own (una — article and subjunctive of unir) doesn't add to the verb
const isLemma = new Set([...entries.map((e) => e.w), ...anyWord]);
function score(e) {
  let s = freq.get(e.w) || 0;
  const fs = e.p === "v" && verbForms.has(e.w) ? verbForms.get(e.w) : new Set(e.forms);
  for (const f of fs) if (f !== e.w && !isLemma.has(f)) s += freq.get(f) || 0;
  return s;
}
for (const e of entries) e.s = score(e);
// the engine's verbs: always in, with the curated meanings used on the conjugation page
for (const v of ENGINE) {
  const mean = MEAN[v].split("; ");
  const e = entries.find((x) => x.w === v && x.p === "v");
  if (e) { e.m = mean; e.s = Math.max(e.s, 1); }
  else entries.push({ w: v, p: "v", g: "", m: mean, forms: [], s: Math.max(score({ w: v, p: "v", forms: [] }), 1) });
}

// homonyms of one word and part of speech become one entry: meanings merged, genders combined
const merged = new Map();
for (const e of entries.filter((x) => x.s > 0)) {
  const k = e.w + "|" + e.p, o = merged.get(k);
  if (!o) { merged.set(k, { ...e, m: [...e.m] }); continue; }
  o.m = [...new Set([...o.m, ...e.m])].slice(0, 8); o.s = Math.max(o.s, e.s); o.u = o.u && e.u;
  if (e.g && e.g !== o.g) o.g = !o.g ? e.g : o.g === "c" || e.g === "c" ? "c" : "mf";
}
// English Wiktionary: per word, the gender of every head ("hotel m", "estudiante m or f by sense", "padres m pl"),
// the plural, and the feminine and plural forms of adjectives
const want = new Set([...merged.values()].map((e) => e.w));
const enN = new Map(), enA = new Map();
for (const line of (await load(SRC.enNoun)).split("\n")) {
  if (!line) continue;
  const e = JSON.parse(line);
  if (!want.has(e.word)) continue;
  const o = enN.get(e.word) || enN.set(e.word, { g: new Set(), pl: "", only: false, unc: false }).get(e.word);
  for (const h of e.head_templates || []) {
    const t = h.expansion.slice(e.word.length).replace(/\(.*\)/, " ").trim();
    if (/by sense/.test(t)) o.g.add("c");
    else if (/\bm\b.*\bor\b.*\bf\b|\bf\b.*\bor\b.*\bm\b/.test(t)) o.g.add("mf");
    else if (/^m\b/.test(t)) o.g.add("m");
    else if (/^f\b/.test(t)) o.g.add("f");
    if (/\bpl\b/.test(t)) o.only = true;
    if (/uncountable/.test(h.expansion) && !/countable and uncountable|usually uncountable/.test(h.expansion)) o.unc = true;
  }
  const pl = (e.forms || []).find((f) => (f.tags || []).join() === "plural" && /^[a-záéíóúüñ]+$/.test(f.form));
  if (pl && !o.pl) o.pl = pl.form;
  // a separate feminine form (médica, loba): the word itself is the masculine one
  if ((e.forms || []).some((f) => (f.tags || []).join() === "feminine" && f.form !== e.word)) o.fem = true;
}
for (const line of (await load(SRC.enAdj)).split("\n")) {
  if (!line) continue;
  const e = JSON.parse(line);
  if (!want.has(e.word) || enA.has(e.word)) continue;
  const fs = e.forms || [], tag = (...t) => fs.find((f) => { const x = f.tags || []; return t.every((y) => x.includes(y)) && x.length === t.length && /^[a-záéíóúüñ]+$/.test(f.form); })?.form;
  const both = (e.head_templates || []).some((h) => /\bm or f\b/.test(h.expansion));
  const f = both ? e.word : tag("feminine"), mp = tag("masculine", "plural") || tag("feminine", "masculine", "plural") || tag("plural");
  const fp = both ? mp : tag("feminine", "plural");
  if (f && mp && fp) enA.set(e.word, [f, mp, fp].join(" "));
}
// a "by sense" head next to a plain one is a homonym for a person (espada f — sword, m or f — matador): the plain one wins
const gOf = (s0) => { const s = s0.size > 1 ? new Set([...s0].filter((x) => x !== "c")) : s0; return s.has("c") ? "c" : s.has("mf") || (s.has("m") && s.has("f")) ? "mf" : s.has("m") ? "m" : s.has("f") ? "f" : ""; };
for (const e of merged.values()) {
  if (e.p === "n") {
    const o = enN.get(e.w);
    if (!o) continue;
    const g = gOf(o.g);
    // the Russian gender goes with the Russian meanings; the English one fills the gaps, marks common gender only when
    // every English head says so (ayuda f is also "m or f by sense" for a helper), and wins a plain m / f conflict:
    // the dozen such cases are slips in the Russian entries (la mapa, la sueldo)
    const mf = (x) => x === "m" || x === "f";
    if (!e.g || (o.g.size === 1 && g === "c" && e.g !== "mf") || (mf(e.g) && mf(g))) e.g = g;
    if (e.g === "c" && o.fem) e.g = "m";
    if (o.only) e.only = true;
    if (o.unc) e.u = true;
    e.f = o.only ? e.w : o.pl;
  }
  if (e.p === "a" && enA.has(e.w)) e.f = enA.get(e.w);
}
const kept = [...merged.values()].sort((a, b) => b.s - a.s || a.w.localeCompare(b.w, "es"));
// compact rows: [word, part of speech, gender (m / f / mf / c for el-la), meanings, flags ("u" = no plural, "p" = plural only),
// forms (noun: the plural; adjective: "feminine masc.plural fem.plural")]
const rows = kept.map((e) => [e.w, e.p, e.g, e.m, (e.u ? "u" : "") + (e.only ? "p" : ""), e.f || ""]);
const out = new URL("../src/data/dict.json", import.meta.url);
mkdirSync(new URL("./", out), { recursive: true });
writeFileSync(out, JSON.stringify(rows));
const byPos = {}; for (const r of rows) byPos[r[1]] = (byPos[r[1]] || 0) + 1;
console.log(rows.length, "entries", byPos, (JSON.stringify(rows).length / 1024).toFixed(0) + " KB");
