import { chromium } from 'playwright';

async function testCalendar() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:3002');
  await page.waitForTimeout(2000);

  // Take screenshot of login page
  await page.screenshot({ path: 'screenshot-1-login.png', fullPage: true });
  console.log('Screenshot 1: Login page saved');

  // Login
  console.log('2. Logging in with admin/admin123...');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Wait for dashboard to load
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-2-dashboard.png', fullPage: true });
  console.log('Screenshot 2: Dashboard with calendar saved');

  // Look for calendar and click a different date
  console.log('3. Looking for calendar in sidebar...');
  const calendarDays = await page.locator('.mantine-Calendar-day').all();
  console.log(`Found ${calendarDays.length} calendar days`);

  if (calendarDays.length > 0) {
    // Click on a day that's not today (e.g., first available day)
    const targetDay = calendarDays[10]; // Pick some day
    await targetDay.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshot-3-date-changed.png', fullPage: true });
    console.log('Screenshot 3: After date selection saved');
  }

  console.log('Test completed! Check the screenshots.');
  await page.waitForTimeout(5000);
  await browser.close();
}

testCalendar().catch(console.error);
