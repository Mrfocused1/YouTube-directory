import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeMobileCards() {
  console.log('Starting comprehensive mobile UI analysis...');

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
    // Navigate to the main page first
    console.log('\n=== ANALYZING MAIN PAGE ===');
    console.log('Navigating to https://youtube-directory.vercel.app...');
    await page.goto('https://youtube-directory.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Analyze main page cards
    console.log('\nAnalyzing video cards on main page...');

    // Capture full page
    const mainFullPath = path.join(__dirname, 'screenshots', 'main-mobile-full-375px.png');
    await page.screenshot({
      path: mainFullPath,
      fullPage: true
    });
    console.log('Main full page screenshot saved');

    // Analyze card layout
    const mainPageAnalysis = await page.evaluate(() => {
      const analysis = {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        cards: [],
        container: null,
        grid: null
      };

      // Find the main container
      const containers = document.querySelectorAll('main, [class*="container"], [class*="grid"]');

      // Find the grid container specifically
      const gridContainers = document.querySelectorAll('[class*="grid"]:has(> a), [class*="grid"]:has(> div)');
      if (gridContainers.length > 0) {
        const grid = gridContainers[0];
        const gridStyles = window.getComputedStyle(grid);
        analysis.grid = {
          tag: grid.tagName,
          className: grid.className,
          childCount: grid.children.length,
          styles: {
            display: gridStyles.display,
            gridTemplateColumns: gridStyles.gridTemplateColumns,
            gap: gridStyles.gap,
            padding: gridStyles.padding,
            margin: gridStyles.margin,
            width: gridStyles.width
          }
        };
      }

      // Find video cards - they appear to be links with images
      const cards = document.querySelectorAll('a[href*="youtube"], a[href*="youtu.be"], main a, [class*="grid"] > a');

      // Analyze first 6 cards
      for (let i = 0; i < Math.min(6, cards.length); i++) {
        const card = cards[i];
        const rect = card.getBoundingClientRect();
        const styles = window.getComputedStyle(card);

        // Find image within card
        const img = card.querySelector('img');
        let imgInfo = null;
        if (img) {
          const imgRect = img.getBoundingClientRect();
          const imgStyles = window.getComputedStyle(img);
          imgInfo = {
            width: imgRect.width,
            height: imgRect.height,
            objectFit: imgStyles.objectFit,
            aspectRatio: imgStyles.aspectRatio
          };
        }

        analysis.cards.push({
          index: i,
          position: {
            row: Math.floor(i / 2), // Assuming 2 per row
            col: i % 2
          },
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
            height: styles.height,
            padding: styles.padding,
            margin: styles.margin,
            display: styles.display,
            position: styles.position,
            overflow: styles.overflow
          },
          image: imgInfo,
          href: card.href,
          className: card.className
        });
      }

      // Calculate gaps between cards
      if (analysis.cards.length >= 2) {
        const firstCard = analysis.cards[0];
        const secondCard = analysis.cards[1];
        analysis.horizontalGap = secondCard.dimensions.x - (firstCard.dimensions.x + firstCard.dimensions.width);

        if (analysis.cards.length >= 3) {
          const thirdCard = analysis.cards[2];
          analysis.verticalGap = thirdCard.dimensions.y - (firstCard.dimensions.y + firstCard.dimensions.height);
        }
      }

      return analysis;
    });

    console.log('\n=== MAIN PAGE ANALYSIS ===');
    console.log(JSON.stringify(mainPageAnalysis, null, 2));

    // Save analysis
    fs.writeFileSync(
      path.join(__dirname, 'screenshots', 'main-page-analysis.json'),
      JSON.stringify(mainPageAnalysis, null, 2)
    );

    // Capture individual cards for detailed view
    const cardElements = await page.$$('a[href*="youtube"], a[href*="youtu.be"], main a');
    for (let i = 0; i < Math.min(4, cardElements.length); i++) {
      const cardPath = path.join(__dirname, 'screenshots', `main-card-${i + 1}-375px.png`);
      await cardElements[i].screenshot({ path: cardPath });
      console.log(`Card ${i + 1} screenshot saved`);
    }

    // Try to find and click admin button
    console.log('\n=== ATTEMPTING TO ACCESS ADMIN PAGE ===');

    // Look for admin icon/button
    const adminButton = await page.$('[class*="admin"], [aria-label*="admin"], header button:last-child, header a:last-child');

    if (adminButton) {
      const buttonBox = await adminButton.boundingBox();
      console.log(`Found admin button at position: x=${buttonBox?.x}, y=${buttonBox?.y}`);

      // Click and wait
      await adminButton.click();
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log('Current URL after click:', currentUrl);

      if (currentUrl !== 'https://youtube-directory.vercel.app/') {
        // We navigated somewhere, capture it
        const adminPath = path.join(__dirname, 'screenshots', 'admin-attempt-375px.png');
        await page.screenshot({ path: adminPath, fullPage: true });
        console.log('Admin page screenshot saved');

        // Try to analyze if there are cards here
        const adminAnalysis = await page.evaluate(() => {
          const cards = document.querySelectorAll('[class*="card"], article, .video-item, a[href*="youtube"]');
          return {
            url: window.location.href,
            cardCount: cards.length,
            pageTitle: document.title,
            hasContent: document.body.textContent.length > 100
          };
        });
        console.log('Admin page analysis:', adminAnalysis);
      }
    }

    // Try different admin URLs
    const adminUrls = [
      '/admin',
      '/dashboard',
      '/manage',
      '/admin/videos'
    ];

    for (const adminPath of adminUrls) {
      console.log(`\nTrying URL: https://youtube-directory.vercel.app${adminPath}`);
      const response = await page.goto(`https://youtube-directory.vercel.app${adminPath}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      }).catch(err => null);

      if (response && response.status() === 200) {
        console.log(`Success! Found page at ${adminPath}`);
        await page.waitForTimeout(2000);

        const screenshotPath = path.join(__dirname, 'screenshots', `admin${adminPath.replace('/', '-')}-375px.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Analyze this page
        const pageAnalysis = await page.evaluate(() => {
          const analysis = {
            url: window.location.href,
            cards: []
          };

          const cards = document.querySelectorAll('[class*="card"], article, .video-item');
          for (let i = 0; i < Math.min(4, cards.length); i++) {
            const card = cards[i];
            const rect = card.getBoundingClientRect();
            const styles = window.getComputedStyle(card);

            analysis.cards.push({
              width: rect.width,
              height: rect.height,
              className: card.className
            });
          }

          return analysis;
        });

        console.log('Page analysis:', pageAnalysis);
        break;
      } else if (response) {
        console.log(`Page returned status: ${response.status()}`);
      }
    }

    // Provide detailed measurements
    console.log('\n=== MOBILE LAYOUT ISSUES SUMMARY ===');
    if (mainPageAnalysis.cards.length > 0) {
      const cardWidth = mainPageAnalysis.cards[0].dimensions.width;
      const viewportWidth = mainPageAnalysis.viewport.width;
      const cardsPerRow = Math.floor(viewportWidth / cardWidth);

      console.log(`Viewport width: ${viewportWidth}px`);
      console.log(`Card width: ${cardWidth}px`);
      console.log(`Cards per row: ${cardsPerRow}`);
      console.log(`Card takes up ${(cardWidth/viewportWidth * 100).toFixed(1)}% of viewport width`);

      if (mainPageAnalysis.horizontalGap !== undefined) {
        console.log(`Horizontal gap between cards: ${mainPageAnalysis.horizontalGap}px`);
      }
      if (mainPageAnalysis.verticalGap !== undefined) {
        console.log(`Vertical gap between cards: ${mainPageAnalysis.verticalGap}px`);
      }
    }

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await browser.close();
    console.log('\n✓ Analysis complete. Check ./screenshots/ directory for all captures.');
  }
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

analyzeMobileCards();