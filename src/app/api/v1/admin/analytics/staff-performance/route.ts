import { NextRequest, NextResponse } from 'next/server';
import { getSyncedRecords, getSyncedStaff, getSyncedClients } from '@/lib/sync-store';

/**
 * Типы для эффективности мастеров
 */
interface StaffMetrics {
  total_records: number;
  revenue: number;
  avg_check: number;
  occupancy_percent: number;
  return_rate: number;        // % клиентов вернулось
  no_show_rate: number;
  cancel_rate: number;
  unique_clients: number;
  returning_clients: number;
}

interface StaffScores {
  revenue_score: number;      // 0-100
  retention_score: number;    // 0-100
  reliability_score: number;  // 0-100
  overall_score: number;      // 0-100
}

interface StaffPerformance {
  id: number;
  name: string;
  specialization: string;
  avatar: string;
  metrics: StaffMetrics;
  scores: StaffScores;
  rank: number;
  recommendations: string[];
}

interface NewClientAllocation {
  staff_id: number;
  staff_name: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
}

/**
 * GET /api/v1/admin/analytics/staff-performance
 * Получить аналитику эффективности мастеров
 *
 * Query params:
 *   - date_from: начало периода (YYYY-MM-DD)
 *   - date_to: конец периода (YYYY-MM-DD)
 *   - staff_id: фильтр по конкретному мастеру
 */
