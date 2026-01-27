import { NextResponse } from 'next/server';
import { yclientsApi } from '@/lib/yclients';
import {
  getSyncStatus,
  updateSyncStatus,
  setSyncRunning,
  addSyncHistoryItem,
  updateSyncHistoryItem,
  setCurrentSyncId,
  getSyncConfig,
  setSyncedData,
} from '@/lib/sync-store';

// Задержка между запросами (мс) для избежания rate limit
const REQUEST_DELAY = 200;
// Задержка при retry после 429 ошибки
const RATE_LIMIT_DELAY = 5000;
// Максимум retry попыток
const MAX_RETRIES = 3;

/**
 * Задержка выполнения
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * POST /api/v1/admin/sync/start
 * Запустить полную синхронизацию с YClients
 */
export async function POST() {
  try {
    const currentStatus = getSyncStatus();

    if (currentStatus.is_running) {
      return NextResponse.json(
        { error: 'Sync is already running' },
        { status: 409 }
      );
    }

    const historyItem = addSyncHistoryItem({
      started_at: new Date().toISOString(),
      finished_at: null,
      status: 'running',
      clients_created: 0,
      clients_updated: 0,
      clients_skipped: 0,
    });

    setCurrentSyncId(historyItem.id);
    setSyncRunning(true);
    updateSyncStatus({ errors: [], is_running: true });

    // Запустить синхронизацию асинхронно
    runFullSync(historyItem.id).catch(console.error);

    return NextResponse.json({
      message: 'Full sync started',
      sync_id: historyItem.id,
    });
  } catch (error) {
    console.error('Error starting sync:', error);
    return NextResponse.json(
      { error: 'Failed to start sync' },
      { status: 500 }
    );
  }
}

/**
 * Выполнить запрос с retry логикой
 */
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  context: string,
  retries = MAX_RETRIES
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fetchFn();
      await delay(REQUEST_DELAY); // Пауза после успешного запроса
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const isRateLimit = errorMessage.includes('429');

      if (attempt === retries) {
        throw err;
      }

      if (isRateLimit) {
        console.log(`[Sync] Rate limit hit for ${context}, waiting ${RATE_LIMIT_DELAY}ms (attempt ${attempt}/${retries})`);
        await delay(RATE_LIMIT_DELAY);
      } else {
        console.log(`[Sync] Error for ${context}: ${errorMessage}, retrying (attempt ${attempt}/${retries})`);
        await delay(1000);
      }
    }
  }
  throw new Error(`Failed after ${retries} attempts`);
}

/**
 * Выполнить полную синхронизацию
 */
