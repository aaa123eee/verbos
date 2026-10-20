import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import * as E from "../../src/lib/conjugation.js";

const VERBS = E.REGULAR.concat(Object.keys(E.IRR));
const each = (fn) => { for (const v of VERBS) for (const T of E.TENSES) for (let p = 0; p < 6; p++) fn(v, T.k, p); };

describe("conjugation engine", () => {
  it("gives the reference forms", () => {
    const ref = {
      "tener|sp|3": "tengamos", "dormir|sp|3": "durmamos", "jugar|sp|0": "juegue", "ser|si|3": "fuéramos",
      "decir|impa|1": "di", "ir|impa|4": "id", "oír|fut|0": "oiré", "hacer|perf|0": "he hecho", "pedir|pret|5": "pidieron",
      "hablar|impn|1": "no hables", "ir|impn|4": "no vayáis", "tener|ant|2": "hubo tenido", "hablar|fs|3": "habláremos",
      "ser|fs|0": "fuere", "hacer|fps|5": "hubieren hecho", "elegir|pres|0": "elijo", "mantener|impa|1": "mantén",
      "colgar|sp|3": "colguemos", "comenzar|sp|3": "comencemos", "mentir|sp|3": "mintamos", "traducir|si|3": "tradujéramos",
      "construir|sp|0": "construya", "enviar|sp|3": "enviemos", "enviar|sp|0": "envíe", "resolver|perf|2": "ha resuelto",
      "valer|fut|1": "valdrás", "caber|sp|0": "quepa", "poseer|perf|0": "he poseído", "deshacer|impa|1": "deshaz",
      "convenir|cond|0": "convendría", "costar|impa|1": "cuesta", "vestir|sp|3": "vistamos",
      "sentar|sp|3": "sentemos", "divertir|sp|3": "divirtamos", "acostar|pres|0": "acuesto", "equivocar|sp|0": "equivoque",
    };
    const got = Object.fromEntries(Object.keys(ref).map((k) => { const [v, t, p] = k.split("|"); return [k, E.form(v, t, +p)]; }));
    expect(got).toEqual(ref);
  });

  it("accepts the -se form as an alternative", () => {
    expect(E.altForm("tener", "si", 3)).toBe("tuviésemos");
    expect(E.altForm("ver", "spl", 0)).toBe("hubiese visto");
    expect(E.altForm("hablar", "pres", 0)).toBe(null);
  });

  it("has a form for every verb, tense and person (except imperative yo)", () => {
    const missing = [];
    each((v, t, p) => { if (E.form(v, t, p) == null && !(E.isImp(t) && p === 0)) missing.push(`${v} ${t} ${p}`); });
    expect(missing).toEqual([]);
  });
});

describe("verb data", () => {
  it("has 286 distinct verbs, each with Russian forms and all meanings", () => {
    expect(new Set(VERBS).size).toBe(VERBS.length);
    expect(VERBS.length).toBe(286);
    const bad = VERBS.filter((v) => !E.RU[v] || E.RU[v][1].split(" ").length !== 6 || E.RU[v][2].length !== 2 || !E.MEAN[v] || !E.TIER[v]);
    expect(bad).toEqual([]);
  });

  it("defines a color token for every tense in all three theme blocks", () => {
    const css = readFileSync(new URL("../../src/styles/conjugacion.css", import.meta.url), "utf8");
    const bad = E.TENSES.filter((t) => (css.match(new RegExp(`--t-${t.k}:`, "g")) || []).length !== 3).map((t) => t.k);
    expect(bad).toEqual([]);
  });
});

describe("explanations and hints", () => {
  const strip = (s) => s.replace(/<[^>]+>/g, "");
  const L = "a-záéíóúñü";
  const has = (text, w) => new RegExp(`(^|[^${L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^${L}]|$)`, "i").test(text);

  it("explain every form and mention each word of it", () => {
    const bad = [];
    each((v, t, p) => {
      const c = E.form(v, t, p); if (c == null) return;
      const ex = strip(E.explain(v, t, p).join(" "));
      if (!ex || !c.split(" ").filter((w) => w !== "no").every((w) => ex.includes(w))) bad.push(`${v} ${t} ${p}`);
    });
    expect(bad).toEqual([]);
  });

  it("never leak the answer or name the verb in a hint", () => {
    const bad = [];
    each((v, t, p) => {
      const c = E.form(v, t, p); if (c == null) return;
      for (const [nm, f] of [["rule", E.hintRule], ["reg", E.hintRegular], ["end", E.hintEndings]]) {
        // tense names ("presente") and verb-group labels ("-er/-ir") are not leaks
        const tx = strip(f(v, t, p).join(" ")).replace(/-(ar|er|ir)\b/g, "").replace(/(subj\. )?presente\b/g, "");
        if (has(tx, c)) bad.push(`${nm} leaks ${v} ${t} ${p}`);
        if (has(tx, v)) bad.push(`${nm} names ${v} ${t} ${p}`);
      }
    });
    expect(bad).toEqual([]);
  });
});
