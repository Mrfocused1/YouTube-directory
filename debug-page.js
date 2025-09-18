import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));

  // Listen for page errors
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Listen for request failures
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Take a screenshot
  await page.screenshot({ path: 'debug-screenshot.png' });

  // Get the computed styles of the background element
  const bgStyles = await page.evaluate(() => {
    const bgElement = document.querySelector('.background-image');
    if (bgElement) {
      const styles = window.getComputedStyle(bgElement);
      return {
        backgroundImage: styles.backgroundImage,
        filter: styles.filter,
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex
      };
    }
    return null;
  });

  console.log('Background element styles:', bgStyles);

  // Check if the image loads
  const imageStatus = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ loaded: true, src: img.src });
      img.onerror = () => resolve({ loaded: false, src: img.src });
      img.src = '/tower-bridge.png';
    });
  });

  console.log('Image load status:', imageStatus);

  await browser.close();
})();