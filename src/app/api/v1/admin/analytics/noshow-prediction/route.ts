import { NextRequest, NextResponse } from 'next/server';
import { getSyncedRecords, getSyncedClients, getSyncedServices } from '@/lib/sync-store';

/**
 * Типы для предсказания неявок
 */
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RiskyAppointment {
  record_id: number;
  client_id: number;
  client_name: string;
  client_phone: string;
  datetime: string;
  date: string;
  time: string;
  service_name: string;
  staff_name: string;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[];
  recommendations: string[];
}

interface NoShowPatterns {
  worst_day: string;
  worst_day_rate: number;
  worst_time: string;
  worst_time_rate: number;
  high_risk_clients: number;
  overall_no_show_rate: number;
}

/**
 * Получить день недели на русском
 */
function getDayName(date: Date): string {
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return days[date.getDay()];
}

/**
 * Получить временной слот
 */
function getTimeSlot(date: Date): string {
  const hour = date.getHours();
  if (hour < 11) return '9:00-11:00';
  if (hour < 14) return '11:00-14:00';
  if (hour < 17) return '14:00-17:00';
  return '17:00-21:00';
}

/**
 * GET /api/v1/admin/analytics/noshow-prediction
 * Получить предсказание неявок для предстоящих записей
 *
 * Query params:
 *   - days_ahead: на сколько дней вперёд (по умолчанию 7)
 *   - risk_level: фильтр по уровню риска (LOW/MEDIUM/HIGH/CRITICAL)
 *   - limit: лимит записей (по умолчанию 50)
 */
