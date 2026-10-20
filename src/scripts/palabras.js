// Words page: the dictionary lookup (Spanish ⇄ Russian), "my words" saved from it, and their day-based review.
import { IDB, norm, esc } from "../lib/trainer-kit.js";
import { LEX } from "../lib/es/lexicon.js";
import { makeDict, lookupEs, lookupRu, meanings, ruWords, matches, OBSCENE, withArticle, isRu, key, POS_RU, today, newCard, grade, known, status, modeFor, answersFor, synonym, shownMeanings } from "../lib/es/palabras.js";
import { REGULAR, IRR, TENSES, form, regularForm, persLabel, hasPerson } from "../lib/conjugation.js";
import LOOKUP_URL from "../data/lookup.json?url";

const $ = (id) => document.getElementById(id);
const ENGINE = new Set(REGULAR.concat(Object.keys(IRR)));
const deaccent = (s) => s.replace(/[áéíóú]/g, (c) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u" })[c]);
const LEXF = new Map(); for (const e of LEX) if (!LEXF.has(e.w + "|" + e.p)) LEXF.set(e.w + "|" + e.p, e);

// ---- state: my words and the day log, in IndexedDB (localStorage until it opens) ----
const PKEY = "words", LKEY = "verbos-palabras-v1", SKEY = "verbos-palabras-settings-v1";
const fresh = () => ({ cards: {}, days: {}, freqAt: 0 });
let S = fresh(), idbReady = false, writing = false, dirty = false, timer = null;
try { const s = JSON.parse(localStorage.getItem(LKEY) || "null"); if (s && s.cards) S = Object.assign(fresh(), s); } catch (e) {}
const save = () => { dirty = true; clearTimeout(timer); timer = setTimeout(flush, 300); };
async function flush() {
  if (!dirty || writing) return;
  dirty = false;
  if (!idbReady) { try { localStorage.setItem(LKEY, JSON.stringify(S)); } catch (e) {} return; }
  writing = true;
  try { await IDB.set(PKEY, JSON.parse(JSON.stringify(S))); } catch (e) { $("syncNote").textContent = "Не получилось сохранить в браузере."; }
  writing = false;
  if (dirty) flush();
}
const day = () => today();
const log = () => (S.days[day()] ||= { n: 0, ok: 0, new: 0 });

// ---- settings: the named inputs of the side panel, remembered ----
const inputs = () => [...$("side").querySelectorAll("input[name]")];
function settings() {
  const o = { modes: [] };
  for (const i of inputs()) {
    if (i.type === "radio") { if (i.checked) o[i.name] = i.value; }
    else if (i.value !== "on") { if (i.checked) o[i.name].push(i.value); }
    else o[i.name] = i.checked;
  }
  o.perDay = +o.perDay;
  return o;
}
try { const on = JSON.parse(localStorage.getItem(SKEY) || "null"); if (Array.isArray(on)) inputs().forEach((i) => (i.checked = on.includes(i.name + "=" + i.value))); } catch (e) {}
$("side").addEventListener("change", (e) => {
  const i = e.target;
  if (i.type === "checkbox" && i.value !== "on" && !inputs().some((x) => x.name === i.name && x.checked)) { i.checked = true; return; }
  try { localStorage.setItem(SKEY, JSON.stringify(inputs().filter((x) => x.checked).map((x) => x.name + "=" + x.value))); } catch (e) {}
  queue = null; if (!answered) next();
  render();
});

// ---- the dictionary: lookup.json is big (~1.5 MB gzipped), so it is a separate file, fetched and cached by the browser ----
let D = null;
const dictReady = fetch(LOOKUP_URL).then((r) => r.json()).then((rows) => { D = makeDict(rows); }).catch(() => { $("res").innerHTML = '<p class="empty">Словарь не загрузился. Обнови страницу.</p>'; });

// an entry for a card: from the dictionary, or the card's own meanings (a MyMemory translation)
function entryOf(c) {
  if (c.m) return { w: c.id.split("|")[0], p: "x", g: "", base: c.m, more: [], id: c.id, rank: 1e9 };
  return D && D.byId.get(c.id);
}
const has = (id) => !!S.cards[id];
function addWord(e, m) {
  if (has(e.id)) return;
  S.cards[e.id] = newCard(e.id, day(), m);
  save(); render(); queue = null;
  if (!cur && !answered) next();
}
function removeWord(id) { delete S.cards[id]; save(); render(); queue = null; if (cur && cur.c.id === id && !answered) next(); }

// ---- voice ----
let voice = null;
function pickVoice() {
  const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  voice = vs.find((v) => /^es[-_]ES/i.test(v.lang)) || vs.find((v) => /^es\b/i.test(v.lang)) || null;
  if (vs.length || voicesWaited) $("voiceNote").hidden = !!voice || !settings().modes.includes("listen");
}
let voicesWaited = false;
setTimeout(() => { voicesWaited = true; pickVoice(); }, 1500);
function speak(text) {
  if (!voice) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.voice = voice; u.lang = voice.lang; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) {}
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.addEventListener?.("voiceschanged", pickVoice); }

