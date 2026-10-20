// Gender page on the shared trainer kit: the article of every noun and the forms of every adjective.
import { createTrainer } from "../lib/trainer-kit.js";
import { randomTask, fromKey, allowed } from "../lib/es/genero.js";

createTrainer({
  id: "genero",
  next: (s) => randomTask({ kinds: s.kinds, top: s.top }),
  fromKey,
  allowed: (k, s) => allowed(k, s),
});
