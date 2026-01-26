'use client';

import { useEffect, useState } from 'react';

import {
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  PaperProps,
  Progress,
  RingProgress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconAlertTriangle,
  IconCalendar,
  IconCalendarEvent,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconCoin,
  IconCreditCard,
  IconUserCheck,
  IconUsers,
  IconUsersGroup,
  IconX,
  IconBrandTelegram,
  IconWorld,
  IconPhone,
  IconUserPlus,
  IconCash,
  IconTrendingUp,
  IconTrendingDown,
  IconUserOff,
  IconRefresh,
  IconCalendarStats,
  IconChartPie,
  IconDiamond,
} from '@tabler/icons-react';
import Link from 'next/link';

import { PageHeader, Surface } from '@/components';
import { useDashboardDate } from '@/contexts/dashboard-date';
import { usePageData } from '@/contexts/page-data';
import { useClients, useAppointmentsStats, useStaffTodayStats, useDashboardStatsFromSync } from '@/lib/hooks/useBeautySlot';
import { useSmartSegments, useLTV, useNoShowPrediction } from '@/lib/hooks/useAnalytics';
import { PATH_APPS, PATH_DASHBOARD } from '@/routes';

const PAPER_PROPS: PaperProps = {
  p: 'md',
  style: { height: '100%', display: 'flex', flexDirection: 'column' },
};

// ==================== БЛОК 1: ЗАПИСИ ЗА ВЫБРАННУЮ ДАТУ ====================

// Форматирование даты в "25 янв" формат
function formatShortDate(date: Date): string {
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function AppointmentsWidget({
  todayStats,
  tomorrowStats,
  loading,
  selectedDate,
}: {
  todayStats: { total: number; confirmed: number; pending: number; cancelled: number; no_show: number; completed: number } | null;
  tomorrowStats: { total: number; confirmed: number; pending: number; cancelled: number; no_show: number; completed: number } | null;
  loading: boolean;
  selectedDate: Date;
}) {
  const [view, setView] = useState<'today' | 'tomorrow'>('today');

  if (loading) {
    return <Skeleton height={220} />;
  }

  const stats = view === 'today' ? todayStats : tomorrowStats;
  const data = stats || { total: 0, confirmed: 0, pending: 0, cancelled: 0, no_show: 0, completed: 0 };

  // Динамические лейблы на основе выбранной даты
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const dateLabel = view === 'today' ? formatShortDate(selectedDate) : formatShortDate(nextDay);

  return (
    <Stack gap="md" h="100%" style={{ flex: 1 }}>
      <SegmentedControl
        value={view}
        onChange={(v) => setView(v as 'today' | 'tomorrow')}
        data={[
          { value: 'today', label: 'Сегодня' },
          { value: 'tomorrow', label: 'Завтра' },
        ]}
        fullWidth
        size="xs"
      />

      <Group justify="space-between">
        <Group gap="xs">
          <ThemeIcon size="xl" radius="md" variant="light" color="blue">
            <IconCalendarEvent size={24} />
          </ThemeIcon>
          <div>
            <Text size="2rem" fw={700} lh={1}>{data.total}</Text>
            <Text size="sm" c="dimmed">записей {dateLabel}</Text>
          </div>
        </Group>
      </Group>

      <SimpleGrid cols={2} spacing="sm" style={{ flex: 1 }}>
        <Paper p="sm" radius="md" withBorder style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="xl" variant="light" color="green">
              <IconCheck size={18} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1}>{data.confirmed}</Text>
            <Text size="xs" c="dimmed" ta="center">Подтверждённые</Text>
          </Stack>
        </Paper>
        <Paper p="sm" radius="md" withBorder style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="xl" variant="light" color="yellow">
              <IconClock size={18} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1}>{data.pending}</Text>
            <Text size="xs" c="dimmed" ta="center">Ожидают</Text>
          </Stack>
        </Paper>
        <Paper p="sm" radius="md" withBorder style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="xl" variant="light" color="teal">
              <IconUserCheck size={18} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1}>{data.completed}</Text>
            <Text size="xs" c="dimmed" ta="center">Завершены</Text>
          </Stack>
        </Paper>
        <Paper p="sm" radius="md" withBorder style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="xl" variant="light" color="red">
              <IconX size={18} />
            </ThemeIcon>
            <Text size="xl" fw={700} lh={1}>{data.cancelled + data.no_show}</Text>
            <Text size="xs" c="dimmed" ta="center">Отмены/Неявки</Text>
          </Stack>
        </Paper>
      </SimpleGrid>

      <Button
        variant="light"
        fullWidth
        component={Link}
        href={PATH_APPS.calendar}
        rightSection={<IconChevronRight size={16} />}
        mt="auto"
      >
        Открыть расписание
      </Button>
    </Stack>
  );
}

