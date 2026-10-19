# Conjugación española

**Live: https://aaa123eee.github.io/verbos/**

A Spanish verb conjugation trainer for Russian speakers. You see a verb, a person and a tense, and you type the form without hints. If you get it wrong, the page shows where the mistake is, which rule applies, and how the form is built step by step from the infinitive. Wrong answers come back a few questions later until you get them right three times. A second mistake in the same verb and tense makes you type out that whole tense from memory.

- All 18 tenses across indicativo, subjuntivo and imperativo, including the negative imperative and the literary ones (pretérito anterior, futuro de subjuntivo), picked with checkboxes. The -se form of the imperfect subjunctive counts too.
- 279 frequent verbs in four levels, regular and irregular.
- Prompts in Spanish (`yo · hablar`) or Russian (`я говорю`).
- Optional hints: the rule for this form, whether it's regular, the endings, or the next letter.
- A cheat sheet of endings and rules, and a verb search that finds a verb by its infinitive, any of its Russian meanings, a Russian form (`сказал` → decir) or any Spanish form (`tuve` → tener), and shows all its meanings and tenses.
- Progress is stored only in your browser. No account, no server.

More trainers on the same site:

- **Местоимения и герундий** (`/verbos/pronombres/`): object pronouns (*me lo da, dámelo, se lo doy*), reflexive verbs (*me levanto, levántate, no te levantes*) and the gerund (*estoy hablando, estoy duchándome*), with the accent rules for attached pronouns.

Built with [Astro](https://astro.build) into a static site; every push to `main` is tested and deployed to GitHub Pages by GitHub Actions.

```bash
npm install
npm run dev     # http://localhost:4321/verbos/
npm run check   # unit tests, build, browser tests
```
