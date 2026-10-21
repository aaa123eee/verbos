import { describe, it, expect } from "vitest";
import { wrapWordsHtml, wordButton } from "../../src/lib/words-html.js";
import { randomTask } from "../../src/lib/es/tiempos.js";

describe("wrapWordsHtml", () => {
  it("wraps every word of the sentence and of the objects, not the gap, not entities, not other markup", () => {
    const h = wrapWordsHtml('<b>x</b><span class="sent">Ya tú <span class="gap">tu</span> (<i>comer</i>)&nbsp;pan.</span>dar<span class="obj">el libro · a Ana</span>');
    expect(h).toBe('<b>x</b><span class="sent">' + wordButton("Ya") + " " + wordButton("tú") + ' <span class="gap">tu</span> (<i>' + wordButton("comer") + "</i>)&nbsp;" + wordButton("pan") + '.</span>dar<span class="obj">' + ["el", "libro"].map(wordButton).join(" ") + " · " + ["a", "Ana"].map(wordButton).join(" ") + "</span>");
  });
  it("keeps the text of every task sentence", () => {
    const text = (h) => h.replace(/<[^>]+>/g, "");
    for (let i = 0; i < 300; i++) { const t = randomTask({ groups: ["past", "fut", "subj", "imp"], vos: true }); expect(text(wrapWordsHtml(t.main))).toBe(text(t.main)); }
  });
});
