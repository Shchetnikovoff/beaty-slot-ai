import { NextRequest, NextResponse } from 'next/server';
import { getSyncedRecords, getSyncedStaff } from '@/lib/sync-store';

/**
 * Типы для прогноза пустых окон
 */
type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';

interface EmptySlot {
  start: string;
  end: string;
  staff_id: number;
  staff_name: string;
  duration_hours: number;
}

interface DayForecast {
  date: string;
  day_name: string;
  occupancy_percent: number;
  risk_level: RiskLevel;
  total_slots: number;
  booked_slots: number;
  empty_slots: EmptySlot[];
  recommendations: string[];
  is_today: boolean;
  is_past: boolean;
}

/**
 * Функция для получения даты в формате YYYY-MM-DD
 */
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Получить название дня недели
 */
function getDayName(date: Date): string {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return days[date.getDay()];
}

/**
 * GET /api/v1/admin/analytics/empty-slots-forecast
 * Прогноз пустых окон на ближайшие дни
 *
 * Query params:
 *   - days_ahead: на сколько дней вперёд (по умолчанию 14)
 *   - staff_id: фильтр по мастеру
 */
export async function GET(request: NextRequest) {
  try {
    const records = getSyncedRecords();
    const staff = getSyncedStaff();

    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days_ahead') || '14', 10);
    const staffIdFilter = searchParams.get('staff_id');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = getLocalDateString(today);

    // Активные мастера
    let activeStaff = staff.filter(s => !s.fired && s.bookable);
    if (activeStaff.length === 0) {
      activeStaff = staff.filter(s => !s.fired);
    }
    if (staffIdFilter) {
      activeStaff = activeStaff.filter(s => s.id === parseInt(staffIdFilter, 10));
    }

    // Рабочие часы: 9:00 - 21:00 (12 часов, ~10 слотов по часу с учётом перерывов)
    const SLOTS_PER_DAY = 10; // слотов на одного мастера
    const WORK_START = 9;
    const WORK_END = 21;

    const totalSlotsPerDay = activeStaff.length * SLOTS_PER_DAY;

    // Прогноз на каждый день
    const forecast: DayForecast[] = [];

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = getLocalDateString(date);

      // Записи на этот день
      const dayRecords = records.filter(r =>
        r.date.startsWith(dateStr) && !r.deleted
      );

      // Подсчёт занятых слотов (по уникальным записям)
      const bookedSlots = dayRecords.length;
      const occupancyPercent = totalSlotsPerDay > 0
        ? Math.round((bookedSlots / totalSlotsPerDay) * 100)
        : 0;

      // Определяем уровень риска
      let riskLevel: RiskLevel;
      if (occupancyPercent < 30) riskLevel = 'HIGH';
      else if (occupancyPercent < 50) riskLevel = 'MEDIUM';
      else if (occupancyPercent < 70) riskLevel = 'LOW';
      else riskLevel = 'OK';

      // Находим пустые слоты по мастерам
      const emptySlots: EmptySlot[] = [];

      if (occupancyPercent < 70) {
        activeStaff.forEach(staffMember => {
          // Записи этого мастера на этот день
          const staffRecords = dayRecords
            .filter(r => r.staff_id === staffMember.id)
            .map(r => {
              const startTime = new Date(r.datetime);
              const durationSec = r.seance_length || 3600; // по умолчанию 1 час
              const endTime = new Date(startTime.getTime() + durationSec * 1000);
              return { start: startTime, end: endTime };
            })
            .sort((a, b) => a.start.getTime() - b.start.getTime());

          // Ищем пустые окна
          let currentHour = WORK_START;

          staffRecords.forEach(record => {
            const recordStartHour = record.start.getHours();
            if (recordStartHour > currentHour) {
              // Есть пустое окно
              const gapHours = recordStartHour - currentHour;
              if (gapHours >= 1) { // Минимум 1 час
                emptySlots.push({
                  start: `${String(currentHour).padStart(2, '0')}:00`,
                  end: `${String(recordStartHour).padStart(2, '0')}:00`,
                  staff_id: staffMember.id,
                  staff_name: staffMember.name,
                  duration_hours: gapHours,
                });
              }
            }
            currentHour = Math.max(currentHour, record.end.getHours() + (record.end.getMinutes() > 0 ? 1 : 0));
          });

          // Проверяем конец дня
          if (currentHour < WORK_END) {
            const gapHours = WORK_END - currentHour;
            if (gapHours >= 1) {
              emptySlots.push({
                start: `${String(currentHour).padStart(2, '0')}:00`,
                end: `${String(WORK_END).padStart(2, '0')}:00`,
                staff_id: staffMember.id,
                staff_name: staffMember.name,
                duration_hours: gapHours,
              });
            }
          }

          // Если у мастера нет записей вообще — весь день пустой
          if (staffRecords.length === 0) {
            emptySlots.push({
              start: `${String(WORK_START).padStart(2, '0')}:00`,
              end: `${String(WORK_END).padStart(2, '0')}:00`,
              staff_id: staffMember.id,
              staff_name: staffMember.name,
              duration_hours: WORK_END - WORK_START,
            });
          }
        });
      }

      // Рекомендации на основе уровня риска и дня недели
      const recommendations: string[] = [];
      const dayOfWeek = date.getDay();

      if (riskLevel === 'HIGH') {
        recommendations.push('🔥 Запустите акцию на этот день');
        recommendations.push('📧 Отправьте рассылку клиентам');
        if (dayOfWeek === 1 || dayOfWeek === 2) { // Пн, Вт
          recommendations.push('💡 Понедельник/Вторник — предложите скидку на начало недели');
        }
      } else if (riskLevel === 'MEDIUM') {
        recommendations.push('📱 Напомните клиентам о записи');
        if (emptySlots.some(s => s.start < '12:00')) {
          recommendations.push('🌅 Скидка на утренние часы');
        }
        if (emptySlots.some(s => s.start >= '17:00')) {
          recommendations.push('🌙 Скидка на вечернее время');
        }
      } else if (riskLevel === 'LOW') {
        recommendations.push('💰 Можно немного поднять цены');
      }

      forecast.push({
        date: dateStr,
        day_name: getDayName(date),
        occupancy_percent: Math.min(100, occupancyPercent),
        risk_level: riskLevel,
        total_slots: totalSlotsPerDay,
        booked_slots: bookedSlots,
        empty_slots: emptySlots.slice(0, 10), // Лимит пустых слотов
        recommendations,
        is_today: dateStr === todayStr,
        is_past: date < today,
      });
    }

    // Статистика
    const highRiskDays = forecast.filter(d => d.risk_level === 'HIGH' && !d.is_past).length;
    const mediumRiskDays = forecast.filter(d => d.risk_level === 'MEDIUM' && !d.is_past).length;
    const avgOccupancy = Math.round(
      forecast.filter(d => !d.is_past).reduce((sum, d) => sum + d.occupancy_percent, 0) /
      Math.max(1, forecast.filter(d => !d.is_past).length)
    );

    // Худший день
    const worstDay = forecast
      .filter(d => !d.is_past)
      .sort((a, b) => a.occupancy_percent - b.occupancy_percent)[0];

    // Общее количество пустых часов
    const totalEmptyHours = forecast
      .filter(d => !d.is_past)
      .reduce((sum, d) => sum + d.empty_slots.reduce((s, slot) => s + slot.duration_hours, 0), 0);

    return NextResponse.json({
      forecast,
      summary: {
        days_analyzed: daysAhead,
        high_risk_days: highRiskDays,
        medium_risk_days: mediumRiskDays,
        avg_occupancy: avgOccupancy,
        worst_day: worstDay ? {
          date: worstDay.date,
          day_name: worstDay.day_name,
          occupancy: worstDay.occupancy_percent,
        } : null,
        total_empty_hours: totalEmptyHours,
        active_staff_count: activeStaff.length,
      },
      insights: [
        highRiskDays > 3 ? `⚠️ ${highRiskDays} дней с высоким риском пустоты` : null,
        worstDay && worstDay.occupancy_percent < 30
          ? `📅 ${worstDay.day_name} (${worstDay.date}) — самый пустой день (${worstDay.occupancy_percent}%)`
          : null,
        avgOccupancy < 50 ? `📉 Средняя загрузка ${avgOccupancy}% — нужны акции` : null,
        avgOccupancy >= 70 ? `💚 Отличная загрузка: ${avgOccupancy}%` : null,
        totalEmptyHours > 50 ? `⏰ ${totalEmptyHours} часов потенциально пустуют` : null,
      ].filter(Boolean),
      calendar_view: forecast.map(d => ({
        date: d.date,
        day_name: d.day_name,
        occupancy: d.occupancy_percent,
        risk: d.risk_level,
        color: d.risk_level === 'HIGH' ? '#ff6b6b' :
               d.risk_level === 'MEDIUM' ? '#ffa94d' :
               d.risk_level === 'LOW' ? '#ffe066' : '#69db7c',
      })),
    });
  } catch (error) {
    console.error('Error getting empty slots forecast:', error);
    return NextResponse.json(
      { error: 'Failed to get empty slots forecast' },
      { status: 500 }
    );
  }
}
