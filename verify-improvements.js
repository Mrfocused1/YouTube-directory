import { chromium } from 'playwright';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://youtube-directory.vercel.app/';

  try {
    console.log('Navigating to YouTube Directory...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Mobile viewport (390px width as specified)
    console.log('Capturing mobile view (390px)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'mobile-390px-view.png',
      fullPage: true
    });

    // Also capture just the grid area on mobile
    const mobileGrid = await page.$('.grid');
    if (mobileGrid) {
      await mobileGrid.screenshot({ path: 'mobile-grid-closeup.png' });
    }

    // Desktop viewport
    console.log('Capturing desktop view (1440px)...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'desktop-1440px-view.png',
      fullPage: true
    });

    // Large desktop viewport
    console.log('Capturing large desktop view (1920px)...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'desktop-1920px-view.png',
      fullPage: false
    });

    // Tablet viewport for comparison
    console.log('Capturing tablet view (768px)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'tablet-768px-view.png',
      fullPage: false
    });

    // Extract some grid information
    console.log('\nExtracting grid information...');
    const gridInfo = await page.evaluate(() => {
      const grid = document.querySelector('.grid');
      if (!grid) return { error: 'Grid not found' };

      const cards = grid.querySelectorAll('.group'); // Assuming cards have 'group' class
      const gridStyles = window.getComputedStyle(grid);

      return {
        cardCount: cards.length,
        gridColumns: gridStyles.gridTemplateColumns,
        gridGap: gridStyles.gap,
        gridWidth: grid.offsetWidth,
        firstCardWidth: cards[0] ? cards[0].offsetWidth : null
      };
    });

    console.log('Grid Information:', gridInfo);

    // Check for admin/home buttons
    const buttonInfo = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a');
      const adminButton = Array.from(buttons).find(b => b.textContent.includes('Admin'));
      const homeButton = Array.from(buttons).find(b => b.textContent.includes('Home'));

      const getPosition = (el) => {
        if (!el) return null;
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          top: styles.top,
          bottom: styles.bottom,
          left: styles.left,
          right: styles.right
        };
      };

      return {
        adminButton: getPosition(adminButton),
        homeButton: getPosition(homeButton)
      };
    });

    console.log('Button positioning:', buttonInfo);

    console.log('\nScreenshots captured successfully!');

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshots();