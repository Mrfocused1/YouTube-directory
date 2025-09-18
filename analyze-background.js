import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to localhost:5175...');
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });

  // Wait for the page to fully render
  await page.waitForTimeout(3000);

  // Capture full page screenshot
  const timestamp = Date.now();
  await page.screenshot({
    path: `investigation-full-${timestamp}.png`,
    fullPage: true
  });
  console.log(`Full page screenshot saved: investigation-full-${timestamp}.png`);

  // Get the background container details
  const bgContainer = await page.evaluate(() => {
    // Find the element with the background
    const elements = document.querySelectorAll('*');
    let bgElement = null;

    for (const el of elements) {
      const style = window.getComputedStyle(el);
      if (style.backgroundImage && style.backgroundImage.includes('tower-bridge')) {
        bgElement = el;
        break;
      }
    }

    if (!bgElement) {
      // Try to find any fixed positioned background element
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' && style.zIndex === '-10') {
          bgElement = el;
          break;
        }
      }
    }

    if (bgElement) {
      const computed = window.getComputedStyle(bgElement);
      const rect = bgElement.getBoundingClientRect();
      return {
        found: true,
        tagName: bgElement.tagName,
        className: bgElement.className,
        id: bgElement.id,
        backgroundImage: computed.backgroundImage,
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        filter: computed.filter,
        position: computed.position,
        zIndex: computed.zIndex,
        opacity: computed.opacity,
        display: computed.display,
        visibility: computed.visibility,
        width: computed.width,
        height: computed.height,
        top: computed.top,
        left: computed.left,
        backgroundColor: computed.backgroundColor,
        boundingRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      };
    }
    return { found: false };
  });

  console.log('\nBackground Container Analysis:');
  console.log(JSON.stringify(bgContainer, null, 2));

  // Check for overlapping elements
  const overlappingElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const overlapping = [];

    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex) || 0;

      if (style.position === 'fixed' || style.position === 'absolute') {
        const rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) {
          overlapping.push({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            position: style.position,
            zIndex: style.zIndex,
            backgroundColor: style.backgroundColor,
            background: style.background,
            opacity: style.opacity,
            width: rect.width,
            height: rect.height
          });
        }
      }
    }

    return overlapping.sort((a, b) => (parseInt(b.zIndex) || 0) - (parseInt(a.zIndex) || 0));
  });

  console.log('\nPotentially Overlapping Elements:');
  console.log(JSON.stringify(overlappingElements, null, 2));

  // Check network requests for the image
  const imageRequests = [];
  page.on('response', response => {
    if (response.url().includes('tower-bridge')) {
      imageRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  // Reload to capture network requests
  console.log('\nReloading page to check network requests...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('\nImage Network Requests:');
  console.log(JSON.stringify(imageRequests, null, 2));

  // Check if image is accessible directly
  const imageResponse = await page.goto('http://localhost:5175/tower-bridge.png');
  console.log('\nDirect Image Access:');
  console.log({
    url: imageResponse.url(),
    status: imageResponse.status(),
    statusText: imageResponse.statusText(),
    contentType: imageResponse.headers()['content-type']
  });

  // Go back to main page
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Inject CSS to test if background works with inline styles
  const testResult = await page.evaluate(() => {
    const testDiv = document.createElement('div');
    testDiv.style.position = 'fixed';
    testDiv.style.top = '0';
    testDiv.style.left = '0';
    testDiv.style.width = '200px';
    testDiv.style.height = '200px';
    testDiv.style.backgroundImage = 'url(/tower-bridge.png)';
    testDiv.style.backgroundSize = 'cover';
    testDiv.style.zIndex = '9999';
    testDiv.id = 'test-bg-div';
    document.body.appendChild(testDiv);

    const computed = window.getComputedStyle(testDiv);
    return {
      backgroundImage: computed.backgroundImage,
      backgroundSize: computed.backgroundSize,
      width: computed.width,
      height: computed.height
    };
  });

  console.log('\nTest Div with Background:');
  console.log(JSON.stringify(testResult, null, 2));

  // Capture screenshot with test div
  await page.screenshot({
    path: `investigation-with-test-${timestamp}.png`,
    fullPage: false
  });
  console.log(`Screenshot with test div saved: investigation-with-test-${timestamp}.png`);

  await browser.close();
})();