// The search dialog of the top bar: the dictionary lookup of the words page on any page; the words it saves go to
// "my words" (words-store.js).
import { createLookup } from "../lib/lookup-ui.js";
import { store, refresh } from "../lib/words-store.js";

const $ = (id) => document.getElementById(id);
const dlg = $("find"), input = $("fq");

// ---- the dialog ----
let look = null;
async function open(q) {
  if (typeof q === "string") input.value = q;
  if (dlg.open) { look?.render(); return input.focus(); }
  try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
  input.focus(); input.select();
  look ||= createLookup({ input, res: $("fres"), store, verbsOpen: true });
  await refresh();
  look.render(); look.load();
}
$("findOpen").addEventListener("click", () => open());
// «подробнее» of a word clicked in a task opens the search on that word
addEventListener("verbos:find", (e) => open(e.detail));
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
