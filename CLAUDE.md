# Verbos

A Spanish verb conjugation trainer. The user types the verb form; optional hints sit behind buttons, and mistakes come back later (a simple spaced-repetition scheme driven by a turn counter). A cheat sheet of endings and rules, plus a verb search, opens in a dialog from the header buttons.

UI language is Russian; verb content is Spanish. Hosted as a static site on GitHub Pages from the root of `main`.

## Layout

- `index.html` — the whole project: markup, CSS and JS in one file. No build step, no dependencies, no `package.json`.
- `CLAUDE.md` — this file.

The only external resource is Google Fonts (Young Serif, IBM Plex Sans, IBM Plex Mono), each with a system fallback. Do not add other CDNs.

## Hard constraints

- **Only served from GitHub Pages**, never embedded in an iframe.
- **No `<form>`.** Enter is handled via `keydown` on `#ans`, and every button is `type="button"` with a `click` handler, so nothing submits or reloads the page.
- **Browser storage only.** No backend, no cloud database.
- **Storage may be unavailable** (private mode, blocked site data). Wrap every `localStorage` / `indexedDB` access in `try/catch`; the page must work without it.
- **Colors only via tokens** in `:root`. Dark theme redefines the same tokens in both `@media (prefers-color-scheme: dark)` and `:root[data-theme="dark"]`; keep the two blocks in sync.
- **Must work at ~400px width** with no horizontal page scroll. Wide tables live inside `.tbl` (`overflow-x: auto`).

## Data model (JS in `index.html`)

| What | Where | Format |
|---|---|---|
| Regular endings (presente, pretérito) | `REG[ar\|er\|ir][pres\|pret]` | array of 6 endings |
| Regular verbs | `REGULAR` | array of infinitives |
| Verbs with any irregularity | `IRR[verb] = {pres, pret}` | 6 space-separated forms each |
| Russian translations | `RU[verb] = [infinitive, "6 present forms", [past sg, past pl], hint?]` | the hint disambiguates pairs like ser/estar, decir |
| Verb set (level) | `TIER[verb] = 1\|2\|3` | 1 core, 2 frequent, 3 everyday |
| Tenses | `TENSES` | `{k, mood, name, short?, ru, g}`; `g` is the color group: `pres` / `past` / `fut` / `subj` / `imp` |

Persons are indices 0–5: yo, tú, él/ella/Ud., nosotros, vosotros, ellos/Uds. The imperative has no form for index 0 (`hasPerson`).

Levels 2 and 3 are added with `addTier(n, regularVerbs, {verb: [pres, pret]}, ruEntries)`.

"Irregular" in the UI filter means any verb in `IRR`: stem changes, spelling changes (busqué), i→y (leyó), not only truly irregular verbs.

## Conjugation engine

Entry point: `form(verb, tenseKey, person)` returns a string or `null`.

- `pres`, `pret` → `basic()`: explicit forms from `IRR`, otherwise stem + `REG`.
- `imp` → stem + `IMPF`; exceptions in `IMPF_IRR` (ser, ir, ver).
- `fut`, `cond` → `(FUT_STEM[v] || infinitive)` + endings. Special stems live in `FUT_STEM`; oír → `oir`.
- Compound tenses (`perf plus futp condp spf spl`) → `HABER[t]` + `part(v)`. Irregular and accented participles live in `PART_IRR`.
- `sp` (present subjunctive) → yo presente minus `-o` + `SP_END`.
  - Whole-paradigm exceptions: `SP_OVR` (ser, estar, ir, saber, dar).
  - nosotros/vosotros of -ir stem-changers: `SP_NOS_IR` (sint-, durm-, prefir-, mur-).
  - nosotros/vosotros of -ar/-er stem-changers: infinitive stem, listed in `SP_NOS_INF`.
  - -car/-gar/-zar spelling: `spell()`.
- `si` (imperfect subjunctive) → ellos pretérito minus `-ron` + `-ra…`; nosotros gets an accent on the last vowel of the stem. Only the -ra form is accepted, not -se.
- `impa` (affirmative imperative) → tú: él presente or `IMP_TU`; Ud./Uds./nosotros: present subjunctive (ir → `vamos`); vosotros: infinitive minus `-r` + `d`.

**Explanations.** `explain(verb, tenseKey, person)` returns HTML lines with the rule and the steps from the infinitive to the form. It follows the same branches and helper lists as `form()` (`whyBasic` for presente/pretérito, which classifies the irregularity by comparing with the regular form; `whySp` for the subjunctive). It is shown in the feedback after a mistake, followed by `tenseHtml`: the whole tense for that verb, with the asked person highlighted and the other forms that differ from `regularForm()` colored. When you change the engine or add a helper list, update `explain` too. Check that every form gets a non-empty explanation that mentions the form itself.

**Cheat sheet and search.** The page shows only the trainer. The header buttons (`nav.tools`, `data-open`) open `<dialog id="sheet">` on one of four tab panels: `#regular`, `#irregular`, `#other`, `#search`. Esc closes the dialog. The undo shortcut ignores Esc while the dialog is open. Search (`searchVerbs`) matches the infinitive, a word of the Russian translation, or any conjugated form or participle. Forms are compared without accents, through an index built on first use. The verb card shows all tenses, and colors forms where `form() !== regularForm()`.

