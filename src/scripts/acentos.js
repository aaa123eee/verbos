// Accents page on the shared trainer kit.
import { createTrainer } from "../lib/trainer-kit.js";
import { randomTask, fromKey } from "../lib/es/acentos.js";

createTrainer({
  id: "acentos",
  next: (s) => randomTask({ kinds: s.kinds }),
  fromKey,
  allowed: (k, s) => s.kinds.includes(k.split("|")[0]),
});
