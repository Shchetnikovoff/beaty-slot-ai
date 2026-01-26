import { NextRequest, NextResponse } from 'next/server';
import { getSyncedRecords, getSyncedClients } from '@/lib/sync-store';

/**
 * Типы источников трафика
 */
type SourceType = 'online_widget' | 'aggregator' | 'direct' | 'admin' | 'unknown';

interface TrafficSource {
  source: SourceType;
  source_name: string;
  source_detail: string | null;
  records_count: number;
  percentage: number;
  unique_clients: number;
  revenue: number;
  avg_check: number;
  conversion_note: string;
}

interface SourceBreakdown {
  detail: string;
  count: number;
  percentage: number;
  revenue: number;
}

/**
 * Определить тип источника из записи
 */
function determineSource(record: {
  from_url?: string | null;
  online?: boolean;
  api_id?: string | number | null;
}): { type: SourceType; detail: string | null } {
  // 1. Онлайн запись через виджет
  if (record.online && !record.api_id) {
    return { type: 'online_widget', detail: record.from_url || null };
  }

  // 2. Запись через агрегатор (api_id указан)
  if (record.api_id) {
    return { type: 'aggregator', detail: `API ID: ${record.api_id}` };
  }

  // 3. Онлайн запись с URL (возможно, свой виджет)
  if (record.from_url) {
    // Парсим домен из URL
    try {
      const url = new URL(record.from_url);
      return { type: 'online_widget', detail: url.hostname };
    } catch {
      return { type: 'online_widget', detail: record.from_url };
    }
  }

  // 4. Прямая запись через администратора (не онлайн)
  if (!record.online) {
    return { type: 'admin', detail: 'Администратор' };
  }

  // 5. Неизвестный источник
  return { type: 'unknown', detail: null };
}

/**
 * Получить человекочитаемое название источника
 */
function getSourceName(type: SourceType): string {
  const names: Record<SourceType, string> = {
    online_widget: 'Онлайн-запись',
    aggregator: 'Агрегаторы',
    direct: 'Прямые',
    admin: 'Через администратора',
    unknown: 'Неизвестно',
  };
  return names[type];
}

/**
 * GET /api/v1/admin/analytics/traffic-sources
 * Анализ источников записей
 *
 * Query params:
 *   - period: 'week' | 'month' | '3months' | 'year' (по умолчанию 'month')
 *   - start_date: YYYY-MM-DD (кастомный период)
 *   - end_date: YYYY-MM-DD (кастомный период)
 */
