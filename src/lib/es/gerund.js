// Gerundio: hablando, comiendo, viviendo; -yendo after a vowel (leyendo); -ir stem change e→i / o→u (pidiendo, durmiendo).
import { IRR, base, vt, basic, stemChange } from "../conjugation.js";
import { attach } from "./syllables.js";

const SPECIAL = { ir: "yendo", poder: "pudiendo", decir: "diciendo", venir: "viniendo", prevenir: "previniendo", convenir: "conviniendo" };

export function gerund(v) {
  if (SPECIAL[v]) return SPECIAL[v];
  const st = base(v), g = vt(v);
  if (g === "ar") return st + "ando";
  // -ir stem changers take the stem of ellos pretérito: pidieron → pid-, durmieron → durm-
  if (g === "ir" && IRR[v]) {
    const p5 = basic(v, "pret", 5), st2 = p5.endsWith("ieron") ? p5.slice(0, -5) : "";
    if (st2 && st2 !== st && stemChange(st, st2)) return st2 + "iendo";
  }
  if (/[aeiouáéíóú]$/.test(st)) return st.replace(/í$/, "i") + "yendo"; // leer → leyendo, oír → oyendo
  return st + "iendo";
}

export function explainGerund(v) {
  const c = gerund(v), st = base(v), g = vt(v), F = (s) => '<b class="f">' + s + "</b>";
  if (SPECIAL[v]) return ["Особый герундий, его надо запомнить: " + F(c) + "."];
  if (g === "ar") return ["У -ar: основа " + F(st + "-") + " + " + F("-ando") + " = " + F(c) + "."];
  if (c.endsWith("yendo")) return ["Основа кончается на гласную, поэтому i между гласными превращается в y: " + F(st + "-") + " + " + F("-yendo") + " = " + F(c) + "."];
  if (c.slice(0, -5) !== st) return ["У -ir со сменой корня гласная меняется, как в él pretérito (" + basic(v, "pret", 2) + "): " + F(c.slice(0, -5) + "-") + " + " + F("-iendo") + " = " + F(c) + "."];
  return ["У -er / -ir: основа " + F(st + "-") + " + " + F("-iendo") + " = " + F(c) + "."];
}

export { attach };
