import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X dimensions
    deviceScaleFactor: 2, // High DPI for clear screenshots
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  console.log('Navigating to YouTube Directory...');
  await page.goto('https://youtube-directory.vercel.app', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for content to load
  await page.waitForTimeout(2000);

  // Capture full page screenshot
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(__dirname, `mobile-screenshot-${timestamp}.png`);

  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  console.log(`Screenshot saved: ${screenshotPath}`);

  // Check for horizontal overflow
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  console.log(`Horizontal scroll detected: ${hasHorizontalScroll}`);

  // Get viewport and content dimensions
  const dimensions = await page.evaluate(() => {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight
      },
      body: {
        width: document.body.scrollWidth,
        height: document.body.scrollHeight
      }
    };
  });

  console.log('Dimensions:', JSON.stringify(dimensions, null, 2));

  // Check for elements extending beyond viewport
  const overflowingElements = await page.evaluate(() => {
    const elements = [];
    const allElements = document.querySelectorAll('*');

    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth || rect.left < 0) {
        elements.push({
          tag: el.tagName,
          class: el.className,
          id: el.id,
          rect: {
            left: rect.left,
            right: rect.right,
            width: rect.width
          },
          overflow: rect.right - window.innerWidth
        });
      }
    });

    return elements.slice(0, 10); // Limit to first 10 overflowing elements
  });

  if (overflowingElements.length > 0) {
    console.log('\nElements extending beyond viewport:');
    overflowingElements.forEach(el => {
      console.log(`- ${el.tag}${el.id ? '#' + el.id : ''}${el.class ? '.' + el.class : ''}`);
      console.log(`  Position: left=${el.rect.left}px, right=${el.rect.right}px, width=${el.rect.width}px`);
      console.log(`  Overflow: ${el.overflow}px beyond viewport\n`);
    });
  }

  // Check grid layout specifics
  const gridInfo = await page.evaluate(() => {
    const grid = document.querySelector('.grid, [class*="grid"]');
    if (!grid) return null;

    const cards = grid.querySelectorAll('*');
    const gridStyles = window.getComputedStyle(grid);

    return {
      gridClass: grid.className,
      gridWidth: grid.offsetWidth,
      gridPadding: gridStyles.padding,
      gridGap: gridStyles.gap || gridStyles.gridGap,
      gridTemplateColumns: gridStyles.gridTemplateColumns,
      cardCount: cards.length,
      firstCardWidth: cards[0] ? cards[0].offsetWidth : null,
      containerWidth: grid.parentElement ? grid.parentElement.offsetWidth : null
    };
  });

  if (gridInfo) {
    console.log('\nGrid Layout Information:');
    console.log(JSON.stringify(gridInfo, null, 2));
  }

  await browser.close();
})();