// ---- lookup ----
const SPK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
let sel = null, mmFor = null, mmRes = null, ruAll = false;
// the word the current search saved by itself; words the learner removed are not saved again
let autoId = null, autoQ = "";
const noAuto = new Set();
// verbs whose conjugation is open right in their card (no going to the main page); the searched form is highlighted
const openConj = new Set();
function conjHtml(v, q) {
  const k = key(q), hit = (f) => f && (key(f) === k || key(f).split(" ").pop() === k);
  return '<p class="note">Цветом выделены формы, которые не строятся по общему правилу.</p><div class="conj">' +
    TENSES.map((T) => '<div class="card" style="--tc:var(--t-' + T.k + ')"><h4>' + T.name + "</h4>" + [0, 1, 2, 3, 4, 5].filter((p) => hasPerson(T.k, p)).map((p) => {
      const f = form(v, T.k, p);
      return '<div class="ln' + (hit(f) ? " found" : "") + '"><span>' + persLabel(T.k, p).split(" ")[0] + '</span><span class="f' + (f !== regularForm(v, T.k, p) ? " x" : "") + '">' + f + "</span></div>";
    }).join("") + "</div>").join("") + "</div>";
}
function formsLine(e) {
  const x = LEXF.get(e.id);
  if (e.p === "v" && ENGINE.has(e.w)) return '<button type="button" class="lnk vlink" data-conj="' + esc(e.w) + '" aria-expanded="' + openConj.has(e.w) + '">' + (openConj.has(e.w) ? "скрыть спряжение" : "спряжение ↓") + "</button>";
  if (!x || !x.forms) return "";
  if (e.p === "n") return x.only ? "только мн. ч." : "мн. ч. <b>" + esc(x.forms) + "</b>";
  if (e.p === "a") return "<b>" + esc([e.w, ...x.forms.split(" ")].join(" · ")) + "</b>";
  return "";
}
// the translations: the main meanings large and numbered, the other translations as chips under them
// (a word with no main meanings gets its first translations as the main ones)
function txHtml(e, fmt, clean, max = 30) {
  const more = e.more.filter((m) => !clean || !OBSCENE.test(m));
  const main = e.base.length ? e.base : more.slice(0, 3), rest = (e.base.length ? more : more.slice(3)).slice(0, max);
  return '<div class="tx"><ol class="tx-main">' + main.map((m) => "<li>" + fmt(m) + "</li>").join("") + "</ol>" +
    (rest.length ? '<p class="tx-more"><i>ещё</i>' + rest.map((m) => "<span>" + fmt(m) + "</span>").join("") + "</p>" : "") + "</div>";
}
function card(e, q, how) {
  const mean = (m) => (q && isRu(q) && matches(m, q) ? "<b>" + esc(m) + "</b>" : esc(m)) + (OBSCENE.test(m) ? ' <span class="vulg">груб.</span>' : "");
  const g = e.p === "n" && e.g ? ({ m: "м. р.", f: "ж. р.", c: "общий род", mf: "м. и ж. р." })[e.g] : "";
  const fl = formsLine(e);
  return '<article class="wcard" data-id="' + esc(e.id) + '"><div class="whead"><span class="ww">' + esc(withArticle(e)) + "</span>" +
    (voice ? '<button type="button" class="spk" data-say="' + esc(e.w) + '" title="Произнести">' + SPK + "</button>" : "") +
    '<span class="badge">' + [POS_RU[e.p], g].filter(Boolean).join(", ") + "</span>" + (how ? '<span class="how">' + esc(how) + "</span>" : "") +
    '<span class="wstate">' + (has(e.id) ? '<span class="saved">✓ в моих словах</span><button type="button" class="lnk" data-del="' + esc(e.id) + '">убрать</button>' : '<button type="button" class="lnk add" data-add="' + esc(e.id) + '">＋ запомнить</button>') + "</span></div>" +
    (fl ? '<p class="forms">' + fl + "</p>" : "") + txHtml(e, mean, false) + (e.p === "v" && openConj.has(e.w) ? '<div class="wconj">' + conjHtml(e.w, q) + "</div>" : "") + "</article>";
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
const untouched = (id) => S.cards[id] && S.cards[id].last === null;
function autoSave(q, e) {
  if (!e || noAuto.has(e.id) || e.id === autoId) return;
  const related = autoQ && (q === autoQ || q.startsWith(autoQ) || autoQ.startsWith(q));
  if (autoId && related && untouched(autoId)) removeWord(autoId);
  autoId = null; autoQ = q;
  if (!has(e.id)) { addWord(e, e.p === "x" ? e.base : undefined); autoId = e.id; }
}
const ruExact = (e, q) => { const k = ruWords(q).join(" "); return meanings(e).some((m) => m.split(/[,;]\s*/).some((x) => ruWords(x.replace(/\([^)]*\)/g, " ")).join(" ") === k)); };
function renderLookup() {
  const q = $("q").value.trim(), el = $("res");
  // the review waits while the learner searches
  $("rev").hidden = !!q;
  if (!q) { el.innerHTML = ""; return; }
  if (!D) { el.innerHTML = '<p class="empty">Словарь загружается…</p>'; return; }
  const R = results(q);
  let h = R.cards.map((c) => card(c.e, q, c.how)).join("");
  // a Russian query lists a dozen words; the rest on request, so the review card stays in sight
  const rows = R.rows.filter((e) => !R.cards.some((c) => c.e.id === e.id)), lim = R.ru ? (ruAll ? 40 : 12) : 8;
  if (rows.length) h += '<div class="rows">' + (R.cards.length && !R.ru ? '<p class="cap">Похожие слова</p>' : "") + rows.slice(0, lim).map((e) => row(e, q)).join("") +
    (R.ru && rows.length > lim ? '<button type="button" class="lnk" id="ruMore">Показать ещё ' + (Math.min(rows.length, 40) - lim) + "</button>" : "") + "</div>";
  if (mmFor === q && mmRes) h += mmHtml(q);
  else if (!R.cards.length && !R.rows.length) h += '<p class="empty">В словаре нет. Enter — спросить переводчик MyMemory.</p>';
  else h += '<p class="empty mmask"><button type="button" class="lnk" id="mmAsk">Перевести фразу через MyMemory</button></p>';
  const best = R.cards[0]?.e || (R.ru && R.rows[0] && ruExact(R.rows[0], q) ? R.rows[0] : null);
  if (best && !has(best.id) && !noAuto.has(best.id)) { autoSave(q, best); return renderLookup(); }
  el.innerHTML = h + '<p class="back"><button type="button" class="lnk" id="back">← к повторению</button> <kbd>Esc</kbd></p>';
}
function commit() {
  const q = $("q").value.trim(); if (!q || !D) return;
  const R = results(q);
  const e = R.cards[0]?.e || (R.rows.length === 1 ? R.rows[0] : null);
  if (e) { sel = e.id; noAuto.delete(e.id); autoSave(q, e); renderLookup(); return; }
  if (R.rows.length) { sel = R.rows[0].id; noAuto.delete(sel); autoSave(q, R.rows[0]); renderLookup(); return; }
  askMM(q);
}

