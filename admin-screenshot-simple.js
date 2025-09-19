import { chromium } from 'playwright';
import fs from 'fs/promises';

async function captureAdminMobile() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // Mobile width
    deviceScaleFactor: 2, // High DPI
  });

  const page = await context.newPage();

  console.log('Navigating directly to admin page...');
  await page.goto('https://youtube-directory.vercel.app/admin', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  await page.waitForTimeout(5000); // Wait for content to load

  // Create screenshots directory
  const screenshotDir = '/Users/paulbridges/Downloads/Directory/youtube-directory/admin-mobile-screenshots';
  await fs.mkdir(screenshotDir, { recursive: true });

  // Take full page screenshot
  console.log('Taking full page screenshot...');
  await page.screenshot({
    path: `${screenshotDir}/admin-full-page-375px.png`,
    fullPage: true
  });

  // Take viewport screenshot
  console.log('Taking viewport screenshot...');
  await page.screenshot({
    path: `${screenshotDir}/admin-viewport-375px.png`,
    fullPage: false
  });

  // Log what we see on the page
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);

  // Check for any cards or grid items
  const possibleSelectors = [
    'article',
    '.card',
    '[class*="card"]',
    '.grid > *',
    '[class*="grid"] > *',
    'main div[class*="rounded"]',
    'div[class*="shadow"]',
    '.video-item',
    '[class*="video"]'
  ];

  for (const selector of possibleSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`Found ${count} elements matching: ${selector}`);

      // Take screenshot of first item
      const firstItem = await page.locator(selector).first();
      const box = await firstItem.boundingBox();
      if (box) {
        console.log(`  First item dimensions: ${box.width}x${box.height} at (${box.x}, ${box.y})`);

        // Screenshot the item
        await firstItem.screenshot({
          path: `${screenshotDir}/first-item-${selector.replace(/[\[\]*:>. ]/g, '_')}.png`
        });

        // Check for buttons in this item
        const buttons = await firstItem.locator('button').count();
        if (buttons > 0) {
          console.log(`  Item has ${buttons} buttons`);

          // Get details of each button
          const buttonElements = await firstItem.locator('button').all();
          for (let i = 0; i < buttonElements.length; i++) {
            const btn = buttonElements[i];
            const btnBox = await btn.boundingBox();
            const btnText = await btn.textContent().catch(() => '');
            const btnAriaLabel = await btn.getAttribute('aria-label').catch(() => '');

            if (btnBox) {
              console.log(`    Button ${i + 1}: "${btnText || btnAriaLabel || 'Icon'}" at x=${btnBox.x}, width=${btnBox.width}, right edge=${btnBox.x + btnBox.width}`);
              const overflows = (btnBox.x + btnBox.width) > 375;
              if (overflows) {
                console.log(`      ⚠️ OVERFLOW: Button extends ${(btnBox.x + btnBox.width) - 375}px beyond viewport!`);
              }
            }
          }
        }
      }

      break; // Found items, stop looking
    }
  }

  // Get page HTML structure for debugging
  const htmlStructure = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return 'No main element found';

    const structure = [];
    const traverse = (element, depth = 0) => {
      if (depth > 3) return;
      const tag = element.tagName.toLowerCase();
      const classes = element.className;
      const childCount = element.children.length;

      structure.push(`${'  '.repeat(depth)}${tag}${classes ? `.${classes.split(' ').join('.')}` : ''} (${childCount} children)`);

      for (let child of element.children) {
        traverse(child, depth + 1);
      }
    };

    traverse(main);
    return structure.join('\n');
  });

  console.log('\nPage structure:\n', htmlStructure);

  console.log(`\nScreenshots saved to: ${screenshotDir}`);
  await browser.close();
}

captureAdminMobile().catch(console.error);