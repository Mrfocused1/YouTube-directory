import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureScreenshots() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--force-device-scale-factor=2'] // High DPI for clarity
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone 12/13 viewport
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'mobile-screenshots-analysis');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('Navigating to main page...');
  await page.goto('https://youtube-directory.vercel.app', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Capture main page - full page
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: path.join(screenshotDir, `main-page-full-${timestamp}.png`),
    fullPage: true
  });
  console.log('Captured main page full screenshot');

  // Capture just the video grid area
  const gridElement = await page.$('.grid');
  if (gridElement) {
    await gridElement.screenshot({
      path: path.join(screenshotDir, `video-grid-${timestamp}.png`)
    });
    console.log('Captured video grid screenshot');
  }

  // Capture individual card for detailed analysis
  const firstCard = await page.$('.grid > div:first-child');
  if (firstCard) {
    await firstCard.screenshot({
      path: path.join(screenshotDir, `single-card-${timestamp}.png`)
    });
    console.log('Captured single card screenshot');

    // Get card dimensions
    const cardDimensions = await firstCard.boundingBox();
    console.log('Card dimensions:', cardDimensions);
  }

  // Scroll down to capture more cards
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotDir, `main-page-scrolled-${timestamp}.png`)
  });
  console.log('Captured scrolled view screenshot');

  // Navigate to admin page
  console.log('Navigating to admin page...');
  const userIcon = await page.$('button svg, [aria-label*="user"], [aria-label*="admin"], header button:has(svg)');
  if (userIcon) {
    await userIcon.click();
    await page.waitForTimeout(2000);

    // Check if we're on admin page
    const currentUrl = page.url();
    if (currentUrl.includes('admin')) {
      await page.screenshot({
        path: path.join(screenshotDir, `admin-page-full-${timestamp}.png`),
        fullPage: true
      });
      console.log('Captured admin page screenshot');

      // Capture admin video grid if exists
      const adminGrid = await page.$('.grid');
      if (adminGrid) {
        await adminGrid.screenshot({
          path: path.join(screenshotDir, `admin-grid-${timestamp}.png`)
        });
        console.log('Captured admin grid screenshot');
      }
    } else {
      // Try clicking the user icon differently
      await page.goto('https://youtube-directory.vercel.app/admin', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: path.join(screenshotDir, `admin-page-direct-${timestamp}.png`),
        fullPage: true
      });
      console.log('Captured admin page via direct navigation');
    }
  }

  // Extract measurements and CSS properties
  console.log('\n=== Extracting measurements ===');

  await page.goto('https://youtube-directory.vercel.app', {
    waitUntil: 'networkidle'
  });
  await page.waitForTimeout(2000);

  const measurements = await page.evaluate(() => {
    const grid = document.querySelector('.grid');
    const cards = document.querySelectorAll('.grid > div');
    const firstCard = cards[0];

    if (!firstCard) return null;

    const gridStyles = window.getComputedStyle(grid);
    const cardStyles = window.getComputedStyle(firstCard);
    const cardRect = firstCard.getBoundingClientRect();

    // Get text elements
    const title = firstCard.querySelector('h3, .font-semibold');
    const channel = firstCard.querySelector('p:not(.font-semibold)');
    const thumbnail = firstCard.querySelector('img');

    return {
      grid: {
        gap: gridStyles.gap,
        padding: gridStyles.padding,
        columns: gridStyles.gridTemplateColumns,
        width: grid.getBoundingClientRect().width
      },
      card: {
        width: cardRect.width,
        height: cardRect.height,
        padding: cardStyles.padding,
        borderRadius: cardStyles.borderRadius,
        boxShadow: cardStyles.boxShadow
      },
      thumbnail: thumbnail ? {
        width: thumbnail.getBoundingClientRect().width,
        height: thumbnail.getBoundingClientRect().height,
        aspectRatio: thumbnail.style.aspectRatio || 'auto'
      } : null,
      typography: {
        title: title ? {
          fontSize: window.getComputedStyle(title).fontSize,
          lineHeight: window.getComputedStyle(title).lineHeight,
          fontWeight: window.getComputedStyle(title).fontWeight
        } : null,
        channel: channel ? {
          fontSize: window.getComputedStyle(channel).fontSize,
          lineHeight: window.getComputedStyle(channel).lineHeight,
          color: window.getComputedStyle(channel).color
        } : null
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  });

  console.log('Measurements:', JSON.stringify(measurements, null, 2));

  // Save measurements to file
  fs.writeFileSync(
    path.join(screenshotDir, 'measurements.json'),
    JSON.stringify(measurements, null, 2)
  );

  await browser.close();
  console.log('\nAll screenshots captured successfully!');
  console.log(`Screenshots saved to: ${screenshotDir}`);
}

captureScreenshots().catch(console.error);