**Hints.** Buttons under the accent keys, available only before answering: «Правило» (`hintRule`, the rule for this verb and form), «Правильный?» (`hintRegular`, compares `form()` with `regularForm()`, which applies the plain rules with no exception lists), «Окончания» (`hintEndings`) and «Буква» (reveals the answer one letter at a time, up to length − 1). `kindBasic` classifies presente/pretérito forms for both `whyBasic` and `hintBasic`. Hints must never contain the answer, and must not name the verb, because in Russian-prompt mode the verb is part of the task. A correct answer given after any hint doesn't add to the streak, and the card goes into review with `need = 1`.

Russian prompts (`ruPhrase`) and full translations in feedback exist only for `pres` and `pret`. Other tenses always prompt in Spanish, and the feedback shows the infinitive's translation.

## Adding a verb

1. **Regular:** add it to the array of the right `addTier(...)` call (or to `REGULAR` for level 1) and add an `RU` entry.
2. **With irregularities:** add 6 presente and 6 pretérito forms to the `addTier` object and add an `RU` entry.
3. Check whether it belongs in the helper lists:
   - e→ie / o→ue stem change in -ar/-er → `SP_NOS_INF`;
   - e→ie / o→ue stem change in -ir → `SP_NOS_IR` (nosotros stem, e.g. `sint`). -ir verbs with e→i (pid-, sig-) need no entry: the yo stem is already correct;
   - special future stem → `FUT_STEM`;
   - irregular or accented participle → `PART_IRR`;
   - special tú imperative → `IMP_TU`;
   - fully irregular present subjunctive → `SP_OVR`;
   - irregular imperfecto → `IMPF_IRR`.
4. Cheat-sheet tables and the vocabulary list are generated from the data; don't edit them by hand.
5. Run the checks below and add a couple of reference forms for the new verb to `exp`.

## Adding a tense

1. Add an object to `TENSES` with a unique `k` and suitable `mood` and `g`. Its checkbox appears automatically.
2. Add a `case` to `form()`.
3. If the tense lacks some person, extend `hasPerson` and `persLabel`.
4. Add an explanation block to the `#other` panel of the cheat sheet.

## Progress storage

- IndexedDB: database `conjugacion`, store `kv`, key `progress`. Shape: `{t, review, total, right, streak}`.
- `review` holds cards under review: key `verb|tense|person`, value `{need, gap, due}`.
- `localStorage`: `conj-tenses-v1` stores the selected tenses. `conj-trainer-v1` is the old progress format; it is migrated to IndexedDB on first load.
- Size is bounded: only state is stored, never a log of answers.

**Controls.** Enter / «Проверить» checks, then moves on. Esc / «Отменить» (only after an answer) restores `S` from an in-memory snapshot taken before the check and asks the same prompt again. «Сбросить прогресс» clears `S`; «Сбросить всё» also resets the tense selection and filters. Both resets need a second click within 3 s. Button icons are inline SVG (`.ico`); key hints are `<kbd>`, hidden on touch devices and below 480px.

**Spaced repetition.** On a mistake: `need = 3`, `due = t + 4..6`. On a correct answer to a card under review: `need--` and the gap is multiplied by 1.8. Each turn picks the most overdue card (`due <= t`) first, otherwise a random one.

## Checks

Data and engine (Node, no dependencies):

```bash
node -e '
const h=require("fs").readFileSync("index.html","utf8");
const js=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("\n");
const X=new Function(js.slice(0,js.indexOf("// irregular table"))+";return {REGULAR,IRR,RU,TENSES,form};")();
const exp={"tener|sp|3":"tengamos","dormir|sp|3":"durmamos","jugar|sp|0":"juegue","ser|si|3":"fuéramos",
 "decir|impa|1":"di","ir|impa|4":"id","oír|fut|0":"oiré","hacer|perf|0":"he hecho","pedir|pret|5":"pidieron"};
const bad=[];
for(const [k,v] of Object.entries(exp)){const [a,b,c]=k.split("|");const r=X.form(a,b,+c);if(r!==v)bad.push(k+": "+r+" ≠ "+v);}
for(const v of X.REGULAR.concat(Object.keys(X.IRR))){
  if(!X.RU[v]||X.RU[v][1].split(" ").length!==6||X.RU[v][2].length!==2) bad.push("RU "+v);
  for(const t of X.TENSES) for(let p=0;p<6;p++){const r=X.form(v,t.k,p); if(r==null&&!(t.k==="impa"&&p===0)) bad.push("null "+v+" "+t.k+" "+p);}
}
new Function(js); console.log(bad.length?bad:"OK");'
```

In a browser: open `index.html` at desktop width and at ~400px. Check that Enter and the button work, that the header buttons open the dialog (and Esc / ✕ / backdrop close it), that the checkboxes switch tenses, and that the last checked tense cannot be unchecked.

## Deploy

Settings → Pages → Deploy from a branch → `main` / root. The site is served at `https://<user>.github.io/verbos/`.
