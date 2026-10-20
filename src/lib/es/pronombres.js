// Tasks for the pronouns page: object pronouns (me lo, se lo), reflexive verbs (me levanto) and the gerund (estoy hablando).
// Every task is rebuilt from its key, so mistakes can come back later.
import { RU, REGULAR, IRR, form, subjPres, PERS, IMP_PERS } from "../conjugation.js";
import { OBJ, REFL } from "./pronombres-data.js";
export { OBJ, REFL };
import { attach } from "./syllables.js";
import { gerund, explainGerund } from "./gerund.js";

const F = (s) => '<b class="f">' + s + "</b>";
const pick = (a, r) => a[Math.floor(r() * a.length)];

export const IO = [["a mí", "me", 0], ["a ti", "te", 1], ["a él", "le", 2], ["a ella", "le", 2], ["a usted", "le", 2],
  ["a nosotros", "nos", 3], ["a vosotros", "os", 4], ["a ellos", "les", 5], ["a ellas", "les", 5], ["a ustedes", "les", 5]];
const DO_RU = { lo: "м. р., ед. ч.", la: "ж. р., ед. ч.", los: "м. р., мн. ч.", las: "ж. р., мн. ч." };
const REFL_CL = ["me", "te", "se", "nos", "os", "se"];
// the gerund works for every verb of the engine
const GER_VERBS = REGULAR.concat(Object.keys(IRR));
export const CONTEXTS = {
  pres: { name: "presente", tc: "pres" }, pret: { name: "pretérito", tc: "pret" },
  impa: { name: "imperativo", tc: "impa" }, impn: { name: "imperativo negativo", tc: "impn" },
  inf: { name: "+ инфинитив", tc: "cond" }, ger: { name: "estar + gerundio", tc: "fs" },
};
const AUX = { ir: "a", querer: "", tener: "que", poder: "" };
const auxForm = (a, p) => form(a, "pres", p) + (AUX[a] ? " " + AUX[a] : "");
const ESTAR = (p) => form("estar", "pres", p);
const isImpCtx = (c) => c === "impa" || c === "impn";

// imperative base before attaching: nosotros loses -s before nos / se (démoselo, sentémonos)
function impBase(v, p, first) {
  const f = form(v, "impa", p);
  return p === 3 && (first === "nos" || first === "se") ? f.slice(0, -1) : f;
}
// vosotros + os: the -d goes (sentaos), -ir verbs write -íos (vestíos), irse → idos
function vosRefl(v) { return v === "ir" ? "idos" : v.endsWith("ir") ? v.slice(0, -2) + "íos" : v.slice(0, -1) + "os"; }