// MyMemory: only on request, only this query is sent
function mmHtml(q) {
  if (mmRes === "wait") return '<p class="empty">Спрашиваю MyMemory…</p>';
  if (mmRes.err) return '<p class="empty">MyMemory не ответил: ' + esc(mmRes.err) + "</p>";
  const id = mmRes.es + "|x", saved = has(id);
  return '<article class="wcard mm"><div class="whead"><span class="ww">' + esc(mmRes.es) + '</span><span class="badge">MyMemory</span><span class="wstate">' +
    (saved ? '<span class="saved">✓ в моих словах</span><button type="button" class="lnk" data-del="' + esc(id) + '">убрать</button>' : '<button type="button" class="lnk add" id="mmAdd">＋ запомнить</button>') +
    '</span></div><ol>' + mmRes.ru.map((m) => "<li>" + esc(m) + "</li>").join("") + "</ol></article>";
}
async function askMM(q) {
  mmFor = q; mmRes = "wait"; renderLookup();
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
  if (mmFor === q) renderLookup();
}
let lookT = null;
$("q").addEventListener("input", () => { openConj.clear(); sel = null; ruAll = false; clearTimeout(lookT); lookT = setTimeout(renderLookup, 60); });
function clearLookup() { $("q").value = ""; sel = null; ruAll = false; autoId = null; autoQ = ""; renderLookup(); }
$("q").addEventListener("keydown", (e) => {
  if (e.isComposing) return;
  if (e.key === "Enter") { e.preventDefault(); commit(); }
  else if (e.key === "Escape" && $("q").value) { e.preventDefault(); e.stopPropagation(); clearLookup(); }
});
$("res").addEventListener("click", (e) => {
  const t = e.target.closest("button,a"); if (!t) return;
  if (t.dataset.say) speak(t.dataset.say);
  else if (t.dataset.conj) { const v = t.dataset.conj; openConj.has(v) ? openConj.delete(v) : openConj.add(v); renderLookup(); $("res").querySelector('[data-conj="' + v + '"]')?.focus({ preventScroll: true }); }
  else if (t.dataset.sel) { sel = t.dataset.sel; autoSave($("q").value.trim(), D.byId.get(sel)); renderLookup(); $("res").querySelector(".wcard")?.scrollIntoView({ block: "nearest" }); }
  else if (t.dataset.add) { addWord(D.byId.get(t.dataset.add)); renderLookup(); }
  else if (t.dataset.del) { noAuto.add(t.dataset.del); if (autoId === t.dataset.del) autoId = null; removeWord(t.dataset.del); renderLookup(); }
  else if (t.id === "back") clearLookup();
  else if (t.id === "mmAsk") askMM($("q").value.trim());
  else if (t.id === "ruMore") { ruAll = true; renderLookup(); }
  else if (t.id === "mmAdd") { const id = mmRes.es + "|x"; if (!has(id)) { S.cards[id] = newCard(id, day(), mmRes.ru); save(); render(); queue = null; if (!cur && !answered) next(); } renderLookup(); }
});

