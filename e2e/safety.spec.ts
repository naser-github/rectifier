import { expect, test } from "@playwright/test";

test.describe("Adversarial safety and stability", () => {
  test("handles deep nesting without crash", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");

    // Use evaluate to inject text directly via CodeMirror's API
    const deepText = await page.evaluate(() => {
      let obj: unknown = "leaf";
      for (let i = 0; i < 50; i++) obj = { n: obj };
      return JSON.stringify(obj);
    });

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");

    // Paste via evaluate for speed
    await page.keyboard.insertText(deepText);

    await page.waitForTimeout(4000);

    // Page should survive — verify by checking header is still visible
    await expect(page.getByText("Rectifier")).toBeVisible();
  });

  test("handles large arrays without crash", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");

    const arrText = JSON.stringify(Array.from({ length: 1000 }, (_, i) => i));
    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.insertText(arrText);

    await page.waitForTimeout(4000);

    // Page should survive
    await expect(page.getByText("Rectifier")).toBeVisible();
  });

  test("handles heavily broken JSON", async ({ page }) => {
    await page.goto("/");

    const broken =
      '{"a":1 "b":2 "c": {"d":3 "e":4 {"f" {"g":1 "h":2 ] "i":} "j":[1 2 3 ';

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(broken);

    await expect(page.getByText(/error|missing|expect/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("handles unknown escape sequence without crash", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type('{"bad": "\\z hello"}');

    await page.waitForTimeout(3000);
    // Should not crash — verify page is still responsive
    await page
      .getByText(/valid|error/i)
      .isVisible()
      .catch(() => undefined);
    await expect(page.getByText("Rectifier")).toBeVisible();
    await expect(page.getByText("Rectifier")).toBeVisible();
  });

  test("handles unterminated strings", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type('{"name": "unterminated');

    await expect(page.getByText(/error|unterminated|missing/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("confirms no unsafe repair is silently applied", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type('{"a":1 "b":2}');

    await page.waitForTimeout(3000);

    const repairBtn = page.locator("button", { hasText: "Repair JSON" });
    if (await repairBtn.isEnabled()) {
      await repairBtn.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    }
  });
});
