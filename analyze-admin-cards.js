import { chromium } from 'playwright';
import fs from 'fs/promises';

async function analyzeAdminCards() {
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

  const screenshotDir = '/Users/paulbridges/Downloads/Directory/youtube-directory/admin-card-analysis';
  await fs.mkdir(screenshotDir, { recursive: true });

  // Click user icon
  console.log('Step 2: Clicking user icon...');
  const userIcon = await page.locator('button svg').first();
  await userIcon.click();
  await page.waitForTimeout(2000);

  // Login to admin (using test credentials - you may need to adjust)
  console.log('Step 3: Logging in to admin...');
  await page.fill('input[type="text"], input[name="username"], #username', 'admin');
  await page.fill('input[type="password"], input[name="password"], #password', 'admin123');

  // Click login button
  await page.click('button:has-text("Login")');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('Step 4: Capturing admin page...');
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Take full page screenshot
  await page.screenshot({
    path: `${screenshotDir}/01-admin-page-full.png`,
    fullPage: true
  });

  // Take viewport screenshot
  await page.screenshot({
    path: `${screenshotDir}/02-admin-viewport.png`,
    fullPage: false
  });

  // Find and analyze video cards
  console.log('\nStep 5: Analyzing video cards...');

  // Try various selectors for cards
  const cardSelectors = [
    'article',
    '.card',
    '[class*="card"]',
    'div[class*="bg-gray"]',
    'div[class*="rounded"]',
    'main div[class*="p-"]',
    '.grid > div',
    'div:has(> button)'
  ];

  let cardsFound = false;
  for (const selector of cardSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      // Filter to only cards with buttons
      const cardsWithButtons = await page.locator(`${selector}:has(button)`).count();
      if (cardsWithButtons > 0) {
        console.log(`\nFound ${cardsWithButtons} cards with buttons using: ${selector}`);
        cardsFound = true;

        // Analyze first 3 cards
        const cards = await page.locator(`${selector}:has(button)`).all();
        for (let i = 0; i < Math.min(3, cards.length); i++) {
          const card = cards[i];
          const cardBox = await card.boundingBox();

          if (cardBox) {
            console.log(`\n=== Card ${i + 1} Analysis ===`);
            console.log(`Dimensions: ${cardBox.width}x${cardBox.height}`);
            console.log(`Position: x=${cardBox.x}, y=${cardBox.y}`);
            console.log(`Right edge: ${cardBox.x + cardBox.width}px`);

            if (cardBox.x + cardBox.width > 375) {
              console.log(`⚠️ CARD OVERFLOW: ${(cardBox.x + cardBox.width) - 375}px beyond viewport!`);
            }

            // Screenshot individual card
            await card.screenshot({
              path: `${screenshotDir}/card-${i + 1}.png`
            });

            // Analyze buttons within card
            const buttons = await card.locator('button').all();
            console.log(`Buttons found: ${buttons.length}`);

            let totalButtonsWidth = 0;
            let rightmostButtonEdge = 0;

            for (let j = 0; j < buttons.length; j++) {
              const btn = buttons[j];
              const btnBox = await btn.boundingBox();

              if (btnBox) {
                // Try to get button content/type
                const ariaLabel = await btn.getAttribute('aria-label').catch(() => '') || '';
                const title = await btn.getAttribute('title').catch(() => '') || '';
                const text = await btn.textContent().catch(() => '') || '';
                const hasPlay = await btn.locator('svg path[d*="M"]').count() > 0;
                const hasEdit = await btn.locator('svg path[d*="M"]').count() > 0;
                const hasDelete = text === 'X' || text === '×' || ariaLabel.toLowerCase().includes('delete') || title.toLowerCase().includes('delete');

                let buttonType = 'Unknown';
                if (hasPlay || ariaLabel.toLowerCase().includes('play')) buttonType = 'Play';
                else if (hasEdit || ariaLabel.toLowerCase().includes('edit')) buttonType = 'Edit';
                else if (hasDelete || text === 'X' || text === '×') buttonType = 'Delete/X';
                else if (text) buttonType = text;

                console.log(`  Button ${j + 1} (${buttonType}):`);
                console.log(`    Position: x=${btnBox.x}, width=${btnBox.width}`);
                console.log(`    Right edge: ${btnBox.x + btnBox.width}px`);

                totalButtonsWidth += btnBox.width;
                rightmostButtonEdge = Math.max(rightmostButtonEdge, btnBox.x + btnBox.width);

                if (btnBox.x + btnBox.width > 375) {
                  console.log(`    ⚠️ BUTTON OVERFLOW: ${(btnBox.x + btnBox.width) - 375}px beyond viewport!`);
                  console.log(`    This button is being trimmed/cut off!`);
                }
              }
            }

            console.log(`\nTotal buttons width: ${totalButtonsWidth}px`);
            console.log(`Rightmost button edge: ${rightmostButtonEdge}px`);

            // Get card's CSS properties
            const cssInfo = await card.evaluate(el => {
              const styles = window.getComputedStyle(el);
              const parent = el.parentElement;
              const parentStyles = parent ? window.getComputedStyle(parent) : null;

              return {
                card: {
                  width: styles.width,
                  maxWidth: styles.maxWidth,
                  padding: styles.padding,
                  margin: styles.margin,
                  display: styles.display,
                  flexDirection: styles.flexDirection,
                  gap: styles.gap
                },
                parent: parentStyles ? {
                  display: parentStyles.display,
                  gridTemplateColumns: parentStyles.gridTemplateColumns,
                  gap: parentStyles.gap,
                  padding: parentStyles.padding
                } : null
              };
            });

            console.log('\nCard CSS:', JSON.stringify(cssInfo.card, null, 2));
            if (cssInfo.parent) {
              console.log('Parent CSS:', JSON.stringify(cssInfo.parent, null, 2));
            }

            // Calculate recommended width
            const viewportWidth = 375;
            const containerPadding = cardBox.x; // Approximate container padding
            const availableWidth = viewportWidth - (containerPadding * 2);
            const currentOverflow = rightmostButtonEdge - viewportWidth;

            if (currentOverflow > 0) {
              const recommendedCardWidth = cardBox.width - currentOverflow - 10; // 10px safety margin
              console.log(`\n📐 RECOMMENDATION:`);
              console.log(`  Current card width: ${cardBox.width}px`);
              console.log(`  Overflow amount: ${currentOverflow}px`);
              console.log(`  Recommended max card width: ${recommendedCardWidth}px`);
              console.log(`  This would require reducing card width by: ${cardBox.width - recommendedCardWidth}px`);
            }
          }
        }

        // Also capture a zoomed out view to show the overflow
        await page.evaluate(() => {
          document.body.style.zoom = '0.8';
        });
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `${screenshotDir}/03-zoomed-out-view.png`,
          fullPage: false
        });
        await page.evaluate(() => {
          document.body.style.zoom = '1';
        });

        break;
      }
    }
  }

  if (!cardsFound) {
    console.log('No cards with buttons found. Page structure:');
    const structure = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return 'No main element';
      return main.innerHTML.substring(0, 500);
    });
    console.log(structure);
  }

  // Measure viewport and available space
  console.log('\n=== Viewport Analysis ===');
  const viewportInfo = await page.evaluate(() => {
    const body = document.body;
    const main = document.querySelector('main');
    const container = document.querySelector('.container, .grid, [class*="container"], [class*="grid"]');

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      body: {
        width: body.offsetWidth,
        scrollWidth: body.scrollWidth,
        hasHorizontalScroll: body.scrollWidth > window.innerWidth
      },
      main: main ? {
        width: main.offsetWidth,
        padding: window.getComputedStyle(main).padding
      } : null,
      container: container ? {
        width: container.offsetWidth,
        padding: window.getComputedStyle(container).padding,
        margin: window.getComputedStyle(container).margin
      } : null
    };
  });

  console.log(JSON.stringify(viewportInfo, null, 2));

  console.log(`\nAnalysis complete! Screenshots saved to: ${screenshotDir}`);

  // Keep browser open for observation
  await page.waitForTimeout(5000);
  await browser.close();
}

analyzeAdminCards().catch(console.error);