// ---- review ----
// the session: due words (most overdue first), then new ones up to the day's limit; a mistake comes back 3 cards later
let queue = null, cur = null, answered = false, revealed = false, undoSnap = null;
function freqNew(n) {
  const out = [];
  for (let i = S.freqAt || 0; i < LEX.length && out.length < n; i++) {
    const x = LEX[i], id = x.w + "|" + x.p;
    if (!has(id) && D.byId.get(id)) out.push(id);
  }
  return out;
}
// a word comes back no sooner than GAP other words later. With few words in the session, words that aren't due yet
// (seen least recently, not today) are mixed in as a review ahead (a right answer doesn't move their date), and with
// the frequency dictionary on, new words after them
const GAP = 4;
let recent = [], ahead = new Set();
function fillers(n, skip) {
  if (n <= 0) return [];
  const d = day(), out = [];
  const early = Object.values(S.cards).filter((c) => c.last !== null && c.last < d && c.due > d && !skip.has(c.id)).sort((a, b) => a.due - b.due);
  for (const c of early.slice(0, n)) { ahead.add(c.id); out.push(c.id); }
  if (out.length < n && settings().src === "freq") out.push(...freqNew(n - out.length + skip.size).filter((id) => !skip.has(id)).slice(0, n - out.length));
  return out;
}
// the next word to ask: the first in the queue that wasn't among the last few answered
function pickNext() {
  const lately = new Set(recent.slice(-GAP));
  let i = queue.findIndex((id) => !lately.has(id));
  if (i < 0 && queue.length) { queue.push(...fillers(GAP, new Set([...queue, ...recent]))); i = queue.findIndex((id) => !lately.has(id)); }
  if (i > 0) queue.unshift(...queue.splice(i, 1));
  return queue[0];
}
function buildQueue() {
  const d = day(), st = settings();
  const cards = Object.values(S.cards);
  // words missed today wait at the end, after the ones not yet seen today
  const due = cards.filter((c) => c.last !== null && c.due <= d).sort((a, b) => (a.last === d) - (b.last === d) || a.due - b.due || a.add - b.add).map((c) => c.id);
  const room = Math.max(0, st.perDay + (log().extra || 0) - log().new);
  const fresh = cards.filter((c) => c.last === null).sort((a, b) => a.add - b.add).map((c) => c.id).slice(0, room);
  const extra = st.src === "freq" && D ? freqNew(room - fresh.length) : [];
  queue = due.concat(fresh, extra);
}
const tc = { see: "pres", write: "pret", listen: "sp" };
// focus: move into the card only when the learner is working with it, never away from the lookup field
function next(focus = $("rev").contains(document.activeElement)) {
  if (!D) return;
  if (!queue) buildQueue();
  queue = queue.filter((id) => entryOf(S.cards[id] || { id }));
  const id = pickNext();
  answered = false; revealed = false;
  if (!id) return showDone(focus);
  const c = S.cards[id] || newCard(id, day());
  const e = entryOf(c), mode = modeFor(c, settings().modes, !!voice);
  cur = { c, e, mode, isNew: c.last === null };
  $("rev").style.setProperty("--tc", "var(--t-" + tc[mode] + ")");
  $("rev").classList.remove("done");
  $("pTag").textContent = { see: "вспомни перевод", write: "напиши по-испански", listen: "на слух" }[mode];
  $("pWhen").textContent = cur.isNew ? "новое слово" : "";
  $("pRev").textContent = ""; $("pMean").hidden = true; $("pMean").innerHTML = ""; $("rev").classList.remove("revealed");
  $("ans").value = ""; $("no").hidden = true; $("undo").disabled = !undoSnap;
  const fb = $("fb"); fb.className = "feedback idle";
  if (mode === "see") {
    $("pMain").textContent = withArticle(e);
    $("pSub").textContent = POS_RU[e.p] || "";
    off(true);
    fb.textContent = "Вспомни перевод и нажми Enter.";
    setGo("Показать перевод");
    if (focus) $("go").focus({ preventScroll: true });
  } else {
    const shown = shownMeanings(e, c);
    $("pMain").innerHTML = mode === "write" ? '<span class="sent">' + esc(shown.join("; ")) + "</span>" : '<button type="button" class="spk big" data-say="1" title="Ещё раз">' + SPK + "</button>";
    $("pSub").textContent = (POS_RU[e.p] || "") + (e.p === "n" && mode === "write" ? " · можно с артиклем" : "");
    off(false);
    fb.textContent = mode === "write" ? "Напиши слово по-испански и нажми Enter." : "Напиши, что услышал. Кнопка с динамиком — ещё раз.";
    setGo("Проверить");
    if (mode === "listen") setTimeout(() => speak(e.w), 150);
    if (focus) $("ans").focus({ preventScroll: true });
  }
  $("spk").hidden = !voice || mode === "listen";
  render();
}
// see mode and the done card don't use the answer field, but it keeps its place
function off(v) { for (const id of ["ansRow", "keys"]) { $(id).classList.toggle("off", v); $(id).inert = v; } }
function showDone(focus) {
  cur = null;
  const n = Object.keys(S.cards).length, st = settings();
  $("rev").classList.add("done"); $("rev").style.setProperty("--tc", "var(--t-cond)");
  $("pTag").textContent = "на сегодня всё"; $("pWhen").textContent = ""; $("pRev").textContent = ""; $("pMean").hidden = true;
  $("pMain").textContent = n ? "¡Muy bien!" : "Пока пусто";
  $("pSub").textContent = n ? "Повторено всё, что было на сегодня." : "Найди слово в словаре выше — оно появится здесь.";
  off(true); $("no").hidden = true; $("spk").hidden = true; $("undo").disabled = !undoSnap;
  const fb = $("fb"); fb.className = "feedback idle";
  fb.textContent = st.perDay || n ? "Следующие слова — завтра. Можно взять ещё новых: кнопка ниже." : "";
  setGo("Ещё 5 новых");
  if (focus) $("go").focus({ preventScroll: true });
  render();
}
function setGo(t) { $("go").innerHTML = "<span>" + esc(t) + "</span><kbd>Enter ↵</kbd>"; }
// in the review, the clean meanings: obscene ones stay in the dictionary card
const meaningsHtml = (e) => txHtml(e, esc, true, 12);
const whenText = (c) => (c.ivl === 0 ? "ещё раз сегодня" : c.ivl === 1 ? "завтра" : "через " + c.ivl + " " + plural(c.ivl, "день", "дня", "дней"));
const plural = (n, a, b, c) => (n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c);