export async function GET(request: NextRequest) {
  try {
    const records = getSyncedRecords();
    const clients = getSyncedClients();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Определяем период
    let startDate: Date;
    let endDate: Date = today;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam + 'T00:00:00');
      endDate = new Date(endDateParam + 'T23:59:59');
    } else {
      switch (period) {
        case 'week':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          break;
        case '3months':
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date(today);
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'month':
        default:
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 1);
      }
      startDate.setHours(0, 0, 0, 0);
    }

    // Фильтруем записи по периоду
    const periodRecords = records.filter(r => {
      const recordDate = new Date(r.datetime || r.date);
      return !r.deleted && recordDate >= startDate && recordDate <= endDate;
    });

    if (periodRecords.length === 0) {
      return NextResponse.json({
        sources: [],
        totals: {
          total_records: 0,
          online_percentage: 0,
          total_revenue: 0,
          period: { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] },
        },
        breakdowns: {},
        insights: ['Нет записей за выбранный период'],
        recommendations: [],
      });
    }

    // Группируем по источникам
    const sourceMap = new Map<SourceType, {
      records: typeof periodRecords;
      details: Map<string, typeof periodRecords>;
    }>();

    periodRecords.forEach(record => {
      const { type, detail } = determineSource(record);

      if (!sourceMap.has(type)) {
        sourceMap.set(type, { records: [], details: new Map() });
      }

      const sourceData = sourceMap.get(type)!;
      sourceData.records.push(record);

      const detailKey = detail || 'Без деталей';
      if (!sourceData.details.has(detailKey)) {
        sourceData.details.set(detailKey, []);
      }
      sourceData.details.get(detailKey)!.push(record);
    });

    // Формируем результат
    const sources: TrafficSource[] = [];
    const breakdowns: Record<string, SourceBreakdown[]> = {};
    const totalRecords = periodRecords.length;

    // Подсчёт выручки
    const calculateRevenue = (recs: typeof periodRecords): number => {
      return recs.reduce((sum, r) => {
        const recordRevenue = r.services?.reduce((s, svc) => s + (svc.cost || 0), 0) || 0;
        return sum + recordRevenue;
      }, 0);
    };

    // Уникальные клиенты
    const getUniqueClients = (recs: typeof periodRecords): number => {
      const clientIds = new Set(recs.map(r => r.client?.id).filter(Boolean));
      return clientIds.size;
    };

    sourceMap.forEach((data, type) => {
      const revenue = calculateRevenue(data.records);
      const uniqueClients = getUniqueClients(data.records);
      const avgCheck = data.records.length > 0 ? Math.round(revenue / data.records.length) : 0;
      const percentage = Math.round((data.records.length / totalRecords) * 100);

      // Определяем примечание о конверсии
      let conversionNote = '';
      if (type === 'online_widget' && percentage < 30) {
        conversionNote = 'Низкая доля онлайн-записей';
      } else if (type === 'admin' && percentage > 70) {
        conversionNote = 'Высокая нагрузка на администратора';
      } else if (type === 'aggregator' && percentage > 40) {
        conversionNote = 'Высокая зависимость от агрегаторов';
      }

      sources.push({
        source: type,
        source_name: getSourceName(type),
        source_detail: data.details.size === 1 ? Array.from(data.details.keys())[0] : null,
        records_count: data.records.length,
        percentage,
        unique_clients: uniqueClients,
        revenue,
        avg_check: avgCheck,
        conversion_note: conversionNote,
      });

      // Детализация по источнику
      if (data.details.size > 1) {
        breakdowns[type] = Array.from(data.details.entries())
          .map(([detail, recs]) => ({
            detail,
            count: recs.length,
            percentage: Math.round((recs.length / data.records.length) * 100),
            revenue: calculateRevenue(recs),
          }))
          .sort((a, b) => b.count - a.count);
      }
    });

    // Сортируем по количеству записей
    sources.sort((a, b) => b.records_count - a.records_count);

    // Общая статистика
    const totalRevenue = calculateRevenue(periodRecords);
    const onlineRecords = periodRecords.filter(r => r.online);
    const onlinePercentage = Math.round((onlineRecords.length / totalRecords) * 100);

    // Инсайты
    const insights: string[] = [];
    const onlineSource = sources.find(s => s.source === 'online_widget');
    const adminSource = sources.find(s => s.source === 'admin');
    const aggregatorSource = sources.find(s => s.source === 'aggregator');

    if (onlinePercentage < 20) {
      insights.push(`📉 Только ${onlinePercentage}% записей онлайн — автоматизируйте приём`);
    } else if (onlinePercentage >= 50) {
      insights.push(`✅ ${onlinePercentage}% записей онлайн — отлично!`);
    }

    if (adminSource && adminSource.percentage > 60) {
      insights.push(`⚠️ ${adminSource.percentage}% записей через админа — высокая нагрузка`);
    }

    if (aggregatorSource && aggregatorSource.percentage > 30) {
      insights.push(`💸 ${aggregatorSource.percentage}% через агрегаторы — проверьте комиссию`);
    }

    if (onlineSource && onlineSource.avg_check > (adminSource?.avg_check || 0) * 1.2) {
      insights.push(`💎 Онлайн-клиенты тратят на ${Math.round(((onlineSource.avg_check / (adminSource?.avg_check || 1)) - 1) * 100)}% больше`);
    }

    // Рекомендации
    const recommendations: string[] = [];

    if (onlinePercentage < 30) {
      recommendations.push('Добавьте виджет онлайн-записи на сайт и соцсети');
    }

    if (!aggregatorSource || aggregatorSource.records_count === 0) {
      recommendations.push('Рассмотрите подключение к агрегаторам (Яндекс, 2ГИС)');
    }

    if (Object.keys(breakdowns).length === 0 || !breakdowns['online_widget']) {
      recommendations.push('Используйте UTM-метки для отслеживания источников');
    }

    // Новые клиенты по источникам
    const newClientsThisMonth = clients.filter(c => {
      if (!c.first_visit_date) return false;
      const firstVisit = new Date(c.first_visit_date);
      return firstVisit >= startDate && firstVisit <= endDate;
    }).length;

    return NextResponse.json({
      sources,
      totals: {
        total_records: totalRecords,
        online_percentage: onlinePercentage,
        total_revenue: totalRevenue,
        avg_check: Math.round(totalRevenue / totalRecords),
        new_clients: newClientsThisMonth,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
      },
      breakdowns,
      insights,
      recommendations,
      chart_data: sources.map(s => ({
        name: s.source_name,
        value: s.records_count,
        percentage: s.percentage,
        color: s.source === 'online_widget' ? '#69db7c' :
               s.source === 'admin' ? '#74c0fc' :
               s.source === 'aggregator' ? '#ffa94d' : '#adb5bd',
      })),
    });
  } catch (error) {
    console.error('Error getting traffic sources:', error);
    return NextResponse.json(
      { error: 'Failed to get traffic sources' },
      { status: 500 }
    );
  }
}
