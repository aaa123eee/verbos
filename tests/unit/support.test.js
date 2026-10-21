import { describe, it, expect } from "vitest";
import { message, contextText, hasWine, mailUrl, TG_MAX } from "../../src/lib/support.js";

const ctx = [["страница", "/verbos/ — Conjugación"], ["задание", "PRESENTE  настоящее\n  yo · hablar\nразговаривать"], ["ключ", ""], ["ответ", "«hablé»"]];

describe("feedback message", () => {
  it("puts the kind, the text, the contact and the context in order, skipping empty lines", () => {
    const m = message({ kind: "bug", text: " тут верно и hablo ", contact: "@me", ctx });
    expect(m.split("\n\n")).toEqual(["🐞 Ошибка", "тут верно и hablo", "Ответить: @me", "— — —\n" + contextText(ctx)]);
    expect(contextText(ctx)).toBe("страница: /verbos/ — Conjugación\nзадание: PRESENTE настоящее\nyo · hablar\nразговаривать\nответ: «hablé»");
  });
  it("sends a report without a comment and feedback without context", () => {
    expect(message({ kind: "bug", text: "", ctx })).toContain("(без комментария)");
    expect(message({ kind: "idea", text: "спасибо" })).toBe("💬 Отзыв\n\nспасибо");
  });
  it("fits Telegram's limit, keeping the context and cutting the text", () => {
    const m = message({ kind: "bug", text: "а".repeat(10000), ctx });
    expect(m.length).toBeLessThanOrEqual(TG_MAX);
    expect(m).toContain("ответ: «hablé»");
  });
  it("builds a mailto link and knows when there is nothing to pay with", () => {
    expect(mailUrl("hola", "idea", { email: "a@b.c" })).toBe("mailto:a@b.c?subject=Verbos%3A%20%D0%BE%D1%82%D0%B7%D1%8B%D0%B2&body=hola");
    expect(hasWine({ sbp: { url: "", phone: "" }, bizum: "", crypto: [] })).toBe(false);
    expect(hasWine({ sbp: { url: "", phone: "" }, bizum: "+34 600", crypto: [] })).toBe(true);
  });
});