// a snapshot before every answer: Esc puts it back and asks the same word again
function result(ok) {
  undoSnap = { S: JSON.stringify(S), queue: queue.slice(), recent: recent.slice() };
  const { c } = cur, d = day();
  if (!S.cards[c.id]) S.cards[c.id] = c;
  if (c.last === null) { log().new++; const i = LEX.findIndex((x) => x.w + "|" + x.p === c.id); if (i >= (S.freqAt || 0)) S.freqAt = i + 1; }
  // a word asked ahead of its date keeps its date when it is right
  if (ahead.has(c.id) && ok && c.last !== null) S.cards[c.id].last = d; else grade(S.cards[c.id], ok, d);
  ahead.delete(c.id); recent.push(c.id); if (recent.length > 20) recent.shift();
  log().n++; if (ok) log().ok++;
  queue.shift();
  if (!ok) { queue.push(...fillers(GAP - queue.length, new Set([...queue, ...recent]))); queue.splice(Math.min(GAP, queue.length), 0, c.id); }
  answered = true;
  $("undo").disabled = false;
  save(); render();
  return S.cards[c.id];
}
function step() {
  if (!cur) { log().extra = (log().extra || 0) + 5; queue = null; save(); next(true); return; } // the day is done: 5 more new words
  if (answered) { next(true); return; }
  const { c, e, mode } = cur, fb = $("fb");
  if (mode === "see") {
    if (!revealed) {
      revealed = true;
      $("pMean").innerHTML = meaningsHtml(e); $("pMean").hidden = false; $("rev").classList.add("revealed");
      fb.textContent = "Вспомнил? Enter — помню, 1 — не помню.";
      setGo("Помню"); $("no").hidden = false; speak(e.w);
      return;
    }
    const k = result(true);
    afterSee(true, k);
    return;
  }
  const u = norm($("ans").value); if (!u) return;
  const strict = settings().strict;
  const ans = answersFor(D, e).map((a) => a.toLowerCase());
  const ok = ans.includes(u), accent = !ok && ans.some((a) => deaccent(a) === deaccent(u));
  const syn = !ok && !accent && mode === "write" ? synonym(D, e, shownMeanings(e, c), u) : null;
  const right = ok || (accent && !strict) || !!syn;
  const k = result(right);
  fb.className = "feedback " + (right ? "ok" : "bad");
  fb.innerHTML = "<div>" + (ok ? "Верно." : syn ? "Тоже верно: " + esc(syn.w) + ". Загадано другое слово:" : accent ? (strict ? "Ошибка в ударении." : "Засчитано, но с ударением:") : "Ошибка.") + "</div>" +
    (ok ? "" : '<div class="row">надо: <b>' + esc(withArticle(e)) + "</b></div>") + meaningsHtml(e) + '<div class="tr">Следующий раз — ' + whenText(k) + ". Esc — отменить ответ.</div>";
  setGo("Дальше");
  speak(e.w);
}
// a "see" answer moves on at once; the line above the next word says what happened
function afterSee(ok, k) {
  const w = cur.e.w;
  next(true);
  $("pRev").textContent = "«" + w + "» — " + (ok ? "помню" : "не помню") + ": " + whenText(k) + ". Esc — отменить.";
}
function forgot() {
  if (!cur || cur.mode !== "see" || !revealed || answered) return;
  const k = result(false);
  afterSee(false, k);
}
function undo() {
  if (!undoSnap) return;
  S = JSON.parse(undoSnap.S); queue = undoSnap.queue; recent = undoSnap.recent; undoSnap = null; save();
  next(true);
  $("fb").textContent = "Ответ отменён, попробуй ещё раз.";
}
$("go").addEventListener("click", step);
$("no").addEventListener("click", forgot);
$("undo").addEventListener("click", undo);
$("spk").addEventListener("click", () => cur && speak(cur.e.w));
$("pMain").addEventListener("click", (e) => { if (e.target.closest("[data-say]") && cur) speak(cur.e.w); });
$("ans").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); step(); } });
document.querySelectorAll("#keys button").forEach((b) => b.addEventListener("click", () => {
  const i = $("ans"), s = i.selectionStart ?? i.value.length, en = i.selectionEnd ?? s;
  i.value = i.value.slice(0, s) + b.dataset.k + i.value.slice(en); i.focus(); i.setSelectionRange(s + 1, s + 1);
}));
// keys for the card: Enter — show / remember (a focused button clicks itself), 1 — don't remember, 2 — remember,
// Esc — undo the last answer (not while typing in the lookup or the list filter)
document.addEventListener("keydown", (e) => {
  if ($("list").open || drawerOpen() || e.isComposing || $("rev").hidden) return;
  const t = e.target, inField = !!t.closest?.("input,textarea,select"), onBtn = !!t.closest?.("button,a");
  if (e.key === "Escape") { if ((!inField || t.id === "ans") && undoSnap) { e.preventDefault(); undo(); } return; }
  if (inField) return;
  if (e.key === "Enter" && !onBtn) { e.preventDefault(); step(); }
  else if (e.key === "1") forgot();
  else if (e.key === "2" && cur?.mode === "see" && revealed) step();
});

