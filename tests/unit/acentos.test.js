import { describe, it, expect } from "vitest";
import { analyze, spellByRules, plural, explainWord, fromKey, randomTask, strip, ACC_WORDS, PL_NOUNS, allowed } from "../../src/lib/es/acentos.js";
import { DIACRITIC, DIACRITIC_WHY } from "../../src/lib/es/acentos-data.js";
import { LEX } from "../../src/lib/es/lexicon.js";
import { REGULAR, IRR, form } from "../../src/lib/conjugation.js";

describe("accent rules", () => {
  it("every dictionary word follows the rules, except the known diacritic words and old spellings", () => {
    const off = LEX.filter((e) => spellByRules(e.w) !== e.w).map((e) => e.w);
    const known = ["qué", "cómo", "sólo", "quién", "dónde", "cuál", "cuánto", "cuándo", "éste", "adónde", "guión", "aquél"];
    expect(off.filter((w) => !known.includes(w))).toEqual([]);
    expect(ACC_WORDS.length).toBeGreaterThan(6000); // the accents page uses the whole dictionary
  });
  it("every one-word verb form of the engine follows the rules too", () => {
    const bad = new Set();
    for (const v of REGULAR.concat(Object.keys(IRR))) for (const t of ["pres", "pret", "imp", "fut", "cond", "sp", "si", "fs", "impa"])
      for (let p = 0; p < 6; p++) { const f = form(v, t, p); if (f && !f.includes(" ") && spellByRules(f) !== f) bad.add(f); }
    expect([...bad]).toEqual([]);
  });
  it("classifies words", () => {
    const t = (w) => ["mono", "aguda", "llana", "esdrújula", "sobresdrújula"][analyze(w).type];
    expect(["sol", "canción", "reloj", "árbol", "casa", "música", "dígamelo"].map(t)).toEqual(["mono", "aguda", "aguda", "llana", "llana", "esdrújula", "sobresdrújula"]);
    expect(["día", "país", "búho"].map((w) => analyze(w).hiatus)).toEqual([true, true, true]);
  });
  it("forms plurals that keep the stress", () => {
    const ref = { "canción": "canciones", joven: "jóvenes", examen: "exámenes", "lápiz": "lápices", "país": "países", "árbol": "árboles", "inglés": "ingleses",
      "autobús": "autobuses", "sofá": "sofás", rey: "reyes", lunes: "lunes", crisis: "crisis", "carácter": "caracteres", "régimen": "regímenes", luz: "luces",
      imagen: "imágenes", "maíz": "maíces", "baúl": "baúles", "menú": "menús", mes: "meses" };
    expect(Object.fromEntries(Object.keys(ref).map((w) => [w, plural(w)]))).toEqual(ref);
  });
  it("explains every word and names it", () => {
    expect(ACC_WORDS.filter(({ w }) => !explainWord(w).join(" ").replace(/<[^>]+>/g, "").includes(w)).map(({ w }) => w)).toEqual([]);
  });
});

describe("accent tasks", () => {
  it("diacritic sentences have one gap, a known pair and an explanation", () => {
    expect(DIACRITIC.filter((d) => d.s.split("___").length !== 2 || !DIACRITIC_WHY[d.pair] || !d.pair.split(" / ").includes(d.w)).map((d) => d.s)).toEqual([]);
  });
  it("random tasks are complete, rebuild from their key, show the word without tildes, and the hint gives nothing away", () => {
    const bad = [];
    for (let i = 0; i < 3000; i++) {
      const t = randomTask({ kinds: ["word", "verb", "plural", "diacr"] }), a = t.answers[0];
      if (!a || /undefined|null/.test(t.main + t.sub + t.tag)) bad.push("incomplete " + t.key);
      if (fromKey(t.key).answers[0] !== a) bad.push("key " + t.key);
      if (t.key.startsWith("word") || t.key.startsWith("verb")) { if (t.main !== strip(a)) bad.push("main " + t.key); }
      // a diacritic hint names both spellings on purpose (the choice itself is the task), so only the other kinds are checked
      if (!t.key.startsWith("diacr") && /[áéíóú]/.test(a) && t.rule.join(" ").includes(a)) bad.push("rule leaks " + t.key);
      if (!t.why.join(" ").replace(/<[^>]+>/g, "").includes(a)) bad.push("why " + t.key);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it("uses all four kinds and only the chosen ones", () => {
    const seen = new Set(); for (let i = 0; i < 400; i++) seen.add(randomTask({ kinds: ["word", "verb", "plural", "diacr"] }).key.split("|")[0]);
    expect([...seen].sort()).toEqual(["diacr", "plural", "verb", "word"]);
    for (let i = 0; i < 100; i++) expect(randomTask({ kinds: ["plural"] }).key.startsWith("plural|")).toBe(true);
  });
  it("covers every noun of the dictionary with a regular plural, and the size setting limits the words", () => {
    expect(PL_NOUNS.length).toBeGreaterThan(4000);
    expect(PL_NOUNS.every((e) => plural(e.w))).toBe(true);
    for (let i = 0; i < 300; i++) {
      const t = randomTask({ kinds: ["word", "plural"], top: "1000" });
      expect(allowed(t.key, { kinds: ["word", "plural"], top: "1000" })).toBe(true);
      expect(LEX.find((e) => e.w === t.key.split("|")[1]).rank).toBeLessThanOrEqual(1000);
    }
  });
});
