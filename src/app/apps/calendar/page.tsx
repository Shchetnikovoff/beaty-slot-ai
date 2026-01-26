'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconCalendar,
  IconCalendarPlus,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconClock,
  IconCurrencyRubel,
  IconLock,
  IconPhone,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconUserCheck,
  IconUsers,
  IconX,
} from '@tabler/icons-react';

import { PageHeader, Surface } from '@/components';
import { PATH_DASHBOARD } from '@/routes';

// ==================== ТИПЫ ДАННЫХ ====================

type AppointmentStatus = 'new' | 'confirmed' | 'completed' | 'canceled' | 'no_show';
type AppointmentSource = 'native' | 'yclients' | 'dikidi';
type RiskLevel = 'low' | 'medium' | 'high';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  visit_count: number;
  cancel_count: number;
  no_show_count: number;
  last_visit_at?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  color: string;
  services_ids: string[];
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  category: string;
}

interface Appointment {
  id: string;
  client_id: string;
  client: Client;
  staff_id: string;
  staff: Staff;
  service_id: string;
  service: Service;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  risk_level: RiskLevel;
  notes?: string;
}

// ==================== API ====================

interface CalendarDataResponse {
  staff: Staff[];
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  total_records: number;
  filtered_records: number;
}

async function fetchCalendarData(dateFrom: string, dateTo: string): Promise<CalendarDataResponse> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  const response = await fetch(`/api/v1/admin/calendar/data?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch calendar data');
  }
  return response.json();
}

// ==================== УТИЛИТЫ ====================

const HOUR_HEIGHT = 100; // Высота одного часа в пикселях (как в YClients)
const START_HOUR = 9;
const END_HOUR = 21;
const WORK_HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const calculateRiskLevel = (client: Client): RiskLevel => {
  const totalVisits = client.visit_count + client.cancel_count + client.no_show_count;
  if (totalVisits === 0) return 'medium';
  const cancelRate = (client.cancel_count + client.no_show_count) / totalVisits;
  if (cancelRate > 0.3) return 'high';
  if (client.visit_count === 1 && client.cancel_count === 0) return 'medium';
  return 'low';
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'Новая', color: 'blue', bg: 'blue.1' },
  confirmed: { label: 'Подтв.', color: 'cyan', bg: 'cyan.1' },
  completed: { label: 'Готово', color: 'green', bg: 'green.1' },
  canceled: { label: 'Отмена', color: 'red', bg: 'red.1' },
  no_show: { label: 'Неявка', color: 'orange', bg: 'orange.1' },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: 'Надёжный', color: 'green' },
  medium: { label: 'Новый', color: 'yellow' },
  high: { label: 'Риск', color: 'red' },
};

const SOURCE_CONFIG: Record<AppointmentSource, { label: string; color: string }> = {
  native: { label: 'Свой', color: 'violet' },
  yclients: { label: 'YC', color: 'blue' },
  dikidi: { label: 'DK', color: 'teal' },
};

// Функция для форматирования даты в YYYY-MM-DD
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==================== КОМПОНЕНТЫ ====================

const breadcrumbItems = [
  { title: 'Главная', href: PATH_DASHBOARD.default },
  { title: 'Журнал записей', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>{item.title}</Anchor>
));

// Цвета карточек записей (как в YClients)
const APPOINTMENT_COLORS: Record<AppointmentStatus, { header: string; bg: string; text: string }> = {
  new: { header: '#fab005', bg: '#fff9db', text: '#000' }, // Жёлтый/оранжевый — новая
  confirmed: { header: '#40c057', bg: '#ebfbee', text: '#fff' }, // Зелёный — подтверждена
  completed: { header: '#40c057', bg: '#ebfbee', text: '#fff' }, // Зелёный — завершена
  canceled: { header: '#fa5252', bg: '#fff5f5', text: '#fff' }, // Красный — отменена
  no_show: { header: '#fd7e14', bg: '#fff4e6', text: '#fff' }, // Оранжевый — неявка
};

// Карточка записи на временной сетке (стиль YClients)
function TimeGridAppointment({
  appointment,
  onEdit,
  onStatusChange,
  columnWidth,
  // Позиция для недельного режима (пересекающиеся записи)
  overlapColumn = 0,
  overlapTotal = 1,
}: {
  appointment: Appointment;
  onEdit: () => void;
  onStatusChange: (status: AppointmentStatus) => void;
  columnWidth: number;
  overlapColumn?: number;
  overlapTotal?: number;
}) {
  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);

  const startMinutes = (startTime.getHours() - START_HOUR) * 60 + startTime.getMinutes();
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;

  const top = (startMinutes / 60) * HOUR_HEIGHT;
  // Высота пропорциональна длительности, минимум 50px для читаемости
  const height = Math.max(50, (durationMinutes / 60) * HOUR_HEIGHT - 2);

  const timeStart = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
  const timeEnd = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

  const colors = APPOINTMENT_COLORS[appointment.status];
  const isCompact = height < 80;
  const isVeryCompact = height < 60;

  // Рассчёт позиции с учётом пересечений
  const widthPercent = 100 / overlapTotal;
  const leftPercent = overlapColumn * widthPercent;

  return (
    <Box
      style={{
        position: 'absolute',
        top,
        left: overlapTotal > 1 ? `calc(${leftPercent}% + 2px)` : 2,
        width: overlapTotal > 1 ? `calc(${widthPercent}% - 4px)` : undefined,
        right: overlapTotal > 1 ? undefined : 2,
        height,
        zIndex: 10 + overlapColumn,
      }}
    >
      <UnstyledButton
        onClick={onEdit}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          transition: 'box-shadow 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }}
      >
        {/* Цветной заголовок с временем */}
        <Box
          px={6}
          py={2}
          style={{
            background: colors.header,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text size="xs" fw={600} c={colors.text}>
            {timeStart}—{timeEnd}
          </Text>
          <Group gap={2}>
            {appointment.status === 'confirmed' && (
              <IconCircleCheck size={14} color={colors.text} />
            )}
            {appointment.status === 'new' && (
              <Badge size="xs" variant="filled" color="yellow" c="dark" px={4}>new</Badge>
            )}
          </Group>
        </Box>

        {/* Контент карточки */}
        <Box
          px={6}
          py={4}
          style={{
            background: colors.bg,
            height: `calc(100% - 24px)`,
            overflow: 'hidden',
          }}
        >
          <Stack gap={2}>
            {/* Услуга */}
            <Text size="xs" fw={500} c="dark" truncate lh={1.2}>
              {appointment.service.name}
            </Text>

            {/* Доп. инфо (если есть место) */}
            {!isVeryCompact && appointment.notes && (
              <Group gap={4} wrap="nowrap">
                <IconSettings size={10} color="gray" style={{ flexShrink: 0 }} />
                <Text size="10px" c="dimmed" truncate>
                  {appointment.notes}
                </Text>
              </Group>
            )}

            {/* Клиент */}
            {!isCompact && (
              <Text size="xs" fw={600} c="dark" truncate>
                {appointment.client.name}
              </Text>
            )}
            {isCompact && !isVeryCompact && (
              <Text size="11px" fw={500} c="dark" truncate>
                {appointment.client.name.split(' ')[0]}
              </Text>
            )}

            {/* Телефон */}
            {!isCompact && appointment.client.phone && (
              <Text size="11px" c="dimmed">
                {appointment.client.phone}
              </Text>
            )}
          </Stack>
        </Box>
      </UnstyledButton>
    </Box>
  );
}

// Текущее время (красная линия)
function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  if (currentHour < START_HOUR || currentHour >= END_HOUR) return null;

  const top = ((currentHour - START_HOUR) * 60 + currentMinutes) / 60 * HOUR_HEIGHT;

  return (
    <Box
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: 2,
        background: '#e03131',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          left: -5,
          top: -4,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#e03131',
        }}
      />
    </Box>
  );
}

// Модальное окно записи
function AppointmentModal({
  opened,
  onClose,
  appointment,
  onSave,
  staff,
  services,
  clients,
}: {
  opened: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  onSave: (data: Partial<Appointment>) => void;
  staff: Staff[];
  services: Service[];
  clients: Client[];
}) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    if (appointment) {
      setSelectedClient(appointment.client_id);
      setSelectedStaff(appointment.staff_id);
      setSelectedService(appointment.service_id);
      const start = new Date(appointment.start_time);
      setDate(start);
      setStartTime(`${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`);
      setNotes(appointment.notes || '');
    } else {
      setSelectedClient(null);
      setSelectedStaff(null);
      setSelectedService(null);
      setDate(new Date());
      setStartTime('10:00');
      setNotes('');
    }
    setClientSearch('');
  }, [appointment, opened]);

  const availableServices = useMemo(() => {
    if (!selectedStaff) return services;
    const staffMember = staff.find(s => s.id === selectedStaff);
    if (!staffMember) return services;
    return services.filter(s => staffMember.services_ids.includes(s.id));
  }, [selectedStaff, services, staff]);

  const handleSave = () => {
    if (!selectedClient || !selectedStaff || !selectedService || !date) {
      notifications.show({ title: 'Ошибка', message: 'Заполните все поля', color: 'red' });
      return;
    }

    const service = services.find(s => s.id === selectedService)!;
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + service.duration_minutes);

    onSave({
      id: appointment?.id,
      client_id: selectedClient,
      staff_id: selectedStaff,
      service_id: selectedService,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      notes,
    });
    onClose();
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  );

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size="md" variant="light" color="blue" radius="md">
            <IconCalendarPlus size={18} />
          </ThemeIcon>
          <Text fw={600} size="lg">{appointment ? 'Редактировать' : 'Новая запись'}</Text>
        </Group>
      }
      size="lg"
      radius="lg"
    >
      <Stack gap="md">
        <TextInput
          label="Клиент"
          placeholder="Поиск..."
          leftSection={<IconSearch size={16} />}
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          radius="md"
        />
        <ScrollArea h={120}>
          <Stack gap={4}>
            {filteredClients.map(client => {
              const risk = calculateRiskLevel(client);
              const riskConfig = RISK_CONFIG[risk];
              const isSelected = selectedClient === client.id;
              return (
                <UnstyledButton
                  key={client.id}
                  onClick={() => setSelectedClient(client.id)}
                  style={{ display: 'block', width: '100%' }}
                >
                  <Paper
                    p="xs"
                    radius="md"
                    style={{
                      backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                      border: isSelected ? '2px solid var(--mantine-color-blue-5)' : '1px solid var(--mantine-color-gray-2)',
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap">
                        <Avatar size="sm" radius="xl" color={isSelected ? 'blue' : 'gray'}>
                          {client.name.charAt(0)}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={500}>{client.name}</Text>
                          <Text size="xs" c="dimmed">{client.phone}</Text>
                        </div>
                      </Group>
                      <Badge size="xs" color={riskConfig.color} variant="light">
                        {riskConfig.label}
                      </Badge>
                    </Group>
                  </Paper>
                </UnstyledButton>
              );
            })}
          </Stack>
        </ScrollArea>

        <SimpleGrid cols={2}>
          <Select
            label="Мастер"
            placeholder="Выберите"
            data={staff.map(s => ({ value: s.id, label: `${s.name} · ${s.role}` }))}
            value={selectedStaff}
            onChange={setSelectedStaff}
            required
            radius="md"
          />
          <Select
            label="Услуга"
            placeholder="Выберите"
            data={availableServices.map(s => ({ value: s.id, label: s.name }))}
            value={selectedService}
            onChange={setSelectedService}
            required
            disabled={!selectedStaff}
            radius="md"
          />
        </SimpleGrid>

        <SimpleGrid cols={2}>
          <DatePickerInput
            label="Дата"
            value={date}
            onChange={setDate}
            locale="ru"
            required
            radius="md"
          />
          <TimeInput
            label="Время"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            radius="md"
          />
        </SimpleGrid>

        {selectedServiceData && (
          <Paper p="md" radius="lg" bg="blue.0" style={{ borderLeft: '4px solid var(--mantine-color-blue-5)' }}>
            <Group justify="space-between">
              <div>
                <Text size="sm" fw={600}>{selectedServiceData.name}</Text>
                <Text size="xs" c="dimmed">{selectedServiceData.duration_minutes} мин</Text>
              </div>
              <Text size="xl" fw={700} c="blue">
                {selectedServiceData.price.toLocaleString('ru-RU')} ₽
              </Text>
            </Group>
          </Paper>
        )}

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose} radius="md">Отмена</Button>
          <Button onClick={handleSave} radius="md" leftSection={<IconCheck size={16} />}>
            {appointment ? 'Сохранить' : 'Создать'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// Статистическая карточка
function StatCard({ label, value, icon: Icon, color, suffix }: {
  label: string;
  value: number | string;
  icon: typeof IconCalendar;
  color: string;
  suffix?: string;
}) {
  return (
    <Paper p="md" radius="lg" withBorder style={{ borderColor: `var(--mantine-color-${color}-2)` }}>
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>{label}</Text>
          <Group gap={4} align="baseline">
            <Text size="xl" fw={700} c={color}>{value}</Text>
            {suffix && <Text size="sm" c="dimmed">{suffix}</Text>}
          </Group>
        </div>
        <ThemeIcon size={44} radius="md" variant="light" color={color}>
          <Icon size={22} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

// ==================== ГЛАВНАЯ СТРАНИЦА ====================

type ViewMode = 'day' | 'week';

function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Вычисляем диапазон дат для загрузки (текущая неделя + запас)
  const dateRange = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
    // Берём неделю до и после для плавной навигации
    const dateFrom = new Date(startOfWeek);
    dateFrom.setDate(dateFrom.getDate() - 7);
    const dateTo = new Date(startOfWeek);
    dateTo.setDate(dateTo.getDate() + 14);
    return {
      from: formatDateString(dateFrom),
      to: formatDateString(dateTo),
    };
  }, [currentDate]);

  // Загрузка данных из API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCalendarData(dateRange.from, dateRange.to);
      setStaff(data.staff);
      setServices(data.services);
      setClients(data.clients);
      setAppointments(data.appointments);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить данные. Проверьте синхронизацию.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (viewMode === 'day' ? direction : direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const displayDays = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentDate, viewMode]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      if (selectedStaffFilter.length > 0 && !selectedStaffFilter.includes(apt.staff_id)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(apt.status)) return false;
      return true;
    });
  }, [appointments, selectedStaffFilter, selectedStatuses]);

  const getAppointmentsForDayAndStaff = (date: Date, staffId: string) => {
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate() &&
        apt.staff_id === staffId
      );
    });
  };

  // Получить ВСЕ записи дня (для недельного режима)
  const getAppointmentsForDay = (date: Date) => {
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      );
    });
  };

  // Рассчитать позиции для пересекающихся записей
  const calculateOverlapPositions = (appointments: Appointment[]) => {
    if (appointments.length === 0) return [];

    // Сортируем по времени начала
    const sorted = [...appointments].sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    // Для каждой записи определяем колонку и общее кол-во колонок в группе
    const positions: { apt: Appointment; column: number; totalColumns: number }[] = [];
    const activeGroups: { apt: Appointment; column: number; endTime: number }[] = [];

    for (const apt of sorted) {
      const startTime = new Date(apt.start_time).getTime();
      const endTime = new Date(apt.end_time).getTime();

      // Удаляем записи которые уже закончились
      const stillActive = activeGroups.filter(g => g.endTime > startTime);

      // Находим свободную колонку
      const usedColumns = new Set(stillActive.map(g => g.column));
      let column = 0;
      while (usedColumns.has(column)) column++;

      // Добавляем в активные
      stillActive.push({ apt, column, endTime });
      activeGroups.length = 0;
      activeGroups.push(...stillActive);

      // Сохраняем позицию
      positions.push({ apt, column, totalColumns: stillActive.length });
    }

    // Обновляем totalColumns для всех записей в группе
    // Группируем пересекающиеся записи
    const result: { apt: Appointment; column: number; totalColumns: number }[] = [];

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const startTime = new Date(pos.apt.start_time).getTime();
      const endTime = new Date(pos.apt.end_time).getTime();

      // Находим все пересекающиеся записи
      let maxColumn = pos.column;
      for (const other of positions) {
        const otherStart = new Date(other.apt.start_time).getTime();
        const otherEnd = new Date(other.apt.end_time).getTime();

        // Проверяем пересечение
        if (!(otherEnd <= startTime || otherStart >= endTime)) {
          maxColumn = Math.max(maxColumn, other.column);
        }
      }

      result.push({ apt: pos.apt, column: pos.column, totalColumns: maxColumn + 1 });
    }

    return result;
  };

  const handleCreateAppointment = () => {
    setEditingAppointment(null);
    openModal();
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    openModal();
  };

  const handleSaveAppointment = (data: Partial<Appointment>) => {
    if (data.id) {
      setAppointments(prev =>
        prev.map(apt => {
          if (apt.id === data.id) {
            const clientData = clients.find(c => c.id === data.client_id);
            const staffData = staff.find(s => s.id === data.staff_id);
            const serviceData = services.find(s => s.id === data.service_id);
            if (!clientData || !staffData || !serviceData) return apt;
            return { ...apt, ...data, client: clientData, staff: staffData, service: serviceData, risk_level: calculateRiskLevel(clientData) };
          }
          return apt;
        })
      );
      notifications.show({ title: 'Обновлено', message: 'Запись изменена', color: 'green' });
    } else {
      const clientData = clients.find(c => c.id === data.client_id);
      const staffData = staff.find(s => s.id === data.staff_id);
      const serviceData = services.find(s => s.id === data.service_id);
      if (!clientData || !staffData || !serviceData) {
        notifications.show({ title: 'Ошибка', message: 'Не найдены данные', color: 'red' });
        return;
      }

      setAppointments(prev => [...prev, {
        id: String(Date.now()),
        client_id: data.client_id!,
        client: clientData,
        staff_id: data.staff_id!,
        staff: staffData,
        service_id: data.service_id!,
        service: serviceData,
        start_time: data.start_time!,
        end_time: data.end_time!,
        status: 'new',
        source: 'native',
        risk_level: calculateRiskLevel(clientData),
        notes: data.notes,
      }]);
      notifications.show({ title: 'Создано', message: `${clientData.name} записан(а)`, color: 'green' });
    }
  };

  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointments(prev =>
      prev.map(apt => (apt.id === appointmentId ? { ...apt, status: newStatus } : apt))
    );
    notifications.show({
      title: 'Статус',
      message: STATUS_CONFIG[newStatus].label,
      color: STATUS_CONFIG[newStatus].color,
    });
  };

  const periodStats = useMemo(() => {
    const periodAppointments = filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return displayDays.some(d =>
        aptDate.getFullYear() === d.getFullYear() &&
        aptDate.getMonth() === d.getMonth() &&
        aptDate.getDate() === d.getDate()
      );
    });

    const total = periodAppointments.length;
    const confirmed = periodAppointments.filter(a => a.status === 'confirmed' || a.status === 'completed').length;
    const revenue = periodAppointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.service.price, 0);
    const expectedRevenue = periodAppointments.filter(a => a.status !== 'canceled' && a.status !== 'no_show').reduce((sum, a) => sum + a.service.price, 0);

    return { total, confirmed, revenue, expectedRevenue };
  }, [filteredAppointments, displayDays]);

  const periodTitle = useMemo(() => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    const first = displayDays[0];
    const last = displayDays[displayDays.length - 1];
    return `${first.getDate()} – ${last.getDate()} ${first.toLocaleDateString('ru-RU', { month: 'long' })}`;
  }, [displayDays, viewMode, currentDate]);

  const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const visibleStaff = selectedStaffFilter.length > 0
    ? staff.filter(s => selectedStaffFilter.includes(s.id))
    : staff;

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  return (
    <>
      <title>Журнал записей | Beauty Slot</title>
      <meta name="description" content="Журнал онлайн-записей салона красоты" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Журнал записей" breadcrumbItems={breadcrumbItems} />

          {/* Статистика */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <StatCard label="Записей" value={periodStats.total} icon={IconCalendar} color="blue" />
            <StatCard label="Подтверждено" value={periodStats.confirmed} icon={IconUserCheck} color="cyan" />
            <StatCard label="Ожидается" value={periodStats.expectedRevenue.toLocaleString('ru-RU')} suffix="₽" icon={IconCurrencyRubel} color="violet" />
            <StatCard label="Завершено" value={periodStats.revenue.toLocaleString('ru-RU')} suffix="₽" icon={IconCheck} color="green" />
          </SimpleGrid>

          {/* Панель управления */}
          <Surface p="md">
            <Group justify="space-between" wrap="wrap" gap="md">
              <Group gap="sm">
                <SegmentedControl
                  value={viewMode}
                  onChange={(v) => setViewMode(v as ViewMode)}
                  radius="md"
                  data={[
                    { label: 'День', value: 'day' },
                    { label: 'Неделя', value: 'week' },
                  ]}
                />
                <Divider orientation="vertical" />
                <Group gap={4}>
                  <ActionIcon variant="light" radius="md" size="lg" onClick={() => navigateDate(-1)}>
                    <IconChevronLeft size={18} />
                  </ActionIcon>
                  <Button variant="subtle" size="sm" onClick={goToToday} radius="md">Сегодня</Button>
                  <ActionIcon variant="light" radius="md" size="lg" onClick={() => navigateDate(1)}>
                    <IconChevronRight size={18} />
                  </ActionIcon>
                </Group>
                <Text fw={600} size="lg" style={{ textTransform: 'capitalize' }}>{periodTitle}</Text>
              </Group>

              <Group gap="sm">
                <MultiSelect
                  placeholder="Мастера"
                  data={staff.map(s => ({ value: s.id, label: s.name }))}
                  value={selectedStaffFilter}
                  onChange={setSelectedStaffFilter}
                  clearable
                  w={160}
                  radius="md"
                  leftSection={<IconUsers size={16} />}
                />
                <MultiSelect
                  placeholder="Статусы"
                  data={Object.entries(STATUS_CONFIG).map(([value, config]) => ({ value, label: config.label }))}
                  value={selectedStatuses}
                  onChange={setSelectedStatuses}
                  clearable
                  w={160}
                  radius="md"
                />
                <Button variant="light" radius="md" leftSection={<IconRefresh size={16} />} onClick={loadData} loading={isLoading}>
                  Обновить
                </Button>
                <ActionIcon
                  variant="light"
                  radius="md"
                  size="lg"
                  onClick={() => setIsFullscreen(true)}
                  title="На весь экран"
                >
                  <IconArrowsMaximize size={18} />
                </ActionIcon>
                <Button radius="md" leftSection={<IconPlus size={16} />} onClick={handleCreateAppointment}>
                  Запись
                </Button>
              </Group>
            </Group>
          </Surface>

          {/* Календарная сетка */}
          <Surface p={0} style={{ overflow: 'hidden' }}>
            {isLoading ? (
              <Center h={700}>
                <Stack align="center" gap="md">
                  <Loader size="lg" />
                  <Text c="dimmed">Загрузка данных...</Text>
                </Stack>
              </Center>
            ) : staff.length === 0 ? (
              <Center h={700}>
                <Stack align="center" gap="md">
                  <ThemeIcon size={60} radius="xl" color="gray" variant="light">
                    <IconCalendar size={30} />
                  </ThemeIcon>
                  <Text c="dimmed" ta="center">
                    Нет данных. Запустите синхронизацию на странице /apps/sync
                  </Text>
                  <Button variant="light" onClick={loadData}>
                    Повторить загрузку
                  </Button>
                </Stack>
              </Center>
            ) : (
            <ScrollArea h={700} type="auto">
              <Box style={{ display: 'flex', minWidth: viewMode === 'week' ? 1200 : 800 }}>
                {/* Временная шкала */}
                <Box w={60} style={{ flexShrink: 0, borderRight: '1px solid var(--mantine-color-gray-2)' }}>
                  <Box h={80} /> {/* Отступ под заголовок */}
                  {WORK_HOURS.map(hour => (
                    <Box
                      key={hour}
                      h={HOUR_HEIGHT}
                      style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
                    >
                      <Text size="xs" c="dimmed" ta="right" pr={8} pt={4}>
                        {hour}:00
                      </Text>
                    </Box>
                  ))}
                </Box>

                {/* Колонки дней/мастеров */}
                {displayDays.map(day => (
                  <Box key={day.toISOString()} style={{ flex: 1, minWidth: 0 }}>
                    {/* Заголовок дня (только в недельном виде) */}
                    {viewMode === 'week' && (
                      <Box
                        h={80}
                        p="xs"
                        style={{
                          borderBottom: '1px solid var(--mantine-color-gray-2)',
                          borderLeft: '1px solid var(--mantine-color-gray-2)',
                          background: isToday(day) ? 'var(--mantine-color-blue-0)' : undefined,
                        }}
                      >
                        <Stack gap={4} align="center">
                          <Text size="xs" c="dimmed">
                            {DAYS_SHORT[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                          </Text>
                          <Paper
                            p={6}
                            radius="xl"
                            bg={isToday(day) ? 'blue' : 'transparent'}
                            c={isToday(day) ? 'white' : undefined}
                          >
                            <Text size="lg" fw={700} ta="center" lh={1}>
                              {day.getDate()}
                            </Text>
                          </Paper>
                        </Stack>
                      </Box>
                    )}

                    {/* В недельном режиме — одна колонка с пересекающимися записями */}
                    {viewMode === 'week' ? (
                      <Box
                        style={{
                          borderLeft: '1px solid var(--mantine-color-gray-2)',
                        }}
                      >
                        <Box
                          style={{
                            position: 'relative',
                            height: WORK_HOURS.length * HOUR_HEIGHT,
                          }}
                        >
                          {WORK_HOURS.map(hour => (
                            <Box
                              key={hour}
                              style={{
                                position: 'absolute',
                                top: (hour - START_HOUR) * HOUR_HEIGHT,
                                left: 0,
                                right: 0,
                                borderTop: '1px solid var(--mantine-color-gray-2)',
                              }}
                            />
                          ))}
                          {isToday(day) && <CurrentTimeLine />}
                          {calculateOverlapPositions(getAppointmentsForDay(day)).map(({ apt, column, totalColumns }) => (
                            <TimeGridAppointment
                              key={apt.id}
                              appointment={apt}
                              onEdit={() => handleEditAppointment(apt)}
                              onStatusChange={(status) => handleStatusChange(apt.id, status)}
                              columnWidth={180}
                              overlapColumn={column}
                              overlapTotal={totalColumns}
                            />
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      /* В дневном режиме — колонки по мастерам */
                      <Box style={{ display: 'flex' }}>
                        {visibleStaff.map(staffMember => (
                          <Box
                            key={staffMember.id}
                            style={{
                              flex: 1,
                              minWidth: 180,
                              borderLeft: '1px solid var(--mantine-color-gray-2)',
                            }}
                          >
                            {/* Заголовок мастера */}
                            <Box
                              h={80}
                              p="sm"
                              style={{
                                background: `linear-gradient(135deg, ${staffMember.color}15, ${staffMember.color}08)`,
                                borderBottom: `3px solid ${staffMember.color}`,
                              }}
                            >
                              <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                                <Avatar size="md" radius="xl" style={{ backgroundColor: staffMember.color, flexShrink: 0 }}>
                                  <Text size="sm" c="white" fw={600}>{staffMember.name.charAt(0)}</Text>
                                </Avatar>
                                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                                  <Text size="sm" fw={600} truncate>{staffMember.name}</Text>
                                  <Text size="xs" c="dimmed" truncate>{staffMember.role}</Text>
                                </div>
                              </Group>
                            </Box>

                            {/* Сетка времени */}
                            <Box
                              style={{
                                position: 'relative',
                                height: WORK_HOURS.length * HOUR_HEIGHT,
                              }}
                            >
                              {/* Линии часов */}
                              {WORK_HOURS.map(hour => (
                                <Box
                                  key={hour}
                                  style={{
                                    position: 'absolute',
                                    top: (hour - START_HOUR) * HOUR_HEIGHT,
                                    left: 0,
                                    right: 0,
                                    borderTop: '1px solid var(--mantine-color-gray-2)',
                                  }}
                                />
                              ))}

                              {/* Линия текущего времени */}
                              {isToday(day) && <CurrentTimeLine />}

                              {/* Записи */}
                              {getAppointmentsForDayAndStaff(day, staffMember.id).map(apt => (
                                <TimeGridAppointment
                                  key={apt.id}
                                  appointment={apt}
                                  onEdit={() => handleEditAppointment(apt)}
                                  onStatusChange={(status) => handleStatusChange(apt.id, status)}
                                  columnWidth={180}
                                />
                              ))}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </ScrollArea>
            )}
          </Surface>
        </Stack>
      </Container>

      <AppointmentModal
        opened={modalOpened}
        onClose={closeModal}
        appointment={editingAppointment}
        onSave={handleSaveAppointment}
        staff={staff}
        services={services}
        clients={clients}
      />

      {/* Fullscreen режим */}
      <Modal
        opened={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        fullScreen
        padding={0}
        withCloseButton={false}
        styles={{
          body: { height: '100vh', display: 'flex', flexDirection: 'column' },
          content: { background: 'var(--mantine-color-gray-0)' },
        }}
      >
        {/* Header в fullscreen */}
        <Box
          p="sm"
          style={{
            background: 'white',
            borderBottom: '1px solid var(--mantine-color-gray-2)',
            flexShrink: 0,
          }}
        >
          <Group justify="space-between">
            <Group gap="sm">
              <SegmentedControl
                value={viewMode}
                onChange={(v) => setViewMode(v as ViewMode)}
                radius="md"
                size="xs"
                data={[
                  { label: 'День', value: 'day' },
                  { label: 'Неделя', value: 'week' },
                ]}
              />
              <Divider orientation="vertical" />
              <Group gap={4}>
                <ActionIcon variant="light" radius="md" size="sm" onClick={() => navigateDate(-1)}>
                  <IconChevronLeft size={14} />
                </ActionIcon>
                <Button variant="subtle" size="xs" onClick={goToToday} radius="md">Сегодня</Button>
                <ActionIcon variant="light" radius="md" size="sm" onClick={() => navigateDate(1)}>
                  <IconChevronRight size={14} />
                </ActionIcon>
              </Group>
              <Text fw={600} size="sm" style={{ textTransform: 'capitalize' }}>{periodTitle}</Text>
            </Group>

            <Group gap="sm">
              <MultiSelect
                placeholder="Мастера"
                data={staff.map(s => ({ value: s.id, label: s.name }))}
                value={selectedStaffFilter}
                onChange={setSelectedStaffFilter}
                clearable
                w={140}
                size="xs"
                radius="md"
              />
              <Button
                variant="light"
                radius="md"
                size="xs"
                color="red"
                leftSection={<IconArrowsMinimize size={14} />}
                onClick={() => setIsFullscreen(false)}
              >
                Свернуть
              </Button>
            </Group>
          </Group>
        </Box>

        {/* Календарная сетка в fullscreen */}
        <ScrollArea style={{ flex: 1 }} type="auto">
          <Box style={{ display: 'flex', minWidth: viewMode === 'week' ? 1400 : 1000, height: '100%' }}>
            {/* Временная шкала */}
            <Box w={50} style={{ flexShrink: 0, borderRight: '1px solid var(--mantine-color-gray-2)', background: 'white' }}>
              <Box h={60} /> {/* Отступ под заголовок */}
              {WORK_HOURS.map(hour => (
                <Box
                  key={hour}
                  h={HOUR_HEIGHT}
                  style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
                >
                  <Text size="xs" c="dimmed" ta="right" pr={6} pt={2}>
                    {hour}:00
                  </Text>
                </Box>
              ))}
            </Box>

            {/* Колонки мастеров */}
            {displayDays.map(day => (
              <Box key={day.toISOString()} style={{ flex: 1, minWidth: 0 }}>
                {viewMode === 'week' && (
                  <Box
                    h={60}
                    p="xs"
                    style={{
                      borderBottom: '1px solid var(--mantine-color-gray-2)',
                      borderLeft: '1px solid var(--mantine-color-gray-2)',
                      background: isToday(day) ? 'var(--mantine-color-blue-0)' : 'white',
                    }}
                  >
                    <Stack gap={2} align="center">
                      <Text size="xs" c="dimmed">
                        {DAYS_SHORT[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                      </Text>
                      <Paper
                        p={4}
                        radius="xl"
                        bg={isToday(day) ? 'blue' : 'transparent'}
                        c={isToday(day) ? 'white' : undefined}
                      >
                        <Text size="sm" fw={700} ta="center" lh={1}>
                          {day.getDate()}
                        </Text>
                      </Paper>
                    </Stack>
                  </Box>
                )}

                {/* В недельном режиме — одна колонка с пересекающимися записями */}
                {viewMode === 'week' ? (
                  <Box
                    style={{
                      borderLeft: '1px solid var(--mantine-color-gray-2)',
                    }}
                  >
                    <Box
                      style={{
                        position: 'relative',
                        height: WORK_HOURS.length * HOUR_HEIGHT,
                        background: 'white',
                      }}
                    >
                      {WORK_HOURS.map(hour => (
                        <Box
                          key={hour}
                          style={{
                            position: 'absolute',
                            top: (hour - START_HOUR) * HOUR_HEIGHT,
                            left: 0,
                            right: 0,
                            borderTop: '1px solid var(--mantine-color-gray-2)',
                          }}
                        />
                      ))}
                      {isToday(day) && <CurrentTimeLine />}
                      {calculateOverlapPositions(getAppointmentsForDay(day)).map(({ apt, column, totalColumns }) => (
                        <TimeGridAppointment
                          key={apt.id}
                          appointment={apt}
                          onEdit={() => handleEditAppointment(apt)}
                          onStatusChange={(status) => handleStatusChange(apt.id, status)}
                          columnWidth={150}
                          overlapColumn={column}
                          overlapTotal={totalColumns}
                        />
                      ))}
                    </Box>
                  </Box>
                ) : (
                  /* В дневном режиме — колонки по мастерам */
                  <Box style={{ display: 'flex' }}>
                    {visibleStaff.map(staffMember => (
                      <Box
                        key={staffMember.id}
                        style={{
                          flex: 1,
                          minWidth: 150,
                          borderLeft: '1px solid var(--mantine-color-gray-2)',
                        }}
                      >
                        <Box
                          h={60}
                          p="xs"
                          style={{
                            background: `linear-gradient(135deg, ${staffMember.color}15, ${staffMember.color}08)`,
                            borderBottom: `2px solid ${staffMember.color}`,
                          }}
                        >
                          <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                            <Avatar size="sm" radius="xl" style={{ backgroundColor: staffMember.color, flexShrink: 0 }}>
                              <Text size="xs" c="white" fw={600}>{staffMember.name.charAt(0)}</Text>
                            </Avatar>
                            <div style={{ overflow: 'hidden', minWidth: 0 }}>
                              <Text size="xs" fw={600} truncate>{staffMember.name}</Text>
                              <Text size="10px" c="dimmed" truncate>{staffMember.role}</Text>
                            </div>
                          </Group>
                        </Box>

                        <Box
                          style={{
                            position: 'relative',
                            height: WORK_HOURS.length * HOUR_HEIGHT,
                            background: 'white',
                          }}
                        >
                          {WORK_HOURS.map(hour => (
                            <Box
                              key={hour}
                              style={{
                                position: 'absolute',
                                top: (hour - START_HOUR) * HOUR_HEIGHT,
                                left: 0,
                                right: 0,
                                borderTop: '1px solid var(--mantine-color-gray-2)',
                              }}
                            />
                          ))}
                          {isToday(day) && <CurrentTimeLine />}
                          {getAppointmentsForDayAndStaff(day, staffMember.id).map(apt => (
                            <TimeGridAppointment
                              key={apt.id}
                              appointment={apt}
                              onEdit={() => handleEditAppointment(apt)}
                              onStatusChange={(status) => handleStatusChange(apt.id, status)}
                              columnWidth={150}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </ScrollArea>
      </Modal>
    </>
  );
}

export default CalendarPage;
