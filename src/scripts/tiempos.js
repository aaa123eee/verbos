// Tense page: which tense does the sentence need — on the shared trainer kit.
import { createTrainer } from "../lib/trainer-kit.js";
import { randomTask, fromKey, FRAMES } from "../lib/es/tiempos.js";

createTrainer({
  id: "tiempos",
  next: (s) => randomTask({ groups: s.groups, vos: s.vos }),
  fromKey,
  // a task from the review list comes back only if the current settings still include it
  allowed: (k, s) => { const [f, , p] = k.split("|"); return !!FRAMES[f] && s.groups.includes(FRAMES[f].g) && (s.vos || +p !== 4); },
});
