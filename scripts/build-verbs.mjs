// Builds src/data/verbs.json — every Spanish verb of the English Wiktionary that the engine doesn't have yet.
//
// Each verb is conjugated by the engine (src/lib/conjugation.js, addVerbs): as a regular verb, like a model verb of
// the engine with another beginning (recontar like contar), or from its own presente / pretérito and exception entries.
// This script picks, for every verb, the first way that gives every form of the Wiktionary conjugation table
// (presente, pretérito, imperfecto, futuro, condicional, the subjunctives, both imperatives, the participle);
// a verb the engine can't conjugate that way is left out and listed at the end.
// Meanings come from lookup.json (the Russian Wiktionary entry, else the best supported other translations);
// a verb without any Russian meaning is left out.
//
// Source (CC BY-SA, see src/data/README.md): Spanish verbs of the English Wiktionary, via kaikki.org (wiktextract).
// Run: npm run build:verbs   (downloads ~730 MB into .cache/ on first run; the output is committed)
// Run npm run build:dict first when the dictionary changes: the meanings are read from lookup.json.
import { existsSync, readFileSync, writeFileSync, renameSync, createReadStream, createWriteStream, mkdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import * as E from "../src/lib/conjugation.js";

const CACHE = new URL("../.cache/", import.meta.url);
const SRC = ["en-verb.jsonl", "https://kaikki.org/dictionary/Spanish/pos-verb/kaikki.org-dictionary-Spanish-by-pos-verb.jsonl"];
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

// ---- the conjugation tables: tense key → six lists of forms (a slot may hold variants) ----
const PERSON = { "first-person,singular": 0, "second-person,singular": 1, "singular,third-person": 2, "first-person,plural": 3, "plural,second-person": 4, "plural,third-person": 5 };
const person = (tags) => PERSON[tags.filter((t) => /^(first|second|third)-person$|^singular$|^plural$/.test(t)).sort().join(",")];
function table(e) {
  const T = { part: [] }, put = (k, p, f) => ((T[k] ||= [[], [], [], [], [], []])[p].push(f));
  for (const f of e.forms || []) {
    const t = f.tags || [];
    if (f.source !== "conjugation" || !f.form || f.form === "-" || f.form === "—") continue;
    if (["combined-form", "vos-form", "table-tags", "inflection-template", "class"].some((x) => t.includes(x))) continue;
    if (t.includes("participle")) { if (t.includes("masculine") && t.includes("singular")) T.part.push(f.form); continue; }
    const p = person(t);
    if (p == null) continue;
    let k = null;
    if (t.includes("imperative")) { if (t.includes("formal")) continue; k = t.includes("negative") ? "impn" : "impa"; }
    else if (t.includes("subjunctive")) k = t.includes("present") ? "sp" : t.includes("future") ? "fs" : t.includes("imperfect-se") ? "sise" : t.includes("imperfect") ? "si" : null;
    else if (t.includes("conditional")) k = "cond";
    else if (t.includes("indicative")) k = t.includes("present") ? "pres" : t.includes("preterite") ? "pret" : t.includes("imperfect") ? "imp" : t.includes("future") ? "fut" : null;
    if (k) put(k, p, f.form);
  }
  return T.pres && T.pret ? T : null;
}
const tables = new Map(), glosses = new Map(); // verb → table (the first homonym with a table); verb → English glosses
for await (const line of createInterface({ input: createReadStream(await fetchTo(SRC)), crlfDelay: Infinity })) {
  if (!line.includes('"es-conj"')) continue;
  const e = JSON.parse(line);
  if (e.lang_code !== "es" || !/^[a-zñáéíóúü]+$/.test(e.word)) continue;
  const g = glosses.get(e.word) || glosses.set(e.word, []).get(e.word);
  // common senses first, then obsolete / archaic / rare ones
  const gl = (e.senses || []).filter((s) => s.glosses), odd = (s) => (s.tags || []).some((t) => /obsolete|archaic|rare/.test(t));
  g.push(...gl.filter((s) => !odd(s)).concat(gl.filter(odd)).map((s) => s.glosses[s.glosses.length - 1]));
  if (tables.has(e.word)) continue;
  const T = table(e);
  if (T) tables.set(e.word, T);
}

// a -se verb (arrepentirse) is conjugated as its verb without se; its table has the pronouns: «me arrepiento»
const CL = /^(me|te|se|nos|os) /;
const verbs = new Map(); // verb → { T, se }
for (const [w, T] of tables) {
  const pron = T.pres.some((fs) => fs.some((f) => CL.test(f))); // a table with the pronouns (some lemmas without -se have one too)
  if (pron) { for (const k in T) if (k !== "part") T[k] = T[k].map((fs) => fs.map((f) => f.replace(CL, ""))); delete T.impa; } // glued imperative (arrepiéntete): built from the checked forms
  if (!/[aeií]rse$/.test(w) || !pron) { if (/(ar|er|ir|ír)$/.test(w) && !verbs.has(w)) verbs.set(w, { T, se: pron }); continue; }
  const v = w.slice(0, -2);
  if (tables.has(v)) continue; // the verb itself has an entry
  glosses.set(v, glosses.get(w));
  verbs.set(v, { T, se: true });
}

// ---- does the engine give every form of the table? ----
const TENSES = ["pres", "pret", "imp", "fut", "cond", "sp", "si", "fs", "impa", "impn"];
function misses(v, T) {
  const out = [];
  for (const t of TENSES) {
    if (!T[t]) continue;
    for (let p = 0; p < 6; p++) {
      const want = T[t][p];
      if (!want.length || !E.hasPerson(t, p)) continue;
      let f = E.form(v, t, p);
      if (t === "impn") f = f.replace(/^no /, "");
      const ok = want.includes(f) || (t === "si" && T.sise && T.sise[p].includes(E.subjImpf(v, p, "se")) && want.includes(E.subjImpf(v, p, "ra")));
      if (!ok) out.push(t + p + ":" + f + "≠" + want.join("/"));
    }
  }
  if (T.part.length && !T.part.includes(E.part(v))) out.push("part:" + E.part(v) + "≠" + T.part.join("/"));
  return out;
}
const tryHow = (v, T, how) => { E.register(v, E.specOf(v, how)); const m = misses(v, T); E.unregister(v); return m; };

// models: the engine's verbs of the same group, the longest shared ending first (contener before tener before comer)
const ENGINE = E.REGULAR.concat(Object.keys(E.IRR));
const group = (v) => (v.endsWith("ír") ? "ir" : E.vt(v));
function models(v) {
  return ENGINE.filter((m) => group(m) === group(v) && m !== v)
    .map((m) => [m, E.commonEnd(v, m)]).filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1] || ENGINE.indexOf(a[0]) - ENGINE.indexOf(b[0])).map(([m]) => m);
}
// own entries from the table, each only where the plain rules give something else
function ownHow(v, T) {
  const reg = (t) => [0, 1, 2, 3, 4, 5].map((p) => E.base(v) + E.REG[E.vt(v)][t][p]);
  // a defective verb (atañer: only él / ellos) has gaps; they get the regular form, and the verb is marked
  const first = (k) => T[k] && T[k].map((fs, p) => fs[0] || (E.REG[E.vt(v)][k] ? reg(k)[p] : k === "imp" ? E.base(v) + E.IMPF[E.vt(v)][p] : undefined));
  const how = {}, pres = first("pres"), pret = first("pret");
  // no yo presente (concernir): the subjunctive is built from it, so it is rebuilt from él subjuntivo (concierna → concierno)
  if (!T.pres[0].length && T.sp && T.sp[2][0]) pres[0] = T.sp[2][0].slice(0, -1) + "o";
  if (pres.join(" ") !== reg("pres").join(" ") || pret.join(" ") !== reg("pret").join(" ")) { how.p = pres.join(" "); how.t = pret.join(" "); }
  const fut = first("fut"); if (fut && fut[0]) { const st = fut[0].slice(0, -1); if (st !== v) how.f = st; }
  if (T.part[0] && T.part[0] !== E.base(v) + (E.vt(v) === "ar" ? "ado" : "ido")) how.pa = T.part[0];
  if (T.impa && T.impa[1][0] && T.impa[1][0] !== pres[2]) how.tu = T.impa[1][0];
  const imp = first("imp"); if (imp && imp.join(" ") !== [0, 1, 2, 3, 4, 5].map((p) => E.base(v) + E.IMPF[E.vt(v)][p]).join(" ")) how.im = imp.join(" ");
  // the subjunctive: from yo presente; nosotros from the infinitive or an -ir stem; else the whole paradigm
  const sp = first("sp");
  for (const extra of [{}, { n: 1 }, { ni: sp && sp[3] && sp[3].slice(0, -4) }, { o: sp && sp.every(Boolean) && sp.join(" ") }]) {
    const h = { ...how, ...extra };
    if (!tryHow(v, T, h).length) return h;
  }
  return how;
}

// ---- meanings from the dictionary of the words page ----
const LOOKUP = JSON.parse(readFileSync(new URL("../src/data/lookup.json", import.meta.url), "utf8"));
const OBSCENE = /(^|[^а-я])(вы|за|раз|от|на|по|у|с|до|про|въ|подъ|съ)?[еёъ]б[аиу]|ху[йяеё]|пизд|бляд|трах|дроч|мастурб|онани/;
const meanOf = new Map();
for (const [w, p, , base, more] of LOOKUP) {
  if (p !== "v") continue;
  const clean = (a) => a.filter((m) => !OBSCENE.test(m));
  const m = clean(base).length ? clean(base).slice(0, 6) : clean(more).slice(0, 4);
  if (m.length && !meanOf.has(w)) meanOf.set(w, m.join("; "));
}

// verbs the Russian Wiktionary doesn't have: the English glosses («to risk, to venture») lead to the Russian
// translations of those English verbs in the English Wiktionary (the first translation table of the verb)
// «to excavate, dig» → excavate, dig: after a «to …» the next pieces are verbs too
const enHeads = (v) => (glosses.get(v) || []).slice(0, 4).flatMap((g) => {
  const ps = g.replace(/\([^)]*\)/g, "").split(/[;,]\s*/).map((x) => x.trim());
  if (!/^to /.test(ps[0] || "")) return [];
  return ps.map((x) => x.replace(/^to /, "")).filter((x) => /^[a-z]+( [a-z]+)?$/.test(x));
});
const ENRU_CACHE = new URL("en-ru-verbs.json", CACHE);
const need = new Set([...verbs.keys()].filter((v) => !meanOf.has(v)).flatMap(enHeads));
let enRu = existsSync(ENRU_CACHE) ? JSON.parse(readFileSync(ENRU_CACHE, "utf8")) : null;
if (!enRu) {
  enRu = {};
  const RU_OK = /^[а-яё]+(?:[ -][а-яё]+){0,2}$/;
  for await (const line of createInterface({ input: createReadStream(await fetchTo(["en-all.jsonl", "https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl"])), crlfDelay: Infinity })) {
    if (!line.includes('"pos": "verb"') || !line.includes('"lang_code": "ru"')) continue;
    const e = JSON.parse(line);
    if (e.pos !== "verb" || e.lang_code !== "en" || !need.has(e.word) || enRu[e.word]) continue;
    const trs = (e.translations || []).concat((e.senses || []).flatMap((s) => s.translations || [])).filter((t) => t.lang_code === "ru" && t.word && RU_OK.test((t.word = t.word.normalize("NFD").replace(/[̀́]/g, "").normalize("NFC").trim())));
    if (!trs.length) continue;
    const first = trs[0].sense || "";
    enRu[e.word] = [...new Set(trs.filter((t) => (t.sense || "") === first).map((t) => t.word))].slice(0, 3);
  }
  writeFileSync(ENRU_CACHE, JSON.stringify(enRu));
}
for (const v of verbs.keys()) {
  if (meanOf.has(v)) continue;
  const m = [...new Set(enHeads(v).flatMap((h) => enRu[h] || []))].filter((x) => !OBSCENE.test(x)).slice(0, 5);
  if (m.length) meanOf.set(v, m.join("; "));
}