// ---- the side panel: stats ----
function streak() {
  let n = 0, d = day();
  if (!(S.days[d]?.n)) d--;
  while (S.days[d]?.n) { n++; d--; }
  return n;
}
let loaded = false;
const setB = (el, vals) => el.querySelectorAll("b").forEach((b, i) => (b.textContent = vals[i]));
function render() {
  if (!loaded) return;
  const cards = Object.values(S.cards), d = day(), L = S.days[d] || { n: 0, ok: 0, new: 0 };
  const due = cards.filter((c) => c.last !== null && c.due <= d).length;
  setB($("stats"), [due, L.n, streak(), cards.length, L.new, cards.filter(known).length]);
  setB($("mini"), [queue ? queue.length : "", streak()]);
  if ($("list").open) renderList();
}

// ---- my words ----
function renderList() {
  if (!D) return;
  const f = $("lf").value.trim(), d = day();
  const all = Object.values(S.cards).sort((a, b) => b.add - a.add || a.id.localeCompare(b.id));
  const rows = all.map((c) => ({ c, e: entryOf(c) })).filter(({ e }) => e && (!f || (isRu(f) ? meanings(e).some((m) => matches(m, f)) : key(e.w).includes(key(f)))));
  $("lcount").textContent = all.length ? "Слов: " + all.length + (f ? ", найдено " + rows.length : "") + "." : "Пока пусто: найди слово в словаре — оно появится здесь.";
  $("lt").innerHTML = rows.slice(0, 500).map(({ c, e }) => {
    const st = status(c, d), when = c.last === null ? "новое" : c.due <= d ? "сегодня" : "через " + (c.due - d) + " дн.";
    return "<tr><td class=\"f\">" + esc(withArticle(e)) + "</td><td class=\"wm\">" + esc(meanings(e).slice(0, 3).join("; ")) + '</td><td class="p">' + esc(st === "знаю" ? "знаю · " + when : when) + '</td><td><button type="button" class="lnk" data-del="' + esc(c.id) + '">убрать</button></td></tr>';
  }).join("");
}
const list = $("list");
$("listOpen").addEventListener("click", () => { renderList(); try { list.showModal(); } catch (e) { list.setAttribute("open", ""); } $("lf").focus(); });
$("listClose").addEventListener("click", () => list.close());
list.addEventListener("click", (e) => { if (e.target === list) list.close(); const b = e.target.closest("[data-del]"); if (b) { removeWord(b.dataset.del); renderList(); } });
$("lf").addEventListener("input", renderList);

