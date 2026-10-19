import { describe, it, expect } from "vitest";
import { syllables, stressIndex, attach } from "../../src/lib/es/syllables.js";
import { gerund } from "../../src/lib/es/gerund.js";
import { fromKey, randomTask, CONTEXTS } from "../../src/lib/es/pronombres.js";

describe("syllables and stress", () => {
  it("splits words into syllables", () => {
    const ref = { hablar: "ha-blar", construir: "cons-truir", "oír": "o-ír", "leído": "le-í-do", guitarra: "gui-ta-rra", queso: "que-so",
      instante: "ins-tan-te", otro: "o-tro", ciudad: "ciu-dad", aeropuerto: "a-e-ro-puer-to", "dándotelo": "dán-do-te-lo", huevo: "hue-vo", creer: "cre-er", "biología": "bio-lo-gí-a" };
    expect(Object.fromEntries(Object.keys(ref).map((w) => [w, syllables(w).join("-")]))).toEqual(ref);
  });
  it("finds the stressed syllable", () => {
    expect([stressIndex("hablar"), stressIndex("casa"), stressIndex("árbol"), stressIndex("canción"), stressIndex("país")]).toEqual([1, 0, 0, 1, 1]);
  });
  it("keeps the stress when pronouns are attached", () => {
    const ref = [["da", ["me", "lo"], "dámelo"], ["dad", ["me", "lo"], "dádmelo"], ["decid", ["me"], "decidme"], ["di", ["me", "lo"], "dímelo"],
      ["haz", ["lo"], "hazlo"], ["dando", ["te", "lo"], "dándotelo"], ["dar", ["te", "lo"], "dártelo"], ["dar", ["te"], "darte"], ["oír", ["lo"], "oírlo"],
      ["dé", ["me", "lo"], "démelo"], ["dé", ["me"], "deme"], ["levanta", ["te"], "levántate"], ["sentemo", ["nos"], "sentémonos"], ["diga", ["me"], "dígame"],
      ["traiga", ["se", "la"], "tráigasela"], ["explica", ["me", "lo"], "explícamelo"], ["pon", ["te"], "ponte"], ["construyendo", ["la"], "construyéndola"]];
    expect(ref.map(([f, c]) => attach(f, c))).toEqual(ref.map((x) => x[2]));
  });
});

describe("gerund", () => {
  it("gives the reference forms", () => {
    const ref = { hablar: "hablando", comer: "comiendo", vivir: "viviendo", leer: "leyendo", "oír": "oyendo", traer: "trayendo", construir: "construyendo",
      pedir: "pidiendo", dormir: "durmiendo", morir: "muriendo", sentir: "sintiendo", vestir: "vistiendo", elegir: "eligiendo", seguir: "siguiendo",
      ir: "yendo", poder: "pudiendo", decir: "diciendo", venir: "viniendo", tener: "teniendo", hacer: "haciendo", conducir: "conduciendo", divertir: "divirtiendo", ser: "siendo" };
    expect(Object.fromEntries(Object.keys(ref).map((v) => [v, gerund(v)]))).toEqual(ref);
  });
});

describe("pronoun tasks", () => {
  it("build the right answers", () => {
    const ref = { "obj|dar|impa|1|0|0|": "dámelo", "obj|dar|impa|3|0|7|": "démoselo", "obj|decir|impn|1|0|0|": "no me la digas", "obj|dar|pres|2|0|0|": "me lo da",
      "obj|dar|pret|0|3|3|": "se las di", "obj|explicar|inf|0|1|1||ir": "voy a explicártela", "obj|comprar|ger|0|2|7|": "estoy comprándoselos",
      "obj|dar|impa|4|0|0|": "dádmelo", "obj|decir|impa|2|0|2|": "dígasela", "refl|levantar|impa|1|||": "levántate", "refl|levantar|impa|3|||": "levantémonos",
      "refl|sentar|impa|4|||": "sentaos", "refl|vestir|impa|4|||": "vestíos", "refl|ir|impa|4|||": "idos", "refl|ir|impa|1|||": "vete", "refl|poner|impa|1|||": "ponte",
      "refl|levantar|impn|1|||": "no te levantes", "refl|acostar|pres|0|||": "me acuesto", "refl|vestir|ger|0|||": "estoy vistiéndome",
      "refl|levantar|inf|0|||ir": "voy a levantarme", "refl|divertir|impa|5|||": "diviértanse", "ger|dormir|ger|5|||": "están durmiendo", "obj|traer|impa|5|2|9|": "tráiganselos" };
    expect(Object.fromEntries(Object.keys(ref).map((k) => [k, fromKey(k).answers[0]]))).toEqual(ref);
    expect(fromKey("obj|explicar|inf|0|1|1||ir").answers).toEqual(["voy a explicártela", "te la voy a explicar"]);
  });
  it("random tasks are complete, rebuild from their key, and the hint never gives the answer away", () => {
    const bad = [];
    for (let i = 0; i < 3000; i++) {
      const t = randomTask({ types: ["obj", "refl", "ger"], ctxs: Object.keys(CONTEXTS) });
      const again = fromKey(t.key), text = t.why.join(" ").replace(/<[^>]+>/g, "");
      if (!t.answers[0] || /undefined|null/.test(t.answers.join() + t.main + t.tag)) bad.push("incomplete " + t.key);
      if (again.answers.join() !== t.answers.join()) bad.push("key " + t.key);
      if (!t.answers[0].split(" ").every((w) => text.includes(w))) bad.push("why " + t.key);
      if (t.answers.some((a) => t.rule.join(" ").includes(a))) bad.push("rule leaks " + t.key);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it("respect the settings: no vosotros when it is off, only the chosen kinds", () => {
    for (let i = 0; i < 500; i++) {
      const t = randomTask({ types: ["refl"], ctxs: ["impa"], vos: false });
      expect(t.key.startsWith("refl|")).toBe(true);
      expect(t.key.split("|")[3]).not.toBe("4");
    }
  });
});
