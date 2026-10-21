# Verbos

A Spanish verb conjugation trainer. The user types the verb form; optional hints sit behind buttons, and mistakes come back later (a simple spaced-repetition scheme driven by a turn counter). A cheat sheet of endings and rules, plus a verb search, opens in a dialog from the header buttons.

UI language is Russian; verb content is Spanish. Built with Astro into a static site and deployed to GitHub Pages by GitHub Actions on every push to `main`.

The conjugation trainer is the main page (`/verbos/`) and must stay there. Further trainers become subpages (`/verbos/<name>/`).

## Layout

- `src/pages/index.astro` — the conjugation trainer page (markup). New trainers go to `src/pages/<name>.astro`.
- `src/layouts/Base.astro` — shared `<head>`: viewport, favicon, fonts, base styles.
- `src/styles/conjugacion.css` — tokens, themes and all styles of the trainer.
- `src/lib/conjugation.js` — verb data, the conjugation engine, explanations and hints. Pure (no DOM), so tests import it directly.
- `src/scripts/conjugacion.js` — the page logic: state, check/undo, drill, settings, dialog, search. Bundled by Astro as a module.
- `tests/unit/` — Vitest: engine, data, explanations, hints, color tokens.
- `tests/e2e/` — Playwright against the production build. `cases/*.js` run inside the page module through the e2e hook (`?e2e` → `window.__verbos(src)` evals in module scope) and report `ok …` / `FAIL …` lines via `document.title`.
- `src/components/TrainerPage.astro` — page shell for every new trainer (top bar, menu, settings panel, card, hints, about footer, rules dialog). Slots: `settings`, `about`, `rules`.
- `src/components/TrainerNav.astro` + `src/lib/trainers.js` — the menu of trainers under the top bar. Add every new page to `TRAINERS`.
- `src/lib/trainer-kit.js` — the runtime behind `TrainerPage`: checking, feedback, undo, hints, review, progress, settings, drawer.
- `src/lib/es/` — Spanish modules: `syllables.js` (syllables, stress, `attach` for clitics), `gerund.js`, `pronombres.js` (tasks of the pronouns page).
- `src/pages/pronombres.astro` + `src/scripts/pronombres.js` — pronouns, reflexive verbs, gerund (`/verbos/pronombres/`).
- `src/pages/acentos.astro` + `src/scripts/acentos.js` — written accents (`/verbos/acentos/`); rules and tasks in `src/lib/es/acentos.js`, word lists in `acentos-data.js`.
- `src/pages/palabras.astro` + `src/scripts/palabras.js` — the words page (`/verbos/palabras/`): dictionary lookup and the day-based review of saved words; logic in `src/lib/es/palabras.js`. Its own markup and script (not `TrainerPage`), the same styles.
- `src/lib/lookup-ui.js` — the dictionary lookup widget (`createLookup({input, res, store, …})`: cards, rows, conjugation inside a verb card, saving by searching, MyMemory), `loadDict` and `txHtml`. The words page shows it on the page; `src/components/SearchBox.astro` + `src/scripts/find.js` put it into the top bar of every other page (a field-like button or `/` opens a dialog; the first verb card opens its conjugation by itself). `find.js` reads and writes the words state (IndexedDB `words`) on every change, so words found on any page come back in the words page review; the words page re-reads that state when its tab becomes visible again and writes before it is hidden.
- `src/lib/words-store.js` — "my words" outside the words page (the top bar search, words clicked in a task): reads and writes the words state on every change. `src/lib/word-pop.js` — a word clicked in a task: every word of `.sent` / `.obj` in the prompt is a `button.w` (`wrapWordsHtml` in `src/lib/words-html.js`, used by the kit and by `TrainerPage` for the build-time first task, so the markup is identical and nothing moves; not inside `.gap`; `tabindex=-1` and no focus on mousedown, so the answer field keeps the focus); a click loads `word-pop.js`, which shows a small card under the word (the word or the most frequent word it is a form of, up to 4 meanings, the voice, «подробнее» opens the top bar search on it) and saves the word to "my words" («убрать» undoes it for the visit). Mark the asked word as `.gap` in a new task sentence so it doesn't give the answer away.
- `src/lib/voice.js` — the voice of every page (`speak`, `canSpeak`, `SPK`). `src/scripts/say.js` (included by `Base.astro`) puts one speaker button next to the Spanish form under the pointer in any table (`table .f`, `.conj .f`, `.vocab .f`; on touch — the tapped form); the button is made on the first hover and the voice is fetched only when it is pressed.
- `src/components/Support.astro` + `src/scripts/support.js` + `src/lib/support.js` — above the trainer card on every page (under it, the card's growth after loading would move it): «Ошибка в задании?» and «Отзыв» open `dialog#report`; the wine button at the right end of the top bar (`WineButton.astro`, in every header) opens `dialog#wine` (СБП and Revolut: a link button, plus a QR on wider screens; crypto: copy plus a QR of the address; Bizum has no links: copy; the QRs are drawn at build time by the `qrcode` dev dependency). A report reads what is on the screen when the dialog opens (prompt, `data-key` of `.trainer`, the answer, drill rows, hints, `#fb`, the words query, the settings in `#side`, browser, version) and shows it before sending; feedback sends only the text and the page. Addresses live in `CONTACT` / `WINE` of `lib/support.js`; an empty value hides its option. The bot token comes from the build env `PUBLIC_TG_TOKEN` (a GitHub secret in `deploy.yml`, a local `.env`), never from git; `PUBLIC_TG_CHAT` can override the chat.
- `src/pages/genero.astro` + `src/scripts/genero.js` — gender and agreement (`/verbos/genero/`); tasks and rules in `src/lib/es/genero.js`.
- `src/pages/tiempos.astro` + `src/scripts/tiempos.js` — which tense (`/verbos/tiempos/`); frames and tasks in `src/lib/es/tiempos.js`.
- `src/data/verbs.json` — every other Spanish verb (~8.4k, level 5 of the engine), built by `npm run build:verbs` (`scripts/build-verbs.mjs`, downloads the Spanish verbs of the English Wiktionary into `.cache/`, reads meanings from `lookup.json`). Fetched by URL on the main page and with the dictionary of the lookup (`loadDict`), added with `addVerbs`.
- `src/data/dict.json` — the shared dictionary (~6.5k frequent words: meanings, part of speech, gender, noun plurals, adjective forms), built by `npm run build:dict` (`scripts/build-dict.mjs`, downloads into `.cache/`); read through `src/lib/es/lexicon.js` (`LEX`, `entry`, `gloss`). Meanings come from the Russian Wiktionary; gender gaps, common gender, plurals and adjective forms from the English Wiktionary (which also wins a plain m / f conflict).
- `src/data/lookup.json` — the full dictionary of the words page (~69k Spanish words and phrases, ~6 MB, fetched by URL only on that page): `[word, pos, gender, meanings, more translations]`. Meanings are the Russian Wiktionary entry (curated `MEAN` first for engine verbs); more translations come from the Spanish translations of Russian entries (Russian Wiktionary, read backwards) and from English Wiktionary translation tables (Spanish and Russian words of one English sense), best supported first, obscene ones last (`OBSCENE`, marked «груб.» on the page and left out of the review). Built by the same `npm run build:dict` (it streams ~5 GB of extracts from `.cache/`). Sources and license (CC BY-SA 4.0) in `src/data/README.md`.
- `.github/workflows/deploy.yml` — test, build, publish.

Plain JavaScript modules, no UI framework.

External resources are allowed when they are free and their limits don't get in the learner's way (no paid plans, no API keys, no small quotas); each must fail softly. Used now: Google Fonts (Archivo Black, IBM Plex Sans, IBM Plex Mono), each with a system fallback; on the words page the MyMemory translation API (`api.mymemory.translated.net`), called only when the learner asks (Enter on a word that isn't in the dictionary, or the «через MyMemory» link) and with only that query; the voice of Google Translate (`translate.google.com/translate_tts`, `speak` in `voice.js`), one request per press of a speaker button with only that word. It answers only requests without a referrer, so `Base.astro` sets `<meta name="referrer" content="no-referrer">`; if it fails or doesn't start within 4 s, the Spanish voice of speechSynthesis speaks instead, and for the rest of the visit right away. Reports and feedback go to the Telegram Bot API (`api.telegram.org/bot<token>/sendMessage`, a plain form POST, no preflight) only when the learner presses «Отправить»; if it fails, `mailto:` with the same text. e2e tests stub external services with `page.route` and never call them.

## Hard constraints

- **Only served from GitHub Pages**, never embedded in an iframe.
- **No `<form>`.** Enter is handled via `keydown` on `#ans`, and every button is `type="button"` with a `click` handler, so nothing submits or reloads the page.
- **Browser storage only.** No backend, no cloud database.
- **Storage may be unavailable** (private mode, blocked site data). Wrap every `localStorage` / `indexedDB` access in `try/catch`; the page must work without it.
- **Colors only via tokens** in `:root`. Dark theme redefines the same tokens in both `@media (prefers-color-scheme: dark)` and `:root[data-theme="dark"]`; keep the two blocks in sync.
- **Must work at ~400px width** with no horizontal page scroll. Wide tables live inside `.tbl` (`overflow-x: auto`).

## Trainer kit (new trainers)

The conjugation page has its own script (it predates the kit). Every other trainer is `TrainerPage.astro` + a small script that calls

```js
createTrainer({ id, next(settings) → task, fromKey(key) → task, allowed(key, settings) → bool })
```

A task is `{ key, tc, tag, when, main, sub, answers, why, rule, label }`: `key` rebuilds the task (mistakes come back by key), `tc` is the tense color key (`--t-<tc>`), `main` is HTML, `answers[0]` is the main answer and the rest are also accepted, `why` are explanation lines (HTML) shown after a mistake, `rule` is the «Правило» hint (must not contain the answer), `label` names the task in the review list.

The kit reads settings from every named `<input>` inside `#side`: a checkbox with a `value` belongs to a group (array, at least one stays checked), a checkbox without a value is a boolean (`strict` switches accent strictness), radios give one value. Settings are stored in `localStorage` `verbos-<id>-settings-v1`; progress goes to the same IndexedDB as the conjugation page under the key `progress:<id>`. Undo, hints and review work exactly like on the conjugation page. `?e2e` exposes `window.__kit(src)`, which evals inside `createTrainer`.

**Adding a trainer:** a module in `src/lib/es/` with `randomTask` / `fromKey` and unit tests; `src/pages/<name>.astro` using `TrainerPage`; `src/scripts/<name>.js` calling `createTrainer`; an entry in `TRAINERS`; a Playwright spec.

**Pronouns page.** Kinds: object pronouns (`obj`: verb + direct and/or indirect object), reflexive verbs (`refl`) and the gerund (`ger`, estar + gerundio). Data in `src/lib/es/pronombres-data.js` covers the whole engine: `OBJ` — every transitive verb (~210) with typical objects and an `io` flag (an indirect object only where natural); an object is `article noun` or `phrase=pronoun` for personal a / el agua. `REFL` — every verb with a common se use (~75) and the Russian meaning of that use. The gerund uses all verbs. A test checks that random tasks reach every listed verb; a new verb in the engine should get its `OBJ` / `REFL` entry when it applies. Contexts: presente, pretérito, imperativo, imperativo negativo, + infinitivo (ir a / querer / tener que / poder), estar + gerundio. With an infinitive or gerund both orders are accepted (`quiero dártelo` / `te lo quiero dar`). `attach` keeps the stressed syllable and adds or drops the written accent; nosotros loses -s before nos / se, vosotros loses -d before os (-ir → -íos, irse → idos).

**Accents page.** Kinds: `word` (every dictionary word that follows the rules, `ACC_WORDS`, shown without tildes; the gloss tells homographs apart), `verb` (a one-word form from the engine, with verb · tense · person), `plural` (every dictionary noun with a regular plural, `PL_NOUNS`; stress stays on the same syllable, `PLURAL_SHIFT` lists the few shifts; -í / -ú also accept -es), `diacr` (a `DIACRITIC` sentence with a gap; `DIACRITIC_WHY` explains the pair). `analyze` / `spellByRules` / `explainWord` implement the rules: aguda on a vowel / n / s, llana on any other consonant, esdrújula always, an accented i / u next to a / e / o always (h doesn't separate them), two weak vowels are a diphthong, one syllable — no tilde except the diacritic ones (`MONO_DIACRITIC`), -mente keeps the adjective's tilde. Setting `top` limits words and plurals to the 1000 / 3000 most frequent or all. Tests check that every dictionary word (except a dozen known diacritic words and old spellings like sólo, guión) and every one-word engine form is spelled the way the rules say.

**Gender page.** Kinds: `art` (every dictionary noun with a gender, `NOUNS`: type it with el / la), `artpl` (los / las + the plural, `PL_ART`; Wiktionary's plural, else the accents rule), `adj` (every adjective with its forms, `ADJS`: feminine, masculine plural, feminine plural). Common gender (`c`) and both genders (`mf`) accept either article; a feminine noun on a stressed a- / ha- takes el (`elFem`); plural-only nouns (`only`) are asked with los / las. `explainGender` says whether the ending rule (`ENDINGS`) fits or the word is an exception; `explainAdj` names the adjective's class, and a test checks that `adjByRule` agrees with Wiktionary's forms except marrón, cortés, naranja and the -í plurals. Setting `top` as on the accents page.

**Words page.** Lookup: a Spanish query shows the word, the words it is a form of (every form of every verb, level 5 included, noun plurals and adjective forms from `dict.json`) and words starting with it; a Cyrillic query lists words whose meanings contain every query word (a whole meaning equal to the query first, single words before phrases, a dozen rows, more on request). The search itself saves the word (`autoSave`): the exact Spanish word or the first word it is a form of, for a Cyrillic query the first word with a meaning equal to the query; a refined query (casa → casado) or a click on another row replaces the word the search saved, as long as it hasn't been reviewed; «убрать» removes it and the search won't save it again in this visit. While the query isn't empty the review card is hidden (Esc or «к повторению» clears the query). Every verb opens its conjugation inside its card (a level-5 verb the dictionary lacks gets a card from its engine meanings, `verbEntry`) («спряжение ↓», the searched form highlighted); the page stays. Not found → Enter asks MyMemory; its translation can be saved as a card with its own meanings (`m`). Review: cards `{id: "word|pos", add, due, ivl, ease, reps, lapses, last, m?}` by days (`today()` is the local day): right → 1 day, 3 days, then × ease; wrong → today again, no sooner than `GAP` (4) other words later. With too few words in the session, words that aren't due yet (not seen today, nearest date first) are mixed in as a review ahead — a right answer keeps their date — and then, with the frequency dictionary on, new words; `pickNext` also never repeats one of the last `GAP` answered words while another is available. Words missed today go after the ones not yet seen when the queue is rebuilt. The session is due cards, then new ones up to «новых в день» (saved words first, then the frequency dictionary from `freqAt`); «Ещё 5 новых» raises today's limit. Translations (`txHtml`): the main meanings large and numbered, the other translations as chips. Modes (`modeFor`): see (recall the meaning, Enter shows it right under the word in `#pMean`, Enter = помню, 1 = не помню, moves on at once), write (type the Spanish word from up to 3 meanings; the article is optional; another word with one of those meanings counts, `synonym`), listen (the voice of `speak`; skipped when neither Google nor a Spanish system voice is available, `canSpeak`). The voice speaks only when the learner presses a speaker button, never by itself. Esc undoes the last answer and asks it again. State in IndexedDB key `words` (`{cards, days: {day: {n, ok, new, extra}}, freqAt}`), settings in `verbos-palabras-settings-v1`; export / import as a JSON file (import keeps the newer card). The main page opens a verb card from `#verbo=<verb>`. Loading doesn't move anything: the markup already holds the stats labels with empty numbers, the card with its answer row (`.off` keeps the place in see mode) and one-line texts; `render` fills nothing until the saved state is read (`loaded`), and an e2e test compares the layout before and after.

**No layout jumps on load.** Every page looks the same before and after its script and its saved data: the markup holds the stats labels with empty numbers (`.stats.loading`, the numbers are filled only once the saved progress is read — `loaded`), `.mini` keeps its place (`data-empty`), the primary button already has its label, the tense checkboxes of the main page are rendered at build time (`tensesHtml`), and the review list has a fixed height. The card waits for the saved progress (`start()`, at most 1.5 s) while `.trainer.loading` hides its text. Kit pages draw a task picked at build time (`first` prop of `TrainerPage`, `data-first`) and the kit starts with it; the main page takes a first task that fits the room the placeholder kept. A page answered on before is listed in `localStorage` `verbos-seen`, and an inline script in `Base.astro` hides the first-visit hint before the first paint. `tests/e2e/layout.spec.js` checks with the layout-shift API that nothing moves on every page, at 1280 and 400 px, on a first visit and with saved progress (web fonts blocked there).

**Tense page.** A task is a sentence with a marker and a gap (`FR` in `src/lib/es/tiempos.js`: `{id, g, t, es, p?, alt?, ir?, obj?, why, altWhy?}`); the learner types the verb in the tense the marker asks for. Groups: past (indefinido / imperfecto / perfecto / pluscuamperfecto), present-future-conditional, subjuntivo or indicativo, imperative. Verbs: every `OBJ` verb with one of its objects, every `REFL` verb with its pronoun before the gap (not in the affirmative imperative). Other right answers are accepted (`alt`: pretérito for perfecto, presente for mañana, hubiera for habría; `ir`: ir a + infinitivo; the -se forms). The «Правило» hint (`hintOf`) is the reason up to its colon: it explains the marker and never names the tense; a test checks every frame × person × verb for that and for the answer. Keys: `frame|verb|person|object index or r`.

**Full word sets.** Every exercise uses the complete set it applies to: all engine verbs, all marked transitive / reflexive verbs, all dictionary words or nouns. Don't add hand-picked samples; extend the data for every item instead.

## Data model (`src/lib/conjugation.js`)

| What | Where | Format |
|---|---|---|
| Regular endings (presente, pretérito) | `REG[ar\|er\|ir][pres\|pret]` | array of 6 endings |
| Regular verbs | `REGULAR` | array of infinitives |
| Verbs with any irregularity | `IRR[verb] = {pres, pret}` | 6 space-separated forms each |
| Russian translations | `RU[verb] = [infinitive, "6 present forms", [past sg, past pl], hint?]` | `RU[v][0]` is the short gloss shown in prompts; the hint disambiguates pairs like ser/estar, decir |
| All meanings | `MEAN[verb] = "meaning; meaning; …"` | used by search and the verb card; every verb needs one |
| Verb set (level) | `TIER[verb] = 1\|2\|3\|4\|5` | 1 core, 2 frequent, 3 everyday, 4 extended, 5 every other verb (`verbs.json`) |
| Tenses | `TENSES` | `{k, mood, name, short?, ru, g}`; `g` is the family: `pres` / `past` / `fut` / `subj` / `imp`. Each tense's color is the token `--t-<k>` |

Persons are indices 0–5: yo, tú, él/ella/Ud., nosotros, vosotros, ellos/Uds. The imperatives (`impa`, `impn`) have no form for index 0 (`hasPerson`, `isImp`).

Levels 2–4 are added with `addTier(n, regularVerbs, {verb: [pres, pret]}, ruEntries)`. Level 4 (~200 verbs) was generated from patterns (stem changes, spelling, -zco, -ducir, -uir, g→j, prefixed tener/poner/venir/hacer/traer) and checked against reference forms.

"Irregular" in the UI filter means any verb in `IRR`: stem changes, spelling changes (busqué), i→y (leyó), not only truly irregular verbs.

## Conjugation engine

**Every other verb (level 5).** `addVerbs(rows)` registers the rows of `verbs.json` (`MORE`): a regular verb, a verb conjugated like a model verb of the engine with another beginning (`LIKE[v]`, `likeSpec`: the model's exception entries with v's beginning, `swap` adds the accent a one-syllable form needs once longer — ten → retén, vio → previó), or a verb with its own entries (`specOf`: presente / pretérito in `XIRR`, the others in the usual helper lists). `irr(v)` reads `IRR` and `XIRR`; code that means «the engine's own verbs» keeps using `REGULAR` + `IRR` (the other trainers, Russian prompts), `allVerbs()` is every verb. `scripts/build-verbs.mjs` keeps a verb only if `form()` then gives every form of its Wiktionary table, so the data and the engine can't drift: after changing the engine, rerun it. Level-5 verbs have no Russian forms (`isRuPrompt` is false: always Spanish prompts), `SE[v]` marks verbs used as -se, `DEFECTIVE[v]` verbs that lack persons (left out of the trainer). `explain` starts with «Спрягается как <model>» where the form isn't regular. The search and the words page index the forms of level-5 verbs by first letter, only when a query needs it.

Entry point: `form(verb, tenseKey, person)` returns a string or `null`.

- `pres`, `pret` → `basic()`: explicit forms from `IRR`, otherwise stem + `REG`.
- `imp` → stem + `IMPF`; exceptions in `IMPF_IRR` (ser, ir, ver).
- `fut`, `cond` → `(FUT_STEM[v] || infinitive)` + endings. Special stems live in `FUT_STEM`; oír → `oir`.
- Compound tenses (`perf plus ant futp condp spf spl fps`) → `HABER[t]` + `part(v)`. Irregular and accented participles live in `PART_IRR`.
- `sp` (present subjunctive) → yo presente minus `-o` + `SP_END`.
  - Whole-paradigm exceptions: `SP_OVR` (ser, estar, ir, saber, dar).
  - nosotros/vosotros of -ir stem-changers: `SP_NOS_IR` (sint-, durm-, prefir-, mur-).
  - nosotros/vosotros of -ar/-er stem-changers: infinitive stem, listed in `SP_NOS_INF`.
  - -car/-gar/-zar spelling: `spell()`.
- `si` (imperfect subjunctive) → ellos pretérito minus `-ron` + `-ra…`; nosotros gets an accent on the last vowel of the stem (`raForm(st, p, x)`).
- `fs` (future subjunctive) → the same with `-re…`. `ant`, `fs`, `fps` are literary; their `ru` says so and they are off by default.
- `altForm(v, t, p)` is a second accepted answer: the -se form for `si` and `hubiese` for `spl`. The check and the drill accept it; the feedback names the -ra form.
- `impa` (affirmative imperative) → tú: él presente or `IMP_TU`; Ud./Uds./nosotros: present subjunctive (ir → `vamos`); vosotros: infinitive minus `-r` + `d`. Prefixed verbs have accented tú forms in `IMP_TU` (mantén, supón); `IMP_ROOT` names the root for the explanation.
- `impn` (negative imperative) → `no` + present subjunctive for every person; the answer includes `no`.

**Russian prompts and synonyms.** Many verbs share a Russian phrase (начинать = empezar / comenzar). In a Russian prompt `synonymFor` accepts any verb whose `ruPhrase` is identical, and the feedback names the verb that was asked.

**Explanations.** `explain(verb, tenseKey, person)` returns HTML lines with the rule and the steps from the infinitive to the form. It follows the same branches and helper lists as `form()` (`whyBasic` for presente/pretérito, which classifies the irregularity by comparing with the regular form; `whySp` for the subjunctive). It is shown in the feedback after a mistake, followed by `tenseHtml`: the whole tense for that verb, with the asked person highlighted and the other forms that differ from `regularForm()` colored. When you change the engine or add a helper list, update `explain` too. Check that every form gets a non-empty explanation that mentions each word of the form.

**Page layout.** A top bar (title, cheat-sheet buttons, a «Что это?» link to `#about`), the trainer card in `main`, and a settings panel `aside#side` holding tenses, filters, progress and the resets. At 900px and wider the panel is a sticky column on the right. Below 900px it is a drawer that slides in from the right, opened by `#cfgOpen`; while it is open the rest of the page is `inert`, and Esc, ✕ or the scrim close it. The long description lives in `footer#about` at the end of the page. The look is poster-like: ink borders (`--edge`), sharp corners (`--r`) and hard offset shadows. Each tense has its own color token `--t-<k>`. Families share related hues, and compound tenses use a deeper shade. Red and green are reserved for wrong and right answers, so tense colors never use them. The one exception is the Spanish flag (`--flag-r`, `--flag-y`, the same in both themes), used only for the logo plate. JS sets `--tc` to the current tense's token on the card (shadow, pill, primary button, input focus). The same color appears on the tense checkboxes in settings and on the verb-card tables; `--ts` is a tint of it made with `color-mix`.

**Cheat sheet and search.** The page shows only the trainer. The header buttons (`nav.tools`, `data-open`) open `<dialog id="sheet">` on one of its tab panels: `#regular`, `#irregular`, `#other`; the fourth tab, `#search`, is reached from inside the dialog or by `#verbo=` (the top bar search of `SearchBox` covers words and verbs on every page). Esc closes the dialog. The undo shortcut ignores Esc while the dialog is open. Search (`searchVerbs`) matches the infinitive or any conjugated form or participle (Spanish query), or — for a Cyrillic query — words of the gloss, of `MEAN` and of the Russian forms used in prompts (`ruIndex`, ё = е, every query word must start a word). With a query, results are rows showing every meaning, the matched ones bold (`meanHtml`). Forms are compared without accents, through an index built on first use. The verb card shows all tenses, and colors forms where `form() !== regularForm()`.

**Hints.** Buttons under the accent keys, available only before answering: «Правило» (`hintRule`, the rule for this verb and form), «Правильный?» (`hintRegular`, compares `form()` with `regularForm()`, which applies the plain rules with no exception lists), «Окончания» (`hintEndings`) and «Буква» (reveals the answer one letter at a time, up to length − 1). `kindBasic` classifies presente/pretérito forms for both `whyBasic` and `hintBasic`. Hints must never contain the answer, and must not name the verb, because in Russian-prompt mode the verb is part of the task. A correct answer given after any hint doesn't add to the streak, and the card goes into review with `need = 1`.

Russian prompts (`ruPhrase`) and full translations in feedback exist only for `pres` and `pret`. Other tenses always prompt in Spanish, and the feedback shows the infinitive's translation.

## Adding a verb

1. **Regular:** add it to the array of the right `addTier(...)` call (or to `REGULAR` for level 1) and add an `RU` entry.
2. **With irregularities:** add 6 presente and 6 pretérito forms to the `addTier` object and add an `RU` entry.
3. Check whether it belongs in the helper lists (and remove it from `verbs.json` by rerunning `npm run build:verbs`, which skips the engine's own verbs):
   - e→ie / o→ue stem change in -ar/-er → `SP_NOS_INF`;
   - e→ie / o→ue stem change in -ir → `SP_NOS_IR` (nosotros stem, e.g. `sint`). -ir verbs with e→i (pid-, sig-) need no entry: the yo stem is already correct;
   - special future stem → `FUT_STEM`;
   - irregular or accented participle → `PART_IRR`;
   - special tú imperative → `IMP_TU`;
   - fully irregular present subjunctive → `SP_OVR`;
   - irregular imperfecto → `IMPF_IRR`.
4. Cheat-sheet tables and the vocabulary list are generated from the data; don't edit them by hand.
5. Run the checks below and add a couple of reference forms for the new verb to the `ref` table in `tests/unit/engine.test.js`.

## Adding a tense

1. Add an object to `TENSES` with a unique `k` and suitable `mood` and `g`. Its checkbox appears automatically. Add a `--t-<k>` color in all three token blocks; it must not be red or green.
2. Add a `case` to `form()`.
3. If the tense lacks some person, extend `hasPerson` and `persLabel`.
4. Add an explanation block to the `#other` panel of the cheat sheet.

## Progress storage

- IndexedDB: database `conjugacion`, store `kv`, key `progress`. Shape: `{t, review, total, right, streak, miss?, drill?}`.
- `review` holds cards under review: key `verb|tense|person`, value `{need, gap, due}`.
- `localStorage`: `conj-tenses-v1` stores the selected tenses; `conj-settings-v1` stores the ids of the checked settings inputs (`SET_IDS`: verb type, level, prompt language, accents, vosotros). «Сбросить всё» removes both. `conj-trainer-v1` is the old progress format; it is migrated to IndexedDB on first load.
- Size is bounded: only state is stored, never a log of answers.

**Controls.** Enter / «Проверить» checks, then moves on. Esc / «Отменить» (only after an answer) restores `S` from an in-memory snapshot taken before the check and asks the same prompt again. Like a hint, an undo sets `undone` for this prompt: the next correct answer doesn't add to the streak, and the card goes into review with `need = 1`. «Сбросить прогресс» clears `S`; «Сбросить всё» also resets the tense selection and filters. Both resets need a second click within 3 s. Button icons are inline SVG (`.ico`); key hints are `<kbd>`, hidden on touch devices and below 480px.

**Drill.** `noteMiss` counts mistakes per verb+tense in `S.miss` (`{"verb|tense": {n, t}}`; entries older than `DRILL_WINDOW` = 40 turns are pruned). A second mistake sets `S.drill = "verb|tense"`, and the feedback says a drill is coming; undo cancels it, because it restores `S`. The next step runs `startDrill`, which shows one input per person (respecting `vos` and `hasPerson`) instead of the answer field and hints. Enter checks a row; a wrong row shows the form and clears, to be typed again. `show()` always resumes a pending `S.drill`, so neither a reload nor a settings change skips it. Drill rows don't count in the stats.

**Spaced repetition.** On a mistake: `need = 3`, `due = t + 4..6`. On a correct answer to a card under review: `need--` and the gap is multiplied by 1.8. Each turn picks the most overdue card (`due <= t`) first, otherwise a random one.

## Checks

```bash
npm test            # Vitest: conjugation (reference forms, completeness, explanations, hints, colors), syllables, gerund, pronoun tasks, accent rules and tasks
npm run build       # Astro → dist/
npm run test:e2e    # Playwright on `astro preview`: conjugation flows, pronouns page flows, 400px layout, menu
npm run check       # all three, the same as CI
```

Run `npm run check` before every release. To see the page: `npm run dev` (http://localhost:4321/verbos/). Also look at it at desktop width and at ~400px, in light and dark.

## Deploy

Settings → Pages → Source: **GitHub Actions**. `.github/workflows/deploy.yml` runs on every push to `main`: `npm ci`, unit tests, build, Playwright, then uploads `dist/` and deploys. A failed step publishes nothing. `astro.config.mjs` sets `base: "/verbos"`; the site is served at `https://aaa123eee.github.io/verbos/`.