async function runFullSync(syncId: number): Promise<void> {
  const config = getSyncConfig();
  const errors: string[] = [];
  let clientsCreated = 0;
  let clientsUpdated = 0;
  let clientsSkipped = 0;

  const syncData = {
    staff: [] as Awaited<ReturnType<typeof yclientsApi.getStaff>>,
    services: [] as Awaited<ReturnType<typeof yclientsApi.getServices>>,
    clients: [] as Awaited<ReturnType<typeof yclientsApi.getClients>>,
    records: [] as Awaited<ReturnType<typeof yclientsApi.getRecords>>,
  };

  try {
    console.log('[Sync] ========== НАЧАЛО ПОЛНОЙ СИНХРОНИЗАЦИИ ==========');

    // 1. Сотрудники
    console.log('[Sync] 1/4 Загрузка сотрудников...');
    try {
      syncData.staff = await fetchWithRetry(
        () => yclientsApi.getStaff(),
        'staff'
      );
      console.log(`[Sync] ✓ Загружено ${syncData.staff.length} сотрудников`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Staff: ${msg}`);
      console.error('[Sync] ✗ Ошибка загрузки сотрудников:', msg);
    }

    // 2. Услуги
    console.log('[Sync] 2/4 Загрузка услуг...');
    try {
      syncData.services = await fetchWithRetry(
        () => yclientsApi.getServices(),
        'services'
      );
      console.log(`[Sync] ✓ Загружено ${syncData.services.length} услуг`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Services: ${msg}`);
      console.error('[Sync] ✗ Ошибка загрузки услуг:', msg);
    }

    // 3. Клиенты (все страницы)
    console.log('[Sync] 3/4 Загрузка клиентов...');
    let page = 1;
    const pageSize = 100;
    let hasMoreClients = true;

    while (hasMoreClients) {
      try {
        const clients = await fetchWithRetry(
          () => yclientsApi.getClients({ page, count: pageSize }),
          `clients page ${page}`
        );

        if (clients.length === 0) {
          hasMoreClients = false;
        } else {
          syncData.clients.push(...clients);
          console.log(`[Sync]   Страница ${page}: +${clients.length} клиентов (всего: ${syncData.clients.length})`);
          page++;
        }

        // Обновить статус в реальном времени
        updateSyncStatus({
          clients_synced: syncData.clients.length,
        });

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Clients page ${page}: ${msg}`);
        console.error(`[Sync] ✗ Ошибка на странице ${page}:`, msg);
        hasMoreClients = false;
      }
    }
    console.log(`[Sync] ✓ Загружено ${syncData.clients.length} клиентов`);

    // 4. Записи за последние 90 дней + 14 дней вперёд (с пагинацией)
    console.log('[Sync] 4/4 Загрузка записей (90 дней назад + 14 дней вперёд)...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    let recordsPage = 1;
    const recordsPageSize = 200;
    let hasMoreRecords = true;

    while (hasMoreRecords) {
      try {
        const records = await fetchWithRetry(
          () => yclientsApi.getRecords({
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            page: recordsPage,
            count: recordsPageSize,
          }),
          `records page ${recordsPage}`
        );

        if (records.length === 0) {
          hasMoreRecords = false;
        } else {
          syncData.records.push(...records);
          console.log(`[Sync]   Страница ${recordsPage}: +${records.length} записей (всего: ${syncData.records.length})`);
          recordsPage++;

          // Если получили меньше чем запрашивали - это последняя страница
          if (records.length < recordsPageSize) {
            hasMoreRecords = false;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Records page ${recordsPage}: ${msg}`);
        console.error(`[Sync] ✗ Ошибка на странице ${recordsPage}:`, msg);
        hasMoreRecords = false;
      }
    }
    console.log(`[Sync] ✓ Загружено ${syncData.records.length} записей`);

    // Обработка клиентов: вычисляем visit_count на основе записей
    console.log('[Sync] Обработка клиентов...');

    // Подсчитываем визиты для каждого клиента на основе records
    const clientVisitCounts = new Map<number, number>();
    for (const record of syncData.records) {
      if (record.client && record.client.id && record.attendance === 2) { // attendance === 2 = клиент пришел
        const currentCount = clientVisitCounts.get(record.client.id) || 0;
        clientVisitCounts.set(record.client.id, currentCount + 1);
      }
    }

    // Обновляем данные клиентов
    for (const client of syncData.clients) {
      // Устанавливаем visit_count на основе подсчета из records
      const actualVisitCount = clientVisitCounts.get(client.id) || 0;
      client.visit_count = actualVisitCount;

      // Используем sold_amount как spent (YClients не возвращает spent)
      client.spent = client.sold_amount || 0;

      // Вычисляем средний чек
      if (actualVisitCount > 0 && client.sold_amount) {
        client.avg_sum = Math.round(client.sold_amount / actualVisitCount);
      } else {
        client.avg_sum = 0;
      }

      // Фильтрация по минимальному количеству визитов
      if (actualVisitCount < config.min_visits_threshold) {
        clientsSkipped++;
        continue;
      }

      // Пока считаем как "обновленных"
      clientsUpdated++;
    }

    // Финализация
    const finishedAt = new Date().toISOString();
    const finalStatus = errors.length > 0 ? 'partial' : 'success';

    updateSyncHistoryItem(syncId, {
      finished_at: finishedAt,
      status: finalStatus,
      clients_created: clientsCreated,
      clients_updated: clientsUpdated,
      clients_skipped: clientsSkipped,
      error_message: errors.length > 0 ? errors.join('; ') : undefined,
    });

    updateSyncStatus({
      is_running: false,
      last_sync_at: finishedAt,
      clients_synced: clientsCreated + clientsUpdated,
      clients_skipped: clientsSkipped,
      errors,
    });

    // Сохранить синхронизированные данные для использования на других страницах
    setSyncedData({
      clients: syncData.clients,
      staff: syncData.staff,
      services: syncData.services,
      records: syncData.records,
      lastSyncAt: finishedAt,
    });

    console.log('[Sync] ========== СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА ==========');
    console.log(`[Sync] Сотрудников: ${syncData.staff.length}`);
    console.log(`[Sync] Услуг: ${syncData.services.length}`);
    console.log(`[Sync] Клиентов: ${syncData.clients.length} (обновлено: ${clientsUpdated}, пропущено: ${clientsSkipped})`);
    console.log(`[Sync] Записей: ${syncData.records.length}`);
    console.log(`[Sync] Статус: ${finalStatus}`);
    if (errors.length > 0) {
      console.log(`[Sync] Ошибки: ${errors.join('; ')}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Sync] КРИТИЧЕСКАЯ ОШИБКА:', errorMessage);

    updateSyncHistoryItem(syncId, {
      finished_at: new Date().toISOString(),
      status: 'error',
      clients_created: clientsCreated,
      clients_updated: clientsUpdated,
      clients_skipped: clientsSkipped,
      error_message: errorMessage,
    });

    updateSyncStatus({
      is_running: false,
      errors: [errorMessage],
    });
  } finally {
    setSyncRunning(false);
    setCurrentSyncId(null);
  }
}
