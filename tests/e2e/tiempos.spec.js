import { test, expect } from "@playwright/test";

// window.__kit(src) evals inside createTrainer, so `cur`, `S`, `fromKey`, `check`, `show`, `undo` are reachable.
const kit = (page, src) => page.evaluate((s) => window.__kit(s), src);
const ask = (page, key) => kit(page, `cur=fromKey(${JSON.stringify(key)}); last=cur.key; answered=false; prevS=null; undone=false; resetHints(); setGo(false); $("pMain").innerHTML=cur.main; $("ans").value="";`);
const answer = async (page, text) => { await page.fill("#ans", text); await page.press("#ans", "Enter"); };

test.beforeEach(async ({ page }) => { await page.goto("tiempos/?e2e"); await page.waitForTimeout(400); });

test("a sentence with a gap; the tense the marker asks for counts", async ({ page }) => {
  await ask(page, "ayer|comprar|0|0");
  await expect(page.locator("#pMain")).toContainText("Ayer yo");
  await expect(page.locator("#pMain .gap")).toHaveCount(1);
  await answer(page, "compré");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
});

test("a wrong tense shows the right form, why this tense and how the form is built", async ({ page }) => {
  await ask(page, "mientras|leer|3|0");
  await answer(page, "leímos");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  await expect(page.locator("#fb")).toContainText("leíamos");
  await expect(page.locator("#fb .why")).toContainText("Mientras");
  await expect(page.locator("#fb .why")).toContainText("imperfecto");
  expect(await kit(page, "S.review[cur.key].need")).toBe(3);
});

test("other right answers count: pretérito for perfecto, ir a + infinitivo for futuro", async ({ page }) => {
  await ask(page, "hoy|comer|0|0");
  await answer(page, "comí");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
  await page.press("#ans", "Enter");
  await ask(page, "manana|comprar|0|0");
  await answer(page, "voy a comprar");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
});

test("the rule hint explains the marker without naming the tense", async ({ page }) => {
  await ask(page, "ayer|comprar|0|0");
  await page.click('#hintbar [data-h="rule"]');
  await expect(page.locator("#hints")).toContainText("Ayer");
  await expect(page.locator("#hints")).not.toContainText("pretérito");
});

test("phone width: no sideways scroll; the menu lists the page", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto("tiempos/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
  await expect(page.locator('.trainers [aria-current="page"]')).toContainText("Какое время");
});
