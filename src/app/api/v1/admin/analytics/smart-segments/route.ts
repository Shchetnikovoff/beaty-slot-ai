import { NextRequest, NextResponse } from 'next/server';
import { getSyncedClients, getSyncedRecords } from '@/lib/sync-store';
import type { YclientsClient } from '@/lib/yclients';

/**
 * Типы сегментов
 */
type SegmentId =
  | 'recoverable_7d'      // Можно вернуть за 7 дней
  | 'need_discount'       // Не вернутся без скидки
  | 'urgent_reactivation' // Срочная реактивация
  | 'vip_no_touch'        // VIP — не трогать акциями
  | 'new_needs_attention' // Новички — нужно внимание
  | 'potential_vip';      // Потенциальные VIP

type SegmentPriority = 'HIGH' | 'MEDIUM' | 'LOW';
type RecommendedChannel = 'telegram' | 'sms' | 'whatsapp' | 'email';

interface SegmentClient {
  id: number;
  name: string;
  phone: string;
  email: string;
  last_visit_date: string | null;
  days_since_visit: number;
  visit_count: number;
  avg_sum: number;
  total_spent: number;
}

interface SmartSegment {
  id: SegmentId;
  name: string;
  description: string;
  criteria: string;
  count: number;
  potential_revenue: number;
  priority: SegmentPriority;
  recommended_action: string;
  recommended_channel: RecommendedChannel;
  message_template: string;
  clients: SegmentClient[];
}

/**
 * Рассчитать дни с последнего визита
 */
