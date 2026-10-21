import { test, expect } from "@playwright/test";

// Nothing moves while a page loads: no layout shifts on a first visit and on a visit with saved progress
const observe = () => {
  window.__ls = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ls.push({ v: e.value, src: (e.sources || []).map((s) => (s.node?.id || (s.node?.outerHTML || s.node?.nodeName || "").slice(0, 50)) + " " + Math.round(s.previousRect.y) + "→" + Math.round(s.currentRect.y) + " h" + Math.round(s.previousRect.height) + "→" + Math.round(s.currentRect.height)) }); }).observe({ type: "layout-shift", buffered: true });
};
const shifts = async (page) => { await page.waitForTimeout(1200); return page.evaluate(() => window.__ls); };
async function makeProgress(page, path) {
  if (path === "palabras/") {
    await page.waitForFunction(() => window.__words && window.__words("!!D"));
    for (const q of ["casa", "perro", "gato"]) { await page.fill("#q", q); await expect(page.locator(".wcard .saved").first()).toBeVisible(); }
    await page.fill("#q", ""); await page.click("#go"); await page.click("#no");
  } else {
    for (let i = 0; i < 3; i++) { await page.fill("#ans", "zzz"); await page.press("#ans", "Enter"); await page.press("#ans", "Enter"); }
  }
  await page.waitForTimeout(600);
}

for (const width of [1280, 400]) {
  for (const path of ["", "tiempos/", "pronombres/", "acentos/", "genero/", "palabras/"]) {
    test(`no layout shifts on load: ${path || "main"} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(observe);
      // web fonts swap in whenever the network brings them; this test is about the page's own data
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      await page.goto(path + (path === "palabras/" ? "?e2e" : ""));
      expect(await shifts(page)).toEqual([]);
      await makeProgress(page, path);
      await page.reload();
      expect(await shifts(page)).toEqual([]);
    });
  }
}
