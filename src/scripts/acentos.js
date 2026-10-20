// Accents page on the shared trainer kit.
import { createTrainer } from "../lib/trainer-kit.js";
import { randomTask, fromKey, allowed } from "../lib/es/acentos.js";

createTrainer({
  id: "acentos",
  next: (s) => randomTask({ kinds: s.kinds, top: s.top }),
  fromKey,
  allowed: (k, s) => allowed(k, s),
});
