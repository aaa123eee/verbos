// The dictionary lookup (Spanish ⇄ Russian) as a widget: the words page shows it on the page, every other page in the
// search dialog of the top bar. The words it finds go to "my words" through a store the page gives it.
import { esc } from "./trainer-kit.js";
import { LEX } from "./es/lexicon.js";
import { makeDict, lookupEs, lookupRu, meanings, ruWords, matches, OBSCENE, withArticle, isRu, key, POS_RU } from "./es/palabras.js";
import { TIER, TENSES, form, regularForm, persLabel, hasPerson, addVerbs } from "./conjugation.js";
import { canSpeak, speak, SPK } from "./voice.js";
import LOOKUP_URL from "../data/lookup.json?url";
import VERBS_URL from "../data/verbs.json?url";

const LEXF = new Map(); for (const e of LEX) if (!LEXF.has(e.w + "|" + e.p)) LEXF.set(e.w + "|" + e.p, e);

// ---- the dictionary: lookup.json is big (~1.5 MB gzipped), so it is a separate file, fetched (once) when needed;
// with it every other verb (level 5 of the engine): its conjugation in the card, and its forms in the lookup ----
let D = null, dictP = null;
export const dict = () => D;
export function loadDict() {
  return (dictP ||= Promise.all([fetch(LOOKUP_URL).then((r) => r.json()), fetch(VERBS_URL).then((r) => r.json()).then(addVerbs)]).then(([rows]) => (D = makeDict(rows))).catch((e) => { dictP = null; throw e; }));
}


// the translations: the main meanings large and numbered, the other translations as chips under them
// (a word with no main meanings gets its first translations as the main ones)
export function txHtml(e, fmt, clean, max = 30) {
  const more = e.more.filter((m) => !clean || !OBSCENE.test(m));
  const main = e.base.length ? e.base : more.slice(0, 3), rest = (e.base.length ? more : more.slice(3)).slice(0, max);
  return '<div class="tx"><ol class="tx-main">' + main.map((m) => "<li>" + fmt(m) + "</li>").join("") + "</ol>" +
    (rest.length ? '<p class="tx-more"><i>ещё</i>' + rest.map((m) => "<span>" + fmt(m) + "</span>").join("") + "</p>" : "") + "</div>";
}
// the whole conjugation of an engine verb, the searched form highlighted
function conjHtml(v, q) {
  const k = key(q), hit = (f) => f && (key(f) === k || key(f).split(" ").pop() === k);
  return '<p class="note">Цветом выделены формы, которые не строятся по общему правилу.</p><div class="conj">' +
    TENSES.map((T) => '<div class="card" style="--tc:var(--t-' + T.k + ')"><h4>' + T.name + "</h4>" + [0, 1, 2, 3, 4, 5].filter((p) => hasPerson(T.k, p)).map((p) => {
      const f = form(v, T.k, p);
      return '<div class="ln' + (hit(f) ? " found" : "") + '"><span>' + persLabel(T.k, p).split(" ")[0] + '</span><span class="f' + (f !== regularForm(v, T.k, p) ? " x" : "") + '">' + f + "</span></div>";
    }).join("") + "</div>").join("") + "</div>";
}

