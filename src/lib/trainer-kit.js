// Runtime shared by trainer pages built with TrainerPage.astro.
// A page gives: id (storage namespace), next(settings) → task, fromKey(key) → task, allowed(key, settings) → bool.
// A task is { key, tc, tag, when, main (html), sub, answers: [main, ...alternatives], why: [html lines], rule: [lines], label }.
// The kit does the rest: checking, feedback with the explanation, undo (Esc), hints, review of mistakes,
// progress in IndexedDB, settings remembered in localStorage, the settings drawer on phones, accent keys.

const $ = (id) => document.getElementById(id);
export const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");
export const deacc = (s) => s.normalize("NFD").replace(/[́]/g, "").normalize("NFC");
export const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
function diff(u, c) {
  let a = 0; while (a < u.length && a < c.length && u[a] === c[a]) a++;
  let b = 0; while (b < u.length - a && b < c.length - a && u[u.length - 1 - b] === c[c.length - 1 - b]) b++;
  const cm = c.slice(a, c.length - b), um = u.slice(a, u.length - b);
  return {
    c: esc(c.slice(0, a)) + (cm ? "<mark>" + esc(cm) + "</mark>" : "<mark>∧</mark>") + esc(c.slice(c.length - b)),
    u: esc(u.slice(0, a)) + (um ? "<del>" + esc(um) + "</del>" : "<del>∧</del>") + esc(u.slice(u.length - b)),
    score: a + b,
  };
}