function getDaysSinceVisit(lastVisitDate: string | null, baseDate: Date = new Date()): number {
  if (!lastVisitDate) return 999;
  const lastVisit = new Date(lastVisitDate);
  return Math.floor((baseDate.getTime() - lastVisit.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Рассчитать дни с первого визита
 */
function getDaysSinceFirstVisit(firstVisitDate: string | null, baseDate: Date = new Date()): number {
  if (!firstVisitDate) return 0;
  const firstVisit = new Date(firstVisitDate);
  return Math.floor((baseDate.getTime() - firstVisit.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Преобразовать клиента в формат сегмента
 */
function toSegmentClient(client: YclientsClient, daysSinceVisit: number): SegmentClient {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone || '',
    email: client.email || '',
    last_visit_date: client.last_visit_date,
    days_since_visit: daysSinceVisit,
    visit_count: client.visit_count || 0,
    avg_sum: client.avg_sum || 0,
    total_spent: client.spent || client.sold_amount || 0,
  };
}

/**
 * GET /api/v1/admin/analytics/smart-segments
 * Получить умные сегменты клиентов для рассылок
 *
 * Query params:
 *   - include_clients: boolean (по умолчанию false, для уменьшения размера ответа)
 *   - limit: number (лимит клиентов в каждом сегменте, по умолчанию 50)
 */
export async function GET(request: NextRequest) {
  try {
    const clients = getSyncedClients();
    const records = getSyncedRecords();

    const { searchParams } = new URL(request.url);
    const includeClients = searchParams.get('include_clients') === 'true';
    const clientsLimit = parseInt(searchParams.get('limit') || '50', 10);

    const today = new Date();

    // Предобработка: рассчитываем метрики для каждого клиента
    const clientsWithMetrics = clients.map(client => {
      const daysSinceVisit = getDaysSinceVisit(client.last_visit_date, today);
      const daysSinceFirstVisit = getDaysSinceFirstVisit(client.first_visit_date, today);

      // История неявок клиента
      const clientRecords = records.filter(r => r.client?.id === client.id);
      const noShowCount = clientRecords.filter(r => r.attendance === -1).length;
      const noShowRate = clientRecords.length > 0 ? noShowCount / clientRecords.length : 0;

      return {
        ...client,
        daysSinceVisit,
        daysSinceFirstVisit,
        noShowRate,
        monthsAsClient: Math.floor(daysSinceFirstVisit / 30),
      };
    });

    // ==================== ОПРЕДЕЛЕНИЕ СЕГМЕНТОВ ====================

    const segments: SmartSegment[] = [];

    // 1. Можно вернуть за 7 дней (21-35 дней, visits >= 3)
    const recoverable7d = clientsWithMetrics.filter(c =>
      c.daysSinceVisit >= 21 &&
      c.daysSinceVisit <= 35 &&
      c.visit_count >= 3
    );

    if (recoverable7d.length > 0) {
      segments.push({
        id: 'recoverable_7d',
        name: 'Можно вернуть за 7 дней',
        description: 'Постоянные клиенты, которые давно не были. Легко вернуть мягким напоминанием.',
        criteria: 'Последний визит: 21-35 дней назад, визитов >= 3',
        count: recoverable7d.length,
        potential_revenue: recoverable7d.reduce((sum, c) => sum + (c.avg_sum || 0), 0),
        priority: 'HIGH',
        recommended_action: 'Мягкое напоминание о записи',
        recommended_channel: 'telegram',
        message_template: 'Привет! Давно не видели вас в салоне 💇‍♀️ Может, пора обновить образ? Запишитесь на удобное время!',
        clients: includeClients
          ? recoverable7d.slice(0, clientsLimit).map(c => toSegmentClient(c, c.daysSinceVisit))
          : [],
      });
    }

    // 2. Не вернутся без скидки (36-60 дней)
    const needDiscount = clientsWithMetrics.filter(c =>
      c.daysSinceVisit >= 36 &&
      c.daysSinceVisit <= 60
    );

    if (needDiscount.length > 0) {
      segments.push({
        id: 'need_discount',
        name: 'Не вернутся без скидки',
        description: 'Клиенты уже забывают о вас. Нужен стимул — скидка или бонус.',
        criteria: 'Последний визит: 36-60 дней назад',
        count: needDiscount.length,
        potential_revenue: needDiscount.reduce((sum, c) => sum + (c.avg_sum || 0) * 0.85, 0), // со скидкой
        priority: 'HIGH',
        recommended_action: 'Предложить скидку 10-15%',
        recommended_channel: 'sms',
        message_template: 'Мы скучаем! 🎁 Специально для вас скидка 15% на любую услугу. Действует 7 дней. Запишитесь!',
        clients: includeClients
          ? needDiscount.slice(0, clientsLimit).map(c => toSegmentClient(c, c.daysSinceVisit))
          : [],
      });
    }

    // 3. Срочная реактивация (60-90 дней)
    const urgentReactivation = clientsWithMetrics.filter(c =>
      c.daysSinceVisit >= 60 &&
      c.daysSinceVisit <= 90
    );

    if (urgentReactivation.length > 0) {
      segments.push({
        id: 'urgent_reactivation',
        name: 'Срочная реактивация',
        description: 'Клиенты на грани потери. Нужно агрессивное предложение.',
        criteria: 'Последний визит: 60-90 дней назад',
        count: urgentReactivation.length,
        potential_revenue: urgentReactivation.reduce((sum, c) => sum + (c.avg_sum || 0) * 0.7, 0),
        priority: 'HIGH',
        recommended_action: 'Агрессивное предложение со скидкой 20%+',
        recommended_channel: 'sms',
        message_template: '⚡ Только для вас: скидка 20% + бонус! Мы очень хотим вас видеть. Предложение на 5 дней!',
        clients: includeClients
          ? urgentReactivation.slice(0, clientsLimit).map(c => toSegmentClient(c, c.daysSinceVisit))
          : [],
      });
    }

    // 4. VIP — не трогать акциями (высокий чек, стабильные визиты)
    const avgCheck = clients.reduce((sum, c) => sum + (c.avg_sum || 0), 0) / (clients.length || 1);
    const vipNoTouch = clientsWithMetrics.filter(c =>
      c.avg_sum >= avgCheck * 1.5 &&  // Чек выше среднего в 1.5 раза
      c.visit_count >= 5 &&           // Минимум 5 визитов
      c.daysSinceVisit <= 45          // Был недавно
    );

    if (vipNoTouch.length > 0) {
      segments.push({
        id: 'vip_no_touch',
        name: 'VIP — не трогать акциями',
        description: 'Ценные клиенты с высоким чеком. Скидки обесценят ваш сервис для них.',
        criteria: `Средний чек >= ${Math.round(avgCheck * 1.5).toLocaleString('ru-RU')} ₽, визитов >= 5, был <= 45 дней`,
        count: vipNoTouch.length,
        potential_revenue: vipNoTouch.reduce((sum, c) => sum + (c.avg_sum || 0), 0),
        priority: 'LOW',
        recommended_action: 'Премиум-обслуживание, персональные бонусы',
        recommended_channel: 'telegram',
        message_template: '✨ Специальное приглашение для вас! Новая процедура/мастер. Забронируйте первыми.',
        clients: includeClients
          ? vipNoTouch.slice(0, clientsLimit).map(c => toSegmentClient(c, c.daysSinceVisit))
          : [],
      });
    }

    // 5. Новички — нужно внимание (первый визит < 30 дней)
    const newNeedsAttention = clientsWithMetrics.filter(c =>
      c.daysSinceFirstVisit <= 30 &&
      c.daysSinceFirstVisit > 0 &&
      c.visit_count <= 2
    );

    if (newNeedsAttention.length > 0) {
      segments.push({
        id: 'new_needs_attention',
        name: 'Новички — нужно внимание',
        description: 'Новые клиенты. Важно закрепить их и превратить в постоянных.',
        criteria: 'Первый визит < 30 дней назад, визитов <= 2',
        count: newNeedsAttention.length,
        potential_revenue: newNeedsAttention.reduce((sum, c) => sum + (c.avg_sum || 0) * 12, 0), // потенциал на год
        priority: 'MEDIUM',
        recommended_action: 'Follow-up: спросить о впечатлениях',
        recommended_channel: 'telegram',
        message_template: 'Спасибо, что выбрали нас! 🙏 Как вам визит? Будем рады видеть снова. Бонус на следующий визит!',
        clients: includeClients
          ? newNeedsAttention.slice(0, clientsLimit).map(c => toSegmentClient(c, c.daysSinceVisit))
          : [],
      });
    }

    // 6. Потенциальные VIP (растущий чек, регулярные визиты)
    const potentialVip = clientsWithMetrics.filter(c =>
      c.avg_sum >= avgCheck &&        // Чек выше среднего
      c.avg_sum < avgCheck * 1.5 &&   // Но еще не VIP
      c.visit_count >= 3 &&           // Регулярные визиты
      c.daysSinceVisit <= 60          // Активный
    );

    if (potentialVip.length > 0) {
      segments.push({
        id: 'potential_vip',
        name: 'Потенциальные VIP',
        description: 'Клиенты с хорошим чеком, могут стать VIP. Стимулируйте апсейл.',
        criteria: `Средний чек ${Math.round(avgCheck).toLocaleString('ru-RU')}-${Math.round(avgCheck * 1.5).toLocaleString('ru-RU')} ₽, визитов >= 3`,
        count: potentialVip.length,
        potential_revenue: potentialVip.reduce((sum, c) => sum + (c.avg_sum || 0) * 1.2, 0),
        priority: 'MEDIUM',
        recommended_action: 'Апсейл: предложить премиум-услуги',
        recommended_channel: 'telegram',
        message_template: '💎 Попробуйте нашу новую премиум-процедуру! Специальная цена для постоянных клиентов.',
        clients: includeClients
          ? potentialVip.slice(0, clientsLimit).map(c => toSegmentClient(c, c.daysSinceVisit))
          : [],
      });
    }

    // Сортируем по приоритету
    const priorityOrder: Record<SegmentPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    segments.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Общая статистика
    const totalClientsInSegments = segments.reduce((sum, s) => sum + s.count, 0);
    const totalPotentialRevenue = segments.reduce((sum, s) => sum + s.potential_revenue, 0);
    const highPriorityCount = segments.filter(s => s.priority === 'HIGH').reduce((sum, s) => sum + s.count, 0);

    return NextResponse.json({
      segments,
      summary: {
        total_segments: segments.length,
        total_clients_in_segments: totalClientsInSegments,
        total_potential_revenue: Math.round(totalPotentialRevenue),
        high_priority_clients: highPriorityCount,
        avg_check: Math.round(avgCheck),
      },
      broadcast_suggestions: segments
        .filter(s => s.priority === 'HIGH')
        .map(s => ({
          segment_id: s.id,
          segment_name: s.name,
          client_count: s.count,
          template: s.message_template,
          channel: s.recommended_channel,
          best_send_time: 'Вт-Чт, 11:00-14:00',
          expected_response_rate: s.id === 'recoverable_7d' ? 25 : s.id === 'need_discount' ? 15 : 10,
        })),
    });
  } catch (error) {
    console.error('Error getting smart segments:', error);
    return NextResponse.json(
      { error: 'Failed to get smart segments' },
      { status: 500 }
    );
  }
}
