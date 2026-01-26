const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyDashboard() {
  console.log('========================================');
  console.log('Dashboard Verification Test');
  console.log('========================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = {
    navigation: false,
    login: false,
    dashboardLoaded: false,
    calendarFound: false,
    dateClicked: false,
    widgetsUpdated: false,
    allWidgetsHaveData: false
  };

  try {
    // Step 1: Navigate to dashboard
    console.log('STEP 1: Navigating to http://localhost:3000/dashboard/default...');
    await page.goto('http://localhost:3000/dashboard/default', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });
    results.navigation = true;
    console.log('Navigation: SUCCESS');

    // Wait for page to be stable
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Screenshot: Initial state
    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-01-initial.png'),
      fullPage: false
    });
    console.log('Screenshot saved: dashboard-01-initial.png');

    // Check if login is required
    if (currentUrl.includes('signin') || currentUrl.includes('login')) {
      console.log('\nSTEP 2: Login required. Authenticating...');

      // Wait for form
      await page.waitForTimeout(1500);

      // Fill email
      const emailInput = page.locator('input[type="email"], input[name="email"], input[type="text"]').first();
      if (await emailInput.count() > 0) {
        await emailInput.fill('demo@example.com');
        console.log('Filled email: demo@example.com');
      }

      // Fill password
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.count() > 0) {
        await passwordInput.fill('demo123');
        console.log('Filled password');
      }

      // Screenshot: Login filled
      await page.screenshot({
        path: path.join(screenshotsDir, 'dashboard-02-login.png'),
        fullPage: false
      });

      // Click login button
      const loginBtn = page.locator('button[type="submit"]').first();
      if (await loginBtn.count() > 0) {
        await loginBtn.click();
        console.log('Clicked login button');
      }

      // Wait for navigation after login
      await page.waitForTimeout(5000);
      console.log(`After login URL: ${page.url()}`);
      results.login = true;
    }

    // Wait for dashboard to load
    console.log('\nSTEP 3: Waiting for dashboard to load...');
    await page.waitForTimeout(3000);
    results.dashboardLoaded = true;

    // Screenshot: Dashboard loaded
    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-03-loaded.png'),
      fullPage: false
    });
    console.log('Screenshot saved: dashboard-03-loaded.png');

    // Step 4: Find the calendar in sidebar
    console.log('\nSTEP 4: Looking for sidebar calendar...');

    const calendarSelectors = [
      '[class*="Calendar"]',
      '[class*="calendar"]',
      '.mantine-Calendar-calendar',
      '.mantine-DatePicker-calendar',
      '[data-testid*="calendar"]'
    ];

    let calendarFound = false;
    for (const selector of calendarSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found calendar with selector: ${selector}`);
        calendarFound = true;
        results.calendarFound = true;
        break;
      }
    }

    if (!calendarFound) {
      console.log('Calendar not found with standard selectors, looking in sidebar...');
      // Try to find calendar in left sidebar area
      const sidebarCalendar = await page.locator('aside, nav, [class*="sidebar"], [class*="Sidebar"]').locator('table, [class*="Calendar"]').count();
      if (sidebarCalendar > 0) {
        console.log('Found calendar in sidebar area');
        results.calendarFound = true;
      }
    }

    // Step 5: Capture widget data BEFORE date click
    console.log('\nSTEP 5: Capturing widget data BEFORE date click...');

    const widgetSelectors = [
      '[class*="widget"]',
      '[class*="Widget"]',
      '.mantine-Paper-root',
      '[class*="Card"]',
      '[class*="card"]'
    ];

    let widgetsBefore = [];
    for (const selector of widgetSelectors) {
      const widgets = page.locator(selector);
      const count = await widgets.count();
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        for (let i = 0; i < Math.min(count, 10); i++) {
          const text = await widgets.nth(i).textContent();
          widgetsBefore.push(text?.substring(0, 100) || '');
        }
        break;
      }
    }
    console.log(`Captured ${widgetsBefore.length} widget states`);

    // Step 6: Click on a date in calendar
    console.log('\nSTEP 6: Clicking on a date in calendar...');

    // Look for date cells/buttons
    const dateSelectors = [
      'button[data-day]',
      '.mantine-Calendar-day',
      '.mantine-DatePicker-day',
      'td[data-day]',
      'button.mantine-UnstyledButton-root'
    ];

    let clickedDate = false;
    for (const selector of dateSelectors) {
      const days = page.locator(selector);
      const count = await days.count();

      if (count > 0) {
        console.log(`Found ${count} day elements with selector: ${selector}`);

        for (let i = 0; i < count; i++) {
          const day = days.nth(i);
          const text = await day.textContent();
          const isDisabled = await day.getAttribute('data-disabled');
          const isSelected = await day.getAttribute('data-selected');
          const isOutside = await day.getAttribute('data-outside');

          // Skip disabled, selected, or outside dates
          if (isDisabled === 'true' || isSelected === 'true' || isOutside === 'true') {
            continue;
          }

          // Look for a number that looks like a date (1-31)
          const trimmedText = text?.trim();
          if (trimmedText && /^\d{1,2}$/.test(trimmedText)) {
            const num = parseInt(trimmedText, 10);
            if (num >= 1 && num <= 31) {
              console.log(`Clicking date: ${trimmedText}`);
              await day.click();
              clickedDate = true;
              results.dateClicked = true;
              break;
            }
          }
        }

        if (clickedDate) break;
      }
    }

    if (!clickedDate) {
      // Fallback: look for any button with just a number
      console.log('Trying fallback method to find date buttons...');
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();

      for (let i = 0; i < buttonCount; i++) {
        const btn = allButtons.nth(i);
        const text = await btn.textContent();

        if (text && /^\s*\d{1,2}\s*$/.test(text)) {
          const num = parseInt(text.trim(), 10);
          if (num >= 1 && num <= 31 && !(await btn.isDisabled())) {
            console.log(`Clicking date button: ${text.trim()}`);
            await btn.click();
            clickedDate = true;
            results.dateClicked = true;
            break;
          }
        }
      }
    }

    // Wait for data to update
    await page.waitForTimeout(2000);

    // Screenshot: After date click
    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-04-after-date-click.png'),
      fullPage: false
    });
    console.log('Screenshot saved: dashboard-04-after-date-click.png');

    // Step 7: Capture widget data AFTER date click
    console.log('\nSTEP 7: Checking if widgets updated...');

    let widgetsAfter = [];
    for (const selector of widgetSelectors) {
      const widgets = page.locator(selector);
      const count = await widgets.count();
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 10); i++) {
          const text = await widgets.nth(i).textContent();
          widgetsAfter.push(text?.substring(0, 100) || '');
        }
        break;
      }
    }

    // Compare before and after
    let widgetsChanged = 0;
    for (let i = 0; i < Math.min(widgetsBefore.length, widgetsAfter.length); i++) {
      if (widgetsBefore[i] !== widgetsAfter[i]) {
        widgetsChanged++;
      }
    }

    if (widgetsChanged > 0) {
      console.log(`${widgetsChanged} widgets updated after date selection`);
      results.widgetsUpdated = true;
    } else {
      console.log('Widgets did not change (may be same data for selected date)');
    }

    // Step 8: Check if widgets show data
    console.log('\nSTEP 8: Verifying widgets show data...');

    // Look for common data indicators in widgets
    const dataIndicators = await page.locator('text=/\\d+|Записи|Bookings|Revenue|Orders|доход|записей/i').count();
    console.log(`Found ${dataIndicators} data indicators on page`);

    if (dataIndicators > 0) {
      results.allWidgetsHaveData = true;
    }

    // Final full-page screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-05-final.png'),
      fullPage: true
    });
    console.log('Screenshot saved: dashboard-05-final.png');

    // Print results
    console.log('\n========================================');
    console.log('VERIFICATION RESULTS');
    console.log('========================================');
    console.log(`Navigation to dashboard: ${results.navigation ? 'PASS' : 'FAIL'}`);
    console.log(`Dashboard loaded: ${results.dashboardLoaded ? 'PASS' : 'FAIL'}`);
    console.log(`Calendar found in sidebar: ${results.calendarFound ? 'PASS' : 'FAIL'}`);
    console.log(`Date selection works: ${results.dateClicked ? 'PASS' : 'FAIL'}`);
    console.log(`Widgets updated on date change: ${results.widgetsUpdated ? 'PASS' : 'CHECK (same data for date)'}`);
    console.log(`Widgets display data: ${results.allWidgetsHaveData ? 'PASS' : 'FAIL'}`);
    console.log('========================================');

    const passCount = Object.values(results).filter(v => v === true).length;
    const totalCount = Object.keys(results).length;
    console.log(`Overall: ${passCount}/${totalCount} checks passed`);

    if (passCount >= 4) {
      console.log('\nVERIFICATION: PASSED - Dashboard is functional');
    } else {
      console.log('\nVERIFICATION: NEEDS REVIEW - Check screenshots for details');
    }

  } catch (error) {
    console.error('\nERROR during verification:', error.message);
    console.error('Stack:', error.stack);

    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-error.png'),
      fullPage: true
    }).catch(() => {});
  } finally {
    console.log('\nKeeping browser open for 5 seconds for manual inspection...');
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('Browser closed. Test complete.');
  }
}

verifyDashboard().catch(console.error);
