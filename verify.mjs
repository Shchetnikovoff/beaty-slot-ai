import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('📥 Проверка страниц с реальными данными\n');

  // Clients
  await page.goto('http://localhost:3000/apps/customers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verify-clients.png', fullPage: true });
  const clientsText = await page.textContent('body');
  const clientsMatch = clientsText.match(/Всего клиентов:\s*(\d+)/);
  console.log(`👥 Клиенты: ${clientsMatch ? clientsMatch[1] : 'N/A'}`);

  // Team
  await page.goto('http://localhost:3000/apps/team', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verify-team.png', fullPage: true });
  const teamText = await page.textContent('body');
  const staffMatch = teamText.match(/Всего сотрудников:\s*(\d+)/);
  console.log(`👷 Сотрудники: ${staffMatch ? staffMatch[1] : 'N/A'}`);

  // Sync
  await page.goto('http://localhost:3000/apps/sync', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verify-sync.png', fullPage: true });
  console.log('📊 Sync: скриншот сохранён');

  await page.waitForTimeout(3000);
  await browser.close();

  console.log('\n✅ Скриншоты: verify-clients.png, verify-team.png, verify-sync.png');
}

verify().catch(console.error);
