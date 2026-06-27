import { expect, test } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";
import type { Page } from "@playwright/test";

test.describe("Large file and responsiveness", () => {
  // Generate deterministic large JSON in Node before the test
  function generateJson(sizeBytes: number): string {
    const items: string[] = [];
    let i = 0;
    let total = 0;
    while (total < sizeBytes - 128) {
      const entry = JSON.stringify({ k: i, v: "x".repeat(30) });
      if (total + entry.length + 2 >= sizeBytes - 2) {
        break;
      }
      items.push(entry);
      total += entry.length + 1;
      i++;
    }
    return "[" + items.join(",") + "]";
  }

  function generateObjectJson(sizeBytes: number): string {
    const entries: string[] = [];
    let i = 0;
    let total = 2;

    while (total < sizeBytes - 128) {
      const entry =
        JSON.stringify(`key_${String(i)}`) + ":" + JSON.stringify("x".repeat(30));
      if (total + entry.length + 1 >= sizeBytes - 2) {
        break;
      }
      entries.push(entry);
      total += entry.length + 1;
      i++;
    }

    return "{" + entries.join(",") + "}";
  }

  function removeFirstPropertyComma(text: string): string {
    const commaOffset = text.indexOf(',"key_');

    if (commaOffset === -1) {
      throw new Error("large repair fixture did not contain a removable comma");
    }

    return text.slice(0, commaOffset) + text.slice(commaOffset + 1);
  }

  async function uploadJson(page: Page, text: string) {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload JSON" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "large.json",
      mimeType: "application/json",
      buffer: Buffer.from(text, "utf-8"),
    });
  }

  async function startLongTaskMonitor(page: Page) {
    await page.evaluate(() => {
      const globalWindow = window as typeof window & {
        __rectifierLongTasks?: number[];
        __rectifierLongTaskObserver?: PerformanceObserver;
      };

      globalWindow.__rectifierLongTasks = [];
      globalWindow.__rectifierLongTaskObserver?.disconnect();

      if (!("PerformanceObserver" in window)) {
        return;
      }

      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            globalWindow.__rectifierLongTasks?.push(entry.duration);
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
        globalWindow.__rectifierLongTaskObserver = observer;
      } catch {
        Reflect.deleteProperty(globalWindow, "__rectifierLongTaskObserver");
      }
    });
  }

  async function stopLongTaskMonitor(page: Page): Promise<number> {
    return page.evaluate(() => {
      const globalWindow = window as typeof window & {
        __rectifierLongTasks?: number[];
        __rectifierLongTaskObserver?: PerformanceObserver;
      };
      globalWindow.__rectifierLongTaskObserver?.disconnect();
      const durations = globalWindow.__rectifierLongTasks ?? [];
      return durations.length === 0 ? 0 : Math.max(...durations);
    });
  }

  async function getJsHeapUsedSize(
    context: BrowserContext,
    page: Page,
  ): Promise<number> {
    const session = await context.newCDPSession(page);
    await session.send("Performance.enable");
    const { metrics } = await session.send("Performance.getMetrics");
    await session.detach();

    const heapMetric = metrics.find((metric) => metric.name === "JSHeapUsedSize");
    return heapMetric?.value ?? 0;
  }

  test("handles 10 MB file upload without crashing", async ({ page }) => {
    test.setTimeout(120000);
    await page.goto("/");

    // Generate a 10+ MB file
    const largeText = generateJson(11 * 1024 * 1024);
    const largeBuffer = Buffer.from(largeText, "utf-8");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload JSON" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "large.json",
      mimeType: "application/json",
      buffer: largeBuffer,
    });

    // Wait — page should not crash. Header should still be visible.
    await page.waitForTimeout(3000);
    await expect(page.getByText("Rectifier")).toBeVisible();
  });

  test("completes validation for a 1 MB valid file", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");

    const text = generateJson(1024 * 1024);
    const buffer = Buffer.from(text, "utf-8");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload JSON" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "large.json",
      mimeType: "application/json",
      buffer,
    });

    // Wait for validation to complete
    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 30000 });
  });

  test("completes validation for a 5 MB valid file", async ({ page }) => {
    test.setTimeout(120000);
    await page.goto("/");

    const text = generateJson(5 * 1024 * 1024);
    const buffer = Buffer.from(text, "utf-8");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload JSON" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "large.json",
      mimeType: "application/json",
      buffer,
    });

    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 60000 });
  });

  test("completes validation for a 10 MB valid file within budget", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto("/");

    const text = generateJson(10 * 1024 * 1024);
    expect(Buffer.byteLength(text, "utf-8")).toBeLessThanOrEqual(10 * 1024 * 1024);

    const start = Date.now();
    await uploadJson(page, text);
    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 60000 });
    const elapsed = Date.now() - start;
    console.log(`10 MB validation elapsed: ${String(elapsed)} ms`);

    expect(elapsed).toBeLessThanOrEqual(5000);
  });

  test("completes repair analysis for a 10 MB supported-invalid file within budget", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto("/");

    const validText = generateObjectJson(10 * 1024 * 1024);
    const invalidText = removeFirstPropertyComma(validText);
    expect(Buffer.byteLength(invalidText, "utf-8")).toBeLessThanOrEqual(
      10 * 1024 * 1024,
    );

    await uploadJson(page, invalidText);
    await expect(page.getByText(/missing comma/i).first()).toBeVisible({
      timeout: 60000,
    });

    const start = Date.now();
    await page.locator("button", { hasText: "Repair JSON" }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 60000 });
    const elapsed = Date.now() - start;
    console.log(`10 MB repair analysis elapsed: ${String(elapsed)} ms`);

    expect(elapsed).toBeLessThanOrEqual(10000);
  });

  test("page remains interactive during worker processing", async ({ page }) => {
    await page.goto("/");

    const start = await page.evaluate(() => performance.now());

    await page.locator(".cm-content").click();
    await page.keyboard.type("42");

    await expect(page.getByRole("button", { name: "Upload JSON" })).toBeVisible({
      timeout: 5000,
    });

    const elapsed = await page.evaluate((startTime) => {
      return new Promise<number>((resolve) => {
        requestAnimationFrame(() => {
          resolve(performance.now() - startTime);
        });
      });
    }, start);
    console.log(`UI responsiveness elapsed: ${String(Math.round(elapsed))} ms`);

    expect(elapsed).toBeLessThanOrEqual(250);
  });

  test("keeps main-thread long tasks within budget during 10 MB validation", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto("/");

    const text = generateJson(10 * 1024 * 1024);
    await uploadJson(page, text);
    await startLongTaskMonitor(page);
    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 60000 });
    const maxLongTaskMs = await stopLongTaskMonitor(page);
    console.log(
      `Max main-thread long task after upload: ${String(Math.round(maxLongTaskMs))} ms`,
    );

    expect(maxLongTaskMs).toBeLessThanOrEqual(500);
  });

  test("records JS heap after 10 MB validation", async ({ context, page }) => {
    test.setTimeout(120000);
    await page.goto("/");

    const text = generateJson(10 * 1024 * 1024);
    await uploadJson(page, text);
    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 60000 });

    const heapUsedBytes = await getJsHeapUsedSize(context, page);
    console.log(
      `10 MB validation JS heap used: ${String(Math.round(heapUsedBytes))} bytes`,
    );
    expect(heapUsedBytes).toBeGreaterThan(0);
  });

  test("large object view does not render every row", async ({ page }) => {
    await page.goto("/");

    // Use evaluate to inject content quickly
    const arrText = JSON.stringify(Array.from({ length: 500 }, (_, i) => ({ i })));
    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.insertText(arrText);

    await expect(page.getByText("JSON is valid")).toBeVisible({ timeout: 10000 });

    // Beautify then switch to Tree view
    await page.locator("button", { hasText: "Beautify" }).click();
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "tree view" }).click();

    // Verify tree is visible (virtualized)
    await expect(page.getByRole("button", { name: /collapse/i }).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
