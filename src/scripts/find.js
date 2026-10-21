// The search dialog of the top bar: the dictionary lookup of the words page on any page. The words it saves go to the
// same state as on the words page (IndexedDB key "words"), read and written each time, so another open tab loses nothing.
import { IDB } from "../lib/trainer-kit.js";
import { createLookup } from "../lib/lookup-ui.js";
import { newCard, today } from "../lib/es/palabras.js";

const $ = (id) => document.getElementById(id);
const dlg = $("find"), input = $("fq");
const PKEY = "words", LKEY = "verbos-palabras-v1";
const fresh = () => ({ cards: {}, days: {}, freqAt: 0 });

// ---- my words: a copy for showing «в моих словах», every change goes to the stored state ----
let cards = {};
async function db() { if (!window.indexedDB) throw new Error("no idb"); if (!IDB.db) await IDB.open(); return IDB; }
async function read() {
  try { const r = await (await db()).get(PKEY); if (r && r.cards) return r; } catch (e) {}
  try { const s = JSON.parse(localStorage.getItem(LKEY) || "null"); if (s && s.cards) return s; } catch (e) {}
  return null;
}
let chain = Promise.resolve();
function change(f) {
  f(cards);
  chain = chain.then(async () => {
    const s = Object.assign(fresh(), await read());
    f(s.cards);
    try { await (await db()).set(PKEY, s); } catch (e) { try { localStorage.setItem(LKEY, JSON.stringify(s)); } catch (e) {} }
  });
}
const store = {
  has: (id) => !!cards[id],
  untouched: (id) => !!cards[id] && cards[id].last === null,
  add: (e, m) => change((c) => { if (!c[e.id]) c[e.id] = newCard(e.id, today(), m); }),
  remove: (id) => change((c) => { delete c[id]; }),
};

// ---- the dialog ----
let look = null;
async function open() {
  if (dlg.open) return input.focus();
  try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
  input.focus(); input.select();
  look ||= createLookup({ input, res: $("fres"), store, verbsOpen: true });
  await chain;
  cards = (await read())?.cards || {};
  look.render(); look.load();
}
$("findOpen").addEventListener("click", open);
$("findClose").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
// the page's own keys (Enter checks, Esc undoes, digits answer) don't reach it while the dialog is open
dlg.addEventListener("keydown", (e) => e.stopPropagation());
// "/" opens the search from anywhere outside a field
document.addEventListener("keydown", (e) => {
  if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || document.querySelector("dialog[open]")) return;
  if (e.target.closest?.("input,textarea,select,[contenteditable]")) return;
  e.preventDefault(); open();
});
