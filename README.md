# Conjugación española

**Live: https://aaa123eee.github.io/verbos/**

A Spanish verb conjugation trainer for Russian speakers. You see a verb, a person and a tense, and you type the form without hints. If you get it wrong, the page shows where the mistake is, which rule applies, and how the form is built step by step from the infinitive. Wrong answers come back a few questions later until you get them right three times. A second mistake in the same verb and tense makes you type out that whole tense from memory.

- All 18 tenses across indicativo, subjuntivo and imperativo, including the negative imperative and the literary ones (pretérito anterior, futuro de subjuntivo), picked with checkboxes. The -se form of the imperfect subjunctive counts too.
- 286 frequent verbs in four levels, regular and irregular, and a fifth level with every other Spanish verb of the Wiktionary (~8,400), each form checked against its Wiktionary table; the search and the verb card cover them all.
- Prompts in Spanish (`yo · hablar`) or Russian (`я говорю`).
- Optional hints: the rule for this form, whether it's regular, the endings, or the next letter.
- A cheat sheet of endings and rules, and a verb search that finds a verb by its infinitive, any of its Russian meanings, a Russian form (`сказал` → decir) or any Spanish form (`tuve` → tener), and shows all its meanings and tenses.
- Progress is stored only in your browser. No account, no server.

More trainers on the same site:

- **Какое время?** (`/verbos/tiempos/`): which tense a sentence needs — a marker (*ayer, mientras, esta semana, ojalá, si…, cuando* about the future) and a gap: *Ayer yo ___ (comprar) el pan* → *compré*. Past tenses, future and conditional, subjuntivo or indicativo, imperative; a mistake explains the marker and how the form is built.
- **Местоимения и герундий** (`/verbos/pronombres/`): object pronouns (*me lo da, dámelo, se lo doy*), reflexive verbs (*me levanto, levántate, no te levantes*) and the gerund (*estoy hablando, estoy duchándome*), with the accent rules for attached pronouns.
- **Ударения** (`/verbos/acentos/`): write a word with or without its tilde (*cancion → canción*, *examen*), verb forms (*hablo / habló*), plurals (*joven → jóvenes*), and the tilde that tells words apart (*tú / tu, qué / que*); every mistake shows the syllables and the rule. Words and plurals come from a dictionary of ~6,500 frequent words.
- **Слова** (`/verbos/palabras/`): a Spanish ⇄ Russian dictionary of ~69,000 words and phrases with every translation found, which recognises forms (*fui* → ir, ser) and saves what you look up; saved words come back for review by days (recall the meaning, write the word, listen). MyMemory is asked only for words the dictionary lacks, on request.
- **Род и согласование** (`/verbos/genero/`): the article of every dictionary noun (*el problema, la mano, el agua*, plural *los hoteles*) and the four forms of every adjective (*blanco → blancas, inglés → inglesa*); a mistake says whether the word follows the ending rule or is an exception.

The verbs of level 5 (`src/data/verbs.json`) come from the Spanish verbs of the English Wiktionary (kaikki.org). The dictionary (`src/data/dict.json`) is built from the Russian Wiktionary and the Spanish nouns and adjectives of the English Wiktionary (both via kaikki.org) and the FrequencyWords lists from OpenSubtitles, both CC BY-SA; see `src/data/README.md`.

Built with [Astro](https://astro.build) into a static site; every push to `main` is tested and deployed to GitHub Pages by GitHub Actions.

```bash
npm install
npm run dev     # http://localhost:4321/verbos/
npm run check   # unit tests, build, browser tests
```
