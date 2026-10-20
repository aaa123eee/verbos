// Gender page: the article of every dictionary noun (el / la, los / las) and the four forms of every adjective.
// Kinds: art (el problema), artpl (los problemas), adj (blanco → blancas).
import { syllables, stressIndex } from "./syllables.js";
import { plural, explainPlural, strip, TOPS } from "./acentos.js";
import { LEX, gloss } from "./lexicon.js";

const F = (s) => '<b class="f">' + s + "</b>";
const pick = (a, r) => a[Math.floor(r() * a.length)];
export const KINDS = { art: "pres", artpl: "cond", adj: "sp" };

// ---- nouns ----
// a feminine noun that starts with a stressed a / ha takes el in the singular: el agua, el hambre (but las aguas)
export function elFem(w) {
  return /^h?[aá]/.test(w) && syllables(w).length > 0 && stressIndex(w) === 0;
}
export function article(e, pl = false) {
  const g = e.g === "c" || e.g === "mf" ? ["m", "f"] : [e.g];
  return g.map((x) => (pl || e.only ? (x === "m" ? "los" : "las") : x === "m" || (e.g === "f" && elFem(e.w)) ? "el" : "la"));
}
// the plural: Wiktionary's where it has one (it knows loanwords: hobbys), otherwise by the rule; -í / -ú also take -es
export function nounPlural(e) {
  if (e.only) return [e.w];
  const p = e.forms || plural(e.w);
  return /[íú]$/.test(e.w) && p === e.w + "s" ? [p, e.w + "es"] : [p];
}

// endings that tell the gender, most specific first: [regex, gender, how to say it]
const ENDINGS = [
  [/(ción|sión|xión)$/, "f", "-ción, -sión"],
  [/(dad|tad|tud)$/, "f", "-dad, -tad, -tud"],
  [/umbre$/, "f", "-umbre"],
  [/(sis|itis)$/, "f", "-sis, -itis"],
  [/aje$/, "m", "-aje"],
  [/or$/, "m", "-or"],
  [/o$/, "m", "-o"],
  [/a$/, "f", "-a"],
];
// la foto, la moto, la radio: short for fotografía, motocicleta, radiodifusión
const SHORT = { foto: "fotografía", moto: "motocicleta", radio: "radiodifusión", polio: "poliomielitis" };
const GR = { m: "мужского рода", f: "женского рода" };
export function explainGender(e) {
  const w = e.w, out = [];
  if (e.only) out.push("Слово употребляется только во множественном числе: " + F(article(e).join(" / ") + " " + w) + ".");
  if (e.g === "c") {
    out.push("Слово общего рода: артикль показывает пол человека — " + F("el " + w) + " (он), " + F("la " + w) + " (она)." + (/ista$/.test(w) ? " Так почти у всех слов на -ista." : ""));
    return out;
  }
  if (e.g === "mf") {
    out.push("Слово бывает и мужского, и женского рода — смотря по значению или по традиции: " + F("el " + w) + " и " + F("la " + w) + ". Засчитываются оба.");
    return out;
  }
  const end = ENDINGS.find(([re]) => re.test(w));
  if (e.g === "m" && /ma$/.test(w)) {
    out.push(F(w) + " — " + GR.m + ", хотя кончается на -a: многие слова на -ma греческого происхождения мужского рода (el problema, el sistema, el tema, el idioma).");
  } else if (end && end[1] === e.g) {
    out.push("Слова на " + end[2] + " обычно " + GR[e.g] + ": " + F(w) + " — " + GR[e.g] + ".");
  } else if (end) {
    const why = SHORT[w] ? " Это сокращение от " + F(SHORT[w]) + "." : "";
    out.push("Исключение: слова на " + end[2] + " обычно " + GR[end[1]] + ", а " + F(w) + " — " + GR[e.g] + "." + why + " Запомни: " + F(article(e)[0] + " " + w) + ".");
  } else {
    out.push("По окончанию -" + w.slice(-1) + " род не угадать: " + F(w) + " — " + GR[e.g] + ". Запомни вместе с артиклем: " + F(article(e)[0] + " " + w) + ".");
  }
  if (e.g === "f" && elFem(w) && !e.only) out.push("Слово женского рода начинается с ударного a- / ha-, поэтому в единственном числе артикль " + F("el") + ": " + F("el " + w) + ". Во множественном — " + F("las " + nounPlural(e)[0]) + ", и прилагательное всегда в женском роде, как в " + F("el agua fría") + ".");
  return out;
}

