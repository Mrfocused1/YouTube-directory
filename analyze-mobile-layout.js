import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeMobileLayout() {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X viewport
    deviceScaleFactor: 2, // For high-quality screenshots
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  console.log('Navigating to website...');
  await page.goto('https://youtube-directory.vercel.app', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'mobile-analysis');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Capture initial full page screenshot
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const fullPagePath = path.join(screenshotDir, `mobile-full-${timestamp}.png`);
  await page.screenshot({
    path: fullPagePath,
    fullPage: true
  });
  console.log(`Full page screenshot saved to: ${fullPagePath}`);

  // Analyze the DOM structure and spacing
  console.log('\n=== ANALYZING CONTAINER HIERARCHY ===\n');

  // Get computed styles for all parent containers
  const spacingAnalysis = await page.evaluate(() => {
    const results = {
      timestamp: new Date().toISOString(),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      containers: []
    };

    // Helper function to get computed styles
    function getComputedSpacing(element, description) {
      const styles = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return {
        description: description,
        selector: element.className || element.tagName.toLowerCase(),
        tagName: element.tagName,
        id: element.id || null,
        className: element.className || null,
        spacing: {
          marginTop: styles.marginTop,
          marginRight: styles.marginRight,
          marginBottom: styles.marginBottom,
          marginLeft: styles.marginLeft,
          paddingTop: styles.paddingTop,
          paddingRight: styles.paddingRight,
          paddingBottom: styles.paddingBottom,
          paddingLeft: styles.paddingLeft,
          width: styles.width,
          maxWidth: styles.maxWidth,
          boxSizing: styles.boxSizing
        },
        position: {
          left: rect.left,
          right: window.innerWidth - rect.right,
          width: rect.width,
          viewportWidth: window.innerWidth
        },
        computed: {
          totalHorizontalMargin: parseFloat(styles.marginLeft) + parseFloat(styles.marginRight),
          totalHorizontalPadding: parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight),
          actualWidth: rect.width,
          distanceFromLeftEdge: rect.left,
          distanceFromRightEdge: window.innerWidth - rect.right
        }
      };
    }

    // Analyze body
    results.containers.push(getComputedSpacing(document.body, 'Body'));

    // Analyze root element
    const root = document.getElementById('root');
    if (root) {
      results.containers.push(getComputedSpacing(root, 'Root Container (#root)'));
    }

    // Analyze all parent containers of video-grid
    const videoGrid = document.querySelector('.video-grid');
    if (videoGrid) {
      results.containers.push(getComputedSpacing(videoGrid, 'Video Grid (.video-grid)'));

      // Traverse up the DOM tree
      let parent = videoGrid.parentElement;
      let level = 1;
      while (parent && parent !== document.body) {
        const description = `Parent Level ${level} (${parent.tagName}${parent.className ? '.' + parent.className.split(' ').join('.') : ''}${parent.id ? '#' + parent.id : ''})`;
        results.containers.push(getComputedSpacing(parent, description));
        parent = parent.parentElement;
        level++;
      }
    }

    // Find any container with specific class names that might add spacing
    const possibleContainers = ['.app', '.App', '.container', '.main', 'main', '.content', '.wrapper'];
    for (const selector of possibleContainers) {
      const element = document.querySelector(selector);
      if (element && !results.containers.some(c => c.selector === element.className)) {
        results.containers.push(getComputedSpacing(element, `Container (${selector})`));
      }
    }

    // Get first video card for reference
    const firstCard = document.querySelector('.video-card');
    if (firstCard) {
      results.firstCard = getComputedSpacing(firstCard, 'First Video Card');
      results.firstCard.parentInfo = {
        parentClass: firstCard.parentElement?.className,
        parentTag: firstCard.parentElement?.tagName
      };
    }

    return results;
  });

  // Save analysis to file
  const analysisPath = path.join(screenshotDir, `spacing-analysis-${timestamp}.json`);
  fs.writeFileSync(analysisPath, JSON.stringify(spacingAnalysis, null, 2));
  console.log(`\nSpacing analysis saved to: ${analysisPath}`);

  // Print analysis results
  console.log('\n=== SPACING ANALYSIS RESULTS ===\n');
  console.log('Viewport:', spacingAnalysis.viewport);
  console.log('\nContainer Hierarchy (from outermost to innermost):\n');

  spacingAnalysis.containers.forEach((container, index) => {
    console.log(`${index + 1}. ${container.description}`);
    console.log(`   Tag: ${container.tagName}, Class: ${container.className || 'none'}, ID: ${container.id || 'none'}`);
    console.log(`   Margins: L=${container.spacing.marginLeft}, R=${container.spacing.marginRight}`);
    console.log(`   Padding: L=${container.spacing.paddingLeft}, R=${container.spacing.paddingRight}`);
    console.log(`   Width: ${container.spacing.width}, Max-Width: ${container.spacing.maxWidth}`);
    console.log(`   Distance from edges: Left=${container.position.distanceFromLeftEdge}px, Right=${container.position.distanceFromRightEdge}px`);
    console.log(`   Actual width: ${container.position.width}px`);
    console.log('');
  });

  if (spacingAnalysis.firstCard) {
    console.log('=== FIRST VIDEO CARD ANALYSIS ===');
    console.log(`Distance from left edge: ${spacingAnalysis.firstCard.position.distanceFromLeftEdge}px`);
    console.log(`Distance from right edge: ${spacingAnalysis.firstCard.position.distanceFromRightEdge}px`);
    console.log(`Card width: ${spacingAnalysis.firstCard.position.width}px`);
    console.log(`Parent: ${spacingAnalysis.firstCard.parentInfo.parentTag}.${spacingAnalysis.firstCard.parentInfo.parentClass}`);
  }

  // Highlight spacing issues visually
  await page.evaluate(() => {
    // Add visual indicators for padding/margin
    const style = document.createElement('style');
    style.textContent = `
      .spacing-highlight {
        position: absolute;
        pointer-events: none;
        z-index: 9999;
      }
      .margin-highlight {
        background: rgba(255, 0, 0, 0.2);
        border: 1px dashed red;
      }
      .padding-highlight {
        background: rgba(0, 255, 0, 0.2);
        border: 1px dashed green;
      }
    `;
    document.head.appendChild(style);

    // Highlight video grid container
    const videoGrid = document.querySelector('.video-grid');
    if (videoGrid) {
      const rect = videoGrid.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.className = 'spacing-highlight padding-highlight';
      highlight.style.position = 'fixed';
      highlight.style.left = rect.left + 'px';
      highlight.style.top = rect.top + 'px';
      highlight.style.width = rect.width + 'px';
      highlight.style.height = Math.min(rect.height, 500) + 'px';
      document.body.appendChild(highlight);
    }

    // Highlight parent containers with margins
    const parent = videoGrid?.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.className = 'spacing-highlight margin-highlight';
      highlight.style.position = 'fixed';
      highlight.style.left = '0';
      highlight.style.top = rect.top + 'px';
      highlight.style.width = '100%';
      highlight.style.height = Math.min(rect.height, 500) + 'px';
      document.body.appendChild(highlight);
    }
  });

  // Take screenshot with highlights
  const highlightedPath = path.join(screenshotDir, `mobile-highlighted-${timestamp}.png`);
  await page.screenshot({
    path: highlightedPath,
    fullPage: false
  });
  console.log(`\nHighlighted screenshot saved to: ${highlightedPath}`);

  // Scroll down and capture more of the grid
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(1000);

  const scrolledPath = path.join(screenshotDir, `mobile-scrolled-${timestamp}.png`);
  await page.screenshot({
    path: scrolledPath,
    fullPage: false
  });
  console.log(`Scrolled view screenshot saved to: ${scrolledPath}`);

  await browser.close();
  console.log('\nAnalysis complete!');

  return spacingAnalysis;
}

// Run the analysis
analyzeMobileLayout().catch(console.error);