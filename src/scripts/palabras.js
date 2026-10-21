// Words page: the dictionary lookup (Spanish ⇄ Russian), "my words" saved from it, and their day-based review.
import { IDB, norm, esc } from "../lib/trainer-kit.js";
import { LEX } from "../lib/es/lexicon.js";
import { meanings, matches, withArticle, isRu, key, POS_RU, today, newCard, grade, known, status, modeFor, answersFor, synonym, shownMeanings } from "../lib/es/palabras.js";
import { loadDict, createLookup, txHtml, voice, speak, onVoice, SPK } from "../lib/lookup-ui.js";

const $ = (id) => document.getElementById(id);
const deaccent = (s) => s.replace(/[áéíóú]/g, (c) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u" })[c]);

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

// ---- the dictionary and the lookup (shared with the search of the top bar on other pages) ----
let D = null;
const dictReady = loadDict().then((d) => { D = d; }, () => { $("res").innerHTML = '<p class="empty">Словарь не загрузился. Обнови страницу.</p>'; });

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

// the voice note waits a moment: some browsers list their voices late
let voicesWaited = false;
const voiceNote = (listed) => { if (listed || voicesWaited) $("voiceNote").hidden = !!voice || !settings().modes.includes("listen"); };
onVoice(voiceNote);
setTimeout(() => { voicesWaited = true; voiceNote(true); }, 1500);

// the review waits while the learner searches
const look = createLookup({
  input: $("q"), res: $("res"), back: "← к повторению",
  store: { has, untouched: (id) => S.cards[id] && S.cards[id].last === null, add: addWord, remove: removeWord },
  onQuery: (q) => { $("rev").hidden = !!q; },
});
const renderLookup = look.render;

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
    $("pMain").innerHTML = mode === "write" ? '<span class="sent">' + esc(shown.join("; ")) + "</span>" : '<button type="button" class="spk big" data-say="1" title="Послушать">' + SPK + "</button>";
    $("pSub").textContent = (POS_RU[e.p] || "") + (e.p === "n" && mode === "write" ? " · можно с артиклем" : "");
    off(false);
    fb.textContent = mode === "write" ? "Напиши слово по-испански и нажми Enter." : "Нажми на динамик, послушай и напиши, что услышал.";
    setGo("Проверить");
    if (focus) $("ans").focus({ preventScroll: true });
  }
  hide("spk", !voice || mode === "listen");
  render();
}
// see mode and the done card don't use the answer field, but it keeps its place
const hide = (id, v) => { $(id).classList.toggle("off", v); $(id).inert = v; };
function off(v) { hide("ansRow", v); hide("keys", v); }
function showDone(focus) {
  cur = null;
  const n = Object.keys(S.cards).length, st = settings();
  $("rev").classList.add("done"); $("rev").style.setProperty("--tc", "var(--t-cond)");
  $("pTag").textContent = "на сегодня всё"; $("pWhen").textContent = ""; $("pRev").textContent = ""; $("pMean").hidden = true;
  $("pMain").textContent = n ? "¡Muy bien!" : "Пока пусто";
  $("pSub").textContent = n ? "Повторено всё, что было на сегодня." : "Найди слово в словаре выше — оно появится здесь.";
  off(true); $("no").hidden = true; hide("spk", true); $("undo").disabled = !undoSnap;
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
      setGo("Помню"); $("no").hidden = false;
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

// the search in the top bar of the other pages saves words too, maybe in another tab: write before the page goes away,
// take the stored words when it comes back
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "hidden") { clearTimeout(timer); flush(); return; }
  if (!idbReady || !loaded || dirty || writing) return;
  try {
    const r = await IDB.get(PKEY);
    if (!r || !r.cards || dirty || JSON.stringify(r) === JSON.stringify(S)) return;
    S = Object.assign(fresh(), r); queue = null;
    render(); renderLookup();
    if (!cur && !answered) next();
  } catch (e) {}
});

// e2e hook: only with ?e2e in the URL, Playwright runs test code inside this module's scope
if (new URLSearchParams(location.search).has("e2e")) window.__words = (src) => eval(src);
