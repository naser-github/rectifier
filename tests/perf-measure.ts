/**
 * Performance measurement script for Rectifier.
 *
 * Run: npx tsx tests/perf-measure.ts
 *
 * Prints validation and timing results to stdout.
 * Used to fill in doc/performance.md with real measurements.
 */

import type {Page} from "playwright";
import {chromium} from "playwright";
import {generateValidJson} from "./fixtures/createLargeJson";

async function measureValidation(page: Page, jsonText: string): Promise<number> {
  // Upload file
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "Upload JSON" }).click(),
  ]);

  await fileChooser.setFiles({
    name: "fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(jsonText, "utf-8"),
  });

  // Wait for "JSON is valid" to appear
  const start = Date.now();
  await page.getByText("JSON is valid").waitFor({ timeout: 120000 });
  return Date.now() - start;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("http://127.0.0.1:4173");

    // Warmup: small file
    const warmup = generateValidJson(100 * 1024);
    const [fw] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: "Upload JSON" }).click(),
    ]);
    await fw.setFiles({
      name: "warmup.json",
      mimeType: "application/json",
      buffer: Buffer.from(warmup.text, "utf-8"),
    });
    await page.getByText("JSON is valid").waitFor({ timeout: 30000 });

    const results: { size: string; timeMs: number }[] = [];

    // 1 MB
    const fixture1mb = generateValidJson(1024 * 1024);
    await page.goto("http://127.0.0.1:4173");
    const t1 = await measureValidation(page, fixture1mb.text);
    results.push({ size: "1 MB", timeMs: t1 });
    console.log("1 MB valid JSON validation:", t1, "ms");

    // 5 MB
    const fixture5mb = generateValidJson(5 * 1024 * 1024);
    await page.goto("http://127.0.0.1:4173");
    const t5 = await measureValidation(page, fixture5mb.text);
    results.push({ size: "5 MB", timeMs: t5 });
    console.log("5 MB valid JSON validation:", t5, "ms");

    console.log("\nResults for doc/performance.md:");
    for (const r of results) {
      console.log(`| ${r.size} valid | ${String(r.timeMs)} ms | Pass |`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
