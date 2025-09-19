import { chromium } from 'playwright';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

async function analyzeMobileAdminCards() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Load the mock admin page
  const mockPagePath = 'file://' + path.resolve('/Users/paulbridges/Downloads/Directory/youtube-directory/mock-admin-page.html');
  console.log('Loading mock admin page at 375px mobile width...');
  await page.goto(mockPagePath);

  const screenshotDir = '/Users/paulbridges/Downloads/Directory/youtube-directory/mobile-analysis-results';
  await fs.mkdir(screenshotDir, { recursive: true });

  // Take full page screenshot
  await page.screenshot({
    path: `${screenshotDir}/01-full-page-375px.png`,
    fullPage: true
  });

  console.log('\n' + '='.repeat(60));
  console.log('MOBILE ADMIN CARDS ANALYSIS - 375px WIDTH');
  console.log('='.repeat(60));

  // Analyze the problematic cards
  console.log('\n🔴 ORIGINAL PROBLEMATIC CARDS:');
  console.log('-'.repeat(40));

  const problemCards = await page.locator('.video-card').all();
  for (let i = 0; i < problemCards.length; i++) {
    const card = problemCards[i];
    const box = await card.boundingBox();

    if (box) {
      console.log(`\nCard ${i + 1}:`);
      console.log(`  Width: ${box.width}px`);
      console.log(`  Position: x=${box.x}px`);
      console.log(`  Right edge: ${box.x + box.width}px`);

      // Check if card overflows
      if (box.x + box.width > 375) {
        console.log(`  ⚠️ OVERFLOW: ${(box.x + box.width) - 375}px beyond viewport!`);
      }

      // Analyze buttons
      const buttons = await card.locator('.admin-button').all();
      console.log(`  Buttons: ${buttons.length}`);

      for (let j = 0; j < buttons.length; j++) {
        const btn = buttons[j];
        const btnBox = await btn.boundingBox();
        const btnText = await btn.textContent();

        if (btnBox) {
          const rightEdge = btnBox.x + btnBox.width;
          console.log(`    Button ${j + 1} (${btnText.trim()}):`);
          console.log(`      Position: x=${btnBox.x}px, width=${btnBox.width}px`);
          console.log(`      Right edge: ${rightEdge}px`);

          if (rightEdge > 375) {
            console.log(`      🚨 TRIMMED: ${rightEdge - 375}px cut off!`);
          }
        }
      }

      // Take screenshot of problematic card
      await card.screenshot({
        path: `${screenshotDir}/problem-card-${i + 1}.png`
      });
    }
  }

  // Analyze the fixed cards
  console.log('\n✅ FIXED CARDS:');
  console.log('-'.repeat(40));

  const fixedCards = await page.locator('.video-card-fixed').all();
  for (let i = 0; i < fixedCards.length; i++) {
    const card = fixedCards[i];
    const box = await card.boundingBox();

    if (box) {
      console.log(`\nFixed Card ${i + 1}:`);
      console.log(`  Width: ${box.width}px`);
      console.log(`  Position: x=${box.x}px`);
      console.log(`  Right edge: ${box.x + box.width}px`);

      // Check if card fits
      if (box.x + box.width <= 375) {
        console.log(`  ✓ Fits within viewport`);
      }

      // Analyze buttons
      const buttons = await card.locator('.admin-button-fixed').all();
      console.log(`  Buttons: ${buttons.length}`);

      let allButtonsFit = true;
      for (let j = 0; j < buttons.length; j++) {
        const btn = buttons[j];
        const btnBox = await btn.boundingBox();
        const btnText = await btn.textContent();

        if (btnBox) {
          const rightEdge = btnBox.x + btnBox.width;
          console.log(`    Button ${j + 1} (${btnText.trim()}):`);
          console.log(`      Position: x=${btnBox.x}px, width=${btnBox.width}px`);
          console.log(`      Right edge: ${rightEdge}px`);

          if (rightEdge > 375) {
            allButtonsFit = false;
            console.log(`      ⚠️ Still overflows!`);
          } else {
            console.log(`      ✓ Fully visible`);
          }
        }
      }

      if (allButtonsFit) {
        console.log(`  ✅ All buttons fully visible!`);
      }

      // Take screenshot of fixed card
      await card.screenshot({
        path: `${screenshotDir}/fixed-card-${i + 1}.png`
      });
    }
  }

  // Calculate and display recommendations
  console.log('\n' + '='.repeat(60));
  console.log('📐 RECOMMENDATIONS FOR FIXING X BUTTON TRIMMING:');
  console.log('='.repeat(60));

  const viewportWidth = 375;
  const containerPadding = 20; // Typical padding
  const availableWidth = viewportWidth - (containerPadding * 2);

  console.log(`\n1. VIEWPORT CONSTRAINTS:`);
  console.log(`   - Mobile viewport width: ${viewportWidth}px`);
  console.log(`   - Container padding: ${containerPadding}px × 2 = ${containerPadding * 2}px`);
  console.log(`   - Available width for cards: ${availableWidth}px`);

  console.log(`\n2. CARD WIDTH SOLUTION:`);
  console.log(`   - Set max-width: ${availableWidth}px (or calc(100% - 10px) for safety)`);
  console.log(`   - Reduce card padding from 16px to 12px`);
  console.log(`   - This saves: 8px total (4px × 2 sides)`);

  console.log(`\n3. BUTTON OPTIMIZATION:`);
  console.log(`   - Reduce button gap from 8px to 6px`);
  console.log(`   - Reduce button padding from 8px to 6px`);
  console.log(`   - Use smaller font size (12px instead of 14px)`);
  console.log(`   - For delete button, use just "✖" icon without text`);

  console.log(`\n4. CSS CHANGES NEEDED:`);
  console.log(`   .video-card {`);
  console.log(`     max-width: 335px;`);
  console.log(`     padding: 12px;`);
  console.log(`   }`);
  console.log(`   `);
  console.log(`   .admin-buttons {`);
  console.log(`     gap: 6px;`);
  console.log(`   }`);
  console.log(`   `);
  console.log(`   .admin-button {`);
  console.log(`     padding: 6px;`);
  console.log(`     font-size: 12px;`);
  console.log(`     min-height: 32px;`);
  console.log(`   }`);

  console.log(`\n5. SPACE SAVINGS BREAKDOWN:`);
  const originalCardWidth = 335 + 32; // With padding
  const fixedCardWidth = 335;
  const savings = originalCardWidth - fixedCardWidth;

  console.log(`   - Original card total width: ${originalCardWidth}px`);
  console.log(`   - Fixed card total width: ${fixedCardWidth}px`);
  console.log(`   - Total space saved: ${savings}px`);
  console.log(`   - This ensures X button is fully visible!`);

  // Take comparison screenshot
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `${screenshotDir}/02-comparison-view.png`,
    fullPage: false,
    clip: { x: 0, y: 100, width: 375, height: 600 }
  });

  console.log(`\n✅ Analysis complete!`);
  console.log(`Screenshots saved to: ${screenshotDir}`);

  await page.waitForTimeout(5000);
  await browser.close();
}

analyzeMobileAdminCards().catch(console.error);