export async function GET(request: NextRequest) {
  try {
    const records = getSyncedRecords();
    const staff = getSyncedStaff();
    const clients = getSyncedClients();

    const { searchParams } = new URL(request.url);
    const staffIdFilter = searchParams.get('staff_id');

    // Период анализа (по умолчанию последние 30 дней)
    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 30);

    const dateFromStr = searchParams.get('date_from');
    const dateToStr = searchParams.get('date_to');

    const dateFrom = dateFromStr ? new Date(dateFromStr) : defaultFrom;
    const dateTo = dateToStr ? new Date(dateToStr) : today;
    dateTo.setHours(23, 59, 59, 999);

    // Фильтруем записи за период
    const periodRecords = records.filter(r => {
      const recordDate = new Date(r.datetime);
      return recordDate >= dateFrom && recordDate <= dateTo;
    });

    // Активные сотрудники (не уволенные)
    let activeStaff = staff.filter(s => !s.fired);
    if (staffIdFilter) {
      activeStaff = activeStaff.filter(s => s.id === parseInt(staffIdFilter, 10));
    }

    // Рабочие дни в периоде (для расчёта занятости)
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (24 * 60 * 60 * 1000));
    const workDays = Math.max(1, Math.floor(daysDiff * 5 / 7)); // ~5 рабочих дней в неделю

    // Максимальные значения для нормализации
    let maxRevenue = 0;
    let maxReturnRate = 0;
    let minNoShowRate = 100;

    // Рассчитываем метрики для каждого мастера
    const staffMetrics = activeStaff.map(staffMember => {
      const staffRecords = periodRecords.filter(r => r.staff_id === staffMember.id);

      // Выручка
      const revenue = staffRecords.reduce((sum, r) =>
        sum + (r.services?.reduce((s, svc) => s + (svc.cost || 0), 0) || 0), 0);

      // Количество записей
      const totalRecords = staffRecords.length;

      // Средний чек
      const avgCheck = totalRecords > 0 ? revenue / totalRecords : 0;

      // Уникальные клиенты
      const clientIds = new Set(staffRecords.map(r => r.client?.id).filter(Boolean));
      const uniqueClients = clientIds.size;

      // Вернувшиеся клиенты (клиенты с более чем 1 записью к этому мастеру за весь период данных)
      const clientVisitCounts = new Map<number, number>();
      records.filter(r => r.staff_id === staffMember.id).forEach(r => {
        const clientId = r.client?.id;
        if (clientId) {
          clientVisitCounts.set(clientId, (clientVisitCounts.get(clientId) || 0) + 1);
        }
      });
      const returningClients = Array.from(clientVisitCounts.values()).filter(count => count > 1).length;
      const returnRate = uniqueClients > 0 ? (returningClients / uniqueClients) * 100 : 0;

      // Неявки
      const noShows = staffRecords.filter(r => r.attendance === -1).length;
      const noShowRate = totalRecords > 0 ? (noShows / totalRecords) * 100 : 0;

      // Отмены
      const cancellations = staffRecords.filter(r => r.deleted).length;
      const cancelRate = totalRecords > 0 ? (cancellations / totalRecords) * 100 : 0;

      // Занятость (записей в день)
      const occupancyPercent = Math.min(100, (totalRecords / (workDays * 8)) * 100); // 8 слотов в день

      // Обновляем максимумы
      if (revenue > maxRevenue) maxRevenue = revenue;
      if (returnRate > maxReturnRate) maxReturnRate = returnRate;
      if (noShowRate < minNoShowRate) minNoShowRate = noShowRate;

      return {
        staffMember,
        metrics: {
          total_records: totalRecords,
          revenue: Math.round(revenue),
          avg_check: Math.round(avgCheck),
          occupancy_percent: Math.round(occupancyPercent),
          return_rate: Math.round(returnRate),
          no_show_rate: Math.round(noShowRate * 10) / 10,
          cancel_rate: Math.round(cancelRate * 10) / 10,
          unique_clients: uniqueClients,
          returning_clients: returningClients,
        },
      };
    });

    // Рассчитываем скоры (нормализованные 0-100)
    const staffWithScores = staffMetrics.map(({ staffMember, metrics }) => {
      // Revenue score (относительно лучшего)
      const revenueScore = maxRevenue > 0 ? (metrics.revenue / maxRevenue) * 100 : 0;

      // Retention score
      const retentionScore = maxReturnRate > 0 ? (metrics.return_rate / maxReturnRate) * 100 : 0;

      // Reliability score (обратный от no-show + cancel rate)
      const unreliabilityRate = metrics.no_show_rate + metrics.cancel_rate;
      const reliabilityScore = Math.max(0, 100 - unreliabilityRate * 2);

      // Overall score
      const overallScore = Math.round(
        revenueScore * 0.4 +
        retentionScore * 0.35 +
        reliabilityScore * 0.25
      );

      const scores: StaffScores = {
        revenue_score: Math.round(revenueScore),
        retention_score: Math.round(retentionScore),
        reliability_score: Math.round(reliabilityScore),
        overall_score: overallScore,
      };

      return { staffMember, metrics, scores };
    });

    // Сортируем по overall score
    staffWithScores.sort((a, b) => b.scores.overall_score - a.scores.overall_score);

    // Добавляем ранг и рекомендации
    const staffPerformance: StaffPerformance[] = staffWithScores.map((item, index) => {
      const recommendations: string[] = [];

      // Генерируем рекомендации
      if (item.scores.revenue_score < 50 && item.metrics.total_records > 5) {
        recommendations.push('Рассмотрите обучение апсейлу');
      }
      if (item.scores.retention_score < 50) {
        recommendations.push('Улучшите работу с клиентами');
      }
      if (item.metrics.no_show_rate > 15) {
        recommendations.push('Высокий % неявок — проверьте работу с подтверждениями');
      }
      if (item.metrics.occupancy_percent < 40) {
        recommendations.push('Низкая загрузка — увеличьте продвижение');
      }
      if (item.scores.overall_score >= 80) {
        recommendations.push('Отличная работа! Давайте больше новых клиентов');
      }

      return {
        id: item.staffMember.id,
        name: item.staffMember.name,
        specialization: item.staffMember.specialization || '',
        avatar: item.staffMember.avatar || '',
        metrics: item.metrics,
        scores: item.scores,
        rank: index + 1,
        recommendations,
      };
    });

    // Рекомендации по распределению новых клиентов
    const newClientAllocation: NewClientAllocation[] = staffPerformance
      .filter(s => s.scores.overall_score > 0)
      .slice(0, 5) // Топ 5
      .map(s => {
        let reason = '';
        let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

        if (s.scores.retention_score >= 80 && s.scores.reliability_score >= 80) {
          reason = 'Высокая возвращаемость и надёжность';
          priority = 'HIGH';
        } else if (s.scores.overall_score >= 70) {
          reason = 'Хороший общий показатель';
          priority = 'HIGH';
        } else if (s.metrics.occupancy_percent < 50) {
          reason = 'Есть свободные слоты';
          priority = 'MEDIUM';
        } else {
          reason = 'Стабильная работа';
          priority = 'LOW';
        }

        return {
          staff_id: s.id,
          staff_name: s.name,
          reason,
          priority,
          score: s.scores.overall_score,
        };
      })
      .sort((a, b) => {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    // Общая статистика команды
    const teamStats = {
      total_staff: staffPerformance.length,
      total_revenue: staffPerformance.reduce((sum, s) => sum + s.metrics.revenue, 0),
      total_records: staffPerformance.reduce((sum, s) => sum + s.metrics.total_records, 0),
      avg_return_rate: staffPerformance.length > 0
        ? Math.round(staffPerformance.reduce((sum, s) => sum + s.metrics.return_rate, 0) / staffPerformance.length)
        : 0,
      avg_no_show_rate: staffPerformance.length > 0
        ? Math.round(staffPerformance.reduce((sum, s) => sum + s.metrics.no_show_rate, 0) / staffPerformance.length * 10) / 10
        : 0,
      top_performer: staffPerformance[0]?.name || null,
      needs_attention: staffPerformance.filter(s => s.scores.overall_score < 40).length,
    };

    return NextResponse.json({
      staff: staffPerformance,
      new_client_allocation: newClientAllocation,
      team_stats: teamStats,
      period: {
        from: dateFrom.toISOString().split('T')[0],
        to: dateTo.toISOString().split('T')[0],
        days: daysDiff,
      },
      insights: [
        teamStats.top_performer ? `🏆 Лучший мастер: ${teamStats.top_performer}` : null,
        teamStats.needs_attention > 0 ? `⚠️ ${teamStats.needs_attention} мастеров требуют внимания` : null,
        teamStats.avg_no_show_rate > 10 ? `📉 Высокий средний % неявок: ${teamStats.avg_no_show_rate}%` : null,
        teamStats.avg_return_rate > 60 ? `💚 Отличная возвращаемость клиентов: ${teamStats.avg_return_rate}%` : null,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error('Error getting staff performance:', error);
    return NextResponse.json(
      { error: 'Failed to get staff performance' },
      { status: 500 }
    );
  }
}
