// Builds src/data/dict.json — the shared Spanish → Russian dictionary of frequent words.
//
// Sources (both CC BY-SA, see src/data/README.md):
//   - Spanish entries of the Russian Wiktionary, machine-readable extract by kaikki.org (wiktextract)
//   - FrequencyWords by Hermit Dave, Spanish word frequencies from OpenSubtitles 2018 (top 50k)
//   - Spanish nouns and adjectives of the English Wiktionary (kaikki.org): gender where the Russian one has none,
//     plurals, and the four forms of adjectives
//   - for the words page (lookup.json), every Russian translation we can find: the Spanish translations of Russian
//     entries of the Russian Wiktionary, read backwards, and the translation tables of the English Wiktionary, where
//     Spanish and Russian words of one English sense are paired
// A word gets in if it, or one of its forms, appears in the frequency list. Verb forms are mapped to the
// infinitive with our own conjugation engine; the engine's verbs always get in, with their curated meanings.
//
// Run: npm run build:dict   (downloads ~5.5 GB into .cache/ on first run; the output is committed)
import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync, createReadStream, createWriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { REGULAR, IRR, TENSES, form, part, MEAN } from "../src/lib/conjugation.js";

const CACHE = new URL("../.cache/", import.meta.url);
const SRC = {
  wikt: ["ru-es.jsonl", "https://kaikki.org/ruwiktionary/%D0%98%D1%81%D0%BF%D0%B0%D0%BD%D1%81%D0%BA%D0%B8%D0%B9/kaikki.org-dictionary-%D0%98%D1%81%D0%BF%D0%B0%D0%BD%D1%81%D0%BA%D0%B8%D0%B9.jsonl"],
  enNoun: ["en-noun.jsonl", "https://kaikki.org/dictionary/Spanish/pos-noun/kaikki.org-dictionary-Spanish-by-pos-noun.jsonl"],
  enAdj: ["en-adj.jsonl", "https://kaikki.org/dictionary/Spanish/pos-adj/kaikki.org-dictionary-Spanish-by-pos-adj.jsonl"],
  ruRu: ["ru-ru.jsonl", "https://kaikki.org/ruwiktionary/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9/kaikki.org-dictionary-%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9.jsonl"],
  enAll: ["en-all.jsonl", "https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl"],
  freq: ["es_50k.txt", "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt"],
};
async function fetchTo([name, url]) {
  mkdirSync(CACHE, { recursive: true });
  const file = new URL(name, CACHE);
  if (!existsSync(file)) {
    console.log("downloading", url);
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " → " + r.status);
    const part = new URL(name + ".part", CACHE);
    await pipeline(Readable.fromWeb(r.body), createWriteStream(part));
    renameSync(part, file);
  }
  return file;
}
const load = async (src) => readFileSync(await fetchTo(src), "utf8");
// the big files (gigabytes) are read line by line; "has" skips lines without it before parsing
async function* records(src, has) {
  for await (const line of createInterface({ input: createReadStream(await fetchTo(src)), crlfDelay: Infinity })) {
    if (line && line.includes(has)) yield JSON.parse(line);
  }
}

const POS = { noun: "n", adj: "a", verb: "v", adv: "adv", num: "num", pron: "pron", prep: "prep", conj: "conj", intj: "intj" };
// wiki leftovers: [[ ]], stray braces and brackets, footnote numbers like узел[2]
function cleanGloss(g) {
  let s = g.replace(/\[\[|\]\]|[{}]/g, "").replace(/\[\d+\]/g, "").replace(/\s+\d+\)\s*/g, "; ").replace(/\s+/g, " ").trim();
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

