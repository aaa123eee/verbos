// A speaker next to a Spanish form in any table (conjugation tables, the verb cards, the cheat sheets and rules): one
// button for the whole page, made on the first hover and moved to the form under the pointer (on touch — the tapped
// form). The form is spoken only when the button is pressed; nothing is fetched before that.
import { canSpeak, speak, SPK } from "../lib/voice.js";

const SEL = "table .f, .conj .f, .vocab .f";
let btn = null, cur = null, touch = false;

// what a cell says: Spanish only, no endings (-o, -as), no "…"
function textOf(el) {
  const t = el.textContent.replace(/…/g, " ").replace(/\s+/g, " ").trim();
  return t && /[a-záéíóúñü]/i.test(t) && !/[а-яё]/i.test(t) && !/^[-+]/.test(t) ? t : "";
}
function target(e) {
  const el = e.target.closest && e.target.closest(SEL);
  return el && !el.closest("button") && textOf(el) ? el : null;
}
function hide() { if (btn) btn.hidden = true; cur = null; }
function show(el) {
  if (!canSpeak()) return;
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button"; btn.className = "spk say"; btn.title = "Произнести"; btn.setAttribute("aria-label", "Произнести"); btn.innerHTML = SPK;
    btn.addEventListener("click", (e) => { e.stopPropagation(); if (cur) speak(textOf(cur)); });
    btn.addEventListener("pointerleave", (e) => { if (!touch && !(cur && cur.contains(e.relatedTarget))) hide(); });
  }
  // a modal dialog is in the top layer: the button must be inside it to be seen and clickable
  const home = el.closest("dialog") || document.body;
  if (btn.parentNode !== home) home.appendChild(btn);
  cur = el; btn.hidden = false;
  place();
}
// next to the end of the text, also after a scroll; a form that left the page (re-rendered) takes the button away
function place() {
  if (!cur || !btn) return;
  if (!cur.isConnected) return hide();
  const el = cur, r = document.createRange(); r.selectNodeContents(el);
  const box = r.getBoundingClientRect(), w = btn.offsetWidth, h = btn.offsetHeight;
  btn.style.left = Math.max(0, Math.min(box.right + 2, innerWidth - w)) + "px";
  btn.style.top = box.top + box.height / 2 - h / 2 + "px";
}

document.addEventListener("pointerover", (e) => {
  if (e.pointerType === "touch") return;
  touch = false;
  if (btn && (e.target === btn || btn.contains(e.target))) return;
  const el = target(e);
  if (el) { if (el !== cur) show(el); } else if (cur) hide();
});
document.addEventListener("pointerdown", (e) => { touch = e.pointerType === "touch"; });
document.addEventListener("click", (e) => {
  if (!touch || (btn && btn.contains(e.target))) return;
  const el = target(e);
  el ? show(el) : hide();
});
let raf = 0;
addEventListener("scroll", () => { if (cur && !raf) raf = requestAnimationFrame(() => { raf = 0; place(); }); }, { capture: true, passive: true });
addEventListener("resize", () => place());
document.addEventListener("close", hide, true);
