// Accents page: the rules for the written accent, explanations, and tasks.
// Kinds: word (write a word with or without its tilde), verb (a verb form), plural, diacr (tú / tu in a sentence).
import { syllables, stressIndex, withStress } from "./syllables.js";
import { WORDS, PLURALS, DIACRITIC, DIACRITIC_WHY } from "./acentos-data.js";
import { REGULAR, IRR, form, persLabel, TMAP } from "../conjugation.js";

const F = (s) => '<b class="f">' + s + "</b>";
const PLAIN = { á: "a", é: "e", í: "i", ó: "o", ú: "u" };
export const strip = (s) => s.replace(/[áéíóú]/g, (c) => PLAIN[c]);
const TYPE = ["односложное", "aguda", "llana", "esdrújula", "sobresdrújula"];
// one-syllable words whose tilde only tells them apart from another word
const MONO_DIACRITIC = { "sé": "sé — «знаю» (saber) или «будь» (ser), без тильды se — местоимение", "dé": "dé — форма dar, без тильды de — предлог", "té": "té — «чай», без тильды te — местоимение", "más": "más — «больше», без тильды mas — «но» (книжное)", "sí": "sí — «да», «себя», без тильды si — «если»", "él": "él — «он», без тильды el — артикль", "tú": "tú — «ты», без тильды tu — «твой»", "mí": "mí — «мне, меня», без тильды mi — «мой»" };
const hasHiatus = (w) => /[aeo]h?[íú]|[íú]h?[aeo]/.test(w); // h doesn't separate the vowels: búho

// what a word is: syllables, the stressed one, its type, and whether the rules want a tilde
export function analyze(word) {
  if (word.endsWith("mente") && word.length > 6) {
    const a = analyze(word.slice(0, -5));
    return { ...a, mente: true, base: word.slice(0, -5) };
  }
  if (MONO_DIACRITIC[word]) return { sy: [word], si: 0, type: 0, hiatus: false, endsVNS: true, needs: true, diacritic: MONO_DIACRITIC[word] };
  const sy = syllables(word), si = stressIndex(word), fromEnd = sy.length - 1 - si;
  const type = sy.length === 1 ? 0 : Math.min(fromEnd + 1, 4);
  const hiatus = hasHiatus(word);
  const endsVNS = /[aeiouáéíóúns]$/.test(strip(word));
  const needs = hiatus || (type === 1 && endsVNS) || (type === 2 && !endsVNS) || type >= 3;
  return { sy, si, type, hiatus, endsVNS, needs };
}

// the word as the rules write it, from its plain letters and the stressed syllable: used to check the data
export function spellByRules(word) {
  const a = analyze(word);
  if (a.mente) return spellByRules(a.base) + "mente";
  if (a.hiatus || a.diacritic) return word;
  const plain = strip(word);
  if (!a.needs) return plain;
  return withStress(plain, a.si);
}

export function explainWord(word) {
  const a = analyze(word);
  if (a.mente) {
    return ["В наречиях на -mente ударение и тильда — как у прилагательного: " + F(a.base) + " + mente = " + F(word) + "."]
      .concat(explainWord(a.base).slice(0, 2));
  }
  const sy = a.sy.map((s, i) => (i === a.si ? "<u>" + s + "</u>" : s)).join("-");
  const out = ["Слоги: " + sy + ". Ударный слог — " + F(a.sy[a.si]) + (a.type ? " (" + ["", "последний", "второй с конца", "третий с конца", "четвёртый с конца"][a.type] + "): слово " + TYPE[a.type] + "." : ": слово " + TYPE[0] + ".")];
  const end = strip(word).slice(-1);
  if (a.diacritic) out.push("Односложные слова обычно без тильды, но здесь она различает два слова: " + a.diacritic + ".");
  else if (a.hiatus) out.push("Ударная " + F(word.match(/[íú]/)[0]) + " стоит рядом с a, e или o: тильда разбивает дифтонг, без неё гласные слились бы в один слог. Тильда нужна всегда: " + F(word) + ".");
  else if (a.type === 0) out.push("Односложные слова пишутся без тильды: " + F(word) + ".");
  else if (a.type === 1) out.push(a.needs ? "Aguda на гласную, -n или -s — тильда нужна: " + F(word) + "." : "Aguda на -" + end + " (не гласная, не n и не s) — тильда не нужна: " + F(word) + ".");
  else if (a.type === 2) out.push(a.needs ? "Llana на -" + end + " (не гласная, не n и не s) — тильда нужна: " + F(word) + "." : "Llana на " + (/[aeiou]/.test(end) ? "гласную" : "-" + end) + " — тильда не нужна: " + F(word) + ".");
  else out.push(TYPE[a.type][0].toUpperCase() + TYPE[a.type].slice(1) + " — тильда нужна всегда: " + F(word) + ".");
  return out;
}