// ---- pick a way for every verb ----
const rows = [], failed = [], noMeaning = [];
let nReg = 0, nLike = 0, nOwn = 0;
for (const [v, { T, se }] of [...verbs].sort((a, b) => a[0].localeCompare(b[0], "es"))) {
  if (E.TIER[v]) continue;
  // no Russian meaning anywhere: the English gloss, marked (the verb is still conjugated and found)
  let mean = meanOf.get(v) || (se && meanOf.get(v + "se"));
  if (!mean) { const g = (glosses.get(v) || []).slice(0, 2).map((x) => x.replace(/;/g, ",")); if (!g.length) { noMeaning.push(v); continue; } mean = "англ.: " + g.join("; "); }
  let how = null;
  if (!tryHow(v, T, "").length) { how = ""; nReg++; }
  else for (const m of models(v)) { try { if (!tryHow(v, T, m).length) { how = m; nLike++; break; } } catch (e) { E.unregister(v); } }
  if (how == null) {
    const own = ownHow(v, T), m = tryHow(v, T, own);
    if (m.length) { failed.push(v + " " + m.slice(0, 3).join(" ")); continue; }
    how = own; nOwn++;
  }
  // flags: s — used as -se (arrepentirse), d — defective (some persons don't exist: atañer, soler)
  const def = ["pres", "pret", "sp"].some((t) => T[t] && T[t].some((fs, p) => !fs.length && E.hasPerson(t, p)));
  const flags = (se ? "s" : "") + (def ? "d" : "");
  rows.push(flags ? [v, how, mean, flags] : [v, how, mean]);
}
const out = JSON.stringify(rows);
writeFileSync(new URL("../src/data/verbs.json", import.meta.url), out);
console.log(rows.length, "verbs:", nReg, "regular,", nLike, "like a model,", nOwn, "with own forms;", (out.length / 1024).toFixed(0) + " KB");
writeFileSync(new URL("../.cache/verbs-no-meaning.txt", import.meta.url), noMeaning.join("\n"));
console.log(noMeaning.length, "left out without any gloss;", failed.length, "left out, the engine can't conjugate them:");
console.log(failed.join("\n"));