// ---- export / import: the only way to move words to another device ----
$("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ app: "verbos-palabras", v: 1, ...S })], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mis-palabras-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $("ioNote").textContent = "Сохранено: " + Object.keys(S.cards).length + " слов.";
});
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.app !== "verbos-palabras" || !j.cards) throw new Error("не тот файл");
    let n = 0;
    for (const [id, c] of Object.entries(j.cards)) { const o = S.cards[id]; if (!o || (c.last ?? -1) > (o.last ?? -1)) { S.cards[id] = c; n++; } }
    for (const [d, x] of Object.entries(j.days || {})) if (!S.days[d] || x.n > S.days[d].n) S.days[d] = x;
    S.freqAt = Math.max(S.freqAt || 0, j.freqAt || 0);
    save(); queue = null; render(); if (!answered) next();
    $("ioNote").textContent = "Загружено слов: " + n + ".";
  } catch (err) { $("ioNote").textContent = "Не получилось загрузить: " + err.message + "."; }
  e.target.value = "";
});

// ---- settings drawer on phones ----
const side = $("side"), narrow = matchMedia("(max-width:899.98px)");
const drawerOpen = () => side.classList.contains("open");
function setDrawer(open) {
  if (open && !narrow.matches) return;
  side.classList.toggle("open", open); $("scrim").hidden = !open;
  $("cfgOpen").setAttribute("aria-expanded", open);
  document.querySelectorAll(".top,.trainers,.main,.about").forEach((x) => (x.inert = open));
  if (open) side.focus();
}
$("cfgOpen").addEventListener("click", () => setDrawer(true));
$("cfgClose").addEventListener("click", () => setDrawer(false));
$("scrim").addEventListener("click", () => setDrawer(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawerOpen()) { e.preventDefault(); setDrawer(false); } });
narrow.addEventListener("change", () => { if (!narrow.matches && drawerOpen()) setDrawer(false); });

// ---- start ----
render();
(async () => {
  try {
    if (window.indexedDB) {
      await IDB.open(); idbReady = true;
      const r = await IDB.get(PKEY);
      const n = (x) => Object.keys(x?.cards || {}).length;
      if (r && r.cards && n(r) >= n(S)) S = Object.assign(fresh(), r);
      else if (n(S)) { dirty = true; await flush(); }
      try { localStorage.removeItem(LKEY); } catch (e) {}
      $("syncNote").textContent = "Слова и прогресс хранятся в этом браузере (IndexedDB).";
    }
  } catch (e) { idbReady = false; }
  await dictReady;
  loaded = true; render(); next(); renderLookup();
  $("rev").classList.remove("loading"); $("stats").classList.remove("loading");
  $("q").focus({ preventScroll: true });
})();

// e2e hook: only with ?e2e in the URL, Playwright runs test code inside this module's scope
if (new URLSearchParams(location.search).has("e2e")) window.__words = (src) => eval(src);
