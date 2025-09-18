import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2
    });

    const page = await context.newPage();

    console.log('Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any animations or lazy-loaded images
    await page.waitForTimeout(3000);

    // Take full page screenshot
    const screenshotPath = path.join(__dirname, 'tower-bridge-check.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false // Keep viewport size for better quality
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Also capture at different viewport sizes
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(1000);

      const vpScreenshotPath = path.join(__dirname, `tower-bridge-check-${vp.name}.png`);
      await page.screenshot({
        path: vpScreenshotPath,
        fullPage: false
      });
      console.log(`${vp.name} screenshot saved to: ${vpScreenshotPath}`);
    }

  } catch (error) {
    console.error('Error capturing screenshot:', error);
  } finally {
    await browser.close();
  }
})();