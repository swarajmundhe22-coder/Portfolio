const { chromium, firefox, webkit } = require("playwright");

const targetUrl = process.argv[2] || "http://localhost:5173/";
const screenshotPath = process.argv[3] || "analysis/visual_status/live-runtime.png";
const browserName = (process.argv[4] || "chromium").toLowerCase();

const browserType =
  browserName === "firefox" ? firefox : browserName === "webkit" ? webkit : chromium;

(async () => {
  const browser = await browserType.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleLogs = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  let status = null;
  let navigationError = null;

  try {
    const response = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    status = response ? response.status() : null;
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error);
  }

  await page.waitForTimeout(3500);

  const rootSnapshot = await page.evaluate(() => {
    const root = document.getElementById("root");
    const app = document.querySelector(".portfolio-app");
    const bootLoader = document.querySelector(".boot-loader");
    const bodyStyle = window.getComputedStyle(document.body);

    return {
      rootExists: Boolean(root),
      rootHtmlLength: root ? root.innerHTML.length : -1,
      hasPortfolioApp: Boolean(app),
      bootLoaderOpacity: bootLoader ? window.getComputedStyle(bootLoader).opacity : "missing",
      bodyBackground: bodyStyle.backgroundColor,
      bodyTextLength: (document.body.innerText || "").trim().length,
      bodyTextPreview: (document.body.innerText || "").trim().slice(0, 200),
    };
  });

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const summary = {
    browserName,
    targetUrl,
    screenshotPath,
    status,
    navigationError,
    pageErrors,
    consoleLogs: consoleLogs.slice(0, 20),
    rootSnapshot,
  };

  console.log(JSON.stringify(summary, null, 2));

  await browser.close();
})();