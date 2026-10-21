// Tasks for the tense page: which tense does this sentence need? A sentence with a marker (ayer, mientras, ojalá,
// si…) and a gap; the learner types the verb in the tense the marker asks for. Every task is rebuilt from its key.
// Verbs: every verb with a direct object (OBJ, with its typical objects) and every verb with a se use (REFL).
import { RU, TMAP, PERS, IMP_PERS, form, altForm, explain } from "../conjugation.js";
import { OBJ, REFL } from "./pronombres-data.js";

const F = (s) => '<b class="f">' + s + "</b>";
const pick = (a, r) => a[Math.floor(r() * a.length)];
const SUBJ = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];
const CL = ["me", "te", "se", "nos", "os", "se"];
const ALL6 = [0, 1, 2, 3, 4, 5], NOT = (...x) => ALL6.filter((p) => !x.includes(p));
const IR_A = ["voy a", "vas a", "va a", "vamos a", "vais a", "van a"];

// the groups of the settings
export const GROUPS = {
  past: "Прошедшие: indefinido, imperfecto, perfecto, pluscuamperfecto",
  fut: "Настоящее, будущее и условное",
  subj: "Subjuntivo или indicativo",
  imp: "Повелительное наклонение",
};
// A frame is one use of a tense: the sentence ({S} subject, {V} the gap with its pronoun, {O} the object),
// the persons that fit it, the rule (why this tense: shown as a hint and after a mistake) and the accepted other tenses.
// alt: other tenses that are right too (alt reason in altWhy); ir: «ir a + infinitivo» is right too
const FR = [
  // ---- past ----
  { id: "ayer", g: "past", t: "pret", es: "Ayer {S} {V} {O}.", why: "«Ayer» — закрытый период в прошлом: законченное действие → pretérito indefinido." },
  { id: "anopas", g: "past", t: "pret", es: "El año pasado {S} {V} {O}.", why: "«El año pasado» — период закончился: pretérito indefinido." },
  { id: "hace", g: "past", t: "pret", es: "Hace tres días {S} {V} {O}.", why: "«Hace tres días» — точка в прошлом: pretérito indefinido." },
  { id: "en2019", g: "past", t: "pret", es: "En 2019 {S} {V} {O} por primera vez.", why: "Год в прошлом и «por primera vez» — однократное законченное действие: pretérito indefinido." },
  { id: "derep", g: "past", t: "pret", es: "Estábamos tranquilos y de repente {S} {V} {O}.", why: "«De repente» — действие случилось вдруг, на фоне (estábamos): pretérito indefinido." },
  { id: "antes", g: "past", t: "imp", es: "Antes {S} siempre {V} {O}.", why: "«Antes… siempre» — привычка в прошлом: imperfecto." },
  { id: "aquella", g: "past", t: "imp", es: "En aquella época {S} {V} {O} todos los días.", why: "«En aquella época… todos los días» — повторялось в прошлом: imperfecto." },
  { id: "mientras", g: "past", t: "imp", es: "Mientras {S} {V} {O}, empezó a llover.", why: "«Mientras» — фон, длительное действие в прошлом: imperfecto. То, что случилось на его фоне (empezó), — pretérito." },
  { id: "deninos", g: "past", t: "imp", es: "Cuando éramos niños, {S} {V} {O} a menudo.", why: "«Cuando éramos niños… a menudo» — повторялось в прошлом: imperfecto." },
  { id: "hoy", g: "past", t: "perf", alt: ["pret"], es: "Esta mañana {S} {V} {O}.", why: "«Esta mañana» — период ещё не закончился: pretérito perfecto.", altWhy: "В Латинской Америке здесь чаще pretérito indefinido — тоже засчитывается." },
  { id: "semana", g: "past", t: "perf", alt: ["pret"], es: "Esta semana {S} ya {V} {O} dos veces.", why: "«Esta semana… ya» — неделя ещё идёт: pretérito perfecto.", altWhy: "В Латинской Америке здесь чаще pretérito indefinido — тоже засчитывается." },
  { id: "nunca", g: "past", t: "perf", alt: ["pret"], es: "{S} nunca {V} {O}.", why: "«Nunca» — опыт за всю жизнь, без времени: pretérito perfecto.", altWhy: "В Латинской Америке здесь часто pretérito indefinido — тоже засчитывается." },
  { id: "todavia", g: "past", t: "perf", alt: ["pret"], es: "{S} todavía no {V} {O}.", why: "«Todavía no» — до сих пор не сделано: pretérito perfecto.", altWhy: "В Латинской Америке здесь часто pretérito indefinido — тоже засчитывается." },
  { id: "yaplus", g: "past", t: "plus", es: "Cuando Ana llegó, {S} ya {V} {O}.", p: NOT(2), why: "«Cuando Ana llegó… ya» — сделано раньше другого прошедшего действия: pluscuamperfecto." },
  { id: "dijoplus", g: "past", t: "plus", es: "Ana me contó que {S} {V} {O} unos días antes.", p: NOT(2), why: "«Me contó que… unos días antes» — раньше момента рассказа в прошлом: pluscuamperfecto." },
  // ---- present, future, conditional ----
  { id: "normal", g: "fut", t: "pres", es: "Normalmente {S} {V} {O} por la mañana.", why: "«Normalmente» — обычное, повторяющееся сейчас: presente." },
  { id: "cadadia", g: "fut", t: "pres", es: "Cada semana {S} {V} {O}.", why: "«Cada semana» — регулярное действие сейчас: presente." },
  { id: "creo", g: "fut", t: "pres", es: "Creo que {S} {V} {O} todos los días.", p: NOT(0), why: "«Creo que» — утверждение, а не сомнение: indicativo. «Todos los días» — presente." },
  { id: "manana", g: "fut", t: "fut", alt: ["pres"], ir: true, es: "Mañana {S} {V} {O}.", why: "«Mañana» — будущее: futuro simple.", altWhy: "О планах на завтра говорят и presente, и ir a + infinitivo — тоже засчитывается." },
  { id: "anoque", g: "fut", t: "fut", ir: true, es: "El año que viene {S} {V} {O}.", why: "«El año que viene» — будущее: futuro simple.", altWhy: "ir a + infinitivo — тоже засчитывается." },
  { id: "dentro", g: "fut", t: "fut", ir: true, es: "Dentro de diez años {S} {V} {O}.", why: "«Dentro de diez años» — будущее: futuro simple.", altWhy: "ir a + infinitivo — тоже засчитывается." },
  { id: "parael", g: "fut", t: "futp", es: "Para el viernes {S} ya {V} {O}.", why: "«Para el viernes… ya» — будет сделано к моменту в будущем: futuro perfecto." },
  { id: "dentroya", g: "fut", t: "futp", es: "Dentro de una hora {S} ya {V} {O}.", why: "«Dentro de una hora… ya» — будет уже сделано к тому времени: futuro perfecto." },
  { id: "contiempo", g: "fut", t: "cond", es: "Con más tiempo, {S} {V} {O}.", why: "«Con más tiempo» — условие, которого нет: condicional («сделал бы»)." },
  { id: "dijocond", g: "fut", t: "cond", es: "Ana me dijo que {S} {V} {O} al día siguiente.", p: NOT(2), why: "«Me dijo que… al día siguiente» — будущее, увиденное из прошлого: condicional." },
  { id: "entulugar", g: "fut", t: "cond", es: "En tu lugar, {S} {V} {O}.", p: [0, 2, 3, 5], why: "«En tu lugar» — совет, «я бы на твоём месте»: condicional." },
  { id: "condp", g: "fut", t: "condp", alt: ["spl"], es: "Con un poco más de suerte, ayer {S} {V} {O}.", why: "«Con más suerte… ayer» — нереальное в прошлом, «сделал бы тогда»: condicional perfecto.", altWhy: "В разговорной речи вместо habría говорят и hubiera — тоже засчитывается." },
  // ---- subjunctive or indicative ----
  { id: "quiero", g: "subj", t: "sp", es: "Quiero que {S} {V} {O}.", p: NOT(0), why: "«Quiero que» + другой человек — желание: presente de subjuntivo." },
  { id: "espero", g: "subj", t: "sp", es: "Espero que {S} {V} {O} pronto.", p: NOT(0), why: "«Espero que» — надежда: presente de subjuntivo." },
  { id: "ojala", g: "subj", t: "sp", es: "Ojalá {S} {V} {O} mañana.", why: "«Ojalá» + будущее — пожелание: presente de subjuntivo." },
  { id: "importa", g: "subj", t: "sp", es: "Es importante que {S} {V} {O}.", why: "«Es importante que» — оценка: presente de subjuntivo." },
  { id: "nocreo", g: "subj", t: "sp", es: "No creo que {S} {V} {O}.", p: NOT(0), why: "«No creo que» — сомнение: presente de subjuntivo (а «creo que» — indicativo)." },
  { id: "cuandofut", g: "subj", t: "sp", es: "Cuando {S} {V} {O}, te llamaré.", p: NOT(1), why: "«Cuando» о будущем (te llamaré): presente de subjuntivo, не futuro." },
  { id: "antesque", g: "subj", t: "sp", es: "Hay que limpiar antes de que {S} {V} {O}.", why: "«Antes de que» — всегда subjuntivo: presente de subjuntivo." },
  { id: "paraque", g: "subj", t: "sp", es: "Te lo explico para que {S} {V} {O}.", p: NOT(0, 1), why: "«Para que» — цель: всегда subjuntivo." },
  { id: "cuandosiempre", g: "subj", t: "pres", es: "Cuando {S} {V} {O}, siempre estoy contento.", p: NOT(0), why: "«Cuando… siempre» — обычное, повторяющееся: indicativo, presente (о будущем был бы subjuntivo)." },
  { id: "esverdad", g: "subj", t: "pres", es: "Es verdad que {S} {V} {O} cada día.", why: "«Es verdad que» — утверждение факта: indicativo, presente." },
  { id: "si", g: "subj", t: "si", es: "Si {S} {V} {O}, todo sería más fácil.", why: "«Si…, sería» — нереальное условие сейчас: imperfecto de subjuntivo." },
  { id: "queria", g: "subj", t: "si", es: "Mi madre quería que {S} {V} {O}.", p: NOT(2), why: "«Quería que» — желание в прошлом: imperfecto de subjuntivo." },
  { id: "comosi", g: "subj", t: "si", es: "Hablaba como si {S} {V} {O} cada día.", why: "«Como si» — «как будто»: всегда imperfecto (или pluscuamperfecto) de subjuntivo." },
  { id: "ojalaya", g: "subj", t: "spf", es: "Ojalá {S} ya {V} {O}.", why: "«Ojalá… ya» — надежда, что уже сделано: perfecto de subjuntivo." },
  { id: "esposible", g: "subj", t: "spf", es: "Es posible que {S} ya {V} {O}.", why: "«Es posible que… ya» — предположение о сделанном: perfecto de subjuntivo." },
  { id: "siayer", g: "subj", t: "spl", es: "Si {S} {V} {O} ayer, ahora estaría todo listo.", why: "«Si… ayer» — нереальное условие в прошлом: pluscuamperfecto de subjuntivo." },
  { id: "ojalaantes", g: "subj", t: "spl", es: "Ojalá {S} {V} {O} antes. Ahora es tarde.", why: "«Ojalá… antes. Ahora es tarde» — сожаление о прошлом: pluscuamperfecto de subjuntivo." },
  // ---- imperative ----
  { id: "porfavor", g: "imp", t: "impa", obj: true, es: "Por favor, {V} {O}.", why: "Просьба, приказ: imperativo afirmativo." },
  { id: "nopor", g: "imp", t: "impn", obj: true, es: "Por favor, no {V} {O}.", why: "Запрет «no…»: imperativo negativo = subjuntivo (no está dentro)." },
  { id: "tepido", g: "imp", t: "sp", obj: true, es: "Te pido que {S} {V} {O}.", p: [2, 3, 4, 5], why: "«Te pido que» — просьба через que: presente de subjuntivo, а не imperativo." },
];
export const FRAMES = Object.fromEntries(FR.map((f) => [f.id, f]));
const isImpT = (t) => t === "impa" || t === "impn";
const personsOf = (f) => (f.p || (isImpT(f.t) ? [1, 2, 3, 4, 5] : ALL6));

// the form typed into the gap: impn without its «no», which is in the sentence
const gapForm = (v, t, p) => { const x = form(v, t, p); return t === "impn" ? x.replace(/^no /, "") : x; };
const TN = (t) => TMAP[t].name;

// ---- one task: frame, verb, person, object (index into OBJ[v].objs) or "r" for the se use ----
function build({ f: fid, v, p, o }) {
  const f = FRAMES[fid], refl = o === "r", ob = refl ? null : OBJ[v].objs[+o];
  const cl = refl ? CL[p] + " " : "";
  const subj = isImpT(f.t) ? "" : SUBJ[p];
  const main = f.es.replace("{S}", subj).replace("{V}", cl + '<span class="gap"></span> <span class="pron">(' + v + (refl ? "se" : "") + ")</span>").replace("{O}", ob ? ob.ph : "")
    .replace(/\s+([.,])/g, "$1").replace(/\s+/g, " ").trim().replace(/^([a-záéíóúñ])/, (c) => c.toUpperCase());
  const answers = [gapForm(v, f.t, p)];
  const alt = altForm(v, f.t, p); if (alt) answers.push(alt);
  for (const t of f.alt || []) { answers.push(gapForm(v, t, p)); const a2 = altForm(v, t, p); if (a2) answers.push(a2); }
  if (f.ir) answers.push(IR_A[p] + " " + v);
  const why = [f.why];
  if (f.alt || f.ir) why.push(f.altWhy);
  why.push("Форма: " + TN(f.t) + ", " + (isImpT(f.t) ? IMP_PERS[p] : PERS[p]) + " — " + F(answers[0]) + ".");
  why.push(...explain(v, f.t, p));
  const gloss = refl ? REFL[v] : RU[v] ? RU[v][0] : "";
  return {
    key: [fid, v, p, o].join("|"), tc: "plus", tag: "Какое время?", when: isImpT(f.t) ? IMP_PERS[p] : "",
    main: '<span class="sent">' + main + "</span>", sub: v + (refl ? "se" : "") + " — " + gloss, answers: [...new Set(answers)], why,
    rule: [hintOf(f)],
    label: v + (refl ? "se" : "") + " · " + (TMAP[f.t].short || TN(f.t)),
  };
}
// the «Правило» hint says what the marker means, without naming the tense: the rule up to its first colon
export const hintOf = (f) => f.why.split(":")[0] + ". Какое время это выражает?";