export async function GET(request: NextRequest) {
  try {
    const records = getSyncedRecords();
    const clients = getSyncedClients();
    const services = getSyncedServices();

    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days_ahead') || '7', 10);
    const riskFilter = searchParams.get('risk_level') as RiskLevel | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Карты для быстрого поиска
    const clientsMap = new Map(clients.map(c => [c.id, c]));
    const servicesMap = new Map(services.map(s => [s.id, s]));

    // ==================== АНАЛИЗ ИСТОРИЧЕСКИХ ДАННЫХ ====================

    // История неявок по клиентам
    const clientNoShowHistory = new Map<number, { total: number; noShows: number }>();
    // История неявок по дням недели (0 = Вс, 1 = Пн, ...)
    const dayNoShowHistory = new Map<number, { total: number; noShows: number }>();
    // История неявок по временным слотам
    const timeSlotNoShowHistory = new Map<string, { total: number; noShows: number }>();

    // Анализируем все прошлые записи
    const pastRecords = records.filter(r => {
      const recordDate = new Date(r.datetime);
      return recordDate < today && !r.deleted;
    });

    pastRecords.forEach(r => {
      const recordDate = new Date(r.datetime);
      const dayOfWeek = recordDate.getDay();
      const timeSlot = getTimeSlot(recordDate);
      const clientId = r.client?.id || 0;
      const isNoShow = r.attendance === -1;

      // По клиенту
      if (clientId) {
        const history = clientNoShowHistory.get(clientId) || { total: 0, noShows: 0 };
        history.total++;
        if (isNoShow) history.noShows++;
        clientNoShowHistory.set(clientId, history);
      }

      // По дню недели
      const dayHistory = dayNoShowHistory.get(dayOfWeek) || { total: 0, noShows: 0 };
      dayHistory.total++;
      if (isNoShow) dayHistory.noShows++;
      dayNoShowHistory.set(dayOfWeek, dayHistory);

      // По временному слоту
      const timeHistory = timeSlotNoShowHistory.get(timeSlot) || { total: 0, noShows: 0 };
      timeHistory.total++;
      if (isNoShow) timeHistory.noShows++;
      timeSlotNoShowHistory.set(timeSlot, timeHistory);
    });

    // Рассчитываем средние показатели
    const totalPastRecords = pastRecords.length;
    const totalNoShows = pastRecords.filter(r => r.attendance === -1).length;
    const avgNoShowRate = totalPastRecords > 0 ? (totalNoShows / totalPastRecords) * 100 : 5;

    // ==================== ПРЕДСКАЗАНИЕ ДЛЯ БУДУЩИХ ЗАПИСЕЙ ====================

    // Фильтруем будущие записи (не удалённые, не отменённые)
    const upcomingRecords = records.filter(r => {
      const recordDate = new Date(r.datetime);
      return recordDate >= today &&
             recordDate <= futureDate &&
             !r.deleted &&
             r.attendance !== -1; // Не отмечены как неявка
    });

    const riskyAppointments: RiskyAppointment[] = upcomingRecords.map(r => {
      const recordDate = new Date(r.datetime);
      const clientId = r.client?.id || 0;
      const client = r.client || clientsMap.get(clientId);

      // Факторы риска и их веса
      const riskFactors: string[] = [];
      let riskScore = 0;

      // 1. История неявок клиента (вес 40)
      const clientHistory = clientNoShowHistory.get(clientId);
      if (clientHistory && clientHistory.total > 0) {
        const clientNoShowRate = (clientHistory.noShows / clientHistory.total) * 100;
        if (clientNoShowRate > 30) {
          riskScore += 40;
          riskFactors.push(`Клиент не приходил ${clientHistory.noShows} из ${clientHistory.total} раз (${Math.round(clientNoShowRate)}%)`);
        } else if (clientNoShowRate > 15) {
          riskScore += 25;
          riskFactors.push(`История неявок клиента: ${Math.round(clientNoShowRate)}%`);
        } else if (clientNoShowRate > 0) {
          riskScore += 10;
        }
      } else {
        // Новый клиент - небольшой риск неизвестности
        riskScore += 5;
        riskFactors.push('Новый клиент — нет истории');
      }

      // 2. День недели (вес 20)
      const dayOfWeek = recordDate.getDay();
      const dayHistory = dayNoShowHistory.get(dayOfWeek);
      if (dayHistory && dayHistory.total > 0) {
        const dayNoShowRate = (dayHistory.noShows / dayHistory.total) * 100;
        if (dayNoShowRate > avgNoShowRate * 1.5) {
          riskScore += 20;
          riskFactors.push(`${getDayName(recordDate)} — высокий % неявок (${Math.round(dayNoShowRate)}%)`);
        } else if (dayNoShowRate > avgNoShowRate) {
          riskScore += 10;
        }
      }

      // 3. Временной слот (вес 20)
      const timeSlot = getTimeSlot(recordDate);
      const timeHistory = timeSlotNoShowHistory.get(timeSlot);
      if (timeHistory && timeHistory.total > 0) {
        const timeNoShowRate = (timeHistory.noShows / timeHistory.total) * 100;
        if (timeNoShowRate > avgNoShowRate * 1.5) {
          riskScore += 20;
          riskFactors.push(`Время ${timeSlot} — высокий % неявок (${Math.round(timeNoShowRate)}%)`);
        } else if (timeNoShowRate > avgNoShowRate) {
          riskScore += 10;
        }
      }

      // 4. Подтверждение записи (вес 20)
      if (r.confirmed !== 1) {
        riskScore += 20;
        riskFactors.push('Запись не подтверждена');
      }

      // Определяем уровень риска
      let riskLevel: RiskLevel;
      if (riskScore >= 75) riskLevel = 'CRITICAL';
      else if (riskScore >= 50) riskLevel = 'HIGH';
      else if (riskScore >= 25) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';

      // Рекомендации
      const recommendations: string[] = [];
      if (riskLevel === 'CRITICAL') {
        recommendations.push('Требуйте предоплату');
        recommendations.push('Сделайте двойную запись на это время');
        recommendations.push('Позвоните за день для подтверждения');
      } else if (riskLevel === 'HIGH') {
        recommendations.push('Подтвердите звонком за день');
        recommendations.push('Отправьте SMS-напоминание');
      } else if (riskLevel === 'MEDIUM') {
        recommendations.push('Отправьте напоминание за день');
      }

      // Сервис
      const firstService = r.services?.[0];
      const service = firstService ? servicesMap.get(firstService.id) : null;
      const serviceName = r.services?.map(s => s.title).join(', ') || service?.title || 'Услуга';

      return {
        record_id: r.id,
        client_id: clientId,
        client_name: client?.name || 'Неизвестный клиент',
        client_phone: client?.phone || '',
        datetime: r.datetime,
        date: recordDate.toLocaleDateString('ru-RU'),
        time: recordDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        service_name: serviceName,
        staff_name: `Мастер #${r.staff_id}`, // TODO: получить имя мастера
        risk_score: Math.min(100, riskScore),
        risk_level: riskLevel,
        risk_factors: riskFactors.length > 0 ? riskFactors : ['Низкий риск'],
        recommendations,
      };
    });

    // Фильтрация по уровню риска
    let filteredAppointments = riskyAppointments;
    if (riskFilter) {
      filteredAppointments = riskyAppointments.filter(a => a.risk_level === riskFilter);
    }

    // Сортировка по риску (сначала высокий)
    filteredAppointments.sort((a, b) => b.risk_score - a.risk_score);

    // ==================== ПАТТЕРНЫ НЕЯВОК ====================

    // Худший день
    let worstDay = 'Понедельник';
    let worstDayRate = 0;
    dayNoShowHistory.forEach((history, day) => {
      if (history.total > 0) {
        const rate = (history.noShows / history.total) * 100;
        if (rate > worstDayRate) {
          worstDayRate = rate;
          worstDay = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][day];
        }
      }
    });

    // Худшее время
    let worstTime = '9:00-11:00';
    let worstTimeRate = 0;
    timeSlotNoShowHistory.forEach((history, slot) => {
      if (history.total > 0) {
        const rate = (history.noShows / history.total) * 100;
        if (rate > worstTimeRate) {
          worstTimeRate = rate;
          worstTime = slot;
        }
      }
    });

    // Клиенты с высоким риском
    let highRiskClients = 0;
    clientNoShowHistory.forEach(history => {
      if (history.total > 0 && (history.noShows / history.total) > 0.2) {
        highRiskClients++;
      }
    });

    const patterns: NoShowPatterns = {
      worst_day: worstDay,
      worst_day_rate: Math.round(worstDayRate),
      worst_time: worstTime,
      worst_time_rate: Math.round(worstTimeRate),
      high_risk_clients: highRiskClients,
      overall_no_show_rate: Math.round(avgNoShowRate * 10) / 10,
    };

    // Статистика
    const criticalCount = riskyAppointments.filter(a => a.risk_level === 'CRITICAL').length;
    const highCount = riskyAppointments.filter(a => a.risk_level === 'HIGH').length;
    const mediumCount = riskyAppointments.filter(a => a.risk_level === 'MEDIUM').length;

    // Потенциальные потери (сумма услуг в рискованных записях)
    const potentialLoss = filteredAppointments
      .filter(a => a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL')
      .reduce((sum, a) => {
        const record = records.find(r => r.id === a.record_id);
        return sum + (record?.services?.reduce((s, svc) => s + (svc.cost || 0), 0) || 0);
      }, 0);

    return NextResponse.json({
      upcoming: filteredAppointments.slice(0, limit),
      patterns,
      summary: {
        total_upcoming: riskyAppointments.length,
        critical_risk_count: criticalCount,
        high_risk_count: highCount,
        medium_count: mediumCount,
        low_count: riskyAppointments.length - criticalCount - highCount - mediumCount,
        potential_loss: Math.round(potentialLoss),
        days_analyzed: daysAhead,
      },
      insights: [
        criticalCount > 0 ? `⚠️ ${criticalCount} записей с критическим риском неявки` : null,
        highCount > 3 ? `⚡ ${highCount} записей требуют подтверждения звонком` : null,
        worstDayRate > avgNoShowRate * 1.5 ? `📅 ${worstDay} — самый рискованный день (${Math.round(worstDayRate)}% неявок)` : null,
        highRiskClients > 5 ? `👥 ${highRiskClients} клиентов с историей неявок` : null,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error('Error getting no-show prediction:', error);
    return NextResponse.json(
      { error: 'Failed to get no-show prediction' },
      { status: 500 }
    );
  }
}
