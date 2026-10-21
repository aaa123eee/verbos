// The speaker of the tables: one button, shown next to the form under the pointer, and the voice fetched only on a press.
import { test, expect } from "@playwright/test";

test("a form in a table speaks from its speaker, and only when it is pressed", async ({ page }) => {
  const said = [];
  await page.route("https://translate.google.com/**", (r) => { said.push(new URL(r.request().url()).searchParams.get("q")); r.abort(); });
  await page.goto("./#verbo=tener");
  await expect(page.locator("#verbCard .ln .f").first()).toBeVisible();
  await expect(page.locator("button.say")).toHaveCount(0);
  const form = page.locator("#verbCard .ln .f").nth(7);
  await form.hover();
  await expect(page.locator("dialog button.say")).toBeVisible();
  await page.locator("#verbCard .ln .f").nth(8).hover();
  await expect(page.locator("button.say")).toHaveCount(1);
  expect(said).toEqual([]);
  await page.locator("dialog button.say").click();
  await expect.poll(() => said).toEqual([await page.locator("#verbCard .ln .f").nth(8).textContent()]);
  await page.locator("#verbCard .ln span:not(.f)").first().hover();
  await expect(page.locator("button.say")).toBeHidden();
});
