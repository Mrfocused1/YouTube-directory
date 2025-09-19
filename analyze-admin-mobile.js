import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function analyzeAdminMobile() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X dimensions
    deviceScaleFactor: 2, // High DPI for clear screenshots
  });

  const page = await context.newPage();

  console.log('Navigating to YouTube Directory...');
  await page.goto('https://youtube-directory.vercel.app/', { waitUntil: 'networkidle' });

  // Click on user icon to access admin
  console.log('Clicking user icon to access admin...');
  const userIcon = await page.locator('button:has(svg), [aria-label*="user" i], .user-icon, svg[class*="user" i]').first();
  if (await userIcon.isVisible()) {
    await userIcon.click();
    await page.waitForTimeout(2000);
  }

  // Try to find and click admin link
  try {
    const adminLink = await page.locator('a[href*="admin"], button:has-text("Admin"), text=/admin/i').first();
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      throw new Error('Admin link not visible');
    }
  } catch (e) {
    // Try direct navigation
    console.log('Navigating directly to /admin...');
    await page.goto('https://youtube-directory.vercel.app/admin', { waitUntil: 'networkidle' });
  }

  await page.waitForTimeout(3000);

  // Create screenshots directory
  const screenshotDir = '/Users/paulbridges/Downloads/Directory/youtube-directory/admin-analysis';
  await fs.mkdir(screenshotDir, { recursive: true });

  // Take full page screenshot
  console.log('Capturing full page screenshot...');
  await page.screenshot({
    path: path.join(screenshotDir, 'admin-mobile-full.png'),
    fullPage: true
  });

  // Find video cards with admin buttons
  const cards = await page.locator('.video-card, [class*="card"], article, .grid > div').all();
  console.log(`Found ${cards.length} potential cards`);

  // Analyze first few cards with admin buttons
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const card = cards[i];

    // Check if this card has admin buttons
    const hasAdminButtons = await card.locator('button').count() > 0;
    if (!hasAdminButtons) continue;

    console.log(`Analyzing card ${i + 1}...`);

    // Scroll card into view
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Get card dimensions
    const boundingBox = await card.boundingBox();
    if (boundingBox) {
      console.log(`Card ${i + 1} dimensions:`, {
        width: boundingBox.width,
        height: boundingBox.height,
        x: boundingBox.x,
        y: boundingBox.y
      });

      // Take screenshot of individual card
      await card.screenshot({
        path: path.join(screenshotDir, `card-${i + 1}.png`)
      });

      // Analyze admin buttons
      const buttons = await card.locator('button').all();
      console.log(`Card ${i + 1} has ${buttons.length} buttons`);

      for (let j = 0; j < buttons.length; j++) {
        const button = buttons[j];
        const buttonBox = await button.boundingBox();
        const buttonText = await button.textContent().catch(() => '');
        const buttonAriaLabel = await button.getAttribute('aria-label').catch(() => '');

        if (buttonBox) {
          const isVisible = buttonBox.x + buttonBox.width <= 375;
          console.log(`  Button ${j + 1}:`, {
            text: buttonText || buttonAriaLabel || 'Unknown',
            width: buttonBox.width,
            x: buttonBox.x,
            rightEdge: buttonBox.x + buttonBox.width,
            isFullyVisible: isVisible,
            overflow: isVisible ? 0 : (buttonBox.x + buttonBox.width) - 375
          });
        }
      }
    }
  }

  // Analyze grid/container properties
  const container = await page.locator('.grid, [class*="grid"], main > div').first();
  const containerBox = await container.boundingBox();
  if (containerBox) {
    console.log('\nContainer dimensions:', {
      width: containerBox.width,
      padding: await container.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          left: styles.paddingLeft,
          right: styles.paddingRight,
          gap: styles.gap || styles.gridGap
        };
      })
    });
  }

  // Extract CSS information
  console.log('\nExtracting CSS properties...');
  const cssInfo = await page.evaluate(() => {
    const card = document.querySelector('.video-card, [class*="card"], article, .grid > div');
    if (!card) return null;

    const styles = window.getComputedStyle(card);
    const containerStyles = window.getComputedStyle(card.parentElement);

    return {
      card: {
        width: styles.width,
        maxWidth: styles.maxWidth,
        padding: styles.padding,
        margin: styles.margin,
        boxSizing: styles.boxSizing
      },
      container: {
        display: containerStyles.display,
        gridTemplateColumns: containerStyles.gridTemplateColumns,
        gap: containerStyles.gap || containerStyles.gridGap,
        padding: containerStyles.padding,
        width: containerStyles.width
      },
      viewport: {
        width: window.innerWidth,
        availableWidth: window.innerWidth - parseInt(containerStyles.paddingLeft) - parseInt(containerStyles.paddingRight)
      }
    };
  });

  console.log('\nCSS Analysis:', JSON.stringify(cssInfo, null, 2));

  // Take focused screenshot of problem area
  const problemCard = await page.locator('.video-card, [class*="card"]').first();
  if (await problemCard.isVisible()) {
    const box = await problemCard.boundingBox();
    if (box) {
      // Capture wider area to show overflow
      await page.screenshot({
        path: path.join(screenshotDir, 'problem-area.png'),
        clip: {
          x: Math.max(0, box.x - 20),
          y: box.y,
          width: Math.min(415, box.width + 40), // Show 20px on each side if possible
          height: box.height
        }
      });
    }
  }

  console.log(`\nScreenshots saved to: ${screenshotDir}`);
  console.log('\nAnalysis complete!');

  await browser.close();
}

analyzeAdminMobile().catch(console.error);