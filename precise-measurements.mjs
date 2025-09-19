import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getPreciseMeasurements() {
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

  console.log('Navigating to page...');
  await page.goto('https://youtube-directory.vercel.app', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(2000);

  // Get precise measurements from the actual grid structure
  const measurements = await page.evaluate(() => {
    // Find the main grid container
    const gridContainer = document.querySelector('main > div > div.grid, [class*="grid"]');

    // Find actual video cards (divs with images and text)
    const cards = [];
    const allDivs = document.querySelectorAll('div');

    for (const div of allDivs) {
      const img = div.querySelector('img');
      const title = div.querySelector('p, h3');

      // Check if this div has both an image and text and is a reasonable size
      if (img && title && div.offsetWidth > 100 && div.offsetWidth < 300) {
        const rect = div.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          cards.push({
            element: div,
            rect: rect
          });
        }
      }
    }

    // Sort cards by position
    cards.sort((a, b) => {
      if (Math.abs(a.rect.top - b.rect.top) < 5) {
        return a.rect.left - b.rect.left;
      }
      return a.rect.top - b.rect.top;
    });

    if (cards.length === 0) {
      return { error: 'No video cards found' };
    }

    const firstCard = cards[0];
    const secondCard = cards[1];

    // Detect cards in first row
    const firstRowCards = cards.filter(c => Math.abs(c.rect.top - firstCard.rect.top) < 5);
    const cardsPerRow = firstRowCards.length;

    // Calculate gaps
    let horizontalGap = 0;
    let verticalGap = 0;

    if (cardsPerRow > 1) {
      horizontalGap = firstRowCards[1].rect.left - firstRowCards[0].rect.right;
    }

    // Find first card in second row
    const secondRowCard = cards.find(c => c.rect.top > firstCard.rect.bottom);
    if (secondRowCard) {
      verticalGap = secondRowCard.rect.top - firstCard.rect.bottom;
    }

    // Get detailed info from first card
    const cardEl = firstCard.element;
    const img = cardEl.querySelector('img');
    const title = cardEl.querySelector('p, h3');
    const channel = cardEl.querySelectorAll('p')[1] || cardEl.querySelector('p:last-of-type');

    const cardStyles = window.getComputedStyle(cardEl);
    const imgRect = img ? img.getBoundingClientRect() : null;

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      grid: {
        cardsPerRow: cardsPerRow,
        totalCards: cards.length,
        containerWidth: gridContainer ? gridContainer.getBoundingClientRect().width : window.innerWidth
      },
      cards: {
        dimensions: {
          width: Math.round(firstCard.rect.width),
          height: Math.round(firstCard.rect.height),
          aspectRatio: (firstCard.rect.width / firstCard.rect.height).toFixed(2)
        },
        spacing: {
          horizontalGap: Math.round(horizontalGap),
          verticalGap: Math.round(verticalGap),
          leftMargin: Math.round(firstCard.rect.left),
          rightMargin: Math.round(window.innerWidth - firstRowCards[firstRowCards.length - 1].rect.right)
        },
        styles: {
          padding: cardStyles.padding,
          borderRadius: cardStyles.borderRadius,
          backgroundColor: cardStyles.backgroundColor,
          border: cardStyles.border,
          boxShadow: cardStyles.boxShadow
        }
      },
      thumbnail: imgRect ? {
        width: Math.round(imgRect.width),
        height: Math.round(imgRect.height),
        aspectRatio: (imgRect.width / imgRect.height).toFixed(2),
        percentOfCard: Math.round((imgRect.height / firstCard.rect.height) * 100) + '%'
      } : null,
      typography: {
        title: title ? {
          text: title.innerText.substring(0, 30),
          fontSize: window.getComputedStyle(title).fontSize,
          lineHeight: window.getComputedStyle(title).lineHeight,
          fontWeight: window.getComputedStyle(title).fontWeight,
          color: window.getComputedStyle(title).color,
          maxLines: parseInt(window.getComputedStyle(title)['-webkit-line-clamp']) || 'none'
        } : null,
        channel: channel ? {
          text: channel.innerText.substring(0, 30),
          fontSize: window.getComputedStyle(channel).fontSize,
          color: window.getComputedStyle(channel).color
        } : null
      },
      recommendations: {
        cardWidth: `${Math.round(firstCard.rect.width)}px (Current)`,
        idealCardWidth: '160-175px (Mobile best practice)',
        currentAspectRatio: (firstCard.rect.width / firstCard.rect.height).toFixed(2),
        idealAspectRatio: '0.65-0.75 (Mobile cards)',
        spacing: horizontalGap < 8 ? 'Too tight - recommend 12-16px' : 'Good'
      }
    };
  });

  console.log('\n=== PRECISE MEASUREMENTS ===');
  console.log(JSON.stringify(measurements, null, 2));

  // Save measurements
  const analysisDir = path.join(__dirname, 'mobile-analysis-precise');
  if (!fs.existsSync(analysisDir)) {
    fs.mkdirSync(analysisDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(analysisDir, 'measurements.json'),
    JSON.stringify(measurements, null, 2)
  );

  // Take annotated screenshot
  await page.evaluate(() => {
    const cards = document.querySelectorAll('div');
    let count = 0;
    for (const div of cards) {
      const img = div.querySelector('img');
      const title = div.querySelector('p, h3');
      if (img && title && div.offsetWidth > 100 && div.offsetWidth < 300 && count < 4) {
        div.style.outline = '2px solid red';
        div.style.outlineOffset = '-2px';
        count++;
      }
    }
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: path.join(analysisDir, `annotated-cards-${timestamp}.png`)
  });

  await browser.close();
  console.log(`\nAnalysis saved to: ${analysisDir}`);
}

getPreciseMeasurements().catch(console.error);