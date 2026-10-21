// A word clicked in a task sentence: a small card under it with the translation, and the word goes to "my words"
// (a look is a sign it is worth learning). Loaded on the first click; the dictionary is fetched then too.
import { esc } from "./trainer-kit.js";
import { loadDict } from "./lookup-ui.js";
import { speak, canSpeak, SPK } from "./voice.js";
import { lookupEs, withArticle, POS_RU, OBSCENE } from "./es/palabras.js";
import { store, refresh } from "./words-store.js";

let pop = null, at = null, cur = null;
// words the learner removed here are not saved again in this visit
const noAuto = new Set();

function ensure() {
  if (pop) return;
  pop = document.createElement("div");
  pop.id = "wpop"; pop.className = "wpop"; pop.hidden = true; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-live", "polite");
  document.body.append(pop);
  // the answer field keeps the focus: clicks here don't take it
  pop.addEventListener("mousedown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
  pop.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t || !cur) return;
    if (t.dataset.say) speak(t.dataset.say);
    else if (t.dataset.del) { noAuto.add(cur.e.id); store.remove(cur.e.id); render(); }
    else if (t.dataset.add) { noAuto.delete(cur.e.id); store.add(cur.e); render(); }
    else if (t.dataset.more) { const q = cur.e ? cur.e.w : cur.word; close(); dispatchEvent(new CustomEvent("verbos:find", { detail: q })); }
  });
  document.addEventListener("click", (e) => { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest(".w")) close(); }, true);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !pop.hidden) { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  addEventListener("resize", close);
}
export function close() {
  if (!pop) return;
  pop.hidden = true; at?.classList.remove("on"); at = null; cur = null;
}
// under the word, inside the window
function place() {
  if (!at) return;
  const r = at.getBoundingClientRect(), w = pop.offsetWidth;
  pop.style.top = r.bottom + scrollY + 6 + "px";
  pop.style.left = Math.max(8, Math.min(r.left + scrollX, scrollX + document.documentElement.clientWidth - w - 8)) + "px";
}
function find(D, word) {
  for (const q of [word, word.replace(/se$/i, "")]) {
    if (!q) continue;
    const r = lookupEs(D, q);
    if (r.exact[0]) return { e: r.exact.find((e) => e.w === q.toLowerCase()) || r.exact[0] };
    // a form of several words (creo: creer, crear): the most frequent one, the others named under it
    const fo = [...r.formOf].sort((a, b) => a.e.rank - b.e.rank), also = [...new Set(fo.map((x) => x.e.w))].slice(1, 3);
    if (fo[0]) return { e: fo[0].e, how: word + " — " + fo[0].how, also };
  }
  return { e: null };
}
function render() {
  const { e, how, word } = cur, more = document.getElementById("find") ? '<button type="button" class="lnk" data-more="1">подробнее →</button>' : "";
  if (!e) { pop.innerHTML = '<p class="wp-none">«' + esc(word) + "» нет в словаре.</p>" + (more ? '<p class="wp-foot">' + more + "</p>" : ""); place(); return; }
  const list = (e.base.length ? e.base : e.more).filter((m) => !OBSCENE.test(m)).slice(0, 4);
  const g = e.p === "n" && e.g ? ({ m: "м. р.", f: "ж. р.", c: "общий род", mf: "м. и ж. р." })[e.g] : "";
  pop.innerHTML = '<div class="wp-head"><span class="wp-w">' + esc(withArticle(e)) + "</span>" +
    (canSpeak() ? '<button type="button" class="spk" data-say="' + esc(e.w) + '" title="Произнести">' + SPK + "</button>" : "") +
    '<span class="badge">' + [POS_RU[e.p], g].filter(Boolean).join(", ") + "</span></div>" +
    (how ? '<p class="how">' + esc(how) + "</p>" : "") +
    (cur.also?.length ? '<p class="wp-also">или форма: ' + cur.also.map((w) => "<b>" + esc(w) + "</b>").join(", ") + " — «подробнее»</p>" : "") +
    "<ol>" + list.map((m) => "<li>" + esc(m) + "</li>").join("") + "</ol>" +
    '<p class="wp-foot">' + (store.has(e.id) ? '<span class="saved">✓ в моих словах</span><button type="button" class="lnk" data-del="1">убрать</button>' : '<button type="button" class="lnk add" data-add="1">＋ запомнить</button>') + more + "</p>";
  place();
}
export async function showWord(btn) {
  ensure();
  if (at === btn && !pop.hidden) return close();
  at?.classList.remove("on");
  at = btn; btn.classList.add("on");
  const word = btn.textContent;
  cur = null; pop.hidden = false; pop.innerHTML = '<p class="wp-none">Ищу в словаре…</p>'; place();
  let D = null;
  try { [D] = await Promise.all([loadDict(), refresh()]); } catch (e) {}
  if (at !== btn) return;
  if (!D) { pop.innerHTML = '<p class="wp-none">Словарь не загрузился. Проверь сеть и попробуй ещё раз.</p>'; return; }
  cur = { word, ...find(D, word) };
  if (cur.e && !store.has(cur.e.id) && !noAuto.has(cur.e.id)) store.add(cur.e);
  render();
}
