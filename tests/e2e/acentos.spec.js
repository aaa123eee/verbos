import { test, expect } from "@playwright/test";

const kit = (page, src) => page.evaluate((s) => window.__kit(s), src);
// show a given task as the current one
const ask = (page, key) => kit(page, `cur=fromKey(${JSON.stringify(key)}); last=cur.key; answered=false; prevS=null; undone=false; resetHints(); setGo(false);
  $("pTag").textContent=cur.tag; $("pWhen").textContent=cur.when; $("pMain").innerHTML=cur.main; $("pSub").textContent=cur.sub; $("ans").value="";`);
const answer = async (page, text) => { await page.fill("#ans", text); await page.press("#ans", "Enter"); };

test.beforeEach(async ({ page }) => { await page.goto("acentos/?e2e"); await page.waitForTimeout(400); });

test("a word without its tilde is a mistake, and the syllables explain why", async ({ page }) => {
  await ask(page, "word|canción");
  await expect(page.locator("#pMain")).toHaveText("cancion");
  await answer(page, "cancion");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  await expect(page.locator("#fb")).toContainText("Ошибка в ударении");
  await expect(page.locator("#fb .why")).toContainText("can-ción");
  await expect(page.locator("#fb .why")).toContainText("aguda");
});

test("a word that needs no tilde is right as it is", async ({ page }) => {
  await ask(page, "verb|hablar|pres|0");
  await expect(page.locator("#pSub")).toContainText("hablar · presente");
  await answer(page, "hablo");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
  await page.press("#ans", "Enter");
  await ask(page, "verb|hablar|pret|2");
  await answer(page, "hablo");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  await expect(page.locator("#fb")).toContainText("habló");
});

test("plural and the tú / tu sentences", async ({ page }) => {
  await ask(page, "plural|joven");
  await answer(page, "jóvenes");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
  await page.press("#ans", "Enter");
  await ask(page, "diacr|0"); // ¿___ vienes a la fiesta? → tú
  await expect(page.locator("#pMain .gap")).toHaveText("tu");
  await answer(page, "tu");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  await expect(page.locator("#fb .why")).toContainText("местоимение «ты»");
});

test("the chosen kinds survive a reload", async ({ page }) => {
  for (const k of ["word", "verb", "plural"]) await page.locator(`input[name="kinds"][value="${k}"]`).uncheck({ force: true });
  await page.reload(); await page.waitForTimeout(400);
  for (let i = 0; i < 20; i++) expect(await kit(page, "show(); cur.key.split('|')[0]")).toBe("diacr");
  await expect(page.locator('input[name="kinds"][value="word"]')).not.toBeChecked();
});

test("phone width: no sideways scroll; the menu lists every trainer", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto("acentos/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
  await expect(page.locator("nav.trainers a")).toHaveText(["Спряжение", "Какое время?", "Слова", "Местоимения и герундий", "Ударения", "Род и согласование"]);
  await expect(page.locator('nav.trainers a[aria-current="page"]')).toHaveText("Ударения");
});