export const keyOf = (t) => [t.f, t.v, t.p, t.o].join("|");
export function fromKey(k) {
  const [f, v, p, o] = k.split("|");
  if (!FRAMES[f]) throw new Error("unknown frame " + f);
  if (o === "r" ? !REFL[v] : !OBJ[v] || !OBJ[v].objs[+o]) throw new Error("unknown verb " + v);
  return build({ f, v, p: +p, o });
}

// ---- random task for the chosen groups ----
const OBJ_V = Object.keys(OBJ), REFL_V = Object.keys(REFL);
export function randomTask({ groups, vos = true }, r = Math.random) {
  const frames = FR.filter((f) => groups.includes(f.g));
  const f = pick(frames.length ? frames : FR, r);
  const ps = personsOf(f).filter((p) => vos || p !== 4);
  const p = pick(ps.length ? ps : personsOf(f), r);
  // the se use only where the pronoun can stand before the gap (not with the affirmative imperative)
  const refl = !f.obj && r() < REFL_V.length / (REFL_V.length + OBJ_V.length);
  if (refl) return build({ f: f.id, v: pick(REFL_V, r), p, o: "r" });
  const v = pick(OBJ_V, r);
  return build({ f: f.id, v, p, o: Math.floor(r() * OBJ[v].objs.length) });
}
export const framesOf = (g) => FR.filter((f) => f.g === g);
export { FR };
