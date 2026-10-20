// Words page: lookup in both directions, recognising verb and noun / adjective forms, the day-based review schedule,
// and the review tasks. Pure: the page gives it the rows of lookup.json.
import { REGULAR, IRR, TENSES, TMAP, form, part, persLabel } from "../conjugation.js";
import { LEX } from "./lexicon.js";
import { article } from "./genero.js";

// Spanish key: lower case, no accents (ñ stays), one space
export const key = (s) => s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[áéíóúü]/g, (c) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" })[c]);
export const ruKey = (s) => s.toLowerCase().replace(/ё/g, "е");
export const ruWords = (s) => ruKey(s).split(/[^а-яa-z-]+/).filter((x) => x && x !== "-");
export const isRu = (s) => /[а-яё]/i.test(s);
export const POS_RU = { n: "сущ.", a: "прил.", v: "гл.", adv: "нареч.", num: "числ.", pron: "мест.", prep: "предл.", conj: "союз", intj: "межд.", phr: "выражение", part: "частица" };

// ---- the dictionary ----
// entry: { w, p, g, base: meanings of the entry, more: more translations, rank (0 = most frequent), id: "w|p" }
export function makeDict(rows) {
  const list = rows.map(([w, p, g, base, more], rank) => ({ w, p, g, base, more, rank, id: w + "|" + p }));
  const byKey = new Map(), byId = new Map(list.map((e) => [e.id, e]));
  for (const e of list) { const k = key(e.w); (byKey.get(k) || byKey.set(k, []).get(k)).push(e); }
  const keys = [...byKey.keys()].sort();
  return { list, byKey, byId, keys, ru: null };
}
// every meaning of an entry as one list: its own first, then the others
export const meanings = (e) => e.base.concat(e.more);

// forms that lead to a word: every form of the engine's verbs, plurals of nouns and forms of adjectives from the dictionary
let FORMS = null;
function forms() {
  if (FORMS) return FORMS;
  FORMS = new Map();
  const add = (f, x) => { const k = key(f); (FORMS.get(k) || FORMS.set(k, []).get(k)).push(x); };
  for (const v of REGULAR.concat(Object.keys(IRR))) {
    for (const T of TENSES) for (let p = 0; p < 6; p++) { const f = form(v, T.k, p); if (f) add(f, { w: v, p: "v", how: (T.short || T.name) + ", " + persLabel(T.k, p).split(" ")[0] }); }
    add(part(v), { w: v, p: "v", how: "participio" });
  }
  for (const e of LEX) {
    if (!e.forms) continue;
    if (e.p === "n" && e.forms !== e.w) add(e.forms, { w: e.w, p: "n", how: "мн. ч." });
    if (e.p === "a") { const [f, mp, fp] = e.forms.split(" "); const lab = { [f]: "ж. р.", [mp]: "мн. ч.", [fp]: "ж. р., мн. ч." }; for (const x of [f, mp, fp]) if (x !== e.w) add(x, { w: e.w, p: "a", how: lab[x] }); }
  }
  return FORMS;
}
// a negative imperative or a compound tense is several words: "no hables", "he hablado" — the last word is enough
const lastWord = (q) => q.split(" ").pop();

// Spanish query: the word itself, words this is a form of, then words that start with it
export function lookupEs(D, q, max = 8) {
  const k = key(q); if (!k) return { exact: [], formOf: [], more: [] };
  const exact = D.byKey.get(k) || [];
  const fx = (forms().get(k) || forms().get(lastWord(k)) || []).filter((x) => x.w !== exact[0]?.w);
  const seen = new Set(), formOf = [];
  for (const x of fx) {
    const e = D.byId.get(x.w + "|" + x.p) || (D.byKey.get(key(x.w)) || [])[0];
    if (!e) continue;
    const id = e.id + x.how; if (seen.has(id)) continue; seen.add(id);
    formOf.push({ e, how: x.how });
  }
  const more = [];
  let i = lowerBound(D.keys, k);
  const ids = new Set(exact.map((e) => e.id).concat(formOf.map((x) => x.e.id)));
  for (; i < D.keys.length && D.keys[i].startsWith(k) && more.length < 400; i++) for (const e of D.byKey.get(D.keys[i])) if (!ids.has(e.id)) more.push(e);
  more.sort((a, b) => a.rank - b.rank);
  return { exact, formOf, more: more.slice(0, max) };
}
function lowerBound(a, x) { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < x) lo = m + 1; else hi = m; } return lo; }

