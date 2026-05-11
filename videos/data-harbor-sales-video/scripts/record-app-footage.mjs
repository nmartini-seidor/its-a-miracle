import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.env.REPO_ROOT ? path.resolve(process.env.REPO_ROOT) : process.cwd();
const RAW_DIR = path.join(ROOT, "output/playwright/data-harbor-redo");
const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";
const VIEWPORT = { width: 1440, height: 900 };
const PLAYWRIGHT_MODULE = process.env.PLAYWRIGHT_MODULE ?? "playwright";
const playwrightImport = PLAYWRIGHT_MODULE.startsWith("/")
  ? pathToFileURL(PLAYWRIGHT_MODULE).href
  : PLAYWRIGHT_MODULE;
const playwright = await import(playwrightImport);
const chromium = playwright.chromium ?? playwright.default?.chromium;
if (!chromium) throw new Error("Unable to load Playwright chromium");

async function settle(page, ms = 700) {
  await page.waitForTimeout(ms);
}

async function hideDevChrome(page) {
  await page.addStyleTag({
    content: `
      [aria-label="Open Next.js Dev Tools"],
      nextjs-portal {
        display: none !important;
      }
      body {
        cursor: default !important;
      }
    `,
  });
}

async function recordClip(browser, name, run) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: {
      dir: RAW_DIR,
      size: VIEWPORT,
    },
  });
  const page = await context.newPage();
  await run(page);
  const video = page.video();
  await page.close();
  await context.close();
  const rawPath = path.join(RAW_DIR, `${name}.webm`);
  await video.saveAs(rawPath);
  console.log(rawPath);
}

await fs.mkdir(RAW_DIR, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  await recordClip(browser, "triage-batch-research", async (page) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await hideDevChrome(page);
    await settle(page, 900);

    await page.getByRole("button", { name: "Run Research Agent" }).click();
    await settle(page, 600);
    await page.locator('input[type="checkbox"]').nth(0).check();
    await settle(page, 260);
    await page.locator('input[type="checkbox"]').nth(1).check();
    await settle(page, 450);
    await page.getByRole("button", { name: /Queue Research for 2 Products/ }).click();
    await settle(page, 5600);
  });

  await recordClip(browser, "single-product-accept", async (page) => {
    await page.goto(`${BASE_URL}/products/sony-wh1000xm5`, { waitUntil: "networkidle" });
    await hideDevChrome(page);
    await settle(page, 700);

    await page.getByRole("button", { name: "Run Research Agent" }).click();
    await page.getByRole("button", { name: "Run Research Agent" }).waitFor({ state: "visible", timeout: 30000 });
    await settle(page, 800);
    await page.getByRole("tab", { name: "Candidates" }).click();
    await settle(page, 900);
    await page.getByRole("button", { name: "Approve ALL" }).click();
    await settle(page, 2200);
  });

  await recordClip(browser, "governance-schemas-aggregators", async (page) => {
    await page.goto(`${BASE_URL}/schemas`, { waitUntil: "networkidle" });
    await hideDevChrome(page);
    await settle(page, 900);
    await page.mouse.wheel(0, 460);
    await settle(page, 850);
    await page.goto(`${BASE_URL}/aggregators`, { waitUntil: "networkidle" });
    await hideDevChrome(page);
    await settle(page, 900);
    await page.mouse.wheel(0, 420);
    await settle(page, 1200);
  });
} finally {
  await browser.close();
}
