import { describe, it, expect } from "vitest";
import { FR, FRAMES, GROUPS, randomTask, fromKey, hintOf } from "../../src/lib/es/tiempos.js";
import { OBJ, REFL } from "../../src/lib/es/pronombres-data.js";
import { TENSES, TMAP } from "../../src/lib/conjugation.js";

// a deterministic random source
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const strip = (s) => s.replace(/<[^>]+>/g, "");

describe("tense tasks", () => {
  it("every frame has a known tense and group, and a reason with a marker", () => {
    expect(FR.filter((f) => !TMAP[f.t] || !GROUPS[f.g] || !f.why.includes(":") || (f.alt || []).some((t) => !TMAP[t]))).toEqual([]);
    expect(new Set(FR.map((f) => f.id)).size).toBe(FR.length);
  });

  it("random tasks reach every frame, every verb with an object and every se verb", () => {
    const r = rng(7), frames = new Set(), obj = new Set(), refl = new Set();
    for (let i = 0; i < 60000; i++) {
      const t = randomTask({ groups: Object.keys(GROUPS) }, r), [f, v, , o] = t.key.split("|");
      frames.add(f); (o === "r" ? refl : obj).add(v);
    }
    expect(FR.filter((f) => !frames.has(f.id)).map((f) => f.id)).toEqual([]);
    expect(Object.keys(OBJ).filter((v) => !obj.has(v))).toEqual([]);
    expect(Object.keys(REFL).filter((v) => !refl.has(v))).toEqual([]);
  });

  it("every frame × person × verb builds a task: a gap, answers, a reason, a hint that gives neither the answer nor the tense", () => {
    const bad = [], names = TENSES.flatMap((T) => [T.name, T.short]).filter(Boolean);
    for (const f of FR) {
      const ps = f.p || (f.t === "impa" || f.t === "impn" ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5]);
      const vs = Object.keys(OBJ).map((v) => [v, 0]).concat(f.obj ? [] : Object.keys(REFL).map((v) => [v, "r"]));
      for (const p of ps) for (const [v, o] of vs) {
        const k = [f.id, v, p, o].join("|"), t = fromKey(k), m = strip(t.main);
        if (t.key !== k || !t.main.includes('<span class="gap">') || /[{}]/.test(m) || !t.answers.length || t.answers.some((a) => !a || a.startsWith("no "))) bad.push("task " + k);
        const h = t.rule.join(" ");
        if (t.answers.some((a) => new RegExp("(^|[^a-záéíóúñ])" + a + "([^a-záéíóúñ]|$)").test(h))) bad.push("hint leaks " + k);
        if (names.some((n) => h.toLowerCase().includes(n.toLowerCase()))) bad.push("hint names the tense " + k);
        if (!strip(t.why.join(" ")).includes(t.answers[0])) bad.push("why lacks the answer " + k);
      }
    }
    expect(bad.slice(0, 20)).toEqual([]);
  });

  it("gives the expected answers", () => {
    const a = (k) => fromKey(k).answers;
    expect(a("ayer|comprar|0|0")).toEqual(["compré"]);
    expect(a("mientras|leer|3|0")[0]).toBe("leíamos");
    expect(a("hoy|comer|0|0")).toEqual(["he comido", "comí"]);
    expect(a("manana|comprar|0|0")).toEqual(["compraré", "compro", "voy a comprar"]);
    expect(a("si|tener|0|0")).toEqual(["tuviera", "tuviese"]);
    expect(a("nopor|comprar|1|0")).toEqual(["compres"]);
    expect(a("quiero|levantar|1|r")).toEqual(["levantes"]);
    expect(fromKey("quiero|levantar|1|r").main).toContain("te ");
    expect(hintOf(FRAMES.ayer)).not.toMatch(/pretérito/);
  });

  it("rejects keys of unknown frames or verbs", () => {
    expect(() => fromKey("nope|comprar|0|0")).toThrow();
    expect(() => fromKey("ayer|zzz|0|0")).toThrow();
  });
});