// IndexedDB key-value store shared with the conjugation page (same database, own key per trainer)
const setB = (el, vals) => el.querySelectorAll("b").forEach((b, i) => (b.textContent = vals[i]));
// a page answered on before hides the first-visit hint already in <head> (Base.astro), before the first paint
export function markSeen() {
  try { const s = JSON.parse(localStorage.getItem("verbos-seen") || "[]"); if (!s.includes(location.pathname)) { s.push(location.pathname); localStorage.setItem("verbos-seen", JSON.stringify(s)); } } catch (e) {}
}
export const IDB = {
  db: null,
  open() { return new Promise((res, rej) => { const r = indexedDB.open("conjugacion", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res((this.db = r.result)); r.onerror = () => rej(r.error); }); },
  get(k) { return new Promise((res, rej) => { const q = this.db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  set(k, v) { return new Promise((res, rej) => { const tx = this.db.transaction("kv", "readwrite"); tx.objectStore("kv").put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); },
};

export function createTrainer({ id, next, fromKey, allowed = () => true }) {
  const PKEY = "progress:" + id, LKEY = "verbos-" + id + "-v1", SKEY = "verbos-" + id + "-settings-v1";
  const fresh = () => ({ t: 0, review: {}, total: 0, right: 0, streak: 0 });
  let S = fresh();
  try { const s = JSON.parse(localStorage.getItem(LKEY) || "null"); if (s && s.review) S = Object.assign(S, s); } catch (e) {}
  let idbReady = false, writing = false, dirty = false, timer = null;
  const setNote = (s) => { const n = $("syncNote"); if (n) n.textContent = s; };
  const save = () => { dirty = true; clearTimeout(timer); timer = setTimeout(flush, 400); };
  async function flush() {
    if (!dirty || writing) return;
    dirty = false;
    if (!idbReady) { try { localStorage.setItem(LKEY, JSON.stringify(S)); } catch (e) {} return; }
    writing = true;
    try { await IDB.set(PKEY, JSON.parse(JSON.stringify(S))); } catch (e) { setNote("Не получилось сохранить прогресс в браузере."); }
    writing = false;
    if (dirty) flush();
  }

  // ---- settings: every input inside the side panel with a name; remembered between reloads ----
  const inputs = () => [...$("side").querySelectorAll("input[name]")];
  function settings() {
    const o = {};
    for (const i of inputs()) {
      if (i.type === "radio") { if (i.checked) o[i.name] = i.value; }
      else if (i.type === "checkbox" && i.value !== "on") (o[i.name] ||= []).push(...(i.checked ? [i.value] : []));
      else if (i.type === "checkbox") o[i.name] = i.checked;
    }
    return o;
  }
  const defaults = inputs().map((i) => [i, i.checked]);
  const saveSettings = () => { try { localStorage.setItem(SKEY, JSON.stringify(inputs().filter((i) => i.checked).map((i) => i.name + "=" + i.value))); } catch (e) {} };
  try { const on = JSON.parse(localStorage.getItem(SKEY) || "null"); if (Array.isArray(on)) inputs().forEach((i) => (i.checked = on.includes(i.name + "=" + i.value))); } catch (e) {}
  $("side").addEventListener("change", (e) => {
    const i = e.target;
    if (!i.name) return;
    // a group of checkboxes keeps at least one checked
    if (i.type === "checkbox" && i.value !== "on" && !inputs().some((x) => x.name === i.name && x.checked)) { i.checked = true; return; }
    saveSettings(); show();
  });

  // ---- state of the current task ----
  let loaded = false, cur = null, last = null, answered = false, prevS = null, undone = false, hintUsed = new Set(), letters = 0;
  const ICO = { check: '<path d="M20 6 9 17l-5-5"/>', next: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>' };
  const setGo = (done) => {
    $("go").innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + ICO[done ? "next" : "check"] + "</svg><span>" + (done ? "Дальше" : "Проверить") + "</span><kbd>Enter ↵</kbd>";
    $("undo").disabled = !done || !prevS; syncHints();
  };
  const syncHints = () => document.querySelectorAll("#hintbar button").forEach((b) => {
    b.disabled = answered || !cur || (b.dataset.h === "letter" ? letters >= cur.answers[0].length - 1 : hintUsed.has(b.dataset.h));
  });
  const resetHints = () => { hintUsed = new Set(); letters = 0; $("hints").innerHTML = ""; $("hints").hidden = true; };
  function useHint(k) {
    if (answered || !cur) return;
    const h = $("hints"); hintUsed.add(k);
    if (k === "letter") {
      const c = cur.answers[0]; letters++; if (c[letters - 1] === " ") letters++;
      let el = h.querySelector(".lt-row"); if (!el) { el = document.createElement("div"); el.className = "lt-row"; h.appendChild(el); }
      el.innerHTML = '<i>Начало</i><span class="lt">' + esc(c.slice(0, letters)) + "…</span>";
    } else {
      const el = document.createElement("div"); el.innerHTML = "<i>Правило</i>" + cur.rule.map(esc).join(" ");
      h.insertBefore(el, h.querySelector(".lt-row"));
    }
    h.hidden = false; syncHints(); $("ans").focus({ preventScroll: true });
  }

  // due mistakes first, then a new task
  let firstKey = document.querySelector(".trainer").dataset.first || null;
  function pick() {
    const st = settings();
    // the task already drawn in the markup comes first
    if (firstKey) { const k = firstKey; firstKey = null; if (allowed(k, st)) { try { return fromKey(k); } catch (e) {} } }
    const due = Object.entries(S.review).filter(([k, r]) => r.due <= S.t && k !== last && allowed(k, st)).sort((a, b) => a[1].due - b[1].due);
    if (due.length) { try { return fromKey(due[0][0]); } catch (e) { delete S.review[due[0][0]]; } }
    for (let i = 0; i < 20; i++) { const t = next(st); if (t.key !== last) return t; }
    return next(st);
  }
  // every word of a task sentence (.sent) or of the objects (.obj) is a button: it shows the translation and saves the
  // word (word-pop.js, loaded on the first click); the gap is not a word. The answer field keeps the focus.
  function wrapWords(root) {
    for (const box of root.querySelectorAll(".sent, .obj")) {
      const it = document.createTreeWalker(box, NodeFilter.SHOW_TEXT), nodes = [];
      while (it.nextNode()) if (!it.currentNode.parentElement.closest(".gap")) nodes.push(it.currentNode);
      for (const n of nodes) {
        const parts = n.data.split(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/); if (parts.length < 2) continue;
        const f = document.createDocumentFragment();
        parts.forEach((x, i) => { if (!x) return; if (i % 2) { const b = document.createElement("button"); b.type = "button"; b.className = "w"; b.tabIndex = -1; b.title = "Перевод"; b.textContent = x; f.append(b); } else f.append(x); });
        n.replaceWith(f);
      }
    }
  }
  $("pMain").addEventListener("mousedown", (e) => { if (e.target.closest(".w")) e.preventDefault(); });
  $("pMain").addEventListener("click", (e) => { const b = e.target.closest(".w"); if (b) import("./word-pop.js").then((m) => m.showWord(b)); });
  const FB_IDLE = $("fb").textContent;
  function show() {
    if (!loaded) return;
    cur = pick(); last = cur.key; answered = false; prevS = null; undone = false;
    $("pTag").textContent = cur.tag; $("pWhen").textContent = cur.when || "";
    $("pMain").innerHTML = cur.main; $("pSub").textContent = cur.sub || ""; wrapWords($("pMain")); $("wpop")?.setAttribute("hidden", "");
    document.querySelector(".trainer").style.setProperty("--tc", "var(--t-" + (cur.tc || "pres") + ")");
    const r = S.review[cur.key]; $("pRev").textContent = r ? "повтор · осталось верных: " + r.need : "";
    $("ans").value = ""; $("ans").focus({ preventScroll: true });
    resetHints(); setGo(false);
    const fb = $("fb"); fb.className = "feedback idle"; fb.textContent = FB_IDLE; fb.hidden = S.total > 0;
  }
  function check() {
    const u = norm($("ans").value); if (!u) return;
    prevS = JSON.stringify(S);
    const strict = settings().strict !== false;
    const ok = cur.answers.some((a) => u === a), accentOnly = !ok && cur.answers.some((a) => deacc(u) === deacc(a));
    const right = ok || (accentOnly && !strict);
    S.t++; S.total++;
    const fb = $("fb"); fb.hidden = false;
    const best = cur.answers.map((a) => [a, diff(u, a)]).sort((x, y) => y[1].score - x[1].score)[0];
    const others = cur.answers.length > 1 ? '<div class="tr">Можно и так: ' + cur.answers.filter((a) => a !== (right ? u : best[0])).map(esc).join(" · ") + "</div>" : "";
    if (right) {
      S.right++;
      const r = S.review[cur.key];
      let msg = accentOnly ? "Засчитано, но ударение: " + best[0] : "Верно.";
      if (hintUsed.size || undone) {
        msg += hintUsed.size ? " С подсказкой — вопрос вернётся, чтобы ответить без неё." : " После отмены — вопрос вернётся ещё раз позже.";
        if (r) r.due = S.t + r.gap; else S.review[cur.key] = { need: 1, gap: 4, due: S.t + 4 + Math.floor(Math.random() * 3) };
      } else {
        S.streak++;
        if (r) { r.need--; if (r.need <= 0) { delete S.review[cur.key]; msg += " Убрано из повторения."; } else { r.gap = Math.round(r.gap * 1.8); r.due = S.t + r.gap; } }
      }
      fb.className = "feedback ok"; fb.innerHTML = "<div>" + esc(msg) + "</div>" + others;
    } else {
      S.streak = 0;
      S.review[cur.key] = { need: 3, gap: 4, due: S.t + 4 + Math.floor(Math.random() * 3) };
      fb.className = "feedback bad";
      fb.innerHTML = "<div>" + (accentOnly ? "Ошибка в ударении." : "Ошибка.") + '</div><div class="row">ты: ' + best[1].u + '</div><div class="row">надо: ' + best[1].c + "</div>" + others +
        '<div class="why"><h3>Как получается</h3>' + cur.why.map((l) => "<div>" + l + "</div>").join("") + "</div>";
    }
    save(); render(); answered = true; setGo(true);
  }
  function undo() {
    if (!answered || !prevS) return;
    S = JSON.parse(prevS); prevS = null; undone = true; save(); render();
    answered = false; setGo(false);
    const r = S.review[cur.key]; $("pRev").textContent = r ? "повтор · осталось верных: " + r.need : "";
    const fb = $("fb"); fb.hidden = false; fb.className = "feedback idle"; fb.textContent = "Ответ отменён, попробуй ещё раз. Этот вопрос потом вернётся ещё раз.";
    $("ans").value = ""; $("ans").focus({ preventScroll: true });
  }
  // the numbers fill the labels already in the markup, and only once the saved progress is read (nothing jumps on load)
  function render() {
    if (!loaded) return;
    const pct = S.total ? Math.round((S.right / S.total) * 100) : 0, n = Object.keys(S.review).length;
    setB($("stats"), [S.total, pct + "%", S.streak, n]);
    setB($("mini"), [S.streak, pct + "%"]); $("mini").toggleAttribute("data-empty", !S.total);
    if (S.total) markSeen();
    const w = $("weak");
    if (!n) { w.innerHTML = '<span class="empty">Пусто. Ошибки появятся здесь и будут возвращаться, пока не ответишь трижды.</span>'; return; }
    w.innerHTML = Object.entries(S.review).sort((a, b) => a[1].due - b[1].due).map(([k, r]) => {
      let label = k; try { label = fromKey(k).label || k; } catch (e) {}
      return '<span class="chip">' + esc(label) + " <i>×" + r.need + "</i></span>";
    }).join("");
  }
  const step = () => (answered ? show() : check());

  // ---- controls ----
  $("go").addEventListener("click", step);
  $("undo").addEventListener("click", undo);
  $("hintbar").addEventListener("click", (e) => { const b = e.target.closest("button[data-h]"); if (b) useHint(b.dataset.h); });
  $("ans").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); step(); } });
  document.querySelectorAll(".keys button").forEach((b) => b.addEventListener("click", () => {
    const i = $("ans"), s = i.selectionStart ?? i.value.length, en = i.selectionEnd ?? s;
    i.value = i.value.slice(0, s) + b.dataset.k + i.value.slice(en); i.focus(); i.setSelectionRange(s + 1, s + 1);
  }));
  // settings drawer on phones
  const side = $("side"), narrow = matchMedia("(max-width:899.98px)");
  const drawerOpen = () => side.classList.contains("open");
  function setDrawer(open) {
    if (open && !narrow.matches) return;
    side.classList.toggle("open", open); $("scrim").hidden = !open;
    $("cfgOpen").setAttribute("aria-expanded", open);
    document.querySelectorAll(".top,.trainers,.main,.about").forEach((x) => (x.inert = open));
    if (open) side.focus(); else $("ans").focus({ preventScroll: true });
  }
  $("cfgOpen").addEventListener("click", () => setDrawer(true));
  $("cfgClose").addEventListener("click", () => setDrawer(false));
  $("scrim").addEventListener("click", () => setDrawer(false));
  narrow.addEventListener("change", () => { if (!narrow.matches && drawerOpen()) setDrawer(false); });
  const rules = $("rules");
  if (rules) {
    $("rulesOpen").addEventListener("click", () => { try { rules.showModal(); } catch (e) { rules.setAttribute("open", ""); } });
    $("rulesClose").addEventListener("click", () => rules.close());
    rules.addEventListener("click", (e) => { if (e.target === rules) rules.close(); });
    rules.addEventListener("close", () => $("ans").focus({ preventScroll: true }));
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || (rules && rules.open)) return;
    if (drawerOpen()) { e.preventDefault(); setDrawer(false); }
    else if (answered) { e.preventDefault(); undo(); }
  });
  // resets: a second click within 3 s confirms
  function confirmBtn(bid, action) {
    const b = $(bid), lbl = b.querySelector("span"); let armed = false, tm = null;
    b.addEventListener("click", () => {
      if (!armed) { armed = true; lbl.textContent = "Точно?"; tm = setTimeout(() => { armed = false; lbl.textContent = b.dataset.label; }, 3000); return; }
      clearTimeout(tm); armed = false; lbl.textContent = b.dataset.label; action();
    });
  }
  const resetProgress = () => { S = fresh(); prevS = null; save(); render(); };
  confirmBtn("reset", () => { resetProgress(); show(); });
  confirmBtn("resetAll", () => {
    resetProgress(); defaults.forEach(([i, c]) => (i.checked = c));
    try { localStorage.removeItem(SKEY); } catch (e) {}
    show();
  });

  // the first task waits for the saved progress (a review may be due), so the card is drawn once
  function start() {
    if (loaded) return;
    loaded = true; render(); show();
    document.querySelector(".trainer").classList.remove("loading"); $("stats").classList.remove("loading");
  }
  setTimeout(start, 1500);
  (async () => {
    try {
      if (!window.indexedDB) return start();
      await IDB.open(); idbReady = true;
      const r = await IDB.get(PKEY);
      if (r && r.review && (r.total || 0) >= (S.total || 0)) { S = Object.assign(fresh(), r); render(); }
      else if (S.total > 0) { dirty = true; await flush(); }
      try { localStorage.removeItem(LKEY); } catch (e) {}
      setNote("Прогресс хранится в этом браузере (IndexedDB).");
    } catch (e) { idbReady = false; }
    start();
  })();

  // e2e hook: only with ?e2e in the URL, Playwright runs test code inside this scope
  if (new URLSearchParams(location.search).has("e2e")) window.__kit = (src) => eval(src);
  return { show, settings };
}
