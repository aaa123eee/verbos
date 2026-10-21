// "My words" outside the words page (the top bar search, words clicked in a task): the same state as on the words page
// (IndexedDB key "words", localStorage without it), read and written on every change, so another open tab loses nothing.
import { IDB } from "./trainer-kit.js";
import { newCard, today } from "./es/palabras.js";

const PKEY = "words", LKEY = "verbos-palabras-v1";
const fresh = () => ({ cards: {}, days: {}, freqAt: 0 });
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
// the copy that shows «в моих словах»: refreshed from the stored state before showing
export async function refresh() { await chain; cards = (await read())?.cards || {}; }
export const store = {
  has: (id) => !!cards[id],
  untouched: (id) => !!cards[id] && cards[id].last === null,
  add: (e, m) => change((c) => { if (!c[e.id]) c[e.id] = newCard(e.id, today(), m); }),
  remove: (id) => change((c) => { delete c[id]; }),
};
