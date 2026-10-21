// Feedback and the wine button: where messages go, how to send the author a glass of wine, and the text of a message.
// Empty values hide their option. Pure (no DOM), so tests import it directly.

// Messages go to a Telegram bot: the page posts straight to api.telegram.org (it allows any origin), no server needed.
// The token is visible in the page: at worst someone spams the bot, and @BotFather can revoke it.
// The token comes from the build environment (GitHub secret PUBLIC_TG_TOKEN, a local .env), so it stays out of git;
// the chat is the author's (PUBLIC_TG_CHAT overrides it). When Telegram isn't set or the request fails, the same text opens in the mail app (mailto:).
const env = import.meta.env || {}; // undefined when Node imports this file directly (Playwright specs)
export const CONTACT = {
  tg: { token: env.PUBLIC_TG_TOKEN || "", chat: env.PUBLIC_TG_CHAT || "83427281" },
  email: "anthony.efanov@gmail.com",
};

// sbp.url: a bank's SBP link: a button on phones (opens the bank), a QR code (drawn at build time) on wider screens;
// without it, the phone and the bank are shown with «copy».
// bizum: a Spanish phone number (Bizum has no links). crypto: [{ name: "USDT", net: "TRC-20", addr: "…" }], each with a QR of the address.
export const WINE = {
  sbp: { url: "https://t.tb.ru/c2c-qr-choose-bank?requisiteNumber=+79992143299&bankCode=100000000004", phone: "+7 999 214-32-99", bank: "Т-Банк" },
  bizum: "+34 662 555 607",
  revolut: "https://revolut.me/anthonyefanov", // a revolut.me link: a button (opens the app) and a QR
  crypto: [{ name: "EVM", net: "ETH, USDT, USDC · Ethereum, BNB Chain, Polygon, Arbitrum, Base", addr: "0xf861D168849F1443CD1a3FfC8C473C8321CA6D8d" }],
};
export const hasWine = (w = WINE) => !!(w.sbp.url || w.sbp.phone || w.bizum || w.revolut || w.crypto.length);
export const hasSend = (c = CONTACT) => !!((c.tg.token && c.tg.chat) || c.email);

export const TG_MAX = 4096; // Telegram's limit for one message
const VAL_MAX = 900;        // one context line

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const flat = (s) => String(s ?? "").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();

// ctx: [[label, value], …] — what was on the screen when the learner opened the report; empty values are skipped.
export function contextText(ctx) {
  return ctx.map(([k, v]) => [k, flat(v)]).filter(([, v]) => v).map(([k, v]) => k + ": " + clip(v, VAL_MAX)).join("\n");
}

// The whole message: kind, the learner's text, how to answer, then the context. Fits max (the text is cut last).
export function message({ kind, text, contact, ctx = [] }, max = TG_MAX) {
  const head = kind === "bug" ? "🐞 Ошибка" : "💬 Отзыв";
  const tail = [contact && "Ответить: " + flat(contact), ctx.length && "— — —\n" + contextText(ctx)].filter(Boolean).join("\n\n");
  const room = Math.max(200, max - head.length - tail.length - 4);
  const msg = [head, clip(flat(text), room) || "(без комментария)", tail].filter(Boolean).join("\n\n");
  return clip(msg, max);
}

export const tgUrl = (c = CONTACT) => "https://api.telegram.org/bot" + c.tg.token + "/sendMessage";
// mailto: bodies over ~1800 characters are cut by some mail apps
export const mailUrl = (msg, kind, c = CONTACT) =>
  "mailto:" + c.email + "?subject=" + encodeURIComponent("Verbos: " + (kind === "bug" ? "ошибка" : "отзыв")) + "&body=" + encodeURIComponent(clip(msg, 1800));
