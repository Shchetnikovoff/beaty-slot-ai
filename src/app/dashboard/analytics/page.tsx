'use client';

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Paper,
  PaperProps,
  Progress,
  RingProgress,
  ScrollArea,
  SegmentedControl,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBrandTelegram,
  IconCalendarEvent,
  IconChartBar,
  IconChartPie,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconCrown,
  IconDiamond,
  IconMail,
  IconMessage,
  IconPhone,
  IconRefresh,
  IconSend,
  IconSparkles,
  IconStar,
  IconTrendingDown,
  IconTrendingUp,
  IconUser,
  IconUserCheck,
  IconUserOff,
  IconUsers,
  IconUsersGroup,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

import { PageHeader, Surface } from '@/components';
import {
  useSmartSegments,
  useLTV,
  useNoShowPrediction,
  useStaffPerformance,
  useEmptySlotsForcast,
  useTrafficSources,
  type SmartSegment,
  type LTVClient,
  type RiskyAppointment,
  type StaffPerformance,
  type DayForecast,
  type TrafficSource,
} from '@/lib/hooks/useAnalytics';
import { PATH_APPS, PATH_DASHBOARD } from '@/routes';

const PAPER_PROPS: PaperProps = {
  p: 'md',
  style: { height: '100%', display: 'flex', flexDirection: 'column' },
};

