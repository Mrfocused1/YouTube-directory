import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeAdminMobile() {
  console.log('Starting mobile UI analysis of admin page...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone 12/13/14 viewport
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  try {
    // Navigate to the main page
    console.log('Navigating to https://youtube-directory.vercel.app...');
    await page.goto('https://youtube-directory.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // First, take a screenshot of the main page to see the admin icon
    const mainScreenshotPath = path.join(__dirname, 'screenshots', 'mobile-main-375px.png');
    await page.screenshot({
      path: mainScreenshotPath,
      fullPage: false
    });
    console.log('Main page screenshot saved');

    // Look for admin icon/link - typically in the top right
    const adminSelectors = [
      'a[href*="admin"]',
      'button[aria-label*="admin"]',
      '[class*="admin"]',
      'svg[class*="user"]',
      'svg[class*="admin"]',
      '[data-testid*="admin"]',
      'a svg', // Generic SVG in link
      'button svg' // Generic SVG in button
    ];

    let adminLink = null;
    for (const selector of adminSelectors) {
      try {
        adminLink = await page.$(selector);
        if (adminLink) {
          console.log(`Found potential admin element with selector: ${selector}`);
          const box = await adminLink.boundingBox();
          if (box && box.x > 200) { // Likely in the top right if x > 200
            console.log(`Admin element position: x=${box.x}, y=${box.y}`);
            break;
          } else {
            adminLink = null;
          }
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    // If no specific admin link found, try clicking in top right area
    if (!adminLink) {
      console.log('Trying to click in top-right corner area...');
      await page.click('header', { position: { x: 340, y: 30 } }).catch(() => {});
      await page.waitForTimeout(1000);
    } else {
      await adminLink.click();
      console.log('Clicked admin link');
    }

    // Wait for navigation or check if we're on admin page
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // If not on admin page, try direct navigation
    if (!currentUrl.includes('admin')) {
      console.log('Navigating directly to /admin...');
      await page.goto('https://youtube-directory.vercel.app/admin', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(2000);
    }

    // Capture admin page screenshots
    console.log('Capturing admin page mobile screenshots...');

    // Full page screenshot
    const adminFullPath = path.join(__dirname, 'screenshots', 'admin-mobile-full-375px.png');
    await page.screenshot({
      path: adminFullPath,
      fullPage: true
    });
    console.log('Admin full page screenshot saved');

    // Above the fold screenshot
    const adminViewportPath = path.join(__dirname, 'screenshots', 'admin-mobile-viewport-375px.png');
    await page.screenshot({
      path: adminViewportPath,
      fullPage: false
    });
    console.log('Admin viewport screenshot saved');

    // Try to capture video cards specifically
    const cardSelectors = [
      '.video-card',
      '[class*="card"]',
      'article',
      '.grid > div',
      '[class*="grid"] > div'
    ];

    for (const selector of cardSelectors) {
      const cards = await page.$$(selector);
      if (cards.length > 0) {
        console.log(`Found ${cards.length} elements with selector: ${selector}`);

        // Capture first few cards
        for (let i = 0; i < Math.min(3, cards.length); i++) {
          const card = cards[i];
          const box = await card.boundingBox();
          if (box) {
            console.log(`Card ${i + 1} dimensions: width=${box.width}px, height=${box.height}px`);

            // Take screenshot of individual card
            const cardPath = path.join(__dirname, 'screenshots', `admin-card-${i + 1}-375px.png`);
            await card.screenshot({ path: cardPath });
          }
        }

        // Analyze grid/layout CSS
        const gridContainer = await page.$('[class*="grid"]');
        if (gridContainer) {
          const gridStyles = await gridContainer.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              display: computed.display,
              gridTemplateColumns: computed.gridTemplateColumns,
              gap: computed.gap,
              padding: computed.padding,
              width: computed.width
            };
          });
          console.log('Grid container styles:', JSON.stringify(gridStyles, null, 2));
        }

        // Get card styles
        const cardStyles = await cards[0].evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            width: computed.width,
            maxWidth: computed.maxWidth,
            minWidth: computed.minWidth,
            height: computed.height,
            padding: computed.padding,
            margin: computed.margin,
            display: computed.display,
            flexBasis: computed.flexBasis
          };
        });
        console.log('Card styles:', JSON.stringify(cardStyles, null, 2));

        break;
      }
    }

    // Scroll down to capture more cards if present
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);

    const adminScrolledPath = path.join(__dirname, 'screenshots', 'admin-mobile-scrolled-375px.png');
    await page.screenshot({
      path: adminScrolledPath,
      fullPage: false
    });
    console.log('Admin scrolled screenshot saved');

    // Extract and analyze CSS
    const analysisData = await page.evaluate(() => {
      const analysis = {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        cards: [],
        container: null
      };

      // Find card container
      const containers = document.querySelectorAll('[class*="grid"], .container, main');
      if (containers.length > 0) {
        const container = containers[0];
        const containerStyles = window.getComputedStyle(container);
        analysis.container = {
          tag: container.tagName,
          className: container.className,
          styles: {
            display: containerStyles.display,
            gridTemplateColumns: containerStyles.gridTemplateColumns,
            flexDirection: containerStyles.flexDirection,
            gap: containerStyles.gap,
            padding: containerStyles.padding,
            width: containerStyles.width
          }
        };
      }

      // Find cards
      const cardSelectors = ['.video-card', '[class*="card"]', 'article', '.grid > div'];
      let cards = [];

      for (const selector of cardSelectors) {
        cards = document.querySelectorAll(selector);
        if (cards.length > 0) break;
      }

      // Analyze first 5 cards
      for (let i = 0; i < Math.min(5, cards.length); i++) {
        const card = cards[i];
        const rect = card.getBoundingClientRect();
        const styles = window.getComputedStyle(card);

        analysis.cards.push({
          index: i,
          dimensions: {
            width: rect.width,
            height: rect.height,
            x: rect.x,
            y: rect.y
          },
          styles: {
            width: styles.width,
            maxWidth: styles.maxWidth,
            minWidth: styles.minWidth,
            padding: styles.padding,
            margin: styles.margin,
            boxSizing: styles.boxSizing
          },
          className: card.className
        });
      }

      return analysis;
    });

    console.log('\n=== CSS Analysis Results ===');
    console.log(JSON.stringify(analysisData, null, 2));

    // Save analysis to file
    fs.writeFileSync(
      path.join(__dirname, 'screenshots', 'mobile-analysis.json'),
      JSON.stringify(analysisData, null, 2)
    );

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await browser.close();
    console.log('\nAnalysis complete. Screenshots saved in ./screenshots/');
  }
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

analyzeAdminMobile();