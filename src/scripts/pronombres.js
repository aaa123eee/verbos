// Pronouns page: object pronouns, reflexive verbs, the gerund — on the shared trainer kit.
import { createTrainer } from "../lib/trainer-kit.js";
import { randomTask, fromKey } from "../lib/es/pronombres.js";

createTrainer({
  id: "pronombres",
  next: (s) => randomTask({ types: s.types, ctxs: s.ctxs, vos: s.vos }),
  fromKey,
  // a task from the review list comes back only if the current settings still include it
  allowed: (k, s) => {
    const [type, , ctx, p] = k.split("|");
    return s.types.includes(type) && (type === "ger" || s.ctxs.includes(ctx)) && (s.vos || +p !== 4);
  },
});
