import { NextRequest, NextResponse } from 'next/server';
import { getSyncedClients } from '@/lib/sync-store';
import type { YclientsClient } from '@/lib/yclients';

/**
 * Типы для LTV анализа
 */
type LTVSegment = 'diamond' | 'gold' | 'silver' | 'bronze';

interface LTVClient {
  id: number;
  name: string;
  phone: string;
  email: string;
  current_value: number;      // sold_amount / spent
  ltv: number;                // прогнозируемая ценность
  avg_check: number;
  visit_count: number;
  visits_per_month: number;
  months_as_client: number;
  churn_risk: number;         // 0-100
  segment: LTVSegment;
  last_visit_date: string | null;
  first_visit_date: string | null;
}

interface SegmentStats {
  count: number;
  total_value: number;
  revenue_percent: number;
  avg_ltv: number;
  avg_check: number;
}

/**
 * Рассчитать LTV клиента
 * LTV = avg_check × visits_per_month × 12 × predicted_years
 */
function calculateLTV(client: YclientsClient, today: Date): {
  ltv: number;
  visitsPerMonth: number;
  monthsAsClient: number;
  churnRisk: number;
} {
  const avgCheck = client.avg_sum || 0;
  const visitCount = client.visit_count || 0;

  // Месяцы как клиент
  let monthsAsClient = 1;
  if (client.first_visit_date) {
    const firstVisit = new Date(client.first_visit_date);
    monthsAsClient = Math.max(1, Math.floor(
      (today.getTime() - firstVisit.getTime()) / (30 * 24 * 60 * 60 * 1000)
    ));
  }

  // Визиты в месяц
  const visitsPerMonth = visitCount / monthsAsClient;

  // Риск оттока (churn) на основе давности визита
  let churnRisk = 0;
  if (client.last_visit_date) {
    const lastVisit = new Date(client.last_visit_date);
    const daysSinceVisit = Math.floor(
      (today.getTime() - lastVisit.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceVisit > 90) churnRisk = 90;
    else if (daysSinceVisit > 60) churnRisk = 70;
    else if (daysSinceVisit > 45) churnRisk = 50;
    else if (daysSinceVisit > 30) churnRisk = 30;
    else if (daysSinceVisit > 14) churnRisk = 10;
    else churnRisk = 0;
  } else {
    churnRisk = 50; // Нет данных о визитах
  }

  // Прогноз на сколько лет останется клиентом
  // Чем выше churn risk, тем меньше прогноз
  const predictedYears = Math.max(0.5, (100 - churnRisk) / 100 * 3);

  // LTV = avg_check × visits_per_month × 12 × predicted_years
  const ltv = avgCheck * visitsPerMonth * 12 * predictedYears;

  return {
    ltv: Math.round(ltv),
    visitsPerMonth: Math.round(visitsPerMonth * 100) / 100,
    monthsAsClient,
    churnRisk,
  };
}

/**
 * Определить сегмент клиента по LTV
 */
function getSegment(ltv: number, percentile: number): LTVSegment {
  if (percentile >= 95) return 'diamond';  // Top 5%
  if (percentile >= 80) return 'gold';     // Top 20%
  if (percentile >= 50) return 'silver';   // Top 50%
  return 'bronze';                          // Rest
}

/**
 * GET /api/v1/admin/analytics/ltv
 * Получить LTV анализ клиентов
 *
 * Query params:
 *   - segment: фильтр по сегменту (diamond/gold/silver/bronze)
 *   - min_visits: минимум визитов
 *   - sort_by: current_value | ltv | churn_risk (по умолчанию ltv)
 *   - limit: лимит клиентов (по умолчанию 100)
 */
export async function GET(request: NextRequest) {
  try {
    const clients = getSyncedClients();
    const { searchParams } = new URL(request.url);

    const segmentFilter = searchParams.get('segment') as LTVSegment | null;
    const minVisits = parseInt(searchParams.get('min_visits') || '0', 10);
    const sortBy = searchParams.get('sort_by') || 'ltv';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const today = new Date();

    // Рассчитываем LTV для каждого клиента
    const clientsWithLTV = clients
      .filter(c => (c.visit_count || 0) >= minVisits)
      .map(client => {
        const { ltv, visitsPerMonth, monthsAsClient, churnRisk } = calculateLTV(client, today);
        const currentValue = client.spent || client.sold_amount || 0;

        return {
          client,
          ltv,
          visitsPerMonth,
          monthsAsClient,
          churnRisk,
          currentValue,
        };
      });

    // Сортируем по LTV для определения перцентилей
    const sortedByLTV = [...clientsWithLTV].sort((a, b) => b.ltv - a.ltv);

    // Определяем сегменты на основе перцентилей
    const clientsWithSegments: (typeof clientsWithLTV[0] & { segment: LTVSegment; percentile: number })[] =
      clientsWithLTV.map(c => {
        const rank = sortedByLTV.findIndex(s => s.client.id === c.client.id);
        const percentile = 100 - (rank / sortedByLTV.length) * 100;
        return {
          ...c,
          segment: getSegment(c.ltv, percentile),
          percentile,
        };
      });

    // Фильтрация по сегменту
    let filteredClients = clientsWithSegments;
    if (segmentFilter) {
      filteredClients = clientsWithSegments.filter(c => c.segment === segmentFilter);
    }

    // Сортировка
    if (sortBy === 'current_value') {
      filteredClients.sort((a, b) => b.currentValue - a.currentValue);
    } else if (sortBy === 'churn_risk') {
      filteredClients.sort((a, b) => b.churnRisk - a.churnRisk);
    } else {
      filteredClients.sort((a, b) => b.ltv - a.ltv);
    }

    // Преобразование в формат ответа
    const ltvClients: LTVClient[] = filteredClients.slice(0, limit).map(c => ({
      id: c.client.id,
      name: c.client.name,
      phone: c.client.phone || '',
      email: c.client.email || '',
      current_value: Math.round(c.currentValue),
      ltv: c.ltv,
      avg_check: Math.round(c.client.avg_sum || 0),
      visit_count: c.client.visit_count || 0,
      visits_per_month: c.visitsPerMonth,
      months_as_client: c.monthsAsClient,
      churn_risk: c.churnRisk,
      segment: c.segment,
      last_visit_date: c.client.last_visit_date,
      first_visit_date: c.client.first_visit_date,
    }));

    // Статистика по сегментам
    const totalValue = clientsWithSegments.reduce((sum, c) => sum + c.currentValue, 0);

    const segmentStats = (['diamond', 'gold', 'silver', 'bronze'] as LTVSegment[]).reduce((acc, seg) => {
      const segmentClients = clientsWithSegments.filter(c => c.segment === seg);
      const segmentValue = segmentClients.reduce((sum, c) => sum + c.currentValue, 0);
      const segmentLTV = segmentClients.reduce((sum, c) => sum + c.ltv, 0);

      acc[seg] = {
        count: segmentClients.length,
        total_value: Math.round(segmentValue),
        revenue_percent: totalValue > 0 ? Math.round((segmentValue / totalValue) * 100) : 0,
        avg_ltv: segmentClients.length > 0 ? Math.round(segmentLTV / segmentClients.length) : 0,
        avg_check: segmentClients.length > 0
          ? Math.round(segmentClients.reduce((sum, c) => sum + (c.client.avg_sum || 0), 0) / segmentClients.length)
          : 0,
      };
      return acc;
    }, {} as Record<LTVSegment, SegmentStats>);

    // Парето анализ (правило 80/20)
    const top20PercentCount = Math.ceil(clientsWithSegments.length * 0.2);
    const top20Clients = sortedByLTV.slice(0, top20PercentCount);
    const top20Revenue = top20Clients.reduce((sum, c) => sum + c.currentValue, 0);
    const top20RevenuePercent = totalValue > 0 ? Math.round((top20Revenue / totalValue) * 100) : 0;

    return NextResponse.json({
      clients: ltvClients,
      total_clients: clientsWithSegments.length,
      segments: segmentStats,
      pareto: {
        top_20_percent_count: top20PercentCount,
        their_revenue: Math.round(top20Revenue),
        their_revenue_percent: top20RevenuePercent,
        insight: `${top20PercentCount} клиентов (20%) приносят ${top20RevenuePercent}% выручки`,
      },
      summary: {
        total_current_value: Math.round(totalValue),
        total_ltv: Math.round(clientsWithSegments.reduce((sum, c) => sum + c.ltv, 0)),
        avg_ltv: clientsWithSegments.length > 0
          ? Math.round(clientsWithSegments.reduce((sum, c) => sum + c.ltv, 0) / clientsWithSegments.length)
          : 0,
        avg_churn_risk: clientsWithSegments.length > 0
          ? Math.round(clientsWithSegments.reduce((sum, c) => sum + c.churnRisk, 0) / clientsWithSegments.length)
          : 0,
        high_churn_risk_count: clientsWithSegments.filter(c => c.churnRisk >= 50).length,
      },
    });
  } catch (error) {
    console.error('Error getting LTV analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get LTV analytics' },
      { status: 500 }
    );
  }
}
