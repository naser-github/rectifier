import { expect, test } from "@playwright/test";

test("loads the Epic 03 validation workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Input JSON" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Result" })).toBeVisible();
  await expect(page.getByRole("region", { name: /input json editor/i })).toBeVisible();
});

test("shows automatic validation diagnostics for broken JSON", async ({ page }) => {
  await page.goto("/");

  await page.locator(".cm-content").click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type('{"a":1 "b":2}');

  await expect(page.getByText(/missing comma/i)).toBeVisible();
});
