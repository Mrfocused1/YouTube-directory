import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureScreenshots() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 375, height: 812 }, // iPhone 12 Pro viewport
        deviceScaleFactor: 3, // High DPI for clear screenshots
    });

    const page = await context.newPage();

    console.log('Navigating to YouTube Directory...');
    await page.goto('https://youtube-directory-5adk6lagv-paulpauls-projects.vercel.app', {
        waitUntil: 'networkidle',
        timeout: 30000
    });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Create screenshots directory if it doesn't exist
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
    }

    // Capture full page screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullPagePath = path.join(screenshotDir, `mobile-fullpage-${timestamp}.png`);
    await page.screenshot({
        path: fullPagePath,
        fullPage: true
    });
    console.log(`Full page screenshot saved: ${fullPagePath}`);

    // Capture viewport screenshot (above the fold)
    const viewportPath = path.join(screenshotDir, `mobile-viewport-${timestamp}.png`);
    await page.screenshot({
        path: viewportPath,
        fullPage: false
    });
    console.log(`Viewport screenshot saved: ${viewportPath}`);

    // Scroll to video cards section and capture
    await page.evaluate(() => {
        const cards = document.querySelector('.grid, [class*="grid"], .video-grid, .cards-container');
        if (cards) {
            cards.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
    await page.waitForTimeout(1000);

    const cardsPath = path.join(screenshotDir, `mobile-cards-${timestamp}.png`);
    await page.screenshot({
        path: cardsPath,
        fullPage: false
    });
    console.log(`Video cards screenshot saved: ${cardsPath}`);

    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const viewportWidth = window.innerWidth;
        const scrollWidth = Math.max(
            body.scrollWidth,
            body.offsetWidth,
            html.clientWidth,
            html.scrollWidth,
            html.offsetWidth
        );
        return scrollWidth > viewportWidth;
    });

    console.log(`\nHorizontal overflow detected: ${hasOverflow ? 'YES' : 'NO'}`);
    console.log(`Viewport width: 375px`);

    // Get information about video cards
    const cardInfo = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="card"], .video-card, article, .item');
        const info = {
            totalCards: cards.length,
            cardsInfo: []
        };

        cards.forEach((card, index) => {
            if (index < 3) { // Check first 3 cards
                const rect = card.getBoundingClientRect();
                const styles = window.getComputedStyle(card);
                info.cardsInfo.push({
                    index: index + 1,
                    width: rect.width,
                    left: rect.left,
                    right: rect.right,
                    isVisible: rect.right <= window.innerWidth,
                    overflow: rect.right > window.innerWidth,
                    margin: styles.margin,
                    padding: styles.padding
                });
            }
        });

        return info;
    });

    console.log(`\nVideo Cards Analysis:`);
    console.log(`Total cards found: ${cardInfo.totalCards}`);
    cardInfo.cardsInfo.forEach(card => {
        console.log(`\nCard ${card.index}:`);
        console.log(`  Width: ${card.width}px`);
        console.log(`  Position: left=${card.left}px, right=${card.right}px`);
        console.log(`  Fully visible: ${card.isVisible ? 'YES' : 'NO'}`);
        console.log(`  Extends beyond viewport: ${card.overflow ? 'YES (CROPPED)' : 'NO'}`);
    });

    await browser.close();

    console.log('\nScreenshot capture complete!');
    console.log(`Screenshots saved in: ${screenshotDir}`);
}

captureScreenshots().catch(console.error);