// plural that keeps the stress on the same syllable: joven → jóvenes, canción → canciones
export function plural(w) {
  const given = PLURALS.find((x) => x.w === w);
  if (given && given.pl) return given.pl;
  const a = analyze(w);
  if (/[sx]$/.test(w) && a.type !== 1 && a.type !== 0) return w; // lunes, crisis
  let p;
  if (/[aeiouáéíóú]$/.test(w)) p = w + "s";
  else if (w.endsWith("z")) p = w.slice(0, -1) + "ces";
  else p = w + "es";
  if (hasHiatus(p)) return p;
  return spellByRules(withStress(strip(p), a.si));
}
function explainPlural(w) {
  const p = plural(w), given = PLURALS.find((x) => x.w === w);
  if (given && given.pl) return ["Редкий случай: ударение в множественном числе смещается — " + F(w) + " → " + F(p) + ". Это надо запомнить."];
  if (p === w) return ["Llana на -s не меняется во множественном числе: " + F("el " + w + " → los " + p) + "."];
  const how = /[aeiouáéíóú]$/.test(w) ? "на гласную — добавляем -s" : w.endsWith("z") ? "на -z — z меняется на c и добавляем -es" : "на согласную — добавляем -es";
  const out = ["Слово " + how + ": " + F(w) + " → " + F(p) + "."];
  out.push("Ударение остаётся на том же слоге, но слогов стало больше, поэтому тип слова меняется.");
  return out.concat(explainWord(p).slice(0, 2));
}

// ---- tasks ----
const VERBS = REGULAR.concat(Object.keys(IRR));
const VERB_TENSES = ["pres", "pret", "imp", "fut", "cond", "sp"];
const pick = (a, r) => a[Math.floor(r() * a.length)];
export const KINDS = { word: "fut", verb: "pret", plural: "sp", diacr: "impa" };
const RULE_WORD = ["Найди ударный слог. Aguda — тильда, если слово кончается на гласную, n или s; llana — если на любую другую согласную; esdrújula — всегда; ударная i / u рядом с a, e, o — всегда."];

function build(kind, a, b, c) {
  const it = { key: [kind, a, b, c].filter((x) => x !== undefined).join("|"), tc: KINDS[kind] };
  if (kind === "word") {
    const { w, ru } = WORDS[+a];
    return { ...it, tag: "ударение", when: "", main: strip(w), sub: ru, answers: [w], why: explainWord(w), rule: RULE_WORD, label: w };
  }
  if (kind === "verb") {
    const f = form(a, b, +c);
    return { ...it, tag: "форма глагола", when: TMAP[b].short || TMAP[b].name, main: strip(f), sub: a + " · " + (TMAP[b].short || TMAP[b].name) + " · " + persLabel(b, +c), answers: [f], why: explainWord(f), rule: RULE_WORD, label: f };
  }
  if (kind === "plural") {
    const { w, ru } = PLURALS[+a], p = plural(w);
    return { ...it, tag: "множественное число", when: "", main: w, sub: ru + " → мн. ч.", answers: [p], why: explainPlural(w), rule: ["Ударение остаётся на том же слоге. Посчитай слоги заново и проверь, нужна ли теперь тильда."], label: w + " → мн. ч." };
  }
  const d = DIACRITIC[+a], hint = strip(d.w);
  const main = '<span class="sent">' + d.s.replace("___", '<span class="gap">' + hint + "</span>") + "</span>";
  return { ...it, tag: "тильда различает слова", when: d.pair, main, sub: d.ru, answers: [d.w],
    why: [DIACRITIC_WHY[d.pair], "Здесь: «" + d.ru + "» → " + F(d.w) + "."], rule: ["Тильда отличает слова с одинаковым написанием: " + d.pair.replace(/ \/ /, " или ") + ". Подумай, какое из них здесь по смыслу."], label: d.pair + ": " + d.s.replace("___", "…") };
}

export function fromKey(k) { const [kind, a, b, c] = k.split("|"); return build(kind, a, b, c); }

export function randomTask({ kinds }, r = Math.random) {
  const kind = pick(kinds, r);
  if (kind === "word") return build("word", Math.floor(r() * WORDS.length));
  if (kind === "plural") return build("plural", Math.floor(r() * PLURALS.length));
  if (kind === "diacr") return build("diacr", Math.floor(r() * DIACRITIC.length));
  for (let i = 0; i < 20; i++) {
    const v = pick(VERBS, r), t = pick(VERB_TENSES, r), p = Math.floor(r() * 6), f = form(v, t, p);
    if (f && !f.includes(" ")) return build("verb", v, t, p);
  }
  return build("verb", "hablar", "pret", 2);
}