const breadcrumbItems = [
  { title: 'Главная', href: PATH_DASHBOARD.default },
  { title: 'Аналитика', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

// ==================== SMART SEGMENTS WIDGET ====================
function SmartSegmentsWidget() {
  const { data, loading, error } = useSmartSegments();

  if (loading) return <Skeleton height={400} />;
  if (error) return <Text c="red" size="sm">Ошибка загрузки сегментов</Text>;
  if (!data || data.segments.length === 0) {
    return (
      <Stack align="center" justify="center" h={300} gap="md">
        <ThemeIcon size={60} radius="xl" variant="light" color="gray">
          <IconUsers size={30} />
        </ThemeIcon>
        <Text c="dimmed">Нет данных для сегментации</Text>
      </Stack>
    );
  }

  const priorityColors: Record<string, string> = {
    HIGH: 'red',
    MEDIUM: 'orange',
    LOW: 'blue',
  };

  const channelIcons: Record<string, React.ReactNode> = {
    telegram: <IconBrandTelegram size={14} />,
    sms: <IconPhone size={14} />,
    whatsapp: <IconMessage size={14} />,
    email: <IconMail size={14} />,
  };

  return (
    <Stack gap="md" h="100%">
      <Group justify="space-between">
        <div>
          <Text size="sm" c="dimmed">Всего клиентов в сегментах</Text>
          <Text size="xl" fw={700}>{data.summary.total_clients_in_segments}</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text size="sm" c="dimmed">Потенциальная выручка</Text>
          <Text size="xl" fw={700} c="green">
            {Math.round(data.summary.total_potential_revenue).toLocaleString('ru-RU')} ₽
          </Text>
        </div>
      </Group>

      <ScrollArea h={350} offsetScrollbars>
        <Stack gap="sm">
          {data.segments.map((segment) => (
            <Paper key={segment.id} p="sm" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Badge color={priorityColors[segment.priority]} size="sm" variant="filled">
                    {segment.priority}
                  </Badge>
                  <Text fw={600} size="sm">{segment.name}</Text>
                </Group>
                <Badge size="lg" variant="light" color="blue">
                  {segment.count} чел.
                </Badge>
              </Group>

              <Text size="xs" c="dimmed" mb="xs">{segment.description}</Text>

              <Group justify="space-between" mt="sm">
                <Group gap="xs">
                  <Tooltip label={segment.recommended_channel}>
                    <ThemeIcon size="sm" variant="light" color="gray">
                      {channelIcons[segment.recommended_channel]}
                    </ThemeIcon>
                  </Tooltip>
                  <Text size="xs" c="dimmed">{segment.recommended_action}</Text>
                </Group>
                <Text size="xs" fw={500} c="green">
                  +{Math.round(segment.potential_revenue).toLocaleString('ru-RU')} ₽
                </Text>
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

      <Button
        variant="light"
        fullWidth
        component={Link}
        href={PATH_APPS.broadcasts}
        rightSection={<IconSend size={16} />}
        mt="auto"
      >
        Создать рассылку
      </Button>
    </Stack>
  );
}

// ==================== LTV WIDGET ====================
function LTVWidget() {
  const { data, loading, error } = useLTV({ limit: 10 });

  if (loading) return <Skeleton height={400} />;
  if (error) return <Text c="red" size="sm">Ошибка загрузки LTV</Text>;
  if (!data) return null;

  const segmentColors: Record<string, string> = {
    diamond: 'violet',
    gold: 'yellow',
    silver: 'gray',
    bronze: 'orange',
  };

  const segmentIcons: Record<string, React.ReactNode> = {
    diamond: <IconDiamond size={14} />,
    gold: <IconCrown size={14} />,
    silver: <IconStar size={14} />,
    bronze: <IconUser size={14} />,
  };

  return (
    <Stack gap="md" h="100%">
      {/* Pareto Insight */}
      <Paper p="md" radius="md" bg="violet.0" withBorder style={{ borderColor: 'var(--mantine-color-violet-3)' }}>
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="sm" c="violet.8" fw={500}>Правило Парето</Text>
            <Text size="xl" fw={700} c="violet.9">
              {data.pareto.top_20_percent_count} клиентов = {data.pareto.their_revenue_percent}% выручки
            </Text>
            <Text size="xs" c="dimmed">{data.pareto.insight}</Text>
          </div>
          <ThemeIcon size="lg" radius="md" variant="light" color="violet">
            <IconChartPie size={20} />
          </ThemeIcon>
        </Group>
      </Paper>

      {/* Segment Stats */}
      <Group grow>
        {Object.entries(data.segments).map(([key, segment]) => (
          <Paper key={key} p="xs" radius="md" withBorder>
            <Stack gap={4} align="center">
              <ThemeIcon size="sm" radius="xl" variant="light" color={segmentColors[key]}>
                {segmentIcons[key]}
              </ThemeIcon>
              <Text size="lg" fw={700}>{segment.count}</Text>
              <Text size="xs" c="dimmed" ta="center" tt="capitalize">{key}</Text>
              <Text size="xs" c="green">{segment.revenue_percent}%</Text>
            </Stack>
          </Paper>
        ))}
      </Group>

      {/* Top Clients */}
      <ScrollArea h={180} offsetScrollbars>
        <Stack gap="xs">
          {data.clients.slice(0, 5).map((client, idx) => (
            <Paper key={client.id} p="xs" radius="md" withBorder>
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge size="sm" variant="light" color={segmentColors[client.segment]}>
                    #{idx + 1}
                  </Badge>
                  <div>
                    <Text size="sm" fw={500}>{client.name}</Text>
                    <Text size="xs" c="dimmed">{client.visit_count} визитов</Text>
                  </div>
                </Group>
                <div style={{ textAlign: 'right' }}>
                  <Text size="sm" fw={600} c="green">
                    LTV: {Math.round(client.ltv).toLocaleString('ru-RU')} ₽
                  </Text>
                  {client.churn_risk > 50 && (
                    <Badge size="xs" color="red" variant="light">
                      Риск ухода {client.churn_risk}%
                    </Badge>
                  )}
                </div>
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

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

// ==================== NO-SHOW PREDICTION WIDGET ====================
function NoShowWidget() {
  const { data, loading, error } = useNoShowPrediction({ days_ahead: 7 });

  if (loading) return <Skeleton height={400} />;
  if (error) return <Text c="red" size="sm">Ошибка загрузки прогноза неявок</Text>;
  if (!data) return null;

  const riskColors: Record<string, string> = {
    LOW: 'green',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    CRITICAL: 'red',
  };

  return (
    <Stack gap="md" h="100%">
      {/* Summary */}
      <Group grow>
        <Paper p="sm" radius="md" withBorder bg="red.0" style={{ borderColor: 'var(--mantine-color-red-3)' }}>
          <Stack gap={2} align="center">
            <Text size="xl" fw={700} c="red">{data.summary.high_risk_count + data.summary.critical_risk_count}</Text>
            <Text size="xs" c="dimmed">Высокий риск</Text>
          </Stack>
        </Paper>
        <Paper p="sm" radius="md" withBorder>
          <Stack gap={2} align="center">
            <Text size="xl" fw={700}>{Math.round(data.patterns.overall_no_show_rate)}%</Text>
            <Text size="xs" c="dimmed">Общий % неявок</Text>
          </Stack>
        </Paper>
        <Paper p="sm" radius="md" withBorder bg="orange.0" style={{ borderColor: 'var(--mantine-color-orange-3)' }}>
          <Stack gap={2} align="center">
            <Text size="xl" fw={700} c="orange">{Math.round(data.summary.potential_loss).toLocaleString('ru-RU')} ₽</Text>
            <Text size="xs" c="dimmed">Потери</Text>
          </Stack>
        </Paper>
      </Group>

      {/* Patterns */}
      <Paper p="sm" radius="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed">Худший день</Text>
            <Text size="sm" fw={600}>{data.patterns.worst_day} ({data.patterns.worst_day_rate}%)</Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text size="xs" c="dimmed">Худшее время</Text>
            <Text size="sm" fw={600}>{data.patterns.worst_time} ({data.patterns.worst_time_rate}%)</Text>
          </div>
        </Group>
      </Paper>

      {/* Risky Appointments */}
      <ScrollArea h={200} offsetScrollbars>
        <Stack gap="xs">
          {data.upcoming.slice(0, 5).map((appointment) => (
            <Paper key={appointment.record_id} p="xs" radius="md" withBorder>
              <Group justify="space-between" mb={4}>
                <Group gap="xs">
                  <Badge size="sm" color={riskColors[appointment.risk_level]} variant="filled">
                    {appointment.risk_score}%
                  </Badge>
                  <Text size="sm" fw={500}>{appointment.client_name}</Text>
                </Group>
                <Text size="xs" c="dimmed">{appointment.date} {appointment.time}</Text>
              </Group>
              <Text size="xs" c="dimmed">{appointment.service_name}</Text>
              {appointment.recommendations.length > 0 && (
                <Text size="xs" c="orange" mt={4}>
                  {appointment.recommendations[0]}
                </Text>
              )}
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

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

// ==================== STAFF PERFORMANCE WIDGET ====================
function StaffPerformanceWidget() {
  const [period, setPeriod] = useState<'week' | 'month' | '3months'>('month');
  const { data, loading, error } = useStaffPerformance({ period });

  if (loading) return <Skeleton height={400} />;
  if (error) return <Text c="red" size="sm">Ошибка загрузки данных мастеров</Text>;
  if (!data || data.staff.length === 0) {
    return (
      <Stack align="center" justify="center" h={300} gap="md">
        <ThemeIcon size={60} radius="xl" variant="light" color="gray">
          <IconUsersGroup size={30} />
        </ThemeIcon>
        <Text c="dimmed">Нет данных о мастерах</Text>
      </Stack>
    );
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <IconTrendingUp size={14} color="green" />;
    if (trend === 'down') return <IconTrendingDown size={14} color="red" />;
    return null;
  };

  return (
    <Stack gap="md" h="100%">
      <SegmentedControl
        value={period}
        onChange={(v) => setPeriod(v as typeof period)}
        data={[
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
          { value: '3months', label: '3 месяца' },
        ]}
        fullWidth
        size="xs"
      />

      {/* Summary */}
      <Group grow>
        <Paper p="xs" radius="md" withBorder>
          <Stack gap={2} align="center">
            <Text size="lg" fw={700}>{Math.round(data.summary?.avg_return_rate || 0)}%</Text>
            <Text size="xs" c="dimmed">Возврат</Text>
          </Stack>
        </Paper>
        <Paper p="xs" radius="md" withBorder>
          <Stack gap={2} align="center">
            <Text size="lg" fw={700}>{Math.round(data.summary?.avg_no_show_rate || 0)}%</Text>
            <Text size="xs" c="dimmed">Неявки</Text>
          </Stack>
        </Paper>
        <Paper p="xs" radius="md" withBorder>
          <Stack gap={2} align="center">
            <Text size="lg" fw={700} c="green">
              {Math.round((data.summary?.avg_revenue_per_staff || 0) / 1000)}k ₽
            </Text>
            <Text size="xs" c="dimmed">Ср. выручка</Text>
          </Stack>
        </Paper>
      </Group>

      {/* Leaderboard */}
      <ScrollArea h={220} offsetScrollbars>
        <Stack gap="xs">
          {data.staff.map((staff) => (
            <Paper key={staff.id} p="xs" radius="md" withBorder>
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge size="sm" variant="light" color={staff.rank <= 3 ? 'yellow' : 'gray'}>
                    #{staff.rank}
                  </Badge>
                  <div>
                    <Group gap={4}>
                      <Text size="sm" fw={500}>{staff.name}</Text>
                      {getTrendIcon(staff.trend)}
                    </Group>
                    <Text size="xs" c="dimmed">{staff.specialization || 'Мастер'}</Text>
                  </div>
                </Group>
                <div style={{ textAlign: 'right' }}>
                  <RingProgress
                    size={45}
                    thickness={4}
                    sections={[{ value: staff.scores.overall_score, color: staff.scores.overall_score >= 70 ? 'green' : staff.scores.overall_score >= 50 ? 'yellow' : 'red' }]}
                    label={
                      <Text size="xs" ta="center" fw={700}>
                        {staff.scores.overall_score}
                      </Text>
                    }
                  />
                </div>
              </Group>
              <Group gap="xs" mt="xs">
                <Badge size="xs" variant="light">
                  {Math.round(staff.metrics.revenue / 1000)}k ₽
                </Badge>
                <Badge size="xs" variant="light" color="green">
                  {staff.metrics.return_rate}% возврат
                </Badge>
                <Badge size="xs" variant="light" color={staff.metrics.occupancy_percent >= 70 ? 'green' : 'orange'}>
                  {staff.metrics.occupancy_percent}% загрузка
                </Badge>
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

      {/* New Client Allocation */}
      {data.new_client_allocation.length > 0 && (
        <Paper p="xs" radius="md" bg="teal.0" withBorder style={{ borderColor: 'var(--mantine-color-teal-3)' }}>
          <Text size="xs" fw={500} c="teal.8" mb={4}>Рекомендация: кому давать новых клиентов</Text>
          <Text size="sm">{data.new_client_allocation[0].staff_name}</Text>
          <Text size="xs" c="dimmed">{data.new_client_allocation[0].reason}</Text>
        </Paper>
      )}

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

// ==================== EMPTY SLOTS FORECAST WIDGET ====================
function EmptySlotsWidget() {
  const { data, loading, error } = useEmptySlotsForcast({ days_ahead: 14 });

  if (loading) return <Skeleton height={400} />;
  if (error) return <Text c="red" size="sm">Ошибка загрузки прогноза</Text>;
  if (!data) return null;

  const riskColors: Record<string, string> = {
    HIGH: 'red',
    MEDIUM: 'orange',
    LOW: 'yellow',
    OK: 'green',
  };

  return (
    <Stack gap="md" h="100%">
      {/* Summary */}
      <Group grow>
        <Paper p="sm" radius="md" withBorder bg={data.summary.high_risk_days > 0 ? 'red.0' : 'green.0'}>
          <Stack gap={2} align="center">
            <Text size="xl" fw={700} c={data.summary.high_risk_days > 0 ? 'red' : 'green'}>
              {data.summary.high_risk_days}
            </Text>
            <Text size="xs" c="dimmed">Дней с риском</Text>
          </Stack>
        </Paper>
        <Paper p="sm" radius="md" withBorder>
          <Stack gap={2} align="center">
            <Text size="xl" fw={700}>{data.summary.avg_occupancy}%</Text>
            <Text size="xs" c="dimmed">Ср. загрузка</Text>
          </Stack>
        </Paper>
        <Paper p="sm" radius="md" withBorder>
          <Stack gap={2} align="center">
            <Text size="xl" fw={700} c="orange">{data.summary.total_empty_hours}ч</Text>
            <Text size="xs" c="dimmed">Пустых часов</Text>
          </Stack>
        </Paper>
      </Group>

      {/* Worst Day */}
      {data.summary.worst_day && (
        <Paper p="sm" radius="md" bg="orange.0" withBorder style={{ borderColor: 'var(--mantine-color-orange-3)' }}>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="orange.8">Самый пустой день</Text>
              <Text size="sm" fw={600}>{data.summary.worst_day.day_name} ({data.summary.worst_day.date})</Text>
            </div>
            <Badge size="lg" color="orange">{data.summary.worst_day.occupancy}%</Badge>
          </Group>
        </Paper>
      )}

      {/* Calendar Heatmap */}
      <ScrollArea h={200} offsetScrollbars>
        <Stack gap="xs">
          {data.forecast.filter(d => !d.is_past).slice(0, 10).map((day) => (
            <Paper key={day.date} p="xs" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Badge size="sm" color={riskColors[day.risk_level]} variant="filled">
                    {day.risk_level}
                  </Badge>
                  <Text size="sm" fw={day.is_today ? 700 : 400}>
                    {day.day_name} {day.date.slice(5)}
                  </Text>
                </Group>
                <Text size="sm" fw={500}>{day.occupancy_percent}%</Text>
              </Group>
              <Progress
                value={day.occupancy_percent}
                color={riskColors[day.risk_level]}
                size="sm"
                radius="xl"
              />
              {day.recommendations.length > 0 && (
                <Text size="xs" c="dimmed" mt={4}>
                  {day.recommendations[0]}
                </Text>
              )}
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

      {/* Insights */}
      {data.insights.filter(Boolean).length > 0 && (
        <Paper p="xs" radius="md" withBorder>
          {data.insights.filter(Boolean).slice(0, 2).map((insight, idx) => (
            <Text key={idx} size="xs" c="dimmed">{insight}</Text>
          ))}
        </Paper>
      )}

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

// ==================== TRAFFIC SOURCES WIDGET ====================
function TrafficSourcesWidget() {
  const [period, setPeriod] = useState<'week' | 'month' | '3months'>('month');
  const { data, loading, error } = useTrafficSources({ period });

  if (loading) return <Skeleton height={400} />;
  if (error) return <Text c="red" size="sm">Ошибка загрузки источников</Text>;
  if (!data || data.sources.length === 0) {
    return (
      <Stack align="center" justify="center" h={300} gap="md">
        <ThemeIcon size={60} radius="xl" variant="light" color="gray">
          <IconChartPie size={30} />
        </ThemeIcon>
        <Text c="dimmed">Нет данных об источниках</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md" h="100%">
      <SegmentedControl
        value={period}
        onChange={(v) => setPeriod(v as typeof period)}
        data={[
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
          { value: '3months', label: '3 месяца' },
        ]}
        fullWidth
        size="xs"
      />

      {/* Summary */}
      <Group grow>
        <Paper p="sm" radius="md" withBorder>
          <Stack gap={2} align="center">
            <Text size="xl" fw={700}>{data.totals.total_records}</Text>
            <Text size="xs" c="dimmed">Всего записей</Text>
          </Stack>
        </Paper>
        <Paper p="sm" radius="md" withBorder bg={data.totals.online_percentage >= 30 ? 'green.0' : 'orange.0'}>
          <Stack gap={2} align="center">
            <Text size="xl" fw={700} c={data.totals.online_percentage >= 30 ? 'green' : 'orange'}>
              {data.totals.online_percentage}%
            </Text>
            <Text size="xs" c="dimmed">Онлайн</Text>
          </Stack>
        </Paper>
        <Paper p="sm" radius="md" withBorder>
          <Stack gap={2} align="center">
            <Text size="xl" fw={700} c="green">
              {Math.round(data.totals.total_revenue / 1000)}k ₽
            </Text>
            <Text size="xs" c="dimmed">Выручка</Text>
          </Stack>
        </Paper>
      </Group>

      {/* Pie Chart (simplified as progress bars) */}
      <ScrollArea h={180} offsetScrollbars>
        <Stack gap="xs">
          {data.sources.map((source) => (
            <Paper key={source.source} p="xs" radius="md" withBorder>
              <Group justify="space-between" mb={4}>
                <Text size="sm" fw={500}>{source.source_name}</Text>
                <Group gap="xs">
                  <Badge size="sm" variant="light">{source.records_count}</Badge>
                  <Badge size="sm" variant="filled" color="blue">{source.percentage}%</Badge>
                </Group>
              </Group>
              <Progress
                value={source.percentage}
                size="md"
                radius="xl"
                color={source.source === 'online_widget' ? 'green' : source.source === 'admin' ? 'blue' : 'orange'}
              />
              <Group justify="space-between" mt={4}>
                <Text size="xs" c="dimmed">{source.unique_clients} клиентов</Text>
                <Text size="xs" c="green">{source.revenue.toLocaleString('ru-RU')} ₽</Text>
              </Group>
              {source.conversion_note && (
                <Text size="xs" c="orange" mt={2}>{source.conversion_note}</Text>
              )}
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

      {/* Insights */}
      {data.insights.length > 0 && (
        <Paper p="xs" radius="md" withBorder>
          {data.insights.slice(0, 2).map((insight, idx) => (
            <Text key={idx} size="xs">{insight}</Text>
          ))}
        </Paper>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Paper p="xs" radius="md" bg="blue.0" withBorder style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
          <Text size="xs" fw={500} c="blue.8" mb={4}>Рекомендации</Text>
          {data.recommendations.slice(0, 2).map((rec, idx) => (
            <Text key={idx} size="xs" c="dimmed">{rec}</Text>
          ))}
        </Paper>
      )}
    </Stack>
  );
}

// ==================== MAIN PAGE ====================
function Page() {
  return (
    <>
      <title>Аналитика | Beauty Slot</title>
      <meta name="description" content="Аналитика салона красоты Beauty Slot" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Аналитика"
            breadcrumbItems={breadcrumbItems}
          />

          <Grid gutter="lg">
            {/* Smart Segments */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Group gap="xs" mb="md">
                  <ThemeIcon size="md" radius="md" variant="gradient" gradient={{ from: 'grape', to: 'violet' }}>
                    <IconUsers size={18} />
                  </ThemeIcon>
                  <Title order={4}>Умные сегменты</Title>
                </Group>
                <SmartSegmentsWidget />
              </Surface>
            </Grid.Col>

            {/* LTV Analysis */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Group gap="xs" mb="md">
                  <ThemeIcon size="md" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'indigo' }}>
                    <IconDiamond size={18} />
                  </ThemeIcon>
                  <Title order={4}>LTV клиентов</Title>
                </Group>
                <LTVWidget />
              </Surface>
            </Grid.Col>

            {/* No-Show Prediction */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Group gap="xs" mb="md">
                  <ThemeIcon size="md" radius="md" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                    <IconAlertTriangle size={18} />
                  </ThemeIcon>
                  <Title order={4}>Прогноз неявок</Title>
                </Group>
                <NoShowWidget />
              </Surface>
            </Grid.Col>

            {/* Staff Performance */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Group gap="xs" mb="md">
                  <ThemeIcon size="md" radius="md" variant="gradient" gradient={{ from: 'teal', to: 'cyan' }}>
                    <IconUsersGroup size={18} />
                  </ThemeIcon>
                  <Title order={4}>Эффективность мастеров</Title>
                </Group>
                <StaffPerformanceWidget />
              </Surface>
            </Grid.Col>

            {/* Empty Slots Forecast */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Group gap="xs" mb="md">
                  <ThemeIcon size="md" radius="md" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
                    <IconCalendarEvent size={18} />
                  </ThemeIcon>
                  <Title order={4}>Прогноз пустых окон</Title>
                </Group>
                <EmptySlotsWidget />
              </Surface>
            </Grid.Col>

            {/* Traffic Sources */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Group gap="xs" mb="md">
                  <ThemeIcon size="md" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    <IconChartPie size={18} />
                  </ThemeIcon>
                  <Title order={4}>Источники записей</Title>
                </Group>
                <TrafficSourcesWidget />
              </Surface>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}

export default Page;
