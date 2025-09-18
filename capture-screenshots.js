import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Define viewport sizes
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'large-desktop', width: 1920, height: 1080 }
  ];

  try {
    // Navigate to the website
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

    // Capture screenshots at different viewport sizes
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Wait for responsive adjustments

      // Full page screenshot
      await page.screenshot({
        path: `screenshots/current-${viewport.name}-full.png`,
        fullPage: true
      });

      // Viewport screenshot
      await page.screenshot({
        path: `screenshots/current-${viewport.name}-viewport.png`,
        fullPage: false
      });

      console.log(`Captured screenshots for ${viewport.name} (${viewport.width}x${viewport.height})`);
    }

    // Capture specific elements at desktop size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Try to capture header
    const header = await page.$('header, nav, .header, .navbar');
    if (header) {
      await header.screenshot({ path: 'screenshots/element-header.png' });
    }

    // Try to capture video cards
    const firstCard = await page.$('.video-card, .card, [class*="card"]');
    if (firstCard) {
      await firstCard.screenshot({ path: 'screenshots/element-card.png' });
    }

    // Try to capture search bar
    const search = await page.$('input[type="search"], .search, [class*="search"]');
    if (search) {
      await search.screenshot({ path: 'screenshots/element-search.png' });
    }

    console.log('Screenshot capture complete!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
})();