import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureDetailedAnalysis() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--force-device-scale-factor=2']
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'mobile-analysis-detailed');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  console.log('Navigating to main page...');
  await page.goto('https://youtube-directory.vercel.app', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for grid to load
  await page.waitForSelector('.grid', { timeout: 10000 }).catch(() => {
    console.log('Grid not found with .grid selector, trying alternative selectors...');
  });

  // Try to find the grid with various selectors
  const gridSelectors = [
    '.grid',
    '[class*="grid"]',
    'main div:has(> div > img)',
    'div:has(> div > div > img)'
  ];

  let gridElement = null;
  for (const selector of gridSelectors) {
    gridElement = await page.$(selector);
    if (gridElement) {
      console.log(`Found grid with selector: ${selector}`);
      break;
    }
  }

  // Capture full page
  await page.screenshot({
    path: path.join(screenshotDir, `full-page-${timestamp}.png`),
    fullPage: true
  });
  console.log('Captured full page');

  // Capture above the fold
  await page.screenshot({
    path: path.join(screenshotDir, `above-fold-${timestamp}.png`)
  });
  console.log('Captured above fold');

  // Extract detailed measurements
  const measurements = await page.evaluate(() => {
    // Find all video cards
    const cards = Array.from(document.querySelectorAll('div')).filter(div => {
      const img = div.querySelector('img');
      const hasText = div.querySelector('p') || div.querySelector('h3');
      return img && hasText && div.offsetWidth > 100;
    });

    if (cards.length === 0) {
      return { error: 'No cards found' };
    }

    const firstCard = cards[0];
    const parentGrid = firstCard.parentElement;

    // Get computed styles
    const cardStyles = window.getComputedStyle(firstCard);
    const gridStyles = parentGrid ? window.getComputedStyle(parentGrid) : null;

    // Get card boundaries
    const cardRect = firstCard.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();

    // Find text elements
    const titleElement = firstCard.querySelector('h3, p.font-semibold, p:first-of-type');
    const channelElement = firstCard.querySelector('p:not(.font-semibold):last-of-type, p:nth-of-type(2)');
    const thumbnail = firstCard.querySelector('img');

    // Calculate actual spacing
    const secondCard = cards[1];
    const horizontalGap = secondCard ?
      (secondCard.getBoundingClientRect().left - cardRect.right) : 0;

    const cardsPerRow = Math.floor(window.innerWidth / (cardRect.width + horizontalGap));

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollHeight: document.body.scrollHeight
      },
      grid: gridStyles ? {
        display: gridStyles.display,
        gridTemplateColumns: gridStyles.gridTemplateColumns,
        gap: gridStyles.gap,
        padding: gridStyles.padding,
        margin: gridStyles.margin,
        width: parentGrid.getBoundingClientRect().width
      } : null,
      card: {
        count: cards.length,
        cardsPerRow: cardsPerRow,
        dimensions: {
          width: cardRect.width,
          height: cardRect.height,
          aspectRatio: (cardRect.width / cardRect.height).toFixed(2)
        },
        spacing: {
          horizontalGap: horizontalGap,
          verticalGap: cards[cardsPerRow] ?
            (cards[cardsPerRow].getBoundingClientRect().top - cardRect.bottom) : 0,
          marginLeft: cardRect.left,
          marginRight: window.innerWidth - cardRect.right - horizontalGap
        },
        styles: {
          padding: cardStyles.padding,
          margin: cardStyles.margin,
          borderRadius: cardStyles.borderRadius,
          backgroundColor: cardStyles.backgroundColor,
          boxShadow: cardStyles.boxShadow
        }
      },
      thumbnail: thumbnail ? {
        dimensions: {
          width: thumbnail.getBoundingClientRect().width,
          height: thumbnail.getBoundingClientRect().height,
          aspectRatio: (thumbnail.width / thumbnail.height).toFixed(2)
        },
        styles: {
          objectFit: window.getComputedStyle(thumbnail).objectFit,
          borderRadius: window.getComputedStyle(thumbnail).borderRadius
        }
      } : null,
      typography: {
        title: titleElement ? {
          text: titleElement.innerText.substring(0, 50),
          fontSize: window.getComputedStyle(titleElement).fontSize,
          lineHeight: window.getComputedStyle(titleElement).lineHeight,
          fontWeight: window.getComputedStyle(titleElement).fontWeight,
          color: window.getComputedStyle(titleElement).color,
          numberOfLines: Math.ceil(titleElement.scrollHeight / parseFloat(window.getComputedStyle(titleElement).lineHeight))
        } : null,
        channel: channelElement ? {
          text: channelElement.innerText.substring(0, 50),
          fontSize: window.getComputedStyle(channelElement).fontSize,
          lineHeight: window.getComputedStyle(channelElement).lineHeight,
          color: window.getComputedStyle(channelElement).color
        } : null
      },
      performance: {
        visibleCards: cards.filter(card => {
          const rect = card.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        }).length
      }
    };
  });

  console.log('\n=== DETAILED MEASUREMENTS ===');
  console.log(JSON.stringify(measurements, null, 2));

  // Save measurements
  fs.writeFileSync(
    path.join(screenshotDir, 'measurements.json'),
    JSON.stringify(measurements, null, 2)
  );

  // Capture individual card close-up
  const cardSelector = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(div => {
      const img = div.querySelector('img');
      const hasText = div.querySelector('p');
      return img && hasText && div.offsetWidth > 100;
    });
    return cards.length > 0 ? cards[0].className || 'div' : null;
  });

  if (cardSelector) {
    const card = await page.$(`div:has(img):has(p)`);
    if (card) {
      await card.screenshot({
        path: path.join(screenshotDir, `single-card-${timestamp}.png`)
      });
      console.log('Captured single card');
    }
  }

  // Scroll to middle and capture
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotDir, `middle-scroll-${timestamp}.png`)
  });
  console.log('Captured middle scroll');

  // Test admin page
  console.log('\nTesting admin navigation...');

  // Try user icon click
  const userButton = await page.$('header button:has(svg)');
  if (userButton) {
    await userButton.click();
    await page.waitForTimeout(2000);

    if (page.url().includes('admin')) {
      await page.screenshot({
        path: path.join(screenshotDir, `admin-page-${timestamp}.png`),
        fullPage: true
      });
      console.log('Captured admin page via button');
    }
  }

  // Direct navigation fallback
  if (!page.url().includes('admin')) {
    await page.goto('https://youtube-directory.vercel.app/admin', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotDir, `admin-direct-${timestamp}.png`),
      fullPage: true
    });
    console.log('Captured admin page via direct navigation');
  }

  await browser.close();
  console.log(`\nAnalysis complete! Screenshots saved to: ${screenshotDir}`);
}

captureDetailedAnalysis().catch(console.error);