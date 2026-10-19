// Spanish syllables and stress: split a word into syllables, find the stressed one,
// and rebuild the written accent after pronouns are attached (da + me + lo → dámelo).
const STRONG = "aeoáéó", WEAK = "iuü", ACCENTED_WEAK = "íú";
const VOWELS = STRONG + WEAK + ACCENTED_WEAK;
const PLAIN = { á: "a", é: "e", í: "i", ó: "o", ú: "u" };
const ACUTE = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };
const isV = (c) => VOWELS.includes(c);
// consonant pairs that start a syllable together (pla-za, o-tro); ch / ll / rr are single sounds
const ONSET2 = new Set(["pl", "pr", "bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "tr", "kl", "kr", "ch", "ll", "rr"]);

// vowels i and u after q / g before e, i are silent letters, not syllable nuclei (que, guiso)
function nuclei(w) {
  const out = [];
  for (let i = 0; i < w.length; i++) {
    if (!isV(w[i])) continue;
    if (w[i] === "u" && (w[i - 1] === "q" || w[i - 1] === "g") && "eiéí".includes(w[i + 1] || "")) continue;
    out.push(i);
  }
  return out;
}
// two adjacent vowels share a syllable unless both are strong or the weak one carries the accent (hiatus)
const joins = (a, b) => !(STRONG.includes(a) && STRONG.includes(b)) && !ACCENTED_WEAK.includes(a) && !ACCENTED_WEAK.includes(b) && !(a === b);

export function syllables(word) {
  const w = word.toLowerCase(), N = nuclei(w);
  if (!N.length) return [word];
  // group vowel positions into nuclei (diphthongs / triphthongs stay together)
  const groups = [];
  for (const i of N) {
    const g = groups[groups.length - 1];
    if (g && i === g[g.length - 1] + 1 && joins(w[g[g.length - 1]], w[i])) g.push(i);
    else groups.push([i]);
  }
  // split the consonants between nuclei
  const cuts = [];
  for (let k = 1; k < groups.length; k++) {
    const a = groups[k - 1][groups[k - 1].length - 1] + 1, b = groups[k][0];
    const cons = w.slice(a, b);
    if (cons.length === 0) cuts.push(b);
    else if (cons.length === 1) cuts.push(a);
    else {
      // keep a valid onset with the next syllable, at most two consonants (in-tro, ins-tan-te)
      const last2 = cons.slice(-2);
      cuts.push(ONSET2.has(last2) && !(cons.length === 2 && /^(rl|sl|tl)$/.test(last2)) ? b - 2 : b - 1);
    }
  }
  const out = []; let s = 0;
  for (const c of cuts) { out.push(word.slice(s, c)); s = c; }
  out.push(word.slice(s));
  return out;
}

// index of the stressed syllable: the one with a written accent, otherwise the default rule
// (ending in a vowel, n or s → second to last; any other consonant → last)
export function stressIndex(word) {
  const sy = syllables(word);
  const marked = sy.findIndex((s) => /[áéíóú]/.test(s));
  if (marked >= 0) return marked;
  return defaultStress(word, sy);
}
function defaultStress(word, sy = syllables(word)) {
  if (sy.length === 1) return 0;
  return /[aeiouns]$/i.test(word) ? sy.length - 2 : sy.length - 1;
}

const strip = (s) => s.replace(/[áéíóú]/g, (c) => PLAIN[c]);
// put the accent on the main vowel of a syllable: a strong vowel if there is one, otherwise the last weak one
function accentSyllable(s) {
  const chars = [...s];
  let pos = chars.findIndex((c) => STRONG.includes(c));
  if (pos < 0) for (let i = chars.length - 1; i >= 0; i--) if (WEAK.includes(chars[i]) && !(chars[i] === "u" && /[qg]/.test(chars[i - 1] || ""))) { pos = i; break; }
  if (pos < 0) return s;
  chars[pos] = ACUTE[chars[pos]] || chars[pos];
  return chars.join("");
}

// rewrite the accent of word so that syllable `idx` is stressed; keeps an accent that breaks a diphthong (oír)
export function withStress(word, idx) {
  const plainWord = strip(word);
  const hiatus = /[aeo][íú]|[íú][aeo]/.test(word);
  const sy = syllables(hiatus ? word : plainWord);
  if (!hiatus && defaultStress(plainWord, sy) === idx && sy.length > 1) return sy.join("");
  if (hiatus) return word; // the accent is needed anyway to keep the vowels apart
  if (sy.length === 1) return plainWord;
  sy[idx] = accentSyllable(sy[idx]);
  return sy.join("");
}

// attach pronouns to a verb form, keeping the stress where it was: da + [me, lo] → dámelo, decid + [me] → decidme
export function attach(form, clitics) {
  const sy = syllables(form), si = stressIndex(form);
  const word = form + clitics.join("");
  // the stressed syllable keeps its position counted from the start of the word
  const lenBefore = sy.slice(0, si).join("").length;
  let acc = 0, idx = 0;
  const sw = syllables(word);
  for (let i = 0; i < sw.length; i++) { if (acc >= lenBefore) { idx = i; break; } acc += sw[i].length; idx = i + 1; }
  // monosyllables lose their diacritic accent once they are no longer alone (dé + me → deme)
  return withStress(sy.length === 1 ? strip(form) + clitics.join("") : word, Math.min(idx, sw.length - 1));
}
