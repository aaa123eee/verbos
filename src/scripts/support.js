// Report a mistake / write feedback / the wine dialog. A report carries what the learner sees right now: the task,
// their answer, what the page said, the hints, the settings; it is read from the page when the dialog opens.
import { CONTACT, hasSend, message, tgUrl, mailUrl } from "../lib/support.js";

const $ = (id) => document.getElementById(id);
const dlg = $("report"), text = $("rpText"), note = $("rpNote");
const shown = (el) => el && !el.hidden && !el.closest("[hidden]") && !el.closest(".off");
const txt = (el) => (shown(el) ? el.innerText : "");

// ---- what is on the screen ----
// the text of an element, with the tense table of the feedback one person per line («yo quise»)
const lines = (el) => el.matches(".vt") ? [...el.children].map((r) => r.innerText.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n")
  : el.querySelector(".vt") ? [...el.children].map(lines).filter(Boolean).join("\n") : txt(el).trim();
function settings() {
  const side = $("side"); if (!side) return "";
  const groups = {}, out = [];
  side.querySelectorAll("input[type=checkbox],input[type=radio]").forEach((i) => {
    // the tense checkboxes of the main page have an id tn-<k> and no name
    const k = i.name || (i.id.startsWith("tn-") ? "tenses" : i.id); if (!k) return;
    if (i.type === "radio") { if (i.checked) out.push(k + "=" + i.value); }
    else if (i.hasAttribute("value")) { if (i.checked) (groups[k] ||= []).push(i.value); }
    else out.push(k + (i.checked ? "" : "=нет"));
  });
  for (const k in groups) out.push(k + "=" + groups[k].join(","));
  return out.join(" · ");
}
function context() {
  const card = document.querySelector("main .trainer"), ctx = [];
  ctx.push(["страница", location.pathname + location.hash + " — " + document.title]);
  if (card && shown(card)) {
    // line by line: the tense row without the streak, the task, its translation, the review tag
    const p = card.querySelector(".prompt"), tense = [...p.querySelectorAll(".tense>:not(.mini)")].map(txt).filter(Boolean).join(" · ");
    ctx.push(["задание", [tense, ...[...p.children].filter((e) => !e.matches(".tense")).map(txt)].filter((s) => s.trim()).join("\n")], ["ключ", card.dataset.key || ""]);
    const ans = card.querySelector("#ans");
    if (shown(ans)) ctx.push(["ответ", ans.value ? "«" + ans.value + "»" : ""]);
    const drill = card.querySelector("#drill");
    if (shown(drill)) ctx.push(["все формы", [...drill.querySelectorAll(".dr")].map((r) => r.querySelector(".pl")?.innerText + ": " + (r.querySelector("input")?.value || "—") + (r.classList.contains("ok") ? " ✓" : r.classList.contains("bad") ? " ✗" : "")).join("\n")]);
    ctx.push(["подсказки", txt(card.querySelector("#hints"))]);
    const fb = card.querySelector("#fb");
    if (fb && !fb.classList.contains("idle")) ctx.push(["проверка", lines(fb)]);
  }
  const q = $("q");
  if (q && q.value) ctx.push(["поиск", "«" + q.value + "»\n" + txt($("res")).slice(0, 500)]);
  ctx.push(["настройки", settings()]);
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  ctx.push(["браузер", navigator.userAgent], ["экран", innerWidth + "×" + innerHeight + " @" + devicePixelRatio + (dark ? " · тёмная тема" : "") + " · " + navigator.language]);
  ctx.push(["версия", (document.querySelector(".support")?.dataset.ver || "") + " · " + new Date().toISOString()]);
  return ctx;
}

// ---- the dialog ----
const INTRO = {
  bug: "Что не так? Задание, твой ответ, ответ тренажёра и настройки уже приложены — достаточно пары слов, можно и без них.",
  idea: "Что понравилось, чего не хватает, что неудобно — всё пригодится.",
};
let kind = "bug", ctx = [], sending = false;
function setKind(k) {
  kind = k;
  dlg.querySelectorAll("[data-kind]").forEach((b) => b.setAttribute("aria-selected", b.dataset.kind === k));
  $("rpIntro").textContent = INTRO[k];
  text.placeholder = k === "bug" ? "Например: здесь тоже верно «…»" : "Твой отзыв";
  $("rpCtxBox").hidden = k !== "bug";
  note.textContent = ""; note.className = "rp-note";
  text.focus();
}
function open(k) {
  ctx = context(); // before the dialog covers the page
  $("rpCtx").textContent = message({ kind: "bug", text: "…", ctx }).split("— — —\n")[1] || "";
  try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
  setKind(k);
}
document.querySelector(".support").addEventListener("click", (e) => { const b = e.target.closest("[data-report]"); if (b) open(b.dataset.report); });
dlg.querySelector(".tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-kind]"); if (b) setKind(b.dataset.kind); });
$("reportClose").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
// the page's own keys (Enter checks, Esc undoes, digits answer) don't reach it while a dialog is open
dlg.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
});

function say(s, cls = "") { note.textContent = s; note.className = "rp-note " + cls; }
async function copy(s) {
  try { await navigator.clipboard.writeText(s); return true; } catch (e) {}
  try { const t = document.createElement("textarea"); t.value = s; document.body.append(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; } catch (e) { return false; }
}
async function send() {
  if (sending) return;
  if (kind === "idea" && !text.value.trim()) { say("Напиши пару слов.", "bad"); text.focus(); return; }
  const msg = message({ kind, text: text.value, contact: $("rpContact").value, ctx: kind === "bug" && $("rpAttach").checked ? ctx : ctx.filter(([k]) => k === "страница" || k === "версия") });
  sending = true; $("rpSend").disabled = true; say("Отправляю…");
  let ok = false;
  if (CONTACT.tg.token && CONTACT.tg.chat) {
    try {
      // a plain form body: a "simple" request, no CORS preflight
      const r = await fetch(tgUrl(), { method: "POST", body: new URLSearchParams({ chat_id: CONTACT.tg.chat, text: msg, disable_web_page_preview: "true" }) });
      ok = r.ok;
    } catch (e) {}
  }
  sending = false; $("rpSend").disabled = false;
  if (ok) { say("Отправлено, спасибо!", "ok"); text.value = ""; setTimeout(() => { if (dlg.open && note.classList.contains("ok")) dlg.close(); }, 1600); return; }
  if (CONTACT.email) { location.href = mailUrl(msg, kind); say("Не получилось отправить отсюда — открываю почту с готовым письмом.", "bad"); return; }
  say(hasSend() ? "Не получилось отправить. " : "", "bad");
  if (await copy(msg)) say(note.textContent + "Текст скопирован — его можно переслать автору.", "bad");
}
$("rpSend").addEventListener("click", send);

// ---- the wine dialog ----
const wine = $("wine");
if (wine) {
  $("wineOpen").addEventListener("click", () => { try { wine.showModal(); } catch (e) { wine.setAttribute("open", ""); } });
  $("wineClose").addEventListener("click", () => wine.close());
  wine.addEventListener("click", async (e) => {
    if (e.target === wine) return wine.close();
    const b = e.target.closest("[data-copy]"); if (!b) return;
    const l = b.querySelector("span"), was = l.textContent;
    l.textContent = (await copy(b.dataset.copy)) ? "Скопировано ✓" : "Не вышло";
    setTimeout(() => { l.textContent = was; }, 2000);
  });
  wine.addEventListener("keydown", (e) => e.stopPropagation());
}
