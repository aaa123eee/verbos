// Every other Spanish verb (src/data/verbs.json, level 5): conjugated by the engine, explained, hinted.
// The build script (npm run build:verbs) has already checked every form against the Wiktionary tables.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import * as E from "../../src/lib/conjugation.js";

const ROWS = JSON.parse(readFileSync(new URL("../../src/data/verbs.json", import.meta.url), "utf8"));
E.addVerbs(ROWS);
const strip = (s) => s.replace(/<[^>]+>/g, "");
const L = "a-záéíóúñü";
const has = (text, w) => new RegExp(`(^|[^${L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^${L}]|$)`, "i").test(text);

describe("every other verb", () => {
  it("adds thousands of verbs, none of them twice or already in the engine, each with a meaning", () => {
    expect(ROWS.length).toBeGreaterThan(8000);
    expect(new Set(ROWS.map((r) => r[0])).size).toBe(ROWS.length);
    expect(E.MORE.length).toBe(ROWS.length);
    expect(ROWS.filter((r) => !r[2] || !/(ar|er|ir|ír)$/.test(r[0]))).toEqual([]);
    expect(E.allVerbs().length).toBe(286 + ROWS.length);
  });

  it("models are verbs of the engine, and level 5 gives no Russian prompts", () => {
    const own = new Set(E.REGULAR.concat(Object.keys(E.IRR)));
    expect(ROWS.filter((r) => typeof r[1] === "string" && r[1] && !own.has(r[1])).map((r) => r[0])).toEqual([]);
    expect(E.MORE.filter((v) => E.TIER[v] !== 5 || E.isRuPrompt(v))).toEqual([]);
  });

  it("gives the reference forms", () => {
    const ref = {
      "recontar|pres|0": "recuento", "recontar|sp|3": "recontemos", "retener|impa|1": "retén", "retener|fut|0": "retendré",
      "prever|pret|2": "previó", "prever|imp|0": "preveía", "prever|impa|1": "prevé", "contradecir|pret|0": "contradije",
      "averiguar|pret|0": "averigüé", "averiguar|sp|0": "averigüe", "fiar|pres|0": "fío", "fiar|pret|2": "fio",
      "vencer|pres|0": "venzo", "gruñir|pret|2": "gruñó", "reunir|pres|0": "reúno", "inscribir|perf|0": "he inscrito",
      "arrepentir|pres|0": "arrepiento", "arrepentir|pret|5": "arrepintieron", "sonreír|pres|0": "sonrío", "sonreír|pret|2": "sonrió",
      "madrugar|pret|0": "madrugué", "excavar|si|3": "excaváramos", "predecir|fut|0": "predeciré",
    };
    const got = Object.fromEntries(Object.keys(ref).map((k) => { const [v, t, p] = k.split("|"); return [k, E.form(v, t, +p)]; }));
    expect(got).toEqual(ref);
    expect(E.SE.arrepentir).toBe(1);
    expect(E.DEFECTIVE.atañer).toBe(1);
    expect(E.LIKE.recontar).toBe("contar");
  });

  // all ~8.4k verbs × 18 tenses × 6 persons: a form, an explanation naming each of its words, hints without the answer
  it("conjugates and explains every form, and no hint leaks it", () => {
    const bad = [];
    for (const v of E.MORE) for (const T of E.TENSES) for (let p = 0; p < 6; p++) {
      if (!E.hasPerson(T.k, p)) continue;
      const c = E.form(v, T.k, p);
      if (!c) { bad.push("no form " + v + " " + T.k + p); continue; }
      const ex = strip(E.explain(v, T.k, p).join(" "));
      if (!ex || !c.split(" ").filter((w) => w !== "no").every((w) => ex.includes(w))) bad.push("explain " + v + " " + T.k + p);
      if (T.k !== "pres" && T.k !== "pret" && T.k !== "sp" && T.k !== "impa") continue; // the hints that read the verb's own entries
      for (const f of [E.hintRule, E.hintRegular, E.hintEndings]) {
        const tx = strip(f(v, T.k, p).join(" ")).replace(/-(ar|er|ir)\b/g, "").replace(/(subj\. )?presente\b/g, "");
        if (has(tx, c) || has(tx, v)) bad.push("hint " + v + " " + T.k + p);
      }
    }
    expect(bad.slice(0, 20)).toEqual([]);
  }, 120000);
});
