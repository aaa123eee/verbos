import { test, expect } from "@playwright/test";

// MyMemory never gets real requests from tests
test.beforeEach(async ({ page }) => {
  await page.route("https://api.mymemory.translated.net/**", (r) => r.fulfill({ json: { responseData: { translatedText: "ПЕРЕВОД" }, matches: [] } }));
});

for (const path of ["", "pronombres/", "acentos/", "genero/"]) {
  test(`the top bar search works on /${path}`, async ({ page }) => {
    await page.goto(path);
    await page.click("#findOpen");
    await expect(page.locator("#fq")).toBeFocused();
    await page.fill("#fq", "casa");
    await expect(page.locator("#fres .wcard").first()).toContainText("дом");
  });
}

test("a verb form opens the verb with its conjugation; the found words go to my words", async ({ page }) => {
  await page.goto("acentos/");
  await page.click("#findOpen");
  await page.fill("#fq", "tuve");
  const card = page.locator("#fres .wcard").first();
  await expect(card.locator(".ww")).toHaveText("tener");
  await expect(card.locator(".wconj .found")).toContainText("tuve");
  await expect(card.locator(".saved")).toBeVisible();
  await page.fill("#fq", "собака");
  await expect(page.locator("#fres .wrow").first()).toContainText("perro");
  // Esc clears the query, the second Esc closes the dialog
  await page.press("#fq", "Escape");
  await expect(page.locator("#fq")).toHaveValue("");
  await page.press("#fq", "Escape");
  await expect(page.locator("#find")).not.toBeVisible();
  await page.waitForTimeout(300);
  await page.goto("palabras/?e2e");
  await page.waitForFunction(() => window.__words && window.__words("loaded"));
  const ids = await page.evaluate(() => window.__words("Object.keys(S.cards)"));
  expect(ids).toEqual(expect.arrayContaining(["tener|v", "perro|n"]));
});

test("keys typed in the search don't reach the trainer behind it; / opens it", async ({ page }) => {
  await page.goto("?e2e");
  await page.locator("#ans").blur();
  await page.keyboard.press("/");
  await expect(page.locator("#fq")).toBeFocused();
  await page.fill("#fq", "hablar");
  await page.press("#fq", "Enter");
  await expect(page.locator("#fres .wcard").first()).toContainText("говорить");
  await page.click("#findClose");
  await expect(page.locator("#fb")).toHaveClass(/idle/);
});

test("the words page takes words saved in another tab when it comes back", async ({ page, context }) => {
  await page.goto("palabras/?e2e");
  await page.waitForFunction(() => window.__words && window.__words("loaded"));
  const other = await context.newPage();
  await other.goto("genero/");
  await other.click("#findOpen");
  await other.fill("#fq", "gato");
  await expect(other.locator("#fres .wcard .saved").first()).toBeVisible();
  await other.waitForTimeout(300);
  await other.close();
  await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect.poll(() => page.evaluate(() => window.__words("Object.keys(S.cards)"))).toContain("gato|n");
});

test("every word of a task sentence shows its translation and goes to my words; the gap is not a word", async ({ page }) => {
  await page.goto("tiempos/?e2e");
  await page.waitForFunction(() => window.__kit);
  await page.evaluate(() => window.__kit(`cur = fromKey("ayer|comer|2|0"); last = cur.key; $("pMain").innerHTML = cur.main; wrapWords($("pMain"));`));
  await expect(page.locator(".prompt .gap .w")).toHaveCount(0);
  const ayer = page.locator(".prompt .w", { hasText: /^Ayer$/ });
  await ayer.click();
  await expect(page.locator("#wpop")).toContainText("вчера");
  await expect(page.locator("#wpop .saved")).toBeVisible();
  await expect(page.locator("#ans")).toBeFocused();
  // a form leads to its word
  await page.locator(".prompt .w", { hasText: /^él$/ }).click();
  await expect(page.locator("#wpop .wp-w")).toHaveText("él");
  await page.keyboard.press("Escape");
  await expect(page.locator("#wpop")).toBeHidden();
  // «подробнее» opens the search on that word
  await ayer.click();
  await page.locator("#wpop [data-more]").click();
  await expect(page.locator("#find")).toBeVisible();
  await expect(page.locator("#fq")).toHaveValue("ayer");
  await page.waitForTimeout(300);
  await page.goto("palabras/?e2e");
  await page.waitForFunction(() => window.__words && window.__words("loaded"));
  const ids = await page.evaluate(() => window.__words("Object.keys(S.cards)"));
  expect(ids.some((id) => id.startsWith("ayer|")) && ids.some((id) => id.startsWith("él|"))).toBe(true);
});
