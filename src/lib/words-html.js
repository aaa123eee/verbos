// Every word of a task sentence (.sent) or of the objects (.obj) as a button that shows its translation (word-pop.js);
// the gap (.gap) is not a word. Pure string work, so the first task drawn at build time gets the same markup as the
// script, and the page doesn't move when the script takes over.
const WORD = /(&[#\w]+;)|([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/g;
export const wordButton = (w) => '<button type="button" class="w" tabindex="-1" title="Перевод">' + w + "</button>";
export function wrapWordsHtml(html) {
  // a stack of the open elements: is each one a word box (.sent / .obj) or a gap (.gap)
  const stack = [];
  let box = 0, gap = 0;
  return html.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, text) => {
    if (tag) {
      if (tag.startsWith("</")) { const t = stack.pop(); if (t === "box") box--; if (t === "gap") gap--; }
      else if (!tag.endsWith("/>")) {
        const cls = (tag.match(/class="([^"]*)"/) || [])[1]?.split(/\s+/) || [];
        const t = cls.includes("gap") ? "gap" : cls.includes("sent") || cls.includes("obj") ? "box" : "";
        stack.push(t); if (t === "box") box++; if (t === "gap") gap++;
      }
      return tag;
    }
    return box && !gap ? text.replace(WORD, (x, ent, w) => (ent ? ent : wordButton(w))) : text;
  });
}
