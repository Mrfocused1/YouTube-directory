import { chromium } from 'playwright';
import fs from 'fs/promises';

async function navigateToAdmin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // Mobile width
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('Step 1: Navigating to main page...');
  await page.goto('https://youtube-directory.vercel.app/', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  const screenshotDir = '/Users/paulbridges/Downloads/Directory/youtube-directory/admin-navigation';
  await fs.mkdir(screenshotDir, { recursive: true });

  // Screenshot the main page
  await page.screenshot({
    path: `${screenshotDir}/01-main-page.png`,
    fullPage: false
  });

  console.log('Step 2: Looking for user icon or menu...');

  // Try different selectors for the user icon/menu
  const userIconSelectors = [
    'button svg',
    '[aria-label*="user" i]',
    '[aria-label*="menu" i]',
    '[aria-label*="account" i]',
    'button:has(svg)',
    'nav button',
    'header button'
  ];

  let clicked = false;
  for (const selector of userIconSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        console.log(`Found clickable element: ${selector}`);
        const box = await element.boundingBox();
        if (box) {
          console.log(`  Position: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
        }
        await element.click();
        clicked = true;
        await page.waitForTimeout(2000);
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (clicked) {
    console.log('Step 3: Clicked user icon, capturing menu...');
    await page.screenshot({
      path: `${screenshotDir}/02-after-user-icon-click.png`,
      fullPage: false
    });

    // Look for admin link
    const adminSelectors = [
      'a:has-text("Admin")',
      'button:has-text("Admin")',
      '[href*="admin"]',
      'text=Admin Access',
      'text=Admin'
    ];

    for (const selector of adminSelectors) {
      try {
        const adminLink = await page.locator(selector).first();
        if (await adminLink.isVisible()) {
          console.log(`Found admin link: ${selector}`);
          await adminLink.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
  }

  // Capture current state
  console.log('Step 4: Capturing final state...');
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  await page.screenshot({
    path: `${screenshotDir}/03-final-page.png`,
    fullPage: true
  });

  // If we're on the admin page, analyze the cards
  if (currentUrl.includes('admin')) {
    console.log('Successfully reached admin page!');

    // Analyze cards
    const cardSelectors = [
      'article',
      '.card',
      '[class*="card"]',
      'div[class*="shadow"]',
      'div[class*="rounded"]',
      'main > div > div',
      '.grid > div'
    ];

    for (const selector of cardSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`\nFound ${count} cards using selector: ${selector}`);

        // Analyze first card
        const firstCard = await page.locator(selector).first();
        const cardBox = await firstCard.boundingBox();

        if (cardBox) {
          console.log(`First card dimensions: ${cardBox.width}x${cardBox.height}`);
          console.log(`Position: x=${cardBox.x}, right edge=${cardBox.x + cardBox.width}`);

          if (cardBox.x + cardBox.width > 375) {
            console.log(`⚠️ Card overflows viewport by ${(cardBox.x + cardBox.width) - 375}px`);
          }

          // Screenshot the card
          await firstCard.screenshot({
            path: `${screenshotDir}/card-example.png`
          });

          // Check buttons
          const buttons = await firstCard.locator('button').all();
          console.log(`Card has ${buttons.length} buttons`);

          for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const btnBox = await btn.boundingBox();
            if (btnBox) {
              const label = await btn.getAttribute('aria-label').catch(() => '') ||
                          await btn.textContent().catch(() => '') ||
                          `Button ${i + 1}`;
              console.log(`  ${label}: x=${btnBox.x}, width=${btnBox.width}, right=${btnBox.x + btnBox.width}`);

              if (btnBox.x + btnBox.width > 375) {
                console.log(`    ⚠️ OVERFLOW: ${(btnBox.x + btnBox.width) - 375}px beyond viewport`);
              }
            }
          }

          // Get CSS details
          const cssInfo = await firstCard.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              width: styles.width,
              padding: styles.padding,
              margin: styles.margin,
              display: styles.display,
              flexDirection: styles.flexDirection
            };
          });
          console.log('\nCard CSS:', cssInfo);
        }

        break;
      }
    }
  }

  console.log(`\nScreenshots saved to: ${screenshotDir}`);

  // Keep browser open for 5 seconds to observe
  await page.waitForTimeout(5000);
  await browser.close();
}

navigateToAdmin().catch(console.error);