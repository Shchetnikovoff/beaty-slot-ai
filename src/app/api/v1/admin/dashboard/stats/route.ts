import { NextRequest, NextResponse } from 'next/server';
import { getSyncedRecords, getSyncedClients, getSyncedStaff } from '@/lib/sync-store';

/**
 * GET /api/v1/admin/dashboard/stats
 * Получить статистику для дашборда из синхронизированных данных YClients
 *
 * Query params:
 *   - date: YYYY-MM-DD (опционально, по умолчанию = сегодня)
 *           Все расчёты будут относительно этой даты
 */
// Функция для получения даты в локальном формате YYYY-MM-DD
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const records = getSyncedRecords();
    const clients = getSyncedClients();
    const staff = getSyncedStaff();

    // Получить дату из параметров запроса (по умолчанию = сегодня)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Базовая дата для всех расчётов
    const baseDate = dateParam ? new Date(dateParam + 'T12:00:00') : new Date();
    const today = getLocalDateString(baseDate);
    const currentMonth = baseDate.getMonth();
    const currentYear = baseDate.getFullYear();

    // ==================== ВЫРУЧКА ====================
    // Считаем выручку из services в записях
    const calculateRevenue = (dateFilter: (date: Date) => boolean) => {
      return records
        .filter(r => {
          const recordDate = new Date(r.datetime || r.date);
          return !r.deleted && dateFilter(recordDate);
        })
        .reduce((sum, r) => {
          const recordRevenue = r.services?.reduce((s, svc) => s + (svc.cost || 0), 0) || 0;
          return sum + recordRevenue;
        }, 0);
    };

    // Конец выбранного дня
    const todayEnd = new Date(baseDate);
    todayEnd.setHours(23, 59, 59, 999);

    // Начало выбранного дня
    const todayStart = new Date(baseDate);
    todayStart.setHours(0, 0, 0, 0);

    // Начало месяца выбранной даты
    const monthStart = new Date(currentYear, currentMonth, 1);
    monthStart.setHours(0, 0, 0, 0);

    // Конец месяца выбранной даты
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    // Выручка за выбранную дату
    const revenueToday = calculateRevenue(date =>
      getLocalDateString(date) === today
    );

    // Выручка за неделю: с понедельника по сегодня (не включая будущие дни)
    // dayOfWeek: 0 = Пн, 1 = Вт, ..., 6 = Вс
    const dayOfWeek = baseDate.getDay() === 0 ? 6 : baseDate.getDay() - 1;
    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    // weekEnd = конец сегодняшнего дня (не конец недели)
    const weekEnd = new Date(baseDate);
    weekEnd.setHours(23, 59, 59, 999);

    // Конец недели для расчёта заполняемости (Пн-Вс)
    const weekEndFull = new Date(weekStart);
    weekEndFull.setDate(weekStart.getDate() + 6);
    weekEndFull.setHours(23, 59, 59, 999);

    // Выручка за неделю (с Пн по сегодня)
    const revenueThisWeek = calculateRevenue(date =>
      date >= weekStart && date <= weekEnd
    );

    // Выручка за месяц выбранной даты
    const revenueThisMonth = calculateRevenue(date =>
      date >= monthStart && date <= monthEnd
    );

    // Количество записей
    const recordsToday = records.filter(r => r.date.startsWith(today) && !r.deleted).length;
    const recordsThisWeek = records.filter(r => {
      const date = new Date(r.datetime || r.date);
      return date >= weekStart && date <= weekEnd && !r.deleted;  // До сегодня
    }).length;
    const recordsThisMonth = records.filter(r => {
      const date = new Date(r.datetime || r.date);
      return date >= monthStart && date <= monthEnd && !r.deleted;
    }).length;

    // ==================== ЗАПОЛНЯЕМОСТЬ НА НЕДЕЛЮ ====================
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    // Активные сотрудники: не уволенные (fired=0) и могут принимать записи (bookable=true)
    // Если нет по строгому фильтру - берём всех не уволенных
    let activeStaff = staff.filter(s => !s.fired && s.bookable).length;
    if (activeStaff === 0) {
      activeStaff = staff.filter(s => !s.fired).length;
    }
    // Если все равно 0 - используем всех сотрудников
    if (activeStaff === 0) {
      activeStaff = staff.length;
    }

    // Реальная сегодняшняя дата для определения isPast
    const realToday = getLocalDateString(new Date());

    const weekOccupancy = days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dateStr = getLocalDateString(date);

      const dayRecords = records.filter(r => r.date.startsWith(dateStr) && !r.deleted);

      // Предположим 8 слотов на мастера в день (с 10:00 до 20:00, по часу)
      const totalSlots = activeStaff * 8;
      const bookedSlots = dayRecords.length;
      const occupancy = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

      // isToday относительно ВЫБРАННОЙ даты
      const isSelected = dateStr === today;
      // isPast относительно РЕАЛЬНОЙ сегодняшней даты
      const isPast = dateStr < realToday;

      return {
        day,
        date: dateStr,
        occupancy: Math.min(occupancy, 100), // cap at 100%
        bookedSlots,
        totalSlots,
        isPast,
        isToday: isSelected,
      };
    });

    const avgOccupancy = Math.round(weekOccupancy.reduce((sum, d) => sum + d.occupancy, 0) / 7);

    // ==================== ВОЗВРАТ КЛИЕНТОВ ====================
    // Считаем клиентов по месяцам на основе их первого и последнего визита
    const getMonthStats = (monthOffset: number) => {
      const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

      // Новые клиенты в этом месяце (первый визит в этом месяце)
      const newClients = clients.filter(c => {
        if (!c.first_visit_date) return false;
        const firstVisit = new Date(c.first_visit_date);
        return firstVisit >= monthStart && firstVisit <= monthEnd;
      }).length;

      // Вернувшиеся клиенты (visit_count > 1 и последний визит в этом месяце)
      const returned = clients.filter(c => {
        if (!c.last_visit_date || c.visit_count <= 1) return false;
        const lastVisit = new Date(c.last_visit_date);
        return lastVisit >= monthStart && lastVisit <= monthEnd;
      }).length;

      const rate = newClients > 0 ? Math.round((returned / newClients) * 100) : 0;

      return {
        month: monthNames[targetDate.getMonth()],
        newClients,
        returned,
        rate: Math.min(rate, 100),
      };
    };

    const retentionData = [
      getMonthStats(5),
      getMonthStats(4),
      getMonthStats(3),
      getMonthStats(2),
      getMonthStats(1),
      getMonthStats(0),
    ];

    // ==================== ПРОПАДАЮЩИЕ КЛИЕНТЫ ====================
    // Рассчитываем относительно выбранной даты
    const lostClients = clients
      .filter(c => {
        if (!c.last_visit_date) return false;
        const lastVisit = new Date(c.last_visit_date);
        const daysSinceVisit = Math.floor((baseDate.getTime() - lastVisit.getTime()) / (24 * 60 * 60 * 1000));
        return daysSinceVisit >= 30;
      })
      .map(c => {
        const lastVisit = new Date(c.last_visit_date!);
        const daysAgo = Math.floor((baseDate.getTime() - lastVisit.getTime()) / (24 * 60 * 60 * 1000));
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          lastVisit: c.last_visit_date,
          daysAgo,
        };
      })
      .sort((a, b) => a.daysAgo - b.daysAgo)
      .slice(0, 10);

    const risk30_60 = lostClients.filter(c => c.daysAgo >= 30 && c.daysAgo < 60).length;
    const risk60plus = lostClients.filter(c => c.daysAgo >= 60).length;

    // ==================== АЛЕРТЫ ====================
    const lowOccupancyDays = weekOccupancy.filter(d => !d.isPast && d.occupancy < 50 && d.occupancy > 0);
    const cancellations = records.filter(r => {
      const date = new Date(r.datetime || r.date);
      return date >= weekStart && date <= weekEndFull && r.deleted;
    }).length;

    const alerts = [];

    if (lowOccupancyDays.length > 0) {
      alerts.push({
        type: 'warning',
        title: `Низкая загрузка ${lowOccupancyDays.map(d => d.day).join(', ')}`,
        count: `${Math.min(...lowOccupancyDays.map(d => d.occupancy))}%`,
      });
    }

    if (cancellations > 3) {
      alerts.push({
        type: 'error',
        title: 'Всплеск отмен',
        count: String(cancellations),
      });
    }

    if (risk60plus > 5) {
      alerts.push({
        type: 'warning',
        title: 'Затухание клиентов',
        count: String(risk60plus),
      });
    }

    return NextResponse.json({
      selectedDate: today, // Возвращаем какая дата использовалась для расчётов
      revenue: {
        today: revenueToday,
        week: revenueThisWeek,
        month: revenueThisMonth,
        recordsToday,
        recordsThisWeek,
        recordsThisMonth,
      },
      occupancy: {
        weekData: weekOccupancy,
        avgOccupancy,
      },
      retention: {
        data: retentionData,
        currentRate: retentionData[retentionData.length - 1]?.rate || 0,
      },
      lostClients: {
        items: lostClients,
        risk30_60,
        risk60plus,
      },
      alerts,
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard stats' },
      { status: 500 }
    );
  }
}
