import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Loading page with updated brightness...');
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const timestamp = Date.now();
  await page.screenshot({
    path: `tower-bridge-fixed-${timestamp}.png`,
    fullPage: true
  });
  console.log(`Screenshot saved: tower-bridge-fixed-${timestamp}.png`);
  
  // Verify the filter settings
  const filterSettings = await page.evaluate(() => {
    const bgDiv = document.querySelector('div[style*="tower-bridge"]');
    if (bgDiv) {
      const style = window.getComputedStyle(bgDiv);
      return {
        filter: style.filter,
        backgroundImage: style.backgroundImage
      };
    }
    return null;
  });
  
  console.log('Current filter settings:', filterSettings);
  
  await browser.close();
})();
