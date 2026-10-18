import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";

// Each case file is a script that runs inside the page module and reports "ok …" / "FAIL …" lines via document.title.
const dir = new URL("./cases/", import.meta.url);
const run = (page, src) => page.evaluate((s) => window.__verbos("(()=>{" + s + "})()"), src);

for (const file of readdirSync(dir).filter((f) => f.endsWith(".js"))) {
  test(file.replace(".js", ""), async ({ page }) => {
    const src = readFileSync(new URL(file, dir), "utf8");
    await page.goto("./?e2e");
    await page.waitForTimeout(400);
    const report = async () => { await page.waitForTimeout(150); return (await page.title()).includes(" | ") || (await page.title()).startsWith("ok "); };
    try { await run(page, src); } catch (e) { if (!/context was destroyed|navigation/i.test(String(e))) throw e; }
    if (!(await report())) { // the case reloaded the page (settings-persist): run it again after the reload
      await page.waitForLoadState("load"); await page.waitForTimeout(400); await run(page, src);
    }
    await page.waitForTimeout(100);
    const lines = (await page.title()).split(" | ").map((l) => l.trim());
    expect(lines.length, "the case reported results").toBeGreaterThan(1);
    expect(lines.filter((l) => !l.startsWith("ok ")), "failed checks").toEqual([]);
  });
}

test("phone width: no sideways scroll, settings drawer opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto("./");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
  await page.click("#cfgOpen");
  await expect(page.locator("#side")).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#side")).not.toHaveClass(/open/);
});

test("typing an answer and pressing Enter checks it, Enter again moves on", async ({ page }) => {
  await page.goto("./");
  await page.fill("#ans", "zzz");
  await page.press("#ans", "Enter");
  await expect(page.locator("#fb")).toHaveClass(/bad/);
  await page.press("#ans", "Enter");
  await expect(page.locator("#fb")).not.toHaveClass(/bad/);
});