// ---- lookup.json: every Spanish word or short phrase with every Russian translation we can find (the words page) ----
// row: [word, part of speech, gender, meanings (Russian Wiktionary entry, or the curated verb meanings first),
//       more translations (other sources, the best supported first)]; most frequent first
const unstress = (s) => s.normalize("NFD").replace(/[̀́]/g, "").normalize("NFC");
const ES_OK = /^[a-záéíóúüñ]+(?: [a-záéíóúüñ]+){0,3}$/, RU_OK = /^[а-яё]+(?:[ -][а-яё]+){0,3}$/;
const LPOS = { ...POS, phrase: "phr", particle: "part" };
const L = new Map(); // "word|pos" → { w, p, g: {m, f}, base: [], more: Map(ru → support) }
const lx = (w, p) => { const k = w + "|" + p; return L.get(k) || L.set(k, { w, p, g: { m: 0, f: 0 }, base: [], more: new Map() }).get(k); };
for (const line of (await load(SRC.wikt)).split("\n")) {
  if (!line.trim()) continue;
  const e = JSON.parse(line), p = LPOS[e.pos];
  if (!p || !ES_OK.test(e.word)) continue;
  const senses = (e.senses || []).flatMap((s) => s.glosses || []).map(cleanGloss).filter((g) => g.length > 1);
  if (!senses.length) continue;
  const o = lx(e.word, p);
  o.base = [...new Set([...o.base, ...senses])];
  const g = gender(e); if (g === "m" || g === "mf") o.g.m += 5; if (g === "f" || g === "mf") o.g.f += 5;
}
for (const v of ENGINE) { const o = lx(v, "v"); o.base = [...new Set([...MEAN[v].split("; "), ...o.base])]; }
const addMore = (es, p, ru, n, tags = []) => {
  if (!es || !ru) return; // a table row with a note instead of a word
  es = es.trim(); ru = unstress(ru.trim().toLowerCase());
  if (!ES_OK.test(es) || !RU_OK.test(ru)) return;
  const o = lx(es, p); o.more.set(ru, (o.more.get(ru) || 0) + n);
  if (tags.includes("masculine")) o.g.m++; if (tags.includes("feminine")) o.g.f++;
};
// Russian entries: their Spanish translations, read backwards (weight 2: a direct Russian → Spanish pair)
// translations sit on the entry or on its senses
const trs = (e) => (e.translations || []).concat((e.senses || []).flatMap((s) => s.translations || []));
let nRu = 0;
for await (const e of records(SRC.ruRu, '"lang_code": "es"')) {
  const p = LPOS[e.pos]; if (!p || e.lang_code !== "ru") continue;
  for (const t of trs(e)) if (t.lang_code === "es") for (const w of t.word.split(/,\s*/)) addMore(w, p, e.word, 2, t.tags);
  nRu++;
}
// English entries: Spanish and Russian words of one translation table (one English sense) translate each other
let nEn = 0;
for await (const e of records(SRC.enAll, '"lang_code": "es"')) {
  const p = LPOS[e.pos]; if (!p || e.lang_code !== "en") continue;
  const bySense = new Map();
  for (const t of trs(e)) {
    if (t.lang_code !== "es" && t.lang_code !== "ru") continue;
    const s = bySense.get(t.sense || "") || bySense.set(t.sense || "", { es: [], ru: [] }).get(t.sense || "");
    s[t.lang_code].push(t);
  }
  for (const { es, ru } of bySense.values()) {
    if (!es.length || !ru.length || es.length > 8 || ru.length > 10) continue; // a huge table is too loose to pair
    for (const a of es) for (const b of ru) addMore(a.word, p, b.word, 1, a.tags);
  }
  nEn++;
}
// a translation already said by the entry's own meanings is left out
const ruWords = (s) => s.toLowerCase().replace(/ё/g, "е").split(/[^а-я-]+/).filter(Boolean);
const OBSCENE = /(^|[^а-я])(вы|за|раз|от|на|по|у|с|до|про|въ|подъ|съ)?[еёъ]б[аиу]|ху[йяеё]|пизд|бляд|трах/;
const lrows = [];
for (const o of L.values()) {
  // a meaning whose words all appear in a longer one is left out: "бросать" next to "бросать, кидать; метать"
  // (the longer one takes the place of the first short one, so the curated order of verb meanings stays)
  // only a list of synonyms covers it, not a meaning with a label: "время" stays next to "грам. время (глагола)"
  const longer = (m) => o.base.find((x) => x.length > m.length && /[,;]/.test(x) && ruWords(m).every((w) => ruWords(x.replace(/\([^)]*\)/g, "")).includes(w)));
  o.base = [...new Set(o.base.map((m) => { let x = m, y; while ((y = longer(x))) x = y; return x; }))];
  const said = new Set(o.base.flatMap(ruWords));
  // obscene words go last (coger, tirar have such meanings in Latin America); the page marks them
  const more = [...o.more].filter(([r]) => !ruWords(r).every((x) => said.has(x))).sort((a, b) => OBSCENE.test(a[0]) - OBSCENE.test(b[0]) || b[1] - a[1] || a[0].localeCompare(b[0], "ru")).map(([r]) => r).slice(0, 30);
  if (!o.base.length && !more.length) continue;
  const dg = merged.get(o.w + "|n")?.g;
  const g = o.p !== "n" ? "" : dg || (o.g.m && o.g.f ? "mf" : o.g.m ? "m" : o.g.f ? "f" : "");
  const s = merged.get(o.w + "|" + o.p)?.s || freq.get(o.w) || 0;
  lrows.push({ r: [o.w, o.p, g, o.base, more], s });
}
lrows.sort((a, b) => b.s - a.s || a.r[0].localeCompare(b.r[0], "es"));
const lout = JSON.stringify(lrows.map((x) => x.r));
writeFileSync(new URL("../src/data/lookup.json", import.meta.url), lout);
console.log("lookup:", lrows.length, "entries,", nRu, "Russian and", nEn, "English entries read,", (lout.length / 1024).toFixed(0) + " KB");
