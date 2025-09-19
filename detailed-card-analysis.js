import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function detailedCardAnalysis() {
  console.log('Starting detailed card measurement analysis...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to https://youtube-directory.vercel.app...');
    await page.goto('https://youtube-directory.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Detailed analysis focusing on the video grid
    const detailedAnalysis = await page.evaluate(() => {
      const analysis = {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        grid: null,
        cards: [],
        issues: [],
        recommendations: []
      };

      // Find the video grid
      const grid = document.querySelector('.video-grid');
      if (grid) {
        const gridStyles = window.getComputedStyle(grid);
        const gridRect = grid.getBoundingClientRect();

        analysis.grid = {
          className: grid.className,
          dimensions: {
            width: gridRect.width,
            height: gridRect.height,
            x: gridRect.x
          },
          styles: {
            display: gridStyles.display,
            gridTemplateColumns: gridStyles.gridTemplateColumns,
            gridTemplateRows: gridStyles.gridTemplateRows,
            gap: gridStyles.gap,
            rowGap: gridStyles.rowGap,
            columnGap: gridStyles.columnGap,
            padding: gridStyles.padding,
            margin: gridStyles.margin,
            boxSizing: gridStyles.boxSizing
          },
          childCount: grid.children.length
        };

        // Analyze each card in the grid
        const cards = grid.children;
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          const rect = card.getBoundingClientRect();
          const styles = window.getComputedStyle(card);

          // Get text content
          const titleElement = card.querySelector('p, h3, [class*="title"]');
          const title = titleElement ? titleElement.textContent.trim() : '';

          // Get image info
          const img = card.querySelector('img');
          let imgInfo = null;
          if (img) {
            const imgRect = img.getBoundingClientRect();
            const imgStyles = window.getComputedStyle(img);
            imgInfo = {
              width: imgRect.width,
              height: imgRect.height,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              objectFit: imgStyles.objectFit,
              borderRadius: imgStyles.borderRadius,
              aspectRatio: imgStyles.aspectRatio
            };
          }

          analysis.cards.push({
            index: i,
            title: title.substring(0, 30),
            position: {
              row: Math.floor(i / 2),
              col: i % 2,
              x: rect.x,
              y: rect.y
            },
            dimensions: {
              width: rect.width,
              height: rect.height,
              percentOfViewport: (rect.width / window.innerWidth * 100).toFixed(1)
            },
            styles: {
              width: styles.width,
              height: styles.height,
              padding: styles.padding,
              margin: styles.margin,
              borderRadius: styles.borderRadius,
              overflow: styles.overflow,
              display: styles.display,
              flexDirection: styles.flexDirection
            },
            image: imgInfo,
            textOverflow: styles.textOverflow
          });
        }

        // Calculate actual gaps
        if (analysis.cards.length >= 2) {
          const card1 = analysis.cards[0];
          const card2 = analysis.cards[1];
          analysis.actualHorizontalGap = card2.position.x - (card1.position.x + card1.dimensions.width);

          if (analysis.cards.length >= 3) {
            const card3 = analysis.cards[2];
            analysis.actualVerticalGap = card3.position.y - (card1.position.y + card1.dimensions.height);
          }
        }

        // Identify issues
        if (analysis.cards.length > 0) {
          const cardWidth = analysis.cards[0].dimensions.width;
          const viewportWidth = window.innerWidth;

          // Check if cards are too wide
          if (cardWidth > viewportWidth * 0.48) {
            analysis.issues.push({
              type: 'CARD_TOO_WIDE',
              severity: 'HIGH',
              description: `Cards are ${cardWidth}px wide (${analysis.cards[0].dimensions.percentOfViewport}% of viewport). For 2 cards per row on 375px screen, they should be max ~180px (48% of viewport).`
            });
          }

          // Check grid template columns
          if (gridStyles.gridTemplateColumns) {
            const columns = gridStyles.gridTemplateColumns.split(' ');
            if (columns.length === 2) {
              const col1Width = parseFloat(columns[0]);
              const col2Width = parseFloat(columns[1]);
              if (col1Width + col2Width > 355) {
                analysis.issues.push({
                  type: 'GRID_COLUMNS_TOO_WIDE',
                  severity: 'HIGH',
                  description: `Grid columns (${gridStyles.gridTemplateColumns}) total ${col1Width + col2Width}px, leaving insufficient space for padding on 375px screen.`
                });
              }
            }
          }

          // Check padding issues
          const gridPadding = gridStyles.padding;
          if (gridPadding && gridPadding !== '0px') {
            const paddingValues = gridPadding.split(' ');
            const horizontalPadding = paddingValues.length >= 2 ?
              parseFloat(paddingValues[1]) + parseFloat(paddingValues.length === 4 ? paddingValues[3] : paddingValues[1]) :
              parseFloat(paddingValues[0]) * 2;

            if (horizontalPadding < 20) {
              analysis.issues.push({
                type: 'INSUFFICIENT_PADDING',
                severity: 'MEDIUM',
                description: `Grid has only ${horizontalPadding}px total horizontal padding. Consider 20-30px for better mobile UX.`
              });
            }
          }

          // Check text overflow
          const hasTextOverflow = analysis.cards.some(card => {
            const titleEl = document.querySelector(`[class*="title"]`);
            return titleEl && titleEl.scrollWidth > titleEl.clientWidth;
          });

          if (hasTextOverflow) {
            analysis.issues.push({
              type: 'TEXT_OVERFLOW',
              severity: 'LOW',
              description: 'Some card titles may be truncated or overflowing.'
            });
          }
        }

        // Generate recommendations
        analysis.recommendations = [
          {
            priority: 'HIGH',
            category: 'GRID_LAYOUT',
            recommendation: 'Use responsive grid with minmax()',
            currentValue: gridStyles.gridTemplateColumns,
            suggestedValue: 'repeat(2, minmax(0, 1fr))',
            css: `.video-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }`
          },
          {
            priority: 'HIGH',
            category: 'SPACING',
            recommendation: 'Optimize gap and padding for mobile',
            currentValue: `gap: ${gridStyles.gap}, padding: ${gridStyles.padding}`,
            suggestedValue: 'gap: 12px, padding: 0 12px',
            css: `.video-grid { gap: 12px; padding: 0 12px; }`
          },
          {
            priority: 'MEDIUM',
            category: 'CARD_SIZING',
            recommendation: 'Ensure cards scale properly',
            suggestedValue: 'width: 100%',
            css: `.video-grid > a { width: 100%; }`
          },
          {
            priority: 'MEDIUM',
            category: 'IMAGE_ASPECT',
            recommendation: 'Maintain consistent image aspect ratio',
            suggestedValue: 'aspect-ratio: 16/9',
            css: `.video-grid img { width: 100%; height: auto; aspect-ratio: 16/9; object-fit: cover; }`
          }
        ];
      }

      return analysis;
    });

    console.log('\n=== DETAILED CARD ANALYSIS ===');
    console.log(JSON.stringify(detailedAnalysis, null, 2));

    // Save detailed analysis
    fs.writeFileSync(
      path.join(__dirname, 'screenshots', 'detailed-analysis.json'),
      JSON.stringify(detailedAnalysis, null, 2)
    );

    // Create annotated screenshot showing measurements
    await page.evaluate(() => {
      // Add visual indicators
      const grid = document.querySelector('.video-grid');
      if (grid) {
        // Add border to grid
        grid.style.border = '2px solid red';

        // Add borders to cards
        const cards = grid.children;
        for (let i = 0; i < Math.min(4, cards.length); i++) {
          cards[i].style.border = '2px solid blue';
          cards[i].style.position = 'relative';

          // Add dimension label
          const label = document.createElement('div');
          label.textContent = `${Math.round(cards[i].getBoundingClientRect().width)}px`;
          label.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            background: yellow;
            color: black;
            padding: 2px 4px;
            font-size: 10px;
            z-index: 9999;
          `;
          cards[i].appendChild(label);
        }
      }
    });

    await page.waitForTimeout(500);

    // Take annotated screenshot
    const annotatedPath = path.join(__dirname, 'screenshots', 'mobile-annotated-375px.png');
    await page.screenshot({
      path: annotatedPath,
      fullPage: false
    });
    console.log('\nAnnotated screenshot saved showing card dimensions');

    // Print summary
    console.log('\n=== SUMMARY OF MOBILE LAYOUT ISSUES ===');
    if (detailedAnalysis.issues.length > 0) {
      console.log('\nISSUES FOUND:');
      detailedAnalysis.issues.forEach(issue => {
        console.log(`  [${issue.severity}] ${issue.type}`);
        console.log(`    → ${issue.description}`);
      });
    }

    console.log('\n=== KEY MEASUREMENTS ===');
    console.log(`Viewport width: 375px`);
    console.log(`Grid width: ${detailedAnalysis.grid?.dimensions.width}px`);
    console.log(`Grid columns: ${detailedAnalysis.grid?.styles.gridTemplateColumns}`);
    console.log(`Grid gap: ${detailedAnalysis.grid?.styles.gap}`);
    console.log(`Grid padding: ${detailedAnalysis.grid?.styles.padding}`);

    if (detailedAnalysis.cards.length > 0) {
      console.log(`\nCard 1 width: ${detailedAnalysis.cards[0].dimensions.width}px (${detailedAnalysis.cards[0].dimensions.percentOfViewport}% of viewport)`);
      console.log(`Card 1 position: x=${detailedAnalysis.cards[0].position.x}px`);
    }
    if (detailedAnalysis.cards.length > 1) {
      console.log(`Card 2 width: ${detailedAnalysis.cards[1].dimensions.width}px (${detailedAnalysis.cards[1].dimensions.percentOfViewport}% of viewport)`);
      console.log(`Card 2 position: x=${detailedAnalysis.cards[1].position.x}px`);
      console.log(`Horizontal gap: ${detailedAnalysis.actualHorizontalGap}px`);
    }
    if (detailedAnalysis.actualVerticalGap) {
      console.log(`Vertical gap: ${detailedAnalysis.actualVerticalGap}px`);
    }

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await browser.close();
    console.log('\n✓ Analysis complete.');
  }
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

detailedCardAnalysis();