import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get computed styles of the animated background layers
    const animationInfo = await page.evaluate(() => {
      const results = {
        bodyBackground: window.getComputedStyle(document.body).background,
        rootElement: null,
        animatedLayers: []
      };

      // Check root element
      const root = document.getElementById('root');
      if (root) {
        const rootStyle = window.getComputedStyle(root);
        results.rootElement = {
          background: rootStyle.background,
          position: rootStyle.position,
          zIndex: rootStyle.zIndex
        };
      }

      // Find all divs with animated backgrounds
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach((div, index) => {
        const style = window.getComputedStyle(div);
        if (style.animation && style.animation !== 'none' && style.animation !== '') {
          const rect = div.getBoundingClientRect();
          results.animatedLayers.push({
            index,
            animation: style.animation,
            background: style.background ? style.background.substring(0, 200) : 'none',
            position: style.position,
            zIndex: style.zIndex,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            display: style.display,
            opacity: style.opacity,
            filter: style.filter
          });
        }
      });

      // Check if animations are actually running
      const animationKeyframes = [];
      const styleSheets = document.styleSheets;
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const rules = styleSheets[i].cssRules || styleSheets[i].rules;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
              animationKeyframes.push(rule.name);
            }
          }
        } catch (e) {
          // Cross-origin stylesheets may throw errors
        }
      }

      results.definedKeyframes = animationKeyframes;
      results.totalAnimatedElements = results.animatedLayers.length;

      return results;
    });

    console.log('\n=== Animation Debug Information ===\n');
    console.log('Body background:', animationInfo.bodyBackground);
    console.log('Root element styles:', animationInfo.rootElement);
    console.log('\nTotal animated elements found:', animationInfo.totalAnimatedElements);
    console.log('Defined keyframe animations:', animationInfo.definedKeyframes);

    console.log('\nAnimated layers details:');
    animationInfo.animatedLayers.forEach((layer, idx) => {
      console.log(`\nLayer ${idx + 1}:`);
      console.log('  Animation:', layer.animation);
      console.log('  Position:', layer.position);
      console.log('  Z-Index:', layer.zIndex);
      console.log('  Dimensions:', `${layer.width}x${layer.height}`);
      console.log('  Location:', `top: ${layer.top}, left: ${layer.left}`);
      console.log('  Filter:', layer.filter);
    });

    // Take a screenshot with enhanced contrast to see if anything is visible
    await page.evaluate(() => {
      document.body.style.filter = 'contrast(2) brightness(1.5)';
    });

    await page.screenshot({
      path: path.join(__dirname, 'enhanced-contrast-check.png'),
      fullPage: false
    });

    // Reset filter
    await page.evaluate(() => {
      document.body.style.filter = '';
    });

    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('\nConsole error:', msg.text());
      }
    });

    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Error during analysis:', error);
  }

  await browser.close();
  console.log('\n✅ Animation debug complete');
})();