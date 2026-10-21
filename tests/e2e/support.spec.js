import { test, expect } from "@playwright/test";
import { hasWine } from "../../src/lib/support.js";

// Telegram never gets real requests from tests: the stub keeps what the page sent
let sent;
test.beforeEach(async ({ page }) => {
  sent = [];
  await page.route("https://api.telegram.org/**", (r) => { sent.push(new URLSearchParams(r.request().postData() || "")); r.fulfill({ json: { ok: true }, headers: { "access-control-allow-origin": "*" } }); });
});

test("a report carries the task, the answer and what the trainer said", async ({ page }) => {
  await page.goto("");
  await page.locator(".trainer:not(.loading)").waitFor();
  const task = await page.locator("#pVerb").innerText();
  await page.fill("#ans", "zzz");
  await page.press("#ans", "Enter");
  await page.click("[data-report=bug]");
  await expect(page.locator("#rpText")).toBeFocused();
  const ctx = page.locator("#rpCtx");
  await expect(ctx).toContainText(task);
  await expect(ctx).toContainText("ответ: «zzz»");
  await expect(ctx).toContainText("проверка: Ошибка.");
  await expect(ctx).toContainText("tenses=pres,pret");
  // Enter in the dialog doesn't reach the trainer behind it
  await page.fill("#rpText", "тут что-то не так");
  await page.press("#rpText", "Enter");
  await expect(page.locator("#ans")).toHaveValue("zzz");
  await page.press("#rpText", "Control+Enter");
  // built with a bot (PUBLIC_TG_TOKEN): the message goes to Telegram; without one, to the mail app
  await expect(page.locator("#rpNote")).not.toBeEmpty();
  if (sent.length) {
    await expect(page.locator("#rpNote")).toContainText("Отправлено");
    expect(sent[0].get("text")).toContain("ответ: «zzz»");
    expect(sent[0].get("text")).toContain("тут что-то не так");
    await expect(page.locator("#report")).not.toBeVisible();
  } else await expect(page.locator("#rpNote")).toContainText("почту");
});

test("feedback needs text and goes without the screen", async ({ page }) => {
  await page.goto("acentos/");
  await page.click("[data-report=idea]");
  await expect(page.locator("#rpCtxBox")).toBeHidden();
  await page.click("#rpSend");
  await expect(page.locator("#rpNote")).toContainText("Напиши");
  await page.fill("#rpText", "спасибо");
  await page.click("#rpSend");
  await expect(page.locator("#rpNote")).not.toContainText("Отправляю");
  if (sent.length) {
    await expect(page.locator("#rpNote")).toContainText("Отправлено");
    expect(sent[0].get("text")).not.toContain("задание:");
  }
});

test("the wine dialog copies the details in one click", async ({ page, context }) => {
  test.skip(!hasWine(), "no payment details in lib/support.js");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("genero/");
  await page.click("#wineOpen");
  const b = page.locator("#wine [data-copy]").first();
  if (await b.count()) {
    await b.click();
    await expect(b).toContainText("Скопировано");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await b.getAttribute("data-copy"));
  }
});
