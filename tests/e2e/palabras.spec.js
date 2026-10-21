import { test, expect } from "@playwright/test";

const w = (page, src) => page.evaluate((s) => window.__words(s), src);
const ready = (page) => page.waitForFunction(() => window.__words && window.__words("!!D"));
// MyMemory never gets real requests from tests
test.beforeEach(async ({ page }) => {
  await page.route("https://api.mymemory.translated.net/**", (r) => r.fulfill({ json: { responseData: { translatedText: "ПЕРЕВОД" }, matches: [] } }));
  await page.goto("palabras/?e2e"); await ready(page);
});

test("looks up a Spanish word with all its translations, and a form leads to its verbs", async ({ page }) => {
  await page.fill("#q", "tirar");
  await expect(page.locator(".wcard").first()).toContainText("бросать");
  await expect(page.locator(".wcard").first()).toContainText("тащить");
  // the conjugation opens inside the card, the page stays
  await page.locator(".wcard .vlink").first().click();
  await expect(page.locator(".wcard .wconj")).toContainText("tiré");
  expect(page.url()).toContain("palabras");
  await page.locator(".wcard .vlink").first().click();
  await expect(page.locator(".wcard .wconj")).toHaveCount(0);
  await page.fill("#q", "fui");
  await expect(page.locator(".wcard .ww")).toContainText(["ser", "ir"]);
  await expect(page.locator(".wcard .how").first()).toContainText("pretérito");
  await page.locator('.wcard [data-conj="ir"]').click();
  await expect(page.locator(".wcard .wconj .ln.found").first()).toContainText("fui");
  await page.fill("#q", "problema");
  await expect(page.locator(".wcard .ww").first()).toHaveText("el problema");
});

test("every verb conjugates in its card: a form of a rare verb leads to it, even one the dictionary lacks", async ({ page }) => {
  await page.fill("#q", "recuento");
  await expect(page.locator('.wcard [data-conj="recontar"]')).toHaveCount(1);
  await page.locator('.wcard [data-conj="recontar"]').click();
  await expect(page.locator(".wcard .wconj .ln.found").first()).toContainText("recuento");
  // madrugar has no Russian Wiktionary entry: the card comes from the engine's meanings
  await page.fill("#q", "madrugué");
  await expect(page.locator('.wcard [data-conj="madrugar"]').first()).toBeVisible();
  await expect(page.locator(".wcard .how").first()).toContainText("pretérito, yo");
});

test("a Russian query lists Spanish words; a click opens the word and saves it", async ({ page }) => {
  await page.fill("#q", "собака");
  await expect(page.locator(".wrow .f").first()).toBeVisible();
  const first = await page.locator(".wrow").filter({ hasText: "perro" }).first();
  await first.click();
  await expect(page.locator(".wcard .ww").first()).toHaveText("el perro");
  await expect(page.locator(".wcard .saved").first()).toBeVisible();
  expect(await w(page, "Object.keys(S.cards)")).toContain("perro|n");
});

test("Enter saves the word; it can be removed; the list shows it", async ({ page }) => {
  await page.fill("#q", "casa"); await page.press("#q", "Enter");
  await expect(page.locator(".wcard .saved").first()).toBeVisible();
  await page.click("#listOpen");
  await expect(page.locator("#lt")).toContainText("la casa");
  await page.locator('#lt [data-del="casa|n"]').click();
  await expect(page.locator("#lt")).not.toContainText("la casa");
  await page.click("#listClose");
  expect(await w(page, "Object.keys(S.cards)")).not.toContain("casa|n");
});

test("a word not in the dictionary goes to MyMemory only on Enter, and can be saved", async ({ page }) => {
  let calls = 0;
  await page.route("https://api.mymemory.translated.net/**", (r) => { calls++; r.fulfill({ json: { responseData: { translatedText: "очень длинная фраза" }, matches: [] } }); });
  await page.fill("#q", "una frase muy larga de verdad");
  await expect(page.locator("#res")).toContainText("Enter — спросить");
  expect(calls).toBe(0);
  await page.press("#q", "Enter");
  await expect(page.locator(".wcard.mm")).toContainText("очень длинная фраза");
  expect(calls).toBe(1);
  await expect(page.locator(".wcard.mm .saved")).toBeVisible();
  expect(await w(page, "S.cards['una frase muy larga de verdad|x'].m")).toEqual(["очень длинная фраза"]);
});

test("a search saves the word by itself; a refined query replaces it; a removed word stays removed", async ({ page }) => {
  await page.locator("#q").pressSequentially("casado", { delay: 120 });
  await expect(page.locator(".wcard .saved").first()).toBeVisible();
  const ids = await w(page, "Object.keys(S.cards)");
  expect(ids).toContain("casado|a");
  expect(ids).not.toContain("casa|n");
  await page.locator('.wcard [data-del="casado|a"]').click();
  await page.fill("#q", "casad"); await page.fill("#q", "casado");
  await expect(page.locator('.wcard [data-add="casado|a"]')).toBeVisible();
  expect(await w(page, "Object.keys(S.cards)")).not.toContain("casado|a");
  await page.fill("#q", "собака");
  await expect(page.locator(".wrow").first()).toBeVisible();
  expect(await w(page, "Object.keys(S.cards)")).toContain("perro|n");
});

test("the review card hides while searching; Esc or the link brings it back", async ({ page }) => {
  await expect(page.locator("#rev")).toBeVisible();
  await page.fill("#q", "perro");
  await expect(page.locator("#rev")).toBeHidden();
  await page.press("#q", "Escape");
  await expect(page.locator("#q")).toHaveValue("");
  await expect(page.locator("#rev")).toBeVisible();
  await page.fill("#q", "gato");
  await page.click("[data-act=back]");
  await expect(page.locator("#rev")).toBeVisible();
});

test("review: recognise a new word, remember it, and it moves to tomorrow; undo brings it back", async ({ page }) => {
  await w(page, `S=fresh(); S.cards["casa|n"]=newCard("casa|n", day()); queue=null; next(true);`);
  await page.locator('input[name="src"][value="mine"]').check({ force: true });
  await expect(page.locator("#pMain")).toHaveText("la casa");
  await expect(page.locator("#pTag")).toHaveText("вспомни перевод");
  await page.click("#go");
  await expect(page.locator("#pMean")).toContainText("дом");
  await page.click("#go"); // remember
  await expect(page.locator("#pRev")).toContainText("завтра");
  expect(await w(page, "S.cards['casa|n'].due - day()")).toBe(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("#pMain")).toHaveText("la casa");
  expect(await w(page, "S.cards['casa|n'].last")).toBe(null);
});

test("review: write the word from Russian, with or without the article; a mistake comes back today", async ({ page }) => {
  await page.locator('input[name="src"][value="mine"]').check({ force: true });
  await page.locator('input[name="modes"][value="see"]').uncheck({ force: true });
  await page.locator('input[name="modes"][value="listen"]').uncheck({ force: true });
  await w(page, `S=fresh(); const c=newCard("casa|n", day()); c.last=day()-3; c.reps=2; c.due=day(); S.cards["casa|n"]=c;
    const p=newCard("perro|n", day()); p.last=day()-3; p.reps=2; p.due=day(); S.cards["perro|n"]=p; queue=null; next(true);`);
  const first = await page.locator("#pMain").textContent();
  const word = first.includes("дом") ? "la casa" : "perro";
  await page.fill("#ans", word); await page.press("#ans", "Enter");
  await expect(page.locator("#fb")).toHaveClass(/ok/);
  await page.press("#ans", "Enter");
  await page.fill("#ans", "gato"); await page.press("#ans", "Enter");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  const id = await w(page, "cur.c.id");
  expect(await w(page, `S.cards[${JSON.stringify(id)}].due === day()`)).toBe(true);
});

test("words survive a reload; nothing left shows the done card", async ({ page }) => {
  await page.locator('input[name="src"][value="mine"]').check({ force: true });
  await page.fill("#q", "perro"); await page.press("#q", "Enter");
  await page.waitForTimeout(800);
  await page.reload(); await ready(page);
  expect(await w(page, "Object.keys(S.cards)")).toContain("perro|n");
  await w(page, `S=fresh(); queue=null; next(true);`);
  await expect(page.locator("#pTag")).toHaveText("на сегодня всё");
});

test("phone width: no sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto("palabras/"); await page.waitForTimeout(300);
  await page.fill("#q", "tirar");
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
});

test("the main page opens a verb card from #verbo=", async ({ page }) => {
  await page.goto("./#verbo=tirar"); await page.waitForTimeout(300);
  await expect(page.locator("#sheet")).toBeVisible();
  await expect(page.locator("#verbCard .vname")).toHaveText("tirar");
});

test("nothing moves while the saved words and the dictionary load; no made-up zeros before that", async ({ page }) => {
  await w(page, `S=fresh(); S.cards["casa|n"]=newCard("casa|n", day()); save(); flush();`);
  await page.waitForTimeout(400);
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route("**/lookup*.json", async (r) => { await gate; r.continue(); });
  await page.goto("palabras/?e2e");
  const boxes = () => page.evaluate(() => ["rev", "stats", "q", "about"].map((id) => { const r = document.getElementById(id).getBoundingClientRect(); return [id, Math.round(r.top), Math.round(r.height)]; }));
  await page.waitForSelector("#rev.loading");
  const before = await boxes();
  expect(await page.locator("#stats b").allTextContents()).toEqual(["", "", "", "", "", ""]);
  release();
  await expect(page.locator("#rev")).not.toHaveClass(/loading/);
  await expect(page.locator("#stats b").nth(3)).toHaveText("1");
  expect(await boxes()).toEqual(before);
});

test("a missed word doesn't come straight back: words not due yet are mixed in, and keep their dates", async ({ page }) => {
  await page.locator('input[name="src"][value="mine"]').check({ force: true });
  const r = await w(page, `S=fresh(); recent=[]; ahead=new Set(); const d=day();
    const c=newCard("casa|n", d); c.last=d-3; c.reps=2; c.due=d; S.cards["casa|n"]=c;
    for (const id of ["perro|n","gato|n","agua|n","libro|n","mesa|n"]) { const x=newCard(id, d); x.last=d-1; x.reps=1; x.ivl=1; x.due=d+1; S.cards[id]=x; }
    queue=null; next(); const out=[cur.c.id]; result(false);
    for (let i=0;i<5;i++) { next(); out.push(cur.c.id); result(true); }
    [out, S.cards["perro|n"].due - d, S.cards["casa|n"].due - d]`);
  const [order, perroDue] = r;
  expect(order[0]).toBe("casa|n");
  expect(order.slice(1, 5)).not.toContain("casa|n");
  expect(order[5]).toBe("casa|n");
  expect(perroDue).toBe(1);
});