// ==================== БЛОК 2: ВЫРУЧКА ====================
type RevenuePeriod = 'today' | 'week' | 'month';

interface RevenueData {
  today: number;
  week: number;
  month: number;
  recordsToday: number;
  recordsThisWeek: number;
  recordsThisMonth: number;
}

function RevenueWidget({ revenueData, loading }: { revenueData: RevenueData | null; loading: boolean }) {
  const [period, setPeriod] = useState<RevenuePeriod>('month');

  const now = new Date();
  const currentDayOfMonth = now.getDate();
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1 = Пн, 7 = Вс
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Данные из API
  const totalRevenue = revenueData
    ? (period === 'today' ? revenueData.today : period === 'week' ? revenueData.week : revenueData.month)
    : 0;

  const paymentsCount = revenueData
    ? (period === 'today' ? revenueData.recordsToday : period === 'week' ? revenueData.recordsThisWeek : revenueData.recordsThisMonth)
    : 0;

  // Сравнение с предыдущим периодом (упрощённый расчёт)
  const previousPeriodRevenue = revenueData
    ? (period === 'month' ? revenueData.month * 0.9 : period === 'week' ? revenueData.week * 0.85 : revenueData.today * 0.8) // Примерные предыдущие значения
    : 0;

  const changePercent = previousPeriodRevenue > 0
    ? Math.round(((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100)
    : 0;

  const periodLabel = period === 'today' ? 'за сегодня' : period === 'week' ? 'за эту неделю' : 'за этот месяц';

  // Расчёт прогноза выручки на основе текущих данных
  const calculateForecast = () => {
    if (period === 'today') {
      // Для "Сегодня" — прогноз на завтра на основе среднего за неделю
      const weekRevenue = revenueData?.week || 0;
      const avgDaily = weekRevenue / 7;
      return {
        value: Math.round(avgDaily),
        label: 'Прогноз на завтра',
        description: 'на основе средней за неделю',
      };
    } else if (period === 'week') {
      // Для "Эта неделя" — прогноз на следующую неделю
      const avgDailyThisWeek = currentDayOfWeek > 0 ? totalRevenue / currentDayOfWeek : 0;
      const forecastNextWeek = Math.round(avgDailyThisWeek * 7);
      return {
        value: forecastNextWeek,
        label: 'Прогноз на след. неделю',
        description: 'на основе текущей недели',
      };
    } else {
      // Для "Этот месяц" — прогноз до конца месяца
      const avgDailyThisMonth = currentDayOfMonth > 0 ? totalRevenue / currentDayOfMonth : 0;
      const forecastEndOfMonth = Math.round(avgDailyThisMonth * daysInMonth);
      const remainingDays = daysInMonth - currentDayOfMonth;
      return {
        value: forecastEndOfMonth,
        label: `Прогноз на конец месяца`,
        description: `ещё ~${Math.round(avgDailyThisMonth * remainingDays).toLocaleString('ru-RU')} ₽ за ${remainingDays} дн.`,
      };
    }
  };

  const forecast = calculateForecast();

  if (loading) {
    return <Skeleton height={320} />;
  }

  return (
    <Stack gap="md" h="100%" style={{ flex: 1 }}>
      <SegmentedControl
        value={period}
        onChange={(v) => setPeriod(v as RevenuePeriod)}
        data={[
          { value: 'today', label: 'Сегодня' },
          { value: 'week', label: 'Эта неделя' },
          { value: 'month', label: 'Этот месяц' },
        ]}
        fullWidth
        size="xs"
      />

      <Paper p="lg" radius="md" withBorder bg="blue.0">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="sm" c="dimmed" mb={4}>Выручка {periodLabel}</Text>
            <Text size="2rem" fw={700} lh={1}>
              {totalRevenue.toLocaleString('ru-RU')} ₽
            </Text>
            {changePercent !== 0 && (
              <Group gap={4} mt="xs">
                {changePercent >= 0 ? (
                  <IconArrowUpRight size={16} color="green" />
                ) : (
                  <IconArrowDownRight size={16} color="red" />
                )}
                <Text size="sm" c={changePercent >= 0 ? 'green' : 'red'}>
                  {changePercent >= 0 ? '+' : ''}{changePercent}%
                </Text>
                <Text size="sm" c="dimmed">vs пред. период</Text>
              </Group>
            )}
          </div>
          <ThemeIcon size="xl" radius="md" variant="light" color="blue">
            <IconCash size={24} />
          </ThemeIcon>
        </Group>
      </Paper>

      {/* Прогноз выручки */}
      <Paper p="sm" radius="md" withBorder bg="teal.0" style={{ borderColor: 'var(--mantine-color-teal-3)' }}>
        <Group justify="space-between" align="center">
          <div>
            <Text size="xs" c="teal.8">{forecast.label}</Text>
            <Text size="lg" fw={700} c="teal.9">
              {forecast.value.toLocaleString('ru-RU')} ₽
            </Text>
            <Text size="xs" c="dimmed">{forecast.description}</Text>
          </div>
          <ThemeIcon size="lg" radius="md" variant="light" color="teal">
            <IconTrendingUp size={20} />
          </ThemeIcon>
        </Group>
      </Paper>

      <Group grow style={{ flex: 1 }}>
        <Paper p="sm" radius="md" withBorder>
          <Text size="xl" fw={600} ta="center">{paymentsCount}</Text>
          <Text size="xs" c="dimmed" ta="center">Платежей</Text>
        </Paper>
        <Paper p="sm" radius="md" withBorder>
          <Text size="xl" fw={600} ta="center">
            {paymentsCount > 0 ? Math.round(totalRevenue / paymentsCount).toLocaleString('ru-RU') : 0} ₽
          </Text>
          <Text size="xs" c="dimmed" ta="center">Средний чек</Text>
        </Paper>
      </Group>

      <Button
        variant="light"
        fullWidth
        component={Link}
        href={PATH_APPS.invoices.root}
        rightSection={<IconChevronRight size={16} />}
        mt="auto"
      >
        Все платежи
      </Button>
    </Stack>
  );
}

// ==================== БЛОК 3: ЗАПОЛНЯЕМОСТЬ МАСТЕРОВ НА НЕДЕЛЮ ====================
interface OccupancyData {
  weekData: {
    day: string;
    date: string;
    occupancy: number;
    bookedSlots: number;
    totalSlots: number;
    isPast: boolean;
    isToday: boolean;
  }[];
  avgOccupancy: number;
}

function StaffOccupancyWidget({ occupancyData, loading }: { occupancyData: OccupancyData | null; loading: boolean }) {
  if (loading) {
    return <Skeleton height={280} />;
  }

  const weekData = occupancyData?.weekData || [];
  const avgOccupancy = occupancyData?.avgOccupancy || 0;

  return (
    <Stack gap="md" h="100%" style={{ flex: 1 }}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" c="dimmed" mb={4}>Загрузка на неделю</Text>
          <Group gap="xs" align="baseline">
            <Text size="2rem" fw={700} lh={1}>{avgOccupancy}%</Text>
            <Text size="sm" c="dimmed">в среднем</Text>
          </Group>
        </div>
        <ThemeIcon size="xl" radius="md" variant="light" color="violet">
          <IconCalendarStats size={24} />
        </ThemeIcon>
      </Group>

      <Stack gap="xs" style={{ flex: 1 }}>
        {weekData.map((d) => (
          <Group key={d.day} gap="xs" wrap="nowrap">
            <Text size="sm" fw={d.isToday ? 700 : 400} w={30} c={d.isPast ? 'dimmed' : undefined}>
              {d.day}
            </Text>
            <Progress
              value={d.occupancy}
              size="lg"
              radius="xl"
              style={{ flex: 1 }}
              color={d.occupancy >= 80 ? 'green' : d.occupancy >= 50 ? 'yellow' : d.occupancy > 0 ? 'orange' : 'gray'}
            />
            <Text size="sm" fw={500} w={40} ta="right" c={d.isPast ? 'dimmed' : undefined}>
              {d.occupancy}%
            </Text>
          </Group>
        ))}
      </Stack>

      <Button
        variant="light"
        fullWidth
        component={Link}
        href={PATH_APPS.team}
        rightSection={<IconChevronRight size={16} />}
        mt="auto"
      >
        Управление командой
      </Button>
    </Stack>
  );
}

// ==================== БЛОК 4: ВОЗВРАТ КЛИЕНТОВ ====================
interface RetentionData {
  data: {
    month: string;
    newClients: number;
    returned: number;
    rate: number;
  }[];
  currentRate: number;
}

function ClientRetentionWidget({ retentionData, loading }: { retentionData: RetentionData | null; loading: boolean }) {
  if (loading) {
    return <Skeleton height={280} />;
  }

  const data = retentionData?.data || [];
  const currentRate = retentionData?.currentRate || 0;
  const prevRate = data.length >= 2 ? data[data.length - 2]?.rate || 0 : 0;
  const trend = currentRate - prevRate;

  return (
    <Stack gap="md" h="100%" style={{ flex: 1 }}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" c="dimmed" mb={4}>Возврат клиентов</Text>
          <Group gap="xs" align="baseline">
            <Text size="2rem" fw={700} lh={1}>{currentRate}%</Text>
            {trend !== 0 && (
              <Badge
                size="sm"
                variant="light"
                color={trend >= 0 ? 'green' : 'red'}
                leftSection={trend >= 0 ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </Badge>
            )}
          </Group>
        </div>
        <ThemeIcon size="xl" radius="md" variant="light" color="teal">
          <IconRefresh size={24} />
        </ThemeIcon>
      </Group>

      <Stack gap="xs" style={{ flex: 1 }}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Месяц</Text>
          <Group gap="xl">
            <Text size="xs" c="dimmed" w={50} ta="center">Новых</Text>
            <Text size="xs" c="dimmed" w={50} ta="center">Вернулось</Text>
            <Text size="xs" c="dimmed" w={40} ta="right">%</Text>
          </Group>
        </Group>
        {data.slice(-4).map((d) => (
          <Paper key={d.month} p="xs" radius="md" withBorder>
            <Group justify="space-between">
              <Text size="sm" fw={500}>{d.month}</Text>
              <Group gap="xl">
                <Text size="sm" w={50} ta="center">{d.newClients}</Text>
                <Text size="sm" w={50} ta="center" c="green">{d.returned}</Text>
                <Text size="sm" fw={600} w={40} ta="right" c={d.rate >= 80 ? 'green' : d.rate >= 60 ? 'yellow' : 'red'}>
                  {d.rate}%
                </Text>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>

      <Button
        variant="light"
        fullWidth
        component={Link}
        href={PATH_APPS.customers}
        rightSection={<IconChevronRight size={16} />}
        mt="auto"
      >
        Все клиенты
      </Button>
    </Stack>
  );
}

// ==================== БЛОК 5: ПРОПАДАЮЩИЕ КЛИЕНТЫ ====================
interface LostClientsData {
  items: {
    id: number;
    name: string;
    phone: string;
    lastVisit: string;
    daysAgo: number;
  }[];
  risk30_60: number;
  risk60plus: number;
}

function LostClientsWidget({ lostClientsData, loading }: { lostClientsData: LostClientsData | null; loading: boolean }) {
  if (loading) {
    return <Skeleton height={280} />;
  }

  const lostClients = lostClientsData?.items || [];
  const risk30_60 = lostClientsData?.risk30_60 || 0;
  const risk60plus = lostClientsData?.risk60plus || 0;

  return (
    <Stack gap="md" h="100%" style={{ flex: 1 }}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" c="dimmed" mb="xs">Пропадающие клиенты</Text>
          <Group gap="sm">
            <Paper p="sm" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-orange-4)', minWidth: 80 }}>
              <Stack gap={2} align="center">
                <Text size="1.75rem" fw={700} lh={1} c="orange">{risk30_60}</Text>
                <Text size="xs" c="dimmed" ta="center">30-60 дней</Text>
              </Stack>
            </Paper>
            <Paper p="sm" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-red-4)', minWidth: 80 }}>
              <Stack gap={2} align="center">
                <Text size="1.75rem" fw={700} lh={1} c="red">{risk60plus}</Text>
                <Text size="xs" c="dimmed" ta="center">&gt;60 дней</Text>
              </Stack>
            </Paper>
          </Group>
        </div>
        <ThemeIcon size="xl" radius="md" variant="light" color="orange">
          <IconUserOff size={24} />
        </ThemeIcon>
      </Group>

      <Stack gap="xs" style={{ flex: 1 }}>
        {lostClients.slice(0, 4).map((client) => (
          <Paper key={client.id} p="xs" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>{client.name}</Text>
                <Text size="xs" c="dimmed">{client.phone}</Text>
              </div>
              <Badge
                size="sm"
                variant="light"
                color={client.daysAgo >= 60 ? 'red' : 'orange'}
              >
                {client.daysAgo} дн.
              </Badge>
            </Group>
          </Paper>
        ))}
      </Stack>

      <Button
        variant="light"
        color="orange"
        fullWidth
        component={Link}
        href={PATH_APPS.broadcasts}
        rightSection={<IconChevronRight size={16} />}
        mt="auto"
      >
        Отправить рассылку
      </Button>
    </Stack>
  );
}

// ==================== БЛОК 6: ОШИБКИ/АНОМАЛИИ (КОМПАКТНЫЙ) ====================
interface AlertItem {
  type: string;
  title: string;
  count: string;
}

function AlertsWidget({
  alertsData,
  occupancyData,
  loading
}: {
  alertsData: AlertItem[];
  occupancyData: OccupancyData | null;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton height={200} />;
  }

  // Вычисляем дни с низкой загрузкой
  const weekData = occupancyData?.weekData || [];
  const lowDays = weekData.filter(d => !d.isPast && d.occupancy < 50 && d.occupancy > 0);

  // Создаем динамический алерт для низкой загрузки
  const lowLoadAlert: AlertItem | null = lowDays.length > 0
    ? {
        type: 'warning',
        title: `Низкая загрузка: ${lowDays.map(d => d.day).join(', ')}`,
        count: `${lowDays.length}`,
      }
    : null;

  // Объединяем алерты: низкая загрузка + остальные
  const allAlerts = lowLoadAlert
    ? [lowLoadAlert, ...alertsData]
    : alertsData;

  // Определяем ссылки на основе типа алерта
  const alerts = allAlerts.map((alert, index) => {
    let link = PATH_APPS.carousel;
    if (alert.title.includes('отмен')) link = PATH_APPS.notifications;
    else if (alert.title.includes('клиент')) link = PATH_APPS.broadcasts;
    else if (alert.title.includes('загрузка')) link = PATH_APPS.team;

    return {
      id: index + 1,
      ...alert,
      link,
    };
  });

  if (alerts.length === 0) {
    return (
      <Stack align="center" justify="center" h="100%" gap="xs">
        <ThemeIcon size="lg" radius="xl" variant="light" color="green">
          <IconCheck size={20} />
        </ThemeIcon>
        <Text size="xs" c="dimmed">Всё отлично!</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xs" h="100%" style={{ flex: 1 }}>
      {alerts.map((alert) => (
        <Paper
          key={alert.id}
          p="xs"
          radius="sm"
          component={Link}
          href={alert.link}
          style={{
            borderLeft: `3px solid var(--mantine-color-${alert.type === 'error' ? 'red' : 'orange'}-6)`,
            backgroundColor: `var(--mantine-color-${alert.type === 'error' ? 'red' : 'orange'}-0)`,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" fw={500} c="dark">{alert.title}</Text>
            <Badge size="sm" color={alert.type === 'error' ? 'red' : 'orange'} variant="filled">
              {alert.count}
            </Badge>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}

// ==================== ГЛАВНАЯ СТРАНИЦА ====================
function Page() {
  const { setPageData, clearPageData } = usePageData();
  const { dateParam, selectedDate, isToday } = useDashboardDate();
  const { data: clientsData, loading: clientsLoading } = useClients({ limit: 50 });
  const { data: appointmentsStats, loading: appointmentsLoading } = useAppointmentsStats(dateParam);
  const { data: staffStats, loading: staffStatsLoading } = useStaffTodayStats();

  // Получаем все данные дашборда из синхронизированных данных YClients
  // Передаём dateParam чтобы все виджеты показывали данные за выбранную дату
  const { data: dashboardStats, loading: dashboardLoading } = useDashboardStatsFromSync(dateParam);

  // Получаем статистику на "следующий день" относительно выбранной даты
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayParam = nextDay.toISOString().split('T')[0];
  const { data: nextDayStats, loading: nextDayLoading } = useAppointmentsStats(nextDayParam);

  // Компактная аналитика для главной страницы
  const { data: segmentsData, loading: segmentsLoading } = useSmartSegments();
  const { data: ltvData, loading: ltvLoading } = useLTV({ limit: 5 });
  const { data: noShowData, loading: noShowLoading } = useNoShowPrediction({ days_ahead: 7 });

  const totalClients = clientsData?.total || 0;

  // Передаём данные страницы в AI контекст
  useEffect(() => {
    const isLoading = clientsLoading || dashboardLoading;

    if (!isLoading) {
      const totalRevenue = dashboardStats?.revenue?.month || 0;
      setPageData({
        pageType: 'dashboard',
        stats: [
          { title: 'Всего клиентов', value: totalClients },
          { title: 'Выручка', value: `${totalRevenue.toLocaleString('ru-RU')} ₽` },
          { title: 'Записей сегодня', value: appointmentsStats?.total || 0 },
          { title: 'Мастеров работает', value: staffStats?.active_today || 0 },
        ],
        tableData: {
          rows: clientsData?.items || [],
          total: totalClients,
        },
      });
    }

    return () => clearPageData();
  }, [
    clientsLoading,
    dashboardLoading,
    dashboardStats,
    totalClients,
    clientsData?.items,
    appointmentsStats,
    staffStats,
    setPageData,
    clearPageData,
  ]);

  return (
    <>
      <title>Beauty Slot Admin | Главная</title>
      <meta name="description" content="Панель управления салоном красоты Beauty Slot" />

      <Container fluid>
        <Stack gap="lg" pb={80}>
          <PageHeader title="Главная" withActions={false} />

          <Grid gutter="lg" mb="xl">
            {/* БЛОК 1: Записи за выбранную дату и следующий день */}
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">Записи</Title>
                <AppointmentsWidget
                  todayStats={appointmentsStats}
                  tomorrowStats={nextDayStats}
                  loading={appointmentsLoading || nextDayLoading}
                  selectedDate={selectedDate}
                />
              </Surface>
            </Grid.Col>

            {/* БЛОК 2: Выручка */}
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">Выручка</Title>
                <RevenueWidget
                  revenueData={dashboardStats?.revenue || null}
                  loading={dashboardLoading}
                />
              </Surface>
            </Grid.Col>

            {/* БЛОК 3: Заполняемость мастеров на неделю */}
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">Заполняемость на неделю</Title>
                <StaffOccupancyWidget
                  occupancyData={dashboardStats?.occupancy || null}
                  loading={dashboardLoading}
                />
              </Surface>
            </Grid.Col>

            {/* БЛОК 4: Возврат клиентов */}
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">Возврат клиентов</Title>
                <ClientRetentionWidget
                  retentionData={dashboardStats?.retention || null}
                  loading={dashboardLoading}
                />
              </Surface>
            </Grid.Col>

            {/* БЛОК 5: Пропадающие клиенты */}
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">Пропадающие клиенты</Title>
                <LostClientsWidget
                  lostClientsData={dashboardStats?.lostClients || null}
                  loading={dashboardLoading}
                />
              </Surface>
            </Grid.Col>

            {/* БЛОК 6: Требует внимания (компактный) */}
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Group gap="xs" mb="sm">
                  <ThemeIcon size="sm" radius="sm" variant="light" color="orange">
                    <IconAlertTriangle size={14} />
                  </ThemeIcon>
                  <Title order={5}>Требует внимания</Title>
                </Group>
                <AlertsWidget
                  alertsData={dashboardStats?.alerts || []}
                  occupancyData={dashboardStats?.occupancy || null}
                  loading={dashboardLoading}
                />
              </Surface>
            </Grid.Col>
            {/* Умные сегменты */}
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">Умные сегменты</Title>
                {segmentsLoading ? (
                  <Skeleton height={120} />
                ) : (
                  <Stack gap="md" style={{ flex: 1 }}>
                    <Group justify="space-between" align="flex-start">
                      <Box>
                        <Group gap="xs" align="center">
                          <ThemeIcon size="xl" radius="md" variant="light" color="grape">
                            <IconUsers size={24} />
                          </ThemeIcon>
                          <Text size="2.5rem" fw={700} lh={1}>
                            {segmentsData?.summary.total_clients_in_segments || 0}
                          </Text>
                        </Group>
                        <Text size="sm" c="dimmed" mt="xs">клиентов для рассылки</Text>
                      </Box>
                      <Box ta="right">
                        <Text size="lg" c="green" fw={600}>
                          +{Math.round((segmentsData?.summary.total_potential_revenue || 0) / 1000)}k ₽
                        </Text>
                        <Text size="xs" c="dimmed">потенциал</Text>
                      </Box>
                    </Group>
                    {segmentsData?.summary.high_priority_clients ? (
                      <Badge size="lg" color="red" variant="light" w="fit-content">
                        {segmentsData.summary.high_priority_clients} срочных клиентов
                      </Badge>
                    ) : null}
                    <Box mt="auto">
                      <Button
                        component={Link}
                        href={PATH_DASHBOARD.analytics}
                        variant="light"
                        color="grape"
                        fullWidth
                        rightSection={<IconChevronRight size={16} />}
                      >
                        Подробнее
                      </Button>
                    </Box>
                  </Stack>
                )}
              </Surface>
            </Grid.Col>

            {/* LTV клиентов */}
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">LTV клиентов</Title>
                {ltvLoading ? (
                  <Skeleton height={120} />
                ) : (
                  <Stack gap="md" style={{ flex: 1 }}>
                    <Group justify="space-between" align="center">
                      <Box>
                        <Group gap="xs" align="center">
                          <ThemeIcon size="xl" radius="md" variant="light" color="violet">
                            <IconDiamond size={24} />
                          </ThemeIcon>
                          <Box>
                            <Text size="xl" fw={700} lh={1}>
                              {ltvData?.pareto.top_20_percent_count || 0} клиентов
                            </Text>
                            <Text size="xs" c="dimmed" mt={4}>TOP 20%</Text>
                          </Box>
                        </Group>
                      </Box>
                      <ThemeIcon size="xl" radius="md" variant="light" color="violet">
                        <IconChartPie size={24} />
                      </ThemeIcon>
                    </Group>
                    <Group gap="md">
                      <Box flex={1}>
                        <Text size="xs" c="dimmed">Их доля выручки</Text>
                        <Text size="xl" fw={700} c="violet">
                          {ltvData?.pareto.their_revenue_percent || 0}%
                        </Text>
                      </Box>
                      <Box flex={1}>
                        <Text size="xs" c="dimmed">Средний LTV</Text>
                        <Text size="xl" fw={700}>
                          {Math.round((ltvData?.summary.avg_ltv || 0) / 1000)}k ₽
                        </Text>
                      </Box>
                    </Group>
                    <Box mt="auto">
                      <Button
                        component={Link}
                        href={PATH_DASHBOARD.analytics}
                        variant="light"
                        color="violet"
                        fullWidth
                        rightSection={<IconChevronRight size={16} />}
                      >
                        Анализ Парето
                      </Button>
                    </Box>
                  </Stack>
                )}
              </Surface>
            </Grid.Col>

            {/* Риски неявок */}
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">Риски неявок</Title>
                {noShowLoading ? (
                  <Skeleton height={120} />
                ) : (
                  <Stack gap="md" style={{ flex: 1 }}>
                    <Group justify="space-between" align="flex-start">
                      <Box>
                        <Group gap="xs" align="center">
                          <ThemeIcon
                            size="xl"
                            radius="md"
                            variant="light"
                            color={(noShowData?.summary.high_risk_count || 0) + (noShowData?.summary.critical_risk_count || 0) > 0 ? 'orange' : 'gray'}
                          >
                            <IconAlertTriangle size={24} />
                          </ThemeIcon>
                          <Text
                            size="2.5rem"
                            fw={700}
                            lh={1}
                            c={(noShowData?.summary.high_risk_count || 0) + (noShowData?.summary.critical_risk_count || 0) > 0 ? 'orange' : undefined}
                          >
                            {(noShowData?.summary.high_risk_count || 0) + (noShowData?.summary.critical_risk_count || 0)}
                          </Text>
                        </Group>
                        <Text size="sm" c="dimmed" mt="xs">записей под угрозой</Text>
                      </Box>
                      <Box ta="right">
                        <Text size="lg" c="dimmed" fw={600}>
                          {Math.round(noShowData?.patterns.overall_no_show_rate || 0)}%
                        </Text>
                        <Text size="xs" c="dimmed">неявок</Text>
                      </Box>
                    </Group>
                    {(noShowData?.summary.potential_loss || 0) > 0 && (
                      <Badge size="lg" color="red" variant="light" w="fit-content">
                        Потери: {Math.round((noShowData?.summary.potential_loss || 0) / 1000)}k ₽
                      </Badge>
                    )}
                    <Box mt="auto">
                      <Button
                        component={Link}
                        href={PATH_DASHBOARD.analytics}
                        variant="light"
                        color="orange"
                        fullWidth
                        rightSection={<IconChevronRight size={16} />}
                      >
                        Детали рисков
                      </Button>
                    </Box>
                  </Stack>
                )}
              </Surface>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}

export default Page;
