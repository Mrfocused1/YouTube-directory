import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch({ headless: false });
  const screenshotsDir = path.join(__dirname, 'animated-bg-screenshots');

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Define viewport sizes
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'large-desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    console.log(`Capturing ${viewport.name} screenshots...`);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2 // High DPI for clarity
    });

    const page = await context.newPage();

    try {
      // Navigate to the page
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

      // Wait for animations to start
      await page.waitForTimeout(1000);

      // Capture screenshots at different moments to show animation
      for (let i = 0; i < 3; i++) {
        const timestamp = Date.now();

        // Full page screenshot
        await page.screenshot({
          path: path.join(screenshotsDir, `${viewport.name}-full-moment${i + 1}-${timestamp}.png`),
          fullPage: true
        });

        // Viewport screenshot (visible area only)
        await page.screenshot({
          path: path.join(screenshotsDir, `${viewport.name}-viewport-moment${i + 1}-${timestamp}.png`),
          fullPage: false
        });

        // Wait between captures to show animation progression
        await page.waitForTimeout(2000);
      }

      // Capture specific elements
      // Hero section
      const heroSection = await page.$('.hero-section');
      if (heroSection) {
        await heroSection.screenshot({
          path: path.join(screenshotsDir, `${viewport.name}-hero-section.png`)
        });
      }

      // Featured channels section
      const featuredSection = await page.$('.featured-channels');
      if (featuredSection) {
        await featuredSection.screenshot({
          path: path.join(screenshotsDir, `${viewport.name}-featured-section.png`)
        });
      }

      // Individual card with glassmorphism
      const firstCard = await page.$('.channel-card');
      if (firstCard) {
        await firstCard.screenshot({
          path: path.join(screenshotsDir, `${viewport.name}-glassmorphism-card.png`)
        });
      }

      console.log(`✓ Captured ${viewport.name} screenshots`);

    } catch (error) {
      console.error(`Error capturing ${viewport.name}:`, error.message);
    }

    await context.close();
  }

  // Additional performance check
  console.log('\nPerformance Analysis:');
  const perfContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const perfPage = await perfContext.newPage();

  await perfPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Check animation performance
  const animationMetrics = await perfPage.evaluate(() => {
    const computedStyles = window.getComputedStyle(document.body);
    const backgroundImage = computedStyles.backgroundImage;
    const animation = computedStyles.animation;

    // Check if animations are running
    const animatedElements = document.querySelectorAll('*');
    let animationCount = 0;

    animatedElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.animation !== 'none' && style.animation !== '') {
        animationCount++;
      }
    });

    return {
      hasBackgroundImage: backgroundImage !== 'none',
      backgroundValue: backgroundImage.substring(0, 100) + '...',
      animationProperty: animation,
      animatedElementsCount: animationCount,
      bodyClasses: document.body.className
    };
  });

  console.log('Animation Metrics:', animationMetrics);

  // Check for smooth scrolling and transitions
  const transitionCheck = await perfPage.evaluate(() => {
    const cards = document.querySelectorAll('.channel-card');
    const transitions = [];

    cards.forEach((card, index) => {
      if (index < 3) { // Check first 3 cards
        const style = window.getComputedStyle(card);
        transitions.push({
          transition: style.transition,
          transform: style.transform,
          backdropFilter: style.backdropFilter || style.webkitBackdropFilter
        });
      }
    });

    return transitions;
  });

  console.log('Card Transitions:', transitionCheck);

  await perfContext.close();
  await browser.close();

  console.log(`\n✅ All screenshots saved to: ${screenshotsDir}`);
})();