const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'ui-analysis-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const viewports = [
  { name: 'mobile', width: 375, height: 812, deviceScaleFactor: 2 },
  { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 2 },
  { name: 'large-desktop', width: 1920, height: 1080, deviceScaleFactor: 2 }
];

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: false });

  console.log('Starting UI/UX Analysis...\n');

  for (const viewport of viewports) {
    console.log(`\n📱 Capturing ${viewport.name} (${viewport.width}x${viewport.height})`);

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
    });

    const page = await context.newPage();

    try {
      // Main page
      console.log('  - Loading main page...');
      await page.goto('http://localhost:5175/', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for animations to complete
      await page.waitForTimeout(2000);

      // Capture full page
      await page.screenshot({
        path: path.join(screenshotsDir, `${viewport.name}-main-full.png`),
        fullPage: true
      });
      console.log('    ✓ Main page full screenshot');

      // Capture above-fold content
      await page.screenshot({
        path: path.join(screenshotsDir, `${viewport.name}-main-fold.png`),
        fullPage: false
      });
      console.log('    ✓ Above-fold screenshot');

      // Capture header/hero section
      const heroSection = await page.$('.hero-section, header, .main-header, [class*="hero"]');
      if (heroSection) {
        await heroSection.screenshot({
          path: path.join(screenshotsDir, `${viewport.name}-hero.png`)
        });
        console.log('    ✓ Hero section screenshot');
      }

      // Capture video cards/grid
      const cardsSection = await page.$('.cards-container, .video-grid, .channels-grid, [class*="grid"], [class*="cards"]');
      if (cardsSection) {
        await cardsSection.screenshot({
          path: path.join(screenshotsDir, `${viewport.name}-cards.png`)
        });
        console.log('    ✓ Cards/Grid screenshot');
      }

      // Scroll to middle of page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, `${viewport.name}-main-middle.png`),
        fullPage: false
      });
      console.log('    ✓ Middle section screenshot');

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, `${viewport.name}-main-bottom.png`),
        fullPage: false
      });
      console.log('    ✓ Bottom section screenshot');

      // Check for admin page
      console.log('  - Checking admin page...');
      await page.goto('http://localhost:5175/admin', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(screenshotsDir, `${viewport.name}-admin.png`),
        fullPage: false
      });
      console.log('    ✓ Admin page screenshot');

      // Test hover states on main page
      await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Find and hover over a card
      const firstCard = await page.$('.channel-card, .video-card, [class*="card"]:first-child');
      if (firstCard) {
        await firstCard.hover();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(screenshotsDir, `${viewport.name}-hover-state.png`),
          fullPage: false
        });
        console.log('    ✓ Hover state screenshot');
      }

      // Test modal/dialog if available
      const addButton = await page.$('button:has-text("Add"), button:has-text("add"), [class*="add-btn"]');
      if (addButton) {
        await addButton.click();
        await page.waitForTimeout(1000);
        const modal = await page.$('.modal, .dialog, [role="dialog"], [class*="modal"]');
        if (modal) {
          await page.screenshot({
            path: path.join(screenshotsDir, `${viewport.name}-modal.png`),
            fullPage: false
          });
          console.log('    ✓ Modal screenshot');
        }
      }

    } catch (error) {
      console.error(`    ✗ Error capturing ${viewport.name}: ${error.message}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✅ Screenshot capture complete!');
  console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
}

// Analyze CSS and extract key metrics
async function analyzeDesign() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\n🎨 Analyzing Design Elements...\n');

  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });

  // Extract design metrics
  const metrics = await page.evaluate(() => {
    const getComputedStyles = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const styles = window.getComputedStyle(element);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        padding: styles.padding,
        margin: styles.margin,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow,
        backdropFilter: styles.backdropFilter || styles.webkitBackdropFilter,
      };
    };

    // Check for glassmorphism effects
    const glassmorphElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const styles = window.getComputedStyle(el);
      return (styles.backdropFilter && styles.backdropFilter !== 'none') ||
             (styles.webkitBackdropFilter && styles.webkitBackdropFilter !== 'none');
    });

    // Check animations
    const animatedElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const styles = window.getComputedStyle(el);
      return styles.animation !== 'none' || styles.transition !== 'none';
    });

    return {
      body: getComputedStyles('body'),
      header: getComputedStyles('header, .header, .navbar'),
      card: getComputedStyles('.channel-card, .video-card, [class*="card"]'),
      button: getComputedStyles('button, .btn, [class*="button"]'),
      glassmorphismCount: glassmorphElements.length,
      animatedElementsCount: animatedElements.length,
      hasBackgroundImage: !!document.querySelector('[style*="background-image"], [class*="bg-"], [class*="background"]'),
    };
  });

  console.log('Design Metrics:', JSON.stringify(metrics, null, 2));

  // Check accessibility
  console.log('\n♿ Checking Accessibility...\n');

  const accessibilityIssues = await page.evaluate(() => {
    const issues = [];

    // Check color contrast
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      if (styles.color && styles.backgroundColor) {
        // Simple contrast check (would need more complex algorithm for accurate WCAG compliance)
        const rgb = styles.color.match(/\d+/g);
        const bgRgb = styles.backgroundColor.match(/\d+/g);
        if (rgb && bgRgb) {
          const brightness = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
          const bgBrightness = (parseInt(bgRgb[0]) + parseInt(bgRgb[1]) + parseInt(bgRgb[2])) / 3;
          const contrast = Math.abs(brightness - bgBrightness);
          if (contrast < 50 && el.textContent?.trim()) {
            issues.push({
              type: 'contrast',
              element: el.tagName,
              class: el.className,
              contrast: contrast
            });
          }
        }
      }
    });

    // Check for alt text
    document.querySelectorAll('img').forEach(img => {
      if (!img.alt) {
        issues.push({
          type: 'missing-alt',
          src: img.src
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      if (level - lastLevel > 1) {
        issues.push({
          type: 'heading-hierarchy',
          element: h.tagName,
          text: h.textContent?.substring(0, 50)
        });
      }
      lastLevel = level;
    });

    // Check for focus indicators
    const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    focusableElements.forEach(el => {
      const styles = window.getComputedStyle(el, ':focus');
      if (!styles.outline || styles.outline === 'none') {
        issues.push({
          type: 'missing-focus-indicator',
          element: el.tagName,
          class: el.className
        });
      }
    });

    return issues;
  });

  if (accessibilityIssues.length > 0) {
    console.log('Accessibility Issues Found:', accessibilityIssues.length);
    console.log(JSON.stringify(accessibilityIssues.slice(0, 5), null, 2));
  } else {
    console.log('No major accessibility issues detected!');
  }

  // Performance metrics
  console.log('\n⚡ Performance Metrics...\n');

  const performanceMetrics = await page.evaluate(() => {
    const perfData = window.performance.timing;
    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      domInteractive: perfData.domInteractive - perfData.domLoading,
      imageCount: document.querySelectorAll('img').length,
      scriptCount: document.querySelectorAll('script').length,
      stylesheetCount: document.querySelectorAll('link[rel="stylesheet"]').length,
    };
  });

  console.log('Performance:', JSON.stringify(performanceMetrics, null, 2));

  await browser.close();
}

// Main execution
(async () => {
  try {
    await captureScreenshots();
    await analyzeDesign();
  } catch (error) {
    console.error('Error:', error);
  }
})();