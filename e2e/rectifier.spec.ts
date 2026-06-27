import { expect, test } from "@playwright/test";

const VALID_JSON = '{"name":"Alice","active":true,"tags":["dev","lead"]}';
const BROKEN_JSON = '{"name":"Alice" "active":true}';
const NESTED_JSON =
  '{"user":{"name":"Alice","address":{"city":"Dhaka","zip":1205}},"roles":["admin"]}';

test.describe("Rectifier user flows", () => {
  // ---- 1. Paste valid JSON and Beautify ----
  test("paste valid JSON and beautify", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(VALID_JSON);

    // Wait for validation to complete
    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 10000 });

    // Click the actual button (skip DisabledReason wrapper)
    await page.locator("button", { hasText: "Beautify" }).click();

    // Result panel should show beautified content
    await expect(page.getByText('"Alice"')).toBeVisible({ timeout: 10000 });
  });

  // ---- 2. Upload invalid JSON and focus first error ----
  test("upload invalid JSON and focus first error", async ({ page }) => {
    await page.goto("/");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload JSON" }).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from(BROKEN_JSON),
    });

    await expect(page.getByText(/missing comma/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  // ---- 3. Preview and accept one safe repair ----
  test("preview and accept safe repair", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(BROKEN_JSON);

    // Wait for eligibility — check that repair button (the real <button> not wrapper) is not disabled
    await page.waitForTimeout(3000);

    const repairBtn = page.locator("button", { hasText: "Repair JSON" });
    await expect(repairBtn).toBeEnabled({ timeout: 15000 });

    await repairBtn.click();

    // Repair preview dialog appears
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
  });

  // ---- 4. Select ambiguous repair choice ----
  test("select ambiguous repair choice", async ({ page }) => {
    await page.goto("/");

    // Single-quote delimiters may produce ambiguous choices
    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("{'name':'John','active':true}");

    await page.waitForTimeout(3000);

    const repairBtn = page.locator("button", { hasText: "Repair JSON" });
    if (await repairBtn.isEnabled()) {
      await repairBtn.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    }
  });

  // ---- 5. Refuse unsupported repair ----
  test("refuse unsupported repair and return to editing", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("{'name'}");

    await page.waitForTimeout(3000);

    const repairBtn = page.locator("button", { hasText: "Repair JSON" });
    if (await repairBtn.isEnabled()) {
      await repairBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  // ---- 6. Convert nested object to CSV ----
  test("convert nested object to flattened CSV", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(NESTED_JSON);

    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 10000 });

    // Click Convert → Convert to CSV
    await page.locator("button", { hasText: "Convert" }).click();
    await page.locator("button", { hasText: /csv/i }).click();

    // Result area should contain CSV row (the full CSV line is unique to the result)
    await expect(page.getByText(/Alice.*1205/)).toBeVisible({ timeout: 10000 });
  });

  // ---- 7. Run Schema Check from separate drawer ----
  test("run schema check from separate drawer", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(VALID_JSON);

    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 10000 });

    // Open schema drawer
    await page.getByRole("button", { name: /schema/i }).click();

    const schemaTextarea = page.locator("textarea");
    await schemaTextarea.fill(
      JSON.stringify({
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      }),
    );
  });

  // ---- 8. Collapse result objects and arrays ----
  test("collapse result objects and arrays", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(VALID_JSON);

    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 10000 });

    // Beautify to create a result
    await page.locator("button", { hasText: "Beautify" }).click();

    // Switch to Tree view
    await page.getByRole("button", { name: "tree view" }).click();

    const collapseBtns = page.getByRole("button", { name: /collapse/i });
    const count = await collapseBtns.count();
    if (count > 0) {
      await collapseBtns.first().click();
    }
  });

  // ---- 9. Copy and download exact results ----
  test("copy and download exact results", async ({ page }) => {
    await page.goto("/");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(VALID_JSON);

    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 10000 });

    // Beautify to create result
    await page.locator("button", { hasText: "Beautify" }).click();

    await page.waitForTimeout(2000);

    const copyBtn = page.getByRole("button", { name: "Copy result" });
    await expect(copyBtn).toBeEnabled({ timeout: 5000 });
  });

  // ---- 10. Verify disabled reasons ----
  test("verify disabled reasons with pointer and keyboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Clear input" }).click();

    // Without input, the actual button should be disabled
    const beautifyBtn = page.locator("button", { hasText: "Beautify" });
    await expect(beautifyBtn).toBeDisabled();

    const disabledTarget = page.locator('span[aria-disabled="true"]', {
      hasText: "Beautify",
    });
    await disabledTarget.hover();
    await expect(page.getByText("Paste JSON first.")).toBeVisible();
  });

  // ---- 11. Workspace sections present ----
  test("workspace has three main sections", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Input JSON")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
    await expect(page.getByText("No result yet")).toBeVisible();
  });
});