// ---- task building ----
function build(t) {
  const { type, v, ctx, p } = t;
  const C = CONTEXTS[ctx], pl = isImpCtx(ctx) ? IMP_PERS[p] : PERS[p];
  const it = { key: keyOf(t), tc: C.tc, tag: C.name, when: pl, answers: [], why: [], rule: [] };
  if (type === "ger") return buildGer(t, it);
  let cl = [], what = [], why = [];
  if (type === "obj") {
    const ob = t.doN != null ? OBJ[v].objs[t.doN] : null, io = t.io != null ? IO[t.io] : null;
    let ioCl = io ? io[1] : null; const doCl = ob ? ob.pr : null, doN = ob ? ob.ph : null;
    if (ob) { what.push(doN); why.push(doN + " → " + F(doCl) + " (прямое дополнение: " + DO_RU[doCl] + (/^(a |al )/.test(doN) ? "; a перед человеком — не косвенное дополнение" : doN === "el agua" ? "; agua женского рода, el — только ради звучания" : "") + ")."); }
    if (io) { what.push(io[0]); why.push(io[0] + " → " + F(io[1]) + " (косвенное дополнение)."); }
    if (ioCl && doCl && (ioCl === "le" || ioCl === "les")) { ioCl = "se"; why.push(io[1] + " + " + doCl + " → " + F("se " + doCl) + ": два местоимения на l- подряд не ставят, le / les превращается в se."); }
    cl = [ioCl, doCl].filter(Boolean);
    if (cl.length === 2) why.push("Порядок: сначала косвенное, потом прямое — " + F(cl.join(" ")) + ".");
    it.main = v + '<span class="obj">' + what.join(" · ") + "</span>";
    it.sub = (RU[v] ? RU[v][0] : "") + " · замени дополнения местоимениями";
    it.rule.push(cl.length === 2 ? "Два местоимения: косвенное перед прямым; le / les перед lo / la → se." : doN ? "Прямое дополнение: lo, la, los, las — по роду и числу." : "Косвенное дополнение: me, te, le, nos, os, les.");
    it.label = v + " · " + what.join(", ");
  } else {
    cl = [REFL_CL[p]];
    why.push("Возвратное местоимение для " + pl + ": " + F(cl[0]) + ".");
    it.main = v + "se";
    it.sub = REFL[v];
    it.rule.push("Возвратное местоимение по лицу: me, te, se, nos, os, se.");
    it.label = v + "se";
  }
  const before = (verb) => cl.join(" ") + " " + verb;
  if (ctx === "pres" || ctx === "pret") {
    const f = form(v, ctx, p); it.answers = [before(f)];
    why.push("С обычной формой глагола местоимения стоят перед ним: " + F(before(f)) + ".");
    it.rule.push("Местоимения — перед спрягаемым глаголом.");
  } else if (ctx === "impa") {
    let ans;
    if (type === "refl" && p === 4) { ans = vosRefl(v); why.push(v === "ir" ? "irse в vosotros — исключение: " + F(ans) + "." : "vosotros: -d перед os выпадает" + (v.endsWith("ir") ? ", у -ir пишется -íos" : "") + ": " + form(v, "impa", 4) + " + os → " + F(ans) + "."); }
    else {
      const b = impBase(v, p, cl[0]); ans = attach(b, cl);
      if (b !== form(v, "impa", p)) why.push("nosotros теряет -s перед " + cl[0] + ": " + form(v, "impa", p) + " → " + b + "-.");
      why.push("С утвердительным императивом местоимения приклеиваются к концу: " + b + " + " + cl.join(" + ") + " → " + F(ans) + ".");
      if (/[áéíóú]/.test(ans) && !/[áéíóú]/.test(b)) why.push("Ударение остаётся на том же слоге, но слово стало длиннее — нужна тильда.");
    }
    it.answers = [ans];
    it.rule.push("Утвердительный императив: местоимения приклеиваются к концу. Проверь ударение.");
  } else if (ctx === "impn") {
    const f = "no " + before(subjPres(v, p)); it.answers = [f];
    why.push("Отрицательный императив: no + местоимения + subjuntivo — " + F(f) + ".");
    it.rule.push("Отрицательный императив: no, потом местоимения, потом subjuntivo.");
  } else if (ctx === "inf") {
    const a = t.aux || "ir", af = auxForm(a, p), glued = af + " " + attach(v, cl), front = cl.join(" ") + " " + af + " " + v;
    it.answers = [glued, front];
    it.tag = (a === "ir" ? "ir a" : a === "tener" ? "tener que" : a) + " + инфинитив";
    why.push("С инфинитивом два варианта: приклеить к концу — " + F(glued) + ", или поставить перед спрягаемым глаголом — " + F(front) + ". Оба верны.");
    it.rule.push("Инфинитив: местоимения в конец инфинитива или перед спрягаемым глаголом.");
  } else if (ctx === "ger") {
    const g = gerund(v), glued = ESTAR(p) + " " + attach(g, cl), front = cl.join(" ") + " " + ESTAR(p) + " " + g;
    it.answers = [glued, front];
    why.push("С герундием два варианта: " + F(glued) + " или " + F(front) + ".");
    if (/[áéíóú]/.test(attach(g, cl))) why.push("Приклеенные местоимения делают слово длиннее, поэтому у герундия появляется тильда.");
    it.rule.push("Герундий: местоимения в конец герундия (с тильдой) или перед estar.");
  }
  it.why = why;
  return it;
}
function buildGer(t, it) {
  const { v, p } = t, g = gerund(v), ans = ESTAR(p) + " " + g;
  it.tag = "estar + gerundio"; it.main = v; it.sub = RU[v] ? RU[v][0] : "";
  it.answers = [ans]; it.label = v + " · gerundio";
  it.why = ["estar в presente: " + F(ESTAR(p)) + "."].concat(explainGerund(v), ["Вместе: " + F(ans) + "."]);
  it.rule = ["estar + gerundio: -ando у -ar, -iendo у -er / -ir; между гласными -yendo; у -ir со сменой корня e → i, o → u."];
  return it;
}

// ---- keys: type|verb|ctx|person|do|io|aux ----
const keyOf = (t) => [t.type, t.v, t.ctx, t.p, t.doN ?? "", t.io ?? "", t.aux ?? ""].join("|");
export function fromKey(k) {
  const [type, v, ctx, p, doN, io, aux] = k.split("|");
  return build({ type, v, ctx, p: +p, doN: doN === "" ? null : +doN, io: io === "" ? null : +io, aux: aux || null });
}

// ---- random task for the chosen settings: types ⊂ {obj, refl, ger}, ctxs ⊂ CONTEXTS keys ----
export function randomTask({ types, ctxs, vos = true }, r = Math.random) {
  for (let tries = 0; tries < 50; tries++) {
    const type = pick(types, r);
    let ctx = type === "ger" ? "ger" : pick(ctxs, r);
    let persons = isImpCtx(ctx) ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5];
    if (!vos) persons = persons.filter((x) => x !== 4);
    const p = pick(persons, r);
    if (type === "ger") return build({ type, v: pick(GER_VERBS, r), ctx: "ger", p });
    if (type === "refl") return build({ type, v: pick(Object.keys(REFL), r), ctx, p, aux: ctx === "inf" ? pick(["ir", "querer", "tener"], r) : null });
    // an indirect object only where it is natural (dar algo a alguien); some tasks replace only one of the two
    const v = pick(Object.keys(OBJ), r), O = OBJ[v], roll = r();
    const doN = !O.io || roll < 0.85 ? Math.floor(r() * O.objs.length) : null;
    const io = O.io && (roll > 0.3 || doN == null) ? Math.floor(r() * IO.length) : null;
    // the indirect object can't be the subject itself (that would be reflexive)
    if (io != null && IO[io][2] === p) continue;
    if (io != null && !vos && IO[io][2] === 4) continue;
    return build({ type, v, ctx, p, doN, io, aux: ctx === "inf" ? pick(["ir", "querer", "tener", "poder"], r) : null });
  }
  return build({ type: "obj", v: "dar", ctx: "pres", p: 2, doN: 0, io: 0 });
}
