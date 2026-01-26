import { NextRequest, NextResponse } from 'next/server';
import { getSyncedRecords, getSyncedStaff, getSyncedClients, getSyncedServices } from '@/lib/sync-store';
import type { YclientsRecord } from '@/lib/yclients';

/**
 * Типы для календаря
 */
interface CalendarClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  visit_count: number;
  cancel_count: number;
  no_show_count: number;
  last_visit_at?: string;
}

interface CalendarStaff {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  color: string;
  services_ids: string[];
}

interface CalendarService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  category: string;
}

type AppointmentStatus = 'new' | 'confirmed' | 'completed' | 'canceled' | 'no_show';
type AppointmentSource = 'native' | 'yclients' | 'dikidi';
type RiskLevel = 'low' | 'medium' | 'high';

interface CalendarAppointment {
  id: string;
  client_id: string;
  client: CalendarClient;
  staff_id: string;
  staff: CalendarStaff;
  service_id: string;
  service: CalendarService;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  risk_level: RiskLevel;
  notes?: string;
}

// Цвета для сотрудников
const STAFF_COLORS = [
  '#7950f2', '#228be6', '#12b886', '#fd7e14',
  '#e64980', '#40c057', '#fab005', '#15aabf',
  '#be4bdb', '#4c6ef5', '#82c91e', '#f06595',
];

/**
 * Рассчитать уровень риска клиента
 */
function calculateRiskLevel(client: CalendarClient): RiskLevel {
  const totalVisits = client.visit_count + client.cancel_count + client.no_show_count;
  if (totalVisits === 0) return 'medium';
  const cancelRate = (client.cancel_count + client.no_show_count) / totalVisits;
  if (cancelRate > 0.3) return 'high';
  if (client.visit_count === 1 && client.cancel_count === 0) return 'medium';
  return 'low';
}

/**
 * Преобразовать статус YClients в статус календаря
 */
function mapStatus(record: YclientsRecord): AppointmentStatus {
  if (record.deleted) return 'canceled';
  if (record.attendance === -1) return 'no_show';
  if (record.attendance === 1) return 'completed';
  if (record.confirmed === 1) return 'confirmed';
  return 'new';
}

/**
 * GET /api/v1/admin/calendar/data
 * Получить данные для календаря: сотрудники, услуги, записи
 * Query params:
 *   - date_from: начало периода (YYYY-MM-DD)
 *   - date_to: конец периода (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const records = getSyncedRecords();
    const yclientsStaff = getSyncedStaff();
    const yclientsClients = getSyncedClients();
    const yclientsServices = getSyncedServices();

    // Получить параметры запроса
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Преобразовать сотрудников
    const staffMap = new Map<number, CalendarStaff>();
    const staff: CalendarStaff[] = yclientsStaff
      .filter(s => !s.fired && !s.hidden)
      .map((s, index) => {
        const staffItem: CalendarStaff = {
          id: String(s.id),
          name: s.name || 'Без имени',
          role: s.specialization || 'Мастер',
          avatar: s.avatar_big || s.avatar || undefined,
          color: STAFF_COLORS[index % STAFF_COLORS.length],
          services_ids: [], // Будет заполнено из записей
        };
        staffMap.set(s.id, staffItem);
        return staffItem;
      });

    // Преобразовать клиентов
    const clientsMap = new Map<number, CalendarClient>();
    yclientsClients.forEach(c => {
      clientsMap.set(c.id, {
        id: String(c.id),
        name: c.name || 'Без имени',
        phone: c.phone || '',
        email: c.email || undefined,
        visit_count: c.visit_count || 0,
        cancel_count: 0, // YClients не даёт напрямую
        no_show_count: 0, // YClients не даёт напрямую
        last_visit_at: c.last_visit_date || undefined,
      });
    });

    // Преобразовать услуги
    const servicesMap = new Map<number, CalendarService>();
    const services: CalendarService[] = yclientsServices.map(s => {
      const serviceItem: CalendarService = {
        id: String(s.id),
        name: s.title || 'Услуга',
        duration_minutes: s.seance_length || 60,
        price: s.price_min || 0,
        category: 'Общее', // YClients не даёт категорию напрямую в этом формате
      };
      servicesMap.set(s.id, serviceItem);
      return serviceItem;
    });

    // Фильтровать записи по дате
    let filteredRecords = records;
    if (dateFrom) {
      filteredRecords = filteredRecords.filter(r => {
        const recordDate = r.date.split(' ')[0]; // "2026-01-26 20:45:00" -> "2026-01-26"
        return recordDate >= dateFrom;
      });
    }
    if (dateTo) {
      filteredRecords = filteredRecords.filter(r => {
        const recordDate = r.date.split(' ')[0];
        return recordDate <= dateTo;
      });
    }

    // Преобразовать записи в формат календаря
    const appointments: CalendarAppointment[] = filteredRecords
      .filter(r => !r.deleted) // Не показывать удалённые
      .map(r => {
        // Получить или создать клиента
        let client: CalendarClient;
        if (r.client && clientsMap.has(r.client.id)) {
          client = clientsMap.get(r.client.id)!;
        } else if (r.client) {
          client = {
            id: String(r.client.id),
            name: r.client.name || 'Без имени',
            phone: r.client.phone || '',
            email: r.client.email || undefined,
            visit_count: 1,
            cancel_count: 0,
            no_show_count: 0,
          };
        } else {
          client = {
            id: '0',
            name: 'Неизвестный клиент',
            phone: '',
            visit_count: 0,
            cancel_count: 0,
            no_show_count: 0,
          };
        }

        // Получить или создать сотрудника
        let staffMember: CalendarStaff;
        if (staffMap.has(r.staff_id)) {
          staffMember = staffMap.get(r.staff_id)!;
        } else {
          staffMember = {
            id: String(r.staff_id),
            name: 'Неизвестный мастер',
            role: 'Мастер',
            color: STAFF_COLORS[0],
            services_ids: [],
          };
        }

        // Получить или создать услугу
        const firstService = r.services[0];
        let service: CalendarService;
        if (firstService && servicesMap.has(firstService.id)) {
          service = servicesMap.get(firstService.id)!;
        } else if (firstService) {
          service = {
            id: String(firstService.id),
            name: firstService.title || 'Услуга',
            duration_minutes: r.seance_length || 60,
            price: firstService.cost || 0,
            category: 'Общее',
          };
        } else {
          service = {
            id: '0',
            name: 'Неизвестная услуга',
            duration_minutes: r.seance_length || 60,
            price: 0,
            category: 'Общее',
          };
        }

        // Рассчитать время окончания
        // seance_length в YClients указан в СЕКУНДАХ, а не в минутах!
        const startTime = new Date(r.datetime);
        const endTime = new Date(startTime);
        const durationMinutes = Math.round((r.seance_length || 3600) / 60); // Конвертация секунд в минуты
        endTime.setMinutes(endTime.getMinutes() + durationMinutes);

        return {
          id: String(r.id),
          client_id: client.id,
          client,
          staff_id: staffMember.id,
          staff: staffMember,
          service_id: service.id,
          service,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: mapStatus(r),
          source: 'yclients' as AppointmentSource,
          risk_level: calculateRiskLevel(client),
          notes: r.comment || undefined,
        };
      });

    return NextResponse.json({
      staff,
      services,
      clients: Array.from(clientsMap.values()).slice(0, 100), // Лимит для модалки
      appointments,
      total_records: records.length,
      filtered_records: appointments.length,
    });
  } catch (error) {
    console.error('Error getting calendar data:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar data' },
      { status: 500 }
    );
  }
}
