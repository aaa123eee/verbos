import { test, expect } from "@playwright/test";

// window.__kit(src) evals inside createTrainer, so `cur`, `S`, `fromKey`, `check`, `show`, `undo` are reachable.
const kit = (page, src) => page.evaluate((s) => window.__kit(s), src);
const ask = (page, key) => kit(page, `cur=fromKey(${JSON.stringify(key)}); last=cur.key; answered=false; prevS=null; undone=false; resetHints(); setGo(false); $("ans").value="";`);
const answer = async (page, text) => { await page.fill("#ans", text); await page.press("#ans", "Enter"); };

test.beforeEach(async ({ page }) => { await page.goto("pronombres/?e2e"); await page.waitForTimeout(400); });

test("a wrong answer shows the right one, both word orders and the explanation", async ({ page }) => {
  await ask(page, "obj|explicar|inf|0|1|1||ir");
  await answer(page, "voy a explicartelo");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  await expect(page.locator("#fb")).toContainText("voy a explicártela");
  await expect(page.locator("#fb")).toContainText("te la voy a explicar");
  await expect(page.locator("#fb .why")).toContainText("косвенное");
  expect(await kit(page, "S.review[cur.key].need")).toBe(3);
});

test("either word order counts", async ({ page }) => {
  await ask(page, "obj|explicar|inf|0|1|1||ir");
  await answer(page, "te la voy a explicar");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
});

test("a missing accent is a mistake unless accents are switched off", async ({ page }) => {
  await ask(page, "refl|levantar|impa|1|||");
  await answer(page, "levantate");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  await expect(page.locator("#fb")).toContainText("Ошибка в ударении");
  await page.keyboard.press("Escape");
  await page.locator('input[name="strict"]').uncheck({ force: true });
  await ask(page, "refl|levantar|impa|1|||");
  await answer(page, "levantate");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
});

test("undo asks again, and the prompt comes back later once", async ({ page }) => {
  await ask(page, "obj|dar|impa|1|0|0|");
  await answer(page, "damelo");
  await page.keyboard.press("Escape");
  expect(await kit(page, "S.total")).toBe(0);
  await answer(page, "dámelo");
  await expect(page.locator("#fb")).toContainText("После отмены");
  expect(await kit(page, "[S.streak, S.review[cur.key].need]")).toEqual([0, 1]);
});

test("a mistake comes back when it is due", async ({ page }) => {
  await ask(page, "refl|vestir|impa|4|||");
  await answer(page, "vestidos");
  await kit(page, "S.review[cur.key].due=S.t; last='';");
  await page.press("#ans", "Enter");
  expect(await kit(page, "cur.key")).toBe("refl|vestir|impa|4|||");
  await expect(page.locator("#pRev")).toContainText("повтор");
});

test("settings survive a reload; reset all brings back the defaults", async ({ page }) => {
  await page.locator('input[value="ger"][name="types"]').uncheck({ force: true });
  await page.locator('input[name="vos"]').uncheck({ force: true });
  await page.reload(); await page.waitForTimeout(400);
  await expect(page.locator('input[value="ger"][name="types"]')).not.toBeChecked();
  await expect(page.locator('input[name="vos"]')).not.toBeChecked();
  for (let i = 0; i < 30; i++) {
    const k = await kit(page, "show(); cur.key");
    expect(k.startsWith("ger|")).toBe(false);
  }
  await page.click("#resetAll"); await page.click("#resetAll");
  await expect(page.locator('input[value="ger"][name="types"]')).toBeChecked();
  await expect(page.locator('input[name="vos"]')).toBeChecked();
});

test("the last kind of task can't be unchecked", async ({ page }) => {
  for (const v of ["obj", "refl"]) await page.locator(`input[name="types"][value="${v}"]`).uncheck({ force: true });
  await page.locator('input[name="types"][value="ger"]').click({ force: true }); // the click is undone right away
  await expect(page.locator('input[name="types"][value="ger"]')).toBeChecked();
});

test("rules open in a dialog; Esc closes it without undoing an answer", async ({ page }) => {
  await ask(page, "obj|dar|pres|2|0|0|");
  await answer(page, "zzz");
  await page.click("#rulesOpen");
  await expect(page.locator("#rules")).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(page.locator("#rules")).not.toHaveAttribute("open", "");
  expect(await kit(page, "answered && S.total===1")).toBe(true);
});

test("phone width: no sideways scroll, drawer works, menu leads to the main page", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto("pronombres/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
  await page.click("#cfgOpen");
  await expect(page.locator("#side")).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#side")).not.toHaveClass(/open/);
  await page.click('nav.trainers a:has-text("Спряжение")');
  await expect(page).toHaveURL(/\/verbos\/$/);
  await expect(page.locator("#pVerb")).not.toBeEmpty();
});