// store: { has(id), untouched(id) (saved and never reviewed), add(e, m?), remove(id) }
// opts: input, res (elements), onQuery(q) after every render, back (the label of the link that clears the query),
// verbsOpen: the first verb card opens its conjugation by itself
export function createLookup({ input, res, store, onQuery = () => {}, back = null, verbsOpen = false }) {
  let sel = null, mmFor = null, mmRes = null, ruAll = false;
  // the word the current search saved by itself; words the learner removed are not saved again
  let autoId = null, autoQ = "";
  const noAuto = new Set();
  // verbs whose conjugation is open right in their card (no going to the main page); closed by the learner
  const openConj = new Set(), shut = new Set();
  const isOpen = (v, i) => openConj.has(v) || (verbsOpen && i === 0 && !shut.has(v));

  function formsLine(e, i) {
    const x = LEXF.get(e.id);
    if (e.p === "v" && !!TIER[e.w]) return '<button type="button" class="lnk vlink" data-conj="' + esc(e.w) + '" aria-expanded="' + isOpen(e.w, i) + '">' + (isOpen(e.w, i) ? "скрыть спряжение" : "спряжение ↓") + "</button>";
    if (!x || !x.forms) return "";
    if (e.p === "n") return x.only ? "только мн. ч." : "мн. ч. <b>" + esc(x.forms) + "</b>";
    if (e.p === "a") return "<b>" + esc([e.w, ...x.forms.split(" ")].join(" · ")) + "</b>";
    return "";
  }
  function card(e, q, how, i) {
    const mean = (m) => (q && isRu(q) && matches(m, q) ? "<b>" + esc(m) + "</b>" : esc(m)) + (OBSCENE.test(m) ? ' <span class="vulg">груб.</span>' : "");
    const g = e.p === "n" && e.g ? ({ m: "м. р.", f: "ж. р.", c: "общий род", mf: "м. и ж. р." })[e.g] : "";
    const fl = formsLine(e, i), verb = e.p === "v" && !!TIER[e.w];
    return '<article class="wcard" data-id="' + esc(e.id) + '"><div class="whead"><span class="ww">' + esc(withArticle(e)) + "</span>" +
      (canSpeak() ? '<button type="button" class="spk" data-say="' + esc(e.w) + '" title="Произнести">' + SPK + "</button>" : "") +
      '<span class="badge">' + [POS_RU[e.p], g].filter(Boolean).join(", ") + "</span>" + (how ? '<span class="how">' + esc(how) + "</span>" : "") +
      '<span class="wstate">' + (store.has(e.id) ? '<span class="saved">✓ в моих словах</span><button type="button" class="lnk" data-del="' + esc(e.id) + '">убрать</button>' : '<button type="button" class="lnk add" data-add="' + esc(e.id) + '">＋ запомнить</button>') + "</span></div>" +
      (fl ? '<p class="forms">' + fl + "</p>" : "") + txHtml(e, mean, false) + (verb && isOpen(e.w, i) ? '<div class="wconj">' + conjHtml(e.w, q) + "</div>" : "") + "</article>";
  }
  const row = (e, q) => '<button type="button" class="wrow" data-sel="' + esc(e.id) + '" aria-pressed="' + (sel === e.id) + '"><span class="f">' + esc(withArticle(e)) + "</span><small>" +
    meanings(e).slice(0, 6).map((m) => (q && isRu(q) && matches(m, q) ? "<b>" + esc(m) + "</b>" : esc(m))).join("; ") + "</small></button>";

  // what the lookup shows now: the cards on top (an exact word, words it is a form of, or the chosen row), then rows
  function results(q) {
    if (!D) return { cards: [], rows: [] };
    if (isRu(q)) {
      const R = lookupRu(D, q);
      const s = R.find((e) => e.id === sel);
      return { cards: s ? [{ e: s }] : [], rows: R, ru: true };
    }
    const { exact, formOf, more } = lookupEs(D, q);
    const cards = exact.map((e) => ({ e })).concat(formOf.slice(0, 4).map((x) => ({ e: x.e, how: q.trim() + " — " + x.how })));
    const s = sel && !cards.some((c) => c.e.id === sel) ? D.byId.get(sel) : null;
    return { cards: (s ? [{ e: s }] : []).concat(cards), rows: more };
  }
  // a search saves the word it finds: the exact Spanish word (or the first word it is a form of), or for a Russian query
  // the first word with a meaning equal to it; a refined query (casa → casado) or another pick replaces that word
  function autoSave(q, e) {
    if (!e || noAuto.has(e.id) || e.id === autoId) return;
    const related = autoQ && (q === autoQ || q.startsWith(autoQ) || autoQ.startsWith(q));
    if (autoId && related && store.untouched(autoId)) store.remove(autoId);
    autoId = null; autoQ = q;
    if (!store.has(e.id)) { store.add(e, e.p === "x" ? e.base : undefined); autoId = e.id; }
  }
  const ruExact = (e, q) => { const k = ruWords(q).join(" "); return meanings(e).some((m) => m.split(/[,;]\s*/).some((x) => ruWords(x.replace(/\([^)]*\)/g, " ")).join(" ") === k)); };
  let failed = false;
  function render() {
    const q = input.value.trim();
    onQuery(q);
    if (!q) { res.innerHTML = ""; return; }
    if (!D) { res.innerHTML = '<p class="empty">' + (failed ? "Словарь не загрузился. Проверь сеть и попробуй ещё раз." : "Словарь загружается…") + "</p>"; return; }
    const R = results(q);
    let h = R.cards.map((c, i) => card(c.e, q, c.how, i)).join("");
    // a Russian query lists a dozen words; the rest on request
    const rows = R.rows.filter((e) => !R.cards.some((c) => c.e.id === e.id)), lim = R.ru ? (ruAll ? 40 : 12) : 8;
    if (rows.length) h += '<div class="rows">' + (R.cards.length && !R.ru ? '<p class="cap">Похожие слова</p>' : "") + rows.slice(0, lim).map((e) => row(e, q)).join("") +
      (R.ru && rows.length > lim ? '<button type="button" class="lnk" data-act="ruMore">Показать ещё ' + (Math.min(rows.length, 40) - lim) + "</button>" : "") + "</div>";
    if (mmFor === q && mmRes) h += mmHtml(q);
    else if (!R.cards.length && !R.rows.length) h += '<p class="empty">В словаре нет. Enter — спросить переводчик MyMemory.</p>';
    else h += '<p class="empty mmask"><button type="button" class="lnk" data-act="mmAsk">Перевести фразу через MyMemory</button></p>';
    const best = R.cards[0]?.e || (R.ru && R.rows[0] && ruExact(R.rows[0], q) ? R.rows[0] : null);
    if (best && !store.has(best.id) && !noAuto.has(best.id)) { autoSave(q, best); return render(); }
    res.innerHTML = h + (back ? '<p class="back"><button type="button" class="lnk" data-act="back">' + esc(back) + "</button> <kbd>Esc</kbd></p>" : "");
  }
  function commit() {
    const q = input.value.trim(); if (!q || !D) return;
    const R = results(q);
    const e = R.cards[0]?.e || (R.rows.length === 1 ? R.rows[0] : null);
    if (e) { sel = e.id; noAuto.delete(e.id); autoSave(q, e); render(); return; }
    if (R.rows.length) { sel = R.rows[0].id; noAuto.delete(sel); autoSave(q, R.rows[0]); render(); return; }
    askMM(q);
  }

  // MyMemory: only on request, only this query is sent
  function mmHtml(q) {
    if (mmRes === "wait") return '<p class="empty">Спрашиваю MyMemory…</p>';
    if (mmRes.err) return '<p class="empty">MyMemory не ответил: ' + esc(mmRes.err) + "</p>";
    const id = mmRes.es + "|x", saved = store.has(id);
    return '<article class="wcard mm"><div class="whead"><span class="ww">' + esc(mmRes.es) + '</span><span class="badge">MyMemory</span><span class="wstate">' +
      (saved ? '<span class="saved">✓ в моих словах</span><button type="button" class="lnk" data-del="' + esc(id) + '">убрать</button>' : '<button type="button" class="lnk add" data-act="mmAdd">＋ запомнить</button>') +
      '</span></div><ol>' + mmRes.ru.map((m) => "<li>" + esc(m) + "</li>").join("") + "</ol></article>";
  }
  async function askMM(q) {
    mmFor = q; mmRes = "wait"; render();
    const ru = isRu(q), pair = ru ? "ru|es" : "es|ru";
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(q) + "&langpair=" + pair, { signal: ctl.signal });
      clearTimeout(t);
      const j = await r.json();
      const all = [j.responseData?.translatedText, ...(j.matches || []).filter((m) => +m.quality >= 50 || m.quality === undefined).map((m) => m.translation)];
      const tr = [...new Set(all.filter(Boolean).map((s) => s.trim().replace(/[.!]$/, "")).filter((s) => s && s.toLowerCase() !== q.toLowerCase()))].slice(0, 5);
      if (!tr.length) throw new Error("перевода нет");
      mmRes = ru ? { es: tr[0].toLowerCase(), ru: [q] } : { es: q.toLowerCase(), ru: tr };
    } catch (e) { mmRes = { err: e.name === "AbortError" ? "нет ответа" : navigator.onLine === false ? "нет сети" : e.message || "ошибка" }; }
    if (mmFor === q && !mmRes.err) autoSave(q, { id: mmRes.es + "|x", p: "x", base: mmRes.ru });
    if (mmFor === q) render();
  }

  // the dictionary loads on the first query (or right away, if the page asks)
  function load() {
    return loadDict().then(() => { failed = false; render(); }, () => { failed = true; render(); });
  }
  let lookT = null;
  input.addEventListener("input", () => {
    openConj.clear(); shut.clear(); sel = null; ruAll = false;
    if (!D) load();
    clearTimeout(lookT); lookT = setTimeout(render, 60);
  });
  function clear() { input.value = ""; sel = null; ruAll = false; autoId = null; autoQ = ""; render(); }
  input.addEventListener("keydown", (e) => {
    if (e.isComposing) return;
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    else if (e.key === "Escape" && input.value) { e.preventDefault(); e.stopPropagation(); clear(); }
  });
  res.addEventListener("click", (e) => {
    const t = e.target.closest("button,a"); if (!t) return;
    const act = t.dataset.act;
    if (t.dataset.say) speak(t.dataset.say);
    else if (t.dataset.conj) {
      const v = t.dataset.conj, open = t.getAttribute("aria-expanded") === "true";
      if (open) { openConj.delete(v); shut.add(v); } else { openConj.add(v); shut.delete(v); }
      render(); res.querySelector('[data-conj="' + v + '"]')?.focus({ preventScroll: true });
    }
    else if (t.dataset.sel) { sel = t.dataset.sel; autoSave(input.value.trim(), D.byId.get(sel)); render(); res.querySelector(".wcard")?.scrollIntoView({ block: "nearest" }); }
    else if (t.dataset.add) { store.add(D.byId.get(t.dataset.add)); render(); }
    else if (t.dataset.del) { noAuto.add(t.dataset.del); if (autoId === t.dataset.del) autoId = null; store.remove(t.dataset.del); render(); }
    else if (act === "back") clear();
    else if (act === "mmAsk") askMM(input.value.trim());
    else if (act === "ruMore") { ruAll = true; render(); }
    else if (act === "mmAdd") { const id = mmRes.es + "|x"; if (!store.has(id)) store.add({ id, p: "x", base: mmRes.ru }, mmRes.ru); render(); }
  });
  return { render, clear, load };
}