// Russian query: every query word must start a word of the meanings; a whole meaning equal to the query comes first
function ruIndex(D) {
  if (D.ru) return D.ru;
  D.ru = new Map();
  D.list.forEach((e, i) => { for (const w of new Set(meanings(e).flatMap(ruWords))) (D.ru.get(w) || D.ru.set(w, []).get(w)).push(i); });
  D.ruKeys = [...D.ru.keys()].sort();
  return D.ru;
}
const clean = (m) => ruKey(m).replace(/\([^)]*\)/g, " ").replace(/^(?:[а-я]+\.\s*)+/, "").replace(/\s+/g, " ").trim();
export function lookupRu(D, q, max = 40) {
  const qw = ruWords(q); if (!qw.length) return [];
  const idx = ruIndex(D), qk = qw.join(" ");
  let hit = null;
  for (const w of qw) {
    const s = new Set();
    for (let i = lowerBound(D.ruKeys, w); i < D.ruKeys.length && D.ruKeys[i].startsWith(w); i++) for (const j of idx.get(D.ruKeys[i])) s.add(j);
    hit = hit ? new Set([...hit].filter((j) => s.has(j))) : s;
  }
  const score = (e) => {
    const ms = meanings(e), own = e.base.length;
    let best = 9;
    ms.forEach((m, i) => {
      const parts = m.split(/[,;]\s*/).map(clean);
      const sc = parts.includes(qk) ? 0 : parts.some((x) => ruWords(x).join(" ") === qk) ? 1 : qw.every((w) => ruWords(m).includes(w)) ? 2 : 3;
      best = Math.min(best, sc + (i >= own ? 0.5 : 0) + i * 0.01);
    });
    return best + (e.w.split(" ").length - 1) * 0.3; // a single word before a phrase
  };
  return [...hit].map((j) => D.list[j]).map((e) => [e, score(e)]).sort((a, b) => a[1] - b[1] || a[0].rank - b[0].rank).slice(0, max).map(([e]) => e);
}
// obscene meanings are shown, but marked and kept last
export const OBSCENE = /(^|[^а-я])(вы|за|раз|от|на|по|у|с|до|про|въ|подъ|съ)?[еёъ]б[аиу]|ху[йяеё]|пизд|бляд|трах/;
// which meanings match a Russian query (for bold)
export const matches = (m, q) => { const qw = ruWords(q); return qw.length > 0 && qw.every((w) => ruWords(m).some((x) => x.startsWith(w))); };

// the noun with its article: el problema, el / la estudiante
export function withArticle(e) {
  if (e.p !== "n" || !e.g) return e.w;
  return article({ w: e.w, g: e.g, only: false }).join(" / ") + " " + e.w;
}

// ---- the schedule: days, not turns ----
// card: { id, add: day, due: day, ivl: days, ease, reps: right answers in a row, lapses, last: day, m?: own meanings }
export const today = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
export const newCard = (id, day, m) => ({ id, add: day, due: day, ivl: 0, ease: 2.5, reps: 0, lapses: 0, last: null, ...(m ? { m } : {}) });
// right: 1 day, then 3, then the interval times ease; wrong: back to the start, seen again in this session
export function grade(c, ok, day) {
  c.last = day;
  if (!ok) { c.reps = 0; c.lapses++; c.ivl = 0; c.ease = Math.max(1.3, c.ease - 0.2); c.due = day; return c; }
  c.reps++;
  c.ivl = c.reps === 1 ? 1 : c.reps === 2 ? 3 : Math.round(Math.max(c.ivl, 1) * c.ease);
  c.due = day + c.ivl;
  return c;
}
export const known = (c) => c.ivl >= 21;
export const status = (c, day) => (c.reps === 0 && c.last === null ? "новое" : c.due <= day ? "на сегодня" : known(c) ? "знаю" : "учу");

// how to ask: recognise first (see the word, recall the meaning), then write it from Russian, then by ear
export function modeFor(c, modes, voice) {
  const ok = modes.filter((m) => m !== "listen" || voice);
  const order = c.reps < 2 ? ["see", "write", "listen"] : [["write", "listen", "see"], ["listen", "see", "write"], ["see", "write", "listen"]][c.reps % 3];
  return order.find((m) => ok.includes(m)) || ok[0] || "see";
}

// the answers a written task accepts: the word, with its article, and other words with the same meaning
export function answersFor(D, e) {
  const out = [e.w];
  if (e.p === "n" && e.g) for (const a of article({ w: e.w, g: e.g })) out.push(a + " " + e.w);
  return out;
}
// "Тоже верно": another word whose own meanings contain one of the shown meanings
export function synonym(D, e, shown, u) {
  const k = key(u.replace(/^(el|la|los|las) /, ""));
  const want = new Set(shown.flatMap((m) => m.split(/[,;]\s*/).map(clean)));
  return (D.byKey.get(k) || []).find((x) => x.id !== e.id && x.p === e.p && meanings(x).some((m) => m.split(/[,;]\s*/).map(clean).some((y) => want.has(y))));
}
// the meanings shown in a "write" task: the entry's own (up to 3), or the first other translations
export const shownMeanings = (e, c) => (c?.m ? c.m : e.base.length ? e.base : e.more).slice(0, 3);
