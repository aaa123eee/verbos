import { test, expect } from "@playwright/test";

const kit = (page, src) => page.evaluate((s) => window.__kit(s), src);
// show a given task as the current one
const ask = (page, key) => kit(page, `cur=fromKey(${JSON.stringify(key)}); last=cur.key; answered=false; prevS=null; undone=false; resetHints(); setGo(false);
  $("pTag").textContent=cur.tag; $("pWhen").textContent=cur.when; $("pMain").innerHTML=cur.main; $("pSub").textContent=cur.sub; $("ans").value="";`);
const answer = async (page, text) => { await page.fill("#ans", text); await page.press("#ans", "Enter"); };

test.beforeEach(async ({ page }) => { await page.goto("genero/?e2e"); await page.waitForTimeout(400); });

test("a wrong article is a mistake, and the explanation names the exception", async ({ page }) => {
  await ask(page, "art|problema");
  await expect(page.locator("#pMain")).toHaveText("problema");
  await answer(page, "la problema");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  await expect(page.locator("#fb")).toContainText("el problema");
  await expect(page.locator("#fb .why")).toContainText("-ma");
  await page.press("#ans", "Enter");
  await ask(page, "art|agua");
  await answer(page, "el agua");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
});

test("common gender takes either article; the plural and the adjective forms", async ({ page }) => {
  await ask(page, "art|estudiante");
  await answer(page, "la estudiante");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
  await expect(page.locator("#fb")).toContainText("el estudiante");
  await page.press("#ans", "Enter");
  await ask(page, "artpl|hotel");
  await expect(page.locator("#pWhen")).toHaveText("мн. ч.");
  await answer(page, "los hoteles");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
  await page.press("#ans", "Enter");
  await ask(page, "adj|inglés|f");
  await answer(page, "inglésa");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  await expect(page.locator("#fb .why")).toContainText("inglesa");
});

test("the chosen kinds survive a reload", async ({ page }) => {
  for (const k of ["art", "artpl"]) await page.locator(`input[name="kinds"][value="${k}"]`).uncheck({ force: true });
  await page.reload(); await page.waitForTimeout(400);
  for (let i = 0; i < 20; i++) expect(await kit(page, "show(); cur.key.split('|')[0]")).toBe("adj");
});

test("phone width: no sideways scroll; the menu marks this page", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto("genero/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
  await expect(page.locator('nav.trainers a[aria-current="page"]')).toHaveText("Род и согласование");
});