// ---- adjectives ----
// comparatives and a few more on -or don't change for gender: la hermana mayor
const COMP = ["mayor", "menor", "mejor", "peor", "superior", "inferior", "exterior", "interior", "anterior", "posterior", "ulterior"];
// the forms the rules give: -o → -a; -or, -án, -ín, -ón, -és, -ol, -uz (trabajador, alemán, inglés, español, andaluz) → + a;
// everything else changes only for number
export function adjByRule(w) {
  if (w.endsWith("o")) { const s = w.slice(0, -1); return [s + "a", s + "os", s + "as"]; }
  if (/(or|án|ín|ón|és|ol|uz)$/.test(w) && !COMP.includes(w)) { const f = strip(w) + "a"; return [f, plural(w), f + "s"]; }
  const p = plural(w); return [w, p, p];
}
export const FORMS = { f: 0, mp: 1, fp: 2 };
const FORM_RU = { f: "ж. р.", mp: "м. р., мн. ч.", fp: "ж. р., мн. ч." };
const FORM_ART = { f: "la …", mp: "los …", fp: "las …" };
export const adjForms = (e) => e.forms.split(" ");
export function explainAdj(e) {
  const w = e.w, [f, mp, fp] = adjForms(e), byRule = adjByRule(w).join(" ") === e.forms;
  const all = F(w) + " · " + F(f) + " · " + F(mp) + " · " + F(fp);
  if (w === f && w === mp) return ["Не меняется ни по роду, ни по числу (цвет по названию предмета: naranja — апельсин): " + all + "."];
  if (!byRule || /í$/.test(w) && mp.endsWith("íes")) {
    if (/í$/.test(w)) return ["На ударную -í: по роду не меняется, во множественном числе -íes (в разговорной речи и -ís): " + all + "."];
    return ["Исключение: " + all + ". Запомни."];
  }
  if (w.endsWith("o")) return ["На -o: женский род -a, множественное число -s: " + all + "."];
  if (COMP.includes(w)) return ["Сравнительные mayor, menor, mejor, peor и superior, inferior, interior… по роду не меняются: " + all + "."];
  if (/(or|án|ín|ón|és|ol|uz)$/.test(w)) return ["На -or, -án, -ín, -ón, -és (и español, andaluz) женский род получает -a" + (/[áíóé]/.test(w.slice(-3)) ? "; ударение уже не на последнем слоге, и тильда уходит" : "") + ": " + all + "."];
  const pl = explainPlural(w)[0];
  return ["На -" + w.slice(-1) + " по роду не меняется, только по числу: " + all + ".", pl];
}

// ---- the full sets ----
const seen = new Set();
// every noun with a known gender; a word that is first of all something else (nadie, mañana as adverb) is left out
const firstPos = new Map();
for (const e of LEX) if (!firstPos.has(e.w)) firstPos.set(e.w, e.p);
export const NOUNS = LEX.filter((e) => e.p === "n" && e.g && firstPos.get(e.w) === "n" && !seen.has(e.w) && seen.add(e.w));
export const PL_ART = NOUNS.filter((e) => !e.u && !e.only);
const seenA = new Set();
// every adjective whose four forms Wiktionary gives
export const ADJS = LEX.filter((e) => e.p === "a" && e.forms && !seenA.has(e.w) && seenA.add(e.w));
const N_BY = new Map(NOUNS.map((e) => [e.w, e])), A_BY = new Map(ADJS.map((e) => [e.w, e]));

const RULE_ART = ["Обычно -o — мужской род, -a — женский; -ción, -sión, -dad, -tad, -tud, -umbre — женский; -aje, -or — мужской. Многие слова на -ma — мужского рода. Женские слова на ударное a- берут el."];
function build(kind, w, fm) {
  const key = [kind, w, fm].filter(Boolean).join("|"), tc = KINDS[kind];
  if (kind === "adj") {
    const e = A_BY.get(w), forms = adjForms(e), x = forms[FORMS[fm]];
    const answers = [x].concat(/íes$/.test(x) ? [x.replace(/íes$/, "ís")] : []);
    return { key, tc, tag: "согласование", when: FORM_RU[fm] + " · " + FORM_ART[fm], main: w, sub: gloss(e), answers, why: explainAdj(e),
      rule: ["-o меняется на -a; -or, -án, -ón, -és и названия национальностей на согласную получают -a; остальные по роду не меняются. Множественное: -s после гласной, -es после согласной, z → c."], label: w + " → " + FORM_RU[fm] };
  }
  const e = N_BY.get(w), pl = kind === "artpl";
  const forms = pl ? nounPlural(e) : [e.w], arts = article(e, pl);
  const answers = arts.flatMap((a) => forms.map((f) => a + " " + f));
  const why = explainGender(e).concat(pl && !e.only ? explainPlural(e.w).slice(0, 1).map((s) => (forms[0] === plural(e.w) ? s : "Множественное число: " + F(forms[0]) + ".")) : []);
  return { key, tc, tag: "род и артикль", when: e.only ? "только мн. ч." : pl ? "мн. ч." : "ед. ч.", main: w, sub: gloss(e) + (pl ? " → мн. ч." : ""),
    answers, why, rule: RULE_ART, label: (pl ? "мн. ч. " : "") + w };
}

export function fromKey(k) { const [kind, w, fm] = k.split("|"); return build(kind, w, fm); }
const inTop = (e, top) => !!e && e.rank <= (TOPS[top] ?? Infinity);
export function allowed(k, { kinds, top }) {
  const [kind, w] = k.split("|");
  return kinds.includes(kind) && inTop(kind === "adj" ? A_BY.get(w) : N_BY.get(w), top);
}
const cache = {};
const within = (name, list, top) => (cache[name + top] ||= list.filter((e) => inTop(e, top)));
export function randomTask({ kinds, top = "all" }, r = Math.random) {
  const kind = pick(kinds, r);
  if (kind === "adj") return build("adj", pick(within("a", ADJS, top), r).w, pick(Object.keys(FORMS), r));
  return build(kind, pick(within(kind, kind === "art" ? NOUNS : PL_ART, top), r).w);
}
