import { NextRequest, NextResponse } from 'next/server';
import { getSyncedStaff, getSyncedRecords, getStaffActiveOverride } from '@/lib/sync-store';
import type { Staff, StaffListResponse } from '@/types/staff';
import type { YclientsStaff } from '@/lib/yclients';

/**
 * Преобразовать YclientsStaff в Staff (формат админки)
 * @param ys - данные сотрудника из YClients
 * @param todayAppointmentsCount - количество записей на сегодня
 */
function transformStaff(ys: YclientsStaff, todayAppointmentsCount: number): Staff {
  // Проверяем есть ли переопределение статуса активности
  const activeOverride = getStaffActiveOverride(ys.id);
  const isActive = activeOverride !== undefined
    ? activeOverride
    : (ys.status === 1 && !ys.fired && !ys.hidden);

  return {
    id: ys.id,
    yclients_id: String(ys.id),
    name: ys.name || 'Без имени',
    phone: undefined, // YClients не возвращает телефон сотрудника
    email: undefined, // YClients не возвращает email сотрудника
    role: 'MASTER',
    specialization: ys.specialization || undefined,
    photo_url: ys.avatar_big || ys.avatar || undefined,
    is_active: isActive,
    appointments_count: todayAppointmentsCount, // Записей на сегодня
    rating: ys.rating || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * GET /api/v1/admin/staff
 * Получить список сотрудников из синхронизированных данных
 */
export async function GET(request: NextRequest) {
  try {
    const yclientsStaff = getSyncedStaff();
    const records = getSyncedRecords();

    // Если данных нет - вернуть пустой массив с подсказкой
    if (yclientsStaff.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        skip: 0,
        limit: 20,
        message: 'Данные не синхронизированы. Запустите синхронизацию на странице /apps/sync',
      });
    }

    // Получить параметры запроса
    const { searchParams } = new URL(request.url);
    const includeFired = searchParams.get('include_fired') === 'true';

    // Отфильтровать уволенных сотрудников (по умолчанию не показываем)
    const activeYclientsStaff = includeFired
      ? yclientsStaff
      : yclientsStaff.filter(s => !s.fired);

    // Подсчитать записи НА СЕГОДНЯ для каждого сотрудника
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayAppointmentsByStaff = new Map<number, number>();
    records.forEach(r => {
      // Фильтруем только записи на сегодня (учитываем только подтверждённые/ожидающие, не удалённые)
      if (r.date === today && !r.deleted && r.attendance !== -1) {
        const current = todayAppointmentsByStaff.get(r.staff_id) || 0;
        todayAppointmentsByStaff.set(r.staff_id, current + 1);
      }
    });

    // Преобразовать всех сотрудников
    let staff = activeYclientsStaff.map(s =>
      transformStaff(s, todayAppointmentsByStaff.get(s.id) || 0)
    );

    // Дополнительные параметры фильтрации
    const search = searchParams.get('search')?.toLowerCase();
    const role = searchParams.get('role');
    const isActive = searchParams.get('is_active');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Применить фильтры
    if (search) {
      staff = staff.filter(s =>
        s.name.toLowerCase().includes(search) ||
        (s.specialization && s.specialization.toLowerCase().includes(search))
      );
    }

    // Фильтр по роли (игнорируем если role пустой или "null")
    if (role && role !== 'null') {
      staff = staff.filter(s => s.role === role);
    }

    if (isActive !== null && isActive !== undefined) {
      const active = isActive === 'true';
      staff = staff.filter(s => s.is_active === active);
    }

    // Сортировка по количеству записей (популярные сверху)
    staff.sort((a, b) => (b.appointments_count || 0) - (a.appointments_count || 0));

    // Общее количество после фильтрации
    const total = staff.length;

    // Применить пагинацию
    const paginatedStaff = staff.slice(skip, skip + limit);

    const response: StaffListResponse = {
      items: paginatedStaff,
      total,
      skip,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting staff:', error);
    return NextResponse.json(
      { error: 'Failed to get staff' },
      { status: 500 }
    );
  }
}
