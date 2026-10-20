import { describe, it, expect } from "vitest";
import { NOUNS, PL_ART, ADJS, FORMS, adjByRule, fromKey, randomTask, allowed, elFem } from "../../src/lib/es/genero.js";
import { LEX } from "../../src/lib/es/lexicon.js";

const ans = (k) => fromKey(k).answers;
describe("gender and agreement", () => {
  it("uses every dictionary noun with a gender and every adjective with its forms", () => {
    const nouns = new Set(LEX.filter((e) => e.p === "n").map((e) => e.w));
    expect(NOUNS.length).toBeGreaterThan(4000);
    expect(NOUNS.length / nouns.size).toBeGreaterThan(0.95); // the rest: no gender anywhere, or first of all another part of speech
    expect(PL_ART.length).toBeGreaterThan(3900);
    expect(ADJS.length).toBeGreaterThan(1000);
    expect(ADJS.length / new Set(LEX.filter((e) => e.p === "a").map((e) => e.w)).size).toBeGreaterThan(0.9);
  });
  it("gives the right article", () => {
    expect(ans("art|problema")).toEqual(["el problema"]);
    expect(ans("art|mano")).toEqual(["la mano"]);
    expect(ans("art|canción")).toEqual(["la canción"]);
    expect(ans("art|hotel")).toEqual(["el hotel"]);
    expect(ans("art|mapa")).toEqual(["el mapa"]);
    expect(ans("art|agua")).toEqual(["el agua"]);
    expect(ans("art|hambre")).toEqual(["el hambre"]);
    expect(ans("artpl|agua")).toEqual(["las aguas"]);
    expect(ans("art|estudiante")).toEqual(["el estudiante", "la estudiante"]);
    expect(ans("artpl|estudiante")).toEqual(["los estudiantes", "las estudiantes"]);
    expect(ans("art|gafas")).toEqual(["las gafas"]);
    expect(ans("artpl|hotel")).toEqual(["los hoteles"]);
    expect(ans("artpl|lápiz")).toEqual(["los lápices"]);
    expect(ans("artpl|canción")).toEqual(["las canciones"]);
    expect(elFem("arma") && elFem("águila") && !elFem("amiga") && !elFem("hamaca")).toBe(true);
  });
  it("gives the four forms of adjectives", () => {
    expect(ans("adj|blanco|fp")).toEqual(["blancas"]);
    expect(ans("adj|inglés|f")).toEqual(["inglesa"]);
    expect(ans("adj|inglés|mp")).toEqual(["ingleses"]);
    expect(ans("adj|encantador|fp")).toEqual(["encantadoras"]);
    expect(ans("adj|alemán|f")).toEqual(["alemana"]);
    expect(ans("adj|español|mp")).toEqual(["españoles"]);
    expect(ans("adj|feliz|mp")).toEqual(["felices"]);
    expect(ans("adj|verde|f")).toEqual(["verde"]);
    expect(ans("adj|mayor|f")).toEqual(["mayor"]);
    expect(ans("adj|marroquí|fp")).toEqual(["marroquíes", "marroquís"]);
  });
  it("the adjective rules agree with Wiktionary except a few known words", () => {
    const off = ADJS.filter((e) => adjByRule(e.w).join(" ") !== e.forms).map((e) => e.w);
    expect(off.filter((w) => !/í$/.test(w)).sort()).toEqual(["cortés", "marrón", "naranja"]);
  });
  it("every noun and every adjective form makes a task with an explanation, and hints don't give the answer", () => {
    const keys = NOUNS.map((e) => "art|" + e.w).concat(PL_ART.map((e) => "artpl|" + e.w), ADJS.flatMap((e) => Object.keys(FORMS).map((f) => "adj|" + e.w + "|" + f)));
    for (const k of keys) {
      const t = fromKey(k);
      expect(t.key).toBe(k);
      expect(t.answers.length).toBeGreaterThan(0);
      expect(t.answers.every((a) => a && !a.includes("undefined"))).toBe(true);
      expect(t.why.length).toBeGreaterThan(0);
      expect(t.why.join(" ")).not.toMatch(/undefined|NaN/);
      expect(t.rule.join(" ")).not.toContain(t.answers[0]);
    }
  });
  it("random tasks follow the settings", () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i++) {
      const s = { kinds: ["art", "artpl", "adj"], top: "1000" }, t = randomTask(s);
      seen.add(t.key.split("|")[0]);
      expect(allowed(t.key, s)).toBe(true);
      expect(LEX.find((e) => e.w === t.key.split("|")[1]).rank).toBeLessThanOrEqual(1000);
    }
    expect([...seen].sort()).toEqual(["adj", "art", "artpl"]);
    for (let i = 0; i < 100; i++) expect(randomTask({ kinds: ["adj"] }).key.startsWith("adj|")).toBe(true);
    expect(allowed("art|agua", { kinds: ["adj"], top: "all" })).toBe(false);
  });
});
