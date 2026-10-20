import { describe, it, expect } from "vitest";
import ROWS from "../../src/data/lookup.json" with { type: "json" };
import { makeDict, lookupEs, lookupRu, meanings, withArticle, today, newCard, grade, modeFor, answersFor, synonym, shownMeanings, status } from "../../src/lib/es/palabras.js";
import { LEX } from "../../src/lib/es/lexicon.js";
import { REGULAR, IRR } from "../../src/lib/conjugation.js";

const D = makeDict(ROWS);
const ids = (xs) => xs.map((e) => e.id);
describe("words: the dictionary", () => {
  it("has every word of the trainers' dictionary and every engine verb, each with a translation", () => {
    expect(D.list.length).toBeGreaterThan(50000);
    const missing = LEX.filter((e) => !D.byId.get(e.w + "|" + e.p)).map((e) => e.id || e.w + "|" + e.p);
    expect(missing.slice(0, 10)).toEqual([]);
    for (const v of REGULAR.concat(Object.keys(IRR))) expect(meanings(D.byId.get(v + "|v")).length).toBeGreaterThan(0);
    expect(D.list.every((e) => meanings(e).length > 0)).toBe(true);
  });
  it("keeps many translations of a word", () => {
    expect(meanings(D.byId.get("tirar|v")).length).toBeGreaterThan(10);
    expect(meanings(D.byId.get("listo|a"))).toContain("готовый");
    expect(meanings(D.byId.get("tiempo|n"))).toEqual(expect.arrayContaining(["время", "погода"]));
  });
  it("finds a Spanish word, the words a form belongs to, and words that start with the query", () => {
    expect(ids(lookupEs(D, "casa").exact)).toContain("casa|n");
    const fui = lookupEs(D, "fui").formOf.map((x) => x.e.w);
    expect(fui).toEqual(expect.arrayContaining(["ir", "ser"]));
    expect(lookupEs(D, "casas").formOf.map((x) => x.e.id)).toContain("casa|n");
    expect(lookupEs(D, "blancas").formOf.map((x) => x.e.id)).toContain("blanco|a");
    expect(lookupEs(D, "no hables").formOf.map((x) => x.e.w)).toContain("hablar");
    expect(ids(lookupEs(D, "cancion").exact)).toContain("canción|n"); // accents are optional
    expect(lookupEs(D, "orden").more.length).toBeGreaterThan(0);
  });
  it("finds Spanish words by a Russian word, the closest first", () => {
    expect(lookupRu(D, "время").slice(0, 3).map((e) => e.w)).toContain("tiempo");
    expect(lookupRu(D, "компьютер").slice(0, 3).map((e) => e.w)).toContain("ordenador");
    expect(lookupRu(D, "ёлка").length + lookupRu(D, "елка").length).toBeGreaterThan(0);
    expect(lookupRu(D, "собака").slice(0, 3).map((e) => e.w)).toContain("perro");
  });
  it("names nouns with their article", () => {
    expect(withArticle(D.byId.get("problema|n"))).toBe("el problema");
    expect(withArticle(D.byId.get("agua|n"))).toBe("el agua");
    expect(answersFor(D, D.byId.get("casa|n"))).toEqual(["casa", "la casa"]);
  });
});

describe("words: the schedule", () => {
  it("goes 1 day, 3 days, then grows; a mistake starts over today", () => {
    const d = today(new Date(2026, 9, 20)), c = newCard("casa|n", d);
    expect(status(c, d)).toBe("новое");
    grade(c, true, d); expect(c.due - d).toBe(1);
    grade(c, true, d + 1); expect(c.due - (d + 1)).toBe(3);
    grade(c, true, d + 4); expect(c.ivl).toBeGreaterThan(5);
    const ease = c.ease;
    grade(c, false, d + 12); expect(c.due).toBe(d + 12); expect(c.reps).toBe(0); expect(c.ease).toBeLessThan(ease);
    expect(today(new Date(2026, 9, 21, 0, 30)) - today(new Date(2026, 9, 20, 23, 30))).toBe(1); // local midnight
  });
  it("asks to recognise first, then to write and listen; skips listening without a voice", () => {
    const c = newCard("casa|n", 0);
    expect(modeFor(c, ["see", "write", "listen"], true)).toBe("see");
    c.reps = 2; const later = [2, 3, 4].map((r) => modeFor({ ...c, reps: r }, ["see", "write", "listen"], true));
    expect(new Set(later)).toEqual(new Set(["see", "write", "listen"]));
    for (let r = 0; r < 6; r++) expect(modeFor({ ...c, reps: r }, ["see", "write", "listen"], false)).not.toBe("listen");
    expect(modeFor({ ...c, reps: 0 }, ["write"], true)).toBe("write");
  });
  it("accepts a synonym when writing from Russian", () => {
    const e = D.byId.get("empezar|v"), shown = shownMeanings(e);
    expect(synonym(D, e, shown, "comenzar")?.w).toBe("comenzar");
    expect(synonym(D, e, shown, "comer")).toBeFalsy();
  });
});
