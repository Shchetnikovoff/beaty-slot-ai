const { chromium } = require('playwright');

async function testSidebarCalendar() {
  console.log('Starting Playwright browser...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigate to localhost:3000
    console.log('1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { timeout: 60000 });

    // Wait for page to stabilize
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Check if we're on the login page
    const url = page.url();
    console.log('Current URL:', url);

    // Take initial screenshot
    await page.screenshot({
      path: 'screenshots/00-initial.png',
      fullPage: true
    });
    console.log('Initial screenshot saved: screenshots/00-initial.png');

    // Step 2: Check if login is required
    const passwordField = await page.locator('input[type="password"]').count();
    if (url.includes('login') || passwordField > 0) {
      console.log('2. Login page detected. Logging in with admin/admin123...');

      // Wait for form to be ready
      await page.waitForTimeout(1000);

      // Find and fill username
      const usernameSelectors = [
        'input[name="username"]',
        'input[name="email"]',
        'input[type="text"]',
        'input[type="email"]'
      ];

      for (const sel of usernameSelectors) {
        const input = page.locator(sel).first();
        if (await input.count() > 0) {
          await input.fill('admin');
          console.log(`Filled username in: ${sel}`);
          break;
        }
      }

      // Find and fill password
      const pwdInput = page.locator('input[type="password"]').first();
      if (await pwdInput.count() > 0) {
        await pwdInput.fill('admin123');
        console.log('Filled password');
      }

      // Take screenshot of filled form
      await page.screenshot({
        path: 'screenshots/01-login-filled.png',
        fullPage: false
      });

      // Find and click login button
      const buttonSelectors = [
        'button[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Войти")',
        'button:has-text("Sign in")',
        'button:has-text("Вход")'
      ];

      for (const sel of buttonSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.count() > 0) {
          console.log(`Clicking login button: ${sel}`);
          await btn.click();
          break;
        }
      }

      // Wait for navigation
      await page.waitForTimeout(5000);
      console.log('After login URL:', page.url());
    }

    // Step 3: Take screenshot of dashboard with sidebar calendar
    console.log('3. Taking screenshot of dashboard with sidebar calendar...');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'screenshots/02-dashboard-calendar.png',
      fullPage: false
    });
    console.log('Screenshot saved: screenshots/02-dashboard-calendar.png');

    // Get the page content structure for debugging
    const bodyHTML = await page.evaluate(() => {
      const getStructure = (el, depth = 0) => {
        if (depth > 3) return '';
        let result = '';
        const children = el.children;
        for (let i = 0; i < Math.min(children.length, 10); i++) {
          const child = children[i];
          const classes = child.className ? ` class="${child.className.toString().substring(0, 50)}"` : '';
          result += `${'  '.repeat(depth)}<${child.tagName.toLowerCase()}${classes}>\n`;
          result += getStructure(child, depth + 1);
        }
        return result;
      };
      return getStructure(document.body);
    });
    console.log('Page structure:\n', bodyHTML.substring(0, 2000));

    // Look for the calendar in sidebar
    console.log('\nLooking for sidebar calendar...');
    const calendarSelectors = [
      '.mantine-Calendar-calendar',
      '.mantine-Calendar-month',
      '.mantine-DatePicker-calendar',
      '[class*="Calendar"]',
      '[class*="calendar"]',
      '.sidebar-calendar',
      '[data-testid*="calendar"]'
    ];

    let calendarElement = null;
    for (const selector of calendarSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found calendar with selector: ${selector} (count: ${count})`);
        calendarElement = page.locator(selector).first();
        break;
      }
    }

    // Step 4: Click on a different date
    console.log('4. Looking for clickable date cells...');

    const dateSelectors = [
      'button.mantine-Calendar-day',
      '.mantine-Calendar-day',
      '.mantine-DatePicker-day',
      'button[data-day]',
      'td button',
      '[class*="Day__day"]'
    ];

    let clickedDate = false;
    let originalTitle = '';

    // Try to get the current widget title before clicking
    const titleElement = await page.locator('text=/Записи|Bookings/i').first();
    if (await titleElement.count() > 0) {
      originalTitle = await titleElement.textContent();
      console.log(`Original widget title: "${originalTitle}"`);
    }

    for (const selector of dateSelectors) {
      const days = page.locator(selector);
      const count = await days.count();
      console.log(`Selector ${selector}: found ${count} elements`);

      if (count > 0) {
        // Find a day that's not the current selected one
        for (let i = 0; i < count; i++) {
          const day = days.nth(i);
          const isDisabled = await day.getAttribute('data-disabled');
          const isSelected = await day.getAttribute('data-selected');
          const isOutside = await day.getAttribute('data-outside');

          if (isDisabled === 'true' || isSelected === 'true' || isOutside === 'true') {
            continue;
          }

          const text = await day.textContent();
          // Skip if text doesn't look like a date number
          if (!/^\d{1,2}$/.test(text.trim())) {
            continue;
          }

          console.log(`Clicking on date: ${text.trim()}`);
          await day.click();
          clickedDate = true;
          break;
        }

        if (clickedDate) break;
      }
    }

    if (!clickedDate) {
      console.log('Could not find specific date cells. Trying to find any number buttons...');
      const allButtons = await page.locator('button').all();
      for (const btn of allButtons) {
        const text = await btn.textContent();
        // Look for buttons that contain just a number (likely dates)
        if (/^\s*\d{1,2}\s*$/.test(text)) {
          const isDisabled = await btn.isDisabled();
          if (!isDisabled) {
            console.log(`Found and clicking date button: ${text.trim()}`);
            await btn.click();
            clickedDate = true;
            break;
          }
        }
      }
    }

    // Step 5: Take screenshot after clicking date
    console.log('5. Taking screenshot after date selection...');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'screenshots/03-after-date-click.png',
      fullPage: false
    });
    console.log('Screenshot saved: screenshots/03-after-date-click.png');

    // Step 6: Check if widget title changed
    console.log('6. Checking for widget title change...');

    const newTitleElement = await page.locator('text=/Записи|Bookings/i').first();
    if (await newTitleElement.count() > 0) {
      const newTitle = await newTitleElement.textContent();
      console.log(`New widget title: "${newTitle}"`);

      if (originalTitle !== newTitle) {
        console.log('SUCCESS: Widget title changed after date selection!');
      } else {
        console.log('Widget title did not change (might be same date or no records)');
      }
    }

    // Final full page screenshot
    await page.screenshot({
      path: 'screenshots/04-final-state.png',
      fullPage: true
    });
    console.log('Final screenshot saved: screenshots/04-final-state.png');

    console.log('\n=== Test Results ===');
    console.log(`- Navigation: SUCCESS`);
    console.log(`- Calendar found: ${calendarElement ? 'YES' : 'NO'}`);
    console.log(`- Date clicked: ${clickedDate ? 'YES' : 'NO'}`);
    console.log(`- Screenshots saved to: screenshots/`);

  } catch (error) {
    console.error('Error during test:', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({
      path: 'screenshots/error-screenshot.png',
      fullPage: true
    }).catch(() => {});
  } finally {
    console.log('\nKeeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testSidebarCalendar().catch(console.error);
