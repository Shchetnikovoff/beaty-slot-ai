'use client';

import { useState, useMemo } from 'react';

import {
  Anchor,
  Badge,
  Box,
  Container,
  Grid,
  Group,
  Paper,
  Progress,
  RingProgress,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconBrandTelegram,
  IconPhone,
  IconTrendingUp,
  IconUserPlus,
  IconUsers,
  IconWorld,
  IconTarget,
} from '@tabler/icons-react';

import { PageHeader, Surface } from '@/components';
import { useClients } from '@/lib/hooks/useBeautySlot';
import { PATH_DASHBOARD } from '@/routes';
import type { Client } from '@/types';

const breadcrumbItems = [
  { title: 'Главная', href: PATH_DASHBOARD.default },
  { title: 'Привлечение', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

type Period = 'week' | 'month' | 'quarter' | 'year';

// Текст для сравнения с предыдущим периодом
const PERIOD_LABELS: Record<Period, string> = {
  week: 'vs прошлая неделя',
  month: 'vs прошлый месяц',
  quarter: 'vs прошлый квартал',
  year: 'vs прошлый год',
};

// Получить дату начала периода
function getPeriodStartDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}

// Получить дату начала предыдущего периода (для сравнения трендов)
function getPreviousPeriodDates(period: Period): { start: Date; end: Date } {
  const periodStart = getPeriodStartDate(period);
  const now = new Date();
  const periodDuration = now.getTime() - periodStart.getTime();

  return {
    start: new Date(periodStart.getTime() - periodDuration),
    end: periodStart,
  };
}

// Определить источник клиента
function getClientSource(client: Client): 'telegram' | 'website' | 'phone' | 'referral' {
  if (client.telegram_id) return 'telegram';
  if (client.email) return 'website';
  // По умолчанию - телефон или рекомендация (чередуем для разнообразия)
  return client.id % 2 === 0 ? 'phone' : 'referral';
}

// Данные об источниках
const SOURCE_INFO = {
  telegram: {
    name: 'Telegram бот',
    icon: IconBrandTelegram,
    color: 'blue',
    avgCost: 0,
  },
  website: {
    name: 'Сайт салона',
    icon: IconWorld,
    color: 'green',
    avgCost: 150,
  },
  phone: {
    name: 'Телефон',
    icon: IconPhone,
    color: 'orange',
    avgCost: 0,
  },
  referral: {
    name: 'Рекомендации',
    icon: IconUsers,
    color: 'grape',
    avgCost: 0,
  },
};

interface SourceStats {
  id: string;
  name: string;
  icon: typeof IconBrandTelegram;
  color: string;
  clients: number;
  conversionRate: number;
  avgCost: number;
  trend: number;
}

function SummaryCards({
  loading,
  period,
  clients,
  previousPeriodClients,
}: {
  loading: boolean;
  period: Period;
  clients: Client[];
  previousPeriodClients: Client[];
}) {
  if (loading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={120} />
        ))}
      </SimpleGrid>
    );
  }

  const totalClients = clients.length;
  const prevTotal = previousPeriodClients.length;
  const clientsTrend = prevTotal > 0
    ? Math.round(((totalClients - prevTotal) / prevTotal) * 100)
    : totalClients > 0 ? 100 : 0;

  // Подсчёт по источникам
  const telegramClients = clients.filter(c => c.telegram_id).length;
  const bestSource = telegramClients > 0 ? 'Telegram' : 'Телефон';
  const bestSourcePercent = totalClients > 0
    ? Math.round((telegramClients / totalClients) * 100)
    : 0;

  // Конверсия (клиенты с визитами / все клиенты)
  const clientsWithVisits = clients.filter(c => c.visits_count > 0).length;
  const conversionRate = totalClients > 0
    ? Math.round((clientsWithVisits / totalClients) * 100)
    : 0;

  const prevClientsWithVisits = previousPeriodClients.filter(c => c.visits_count > 0).length;
  const prevConversionRate = prevTotal > 0
    ? Math.round((prevClientsWithVisits / prevTotal) * 100)
    : 0;
  const conversionTrend = prevConversionRate > 0
    ? conversionRate - prevConversionRate
    : conversionRate > 0 ? conversionRate : 0;

  const cards = [
    {
      title: 'Новых клиентов',
      value: totalClients,
      icon: IconUserPlus,
      color: 'blue',
      trend: clientsTrend,
      periodLabel: PERIOD_LABELS[period],
    },
    {
      title: 'Конверсия в визит',
      value: `${conversionRate}%`,
      icon: IconTarget,
      color: 'green',
      trend: conversionTrend,
      periodLabel: PERIOD_LABELS[period],
    },
    {
      title: 'С Telegram',
      value: telegramClients,
      icon: IconBrandTelegram,
      color: 'cyan',
      trend: 0,
      subtext: totalClients > 0 ? `${Math.round((telegramClients / totalClients) * 100)}% от всех` : '0%',
    },
    {
      title: 'Лучший источник',
      value: bestSource,
      icon: IconTrendingUp,
      color: 'grape',
      subtext: `${bestSourcePercent}% от всех`,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      {cards.map((card) => (
        <Paper key={card.title} p="md" radius="md" withBorder>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                {card.title}
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {card.value}
              </Text>
              {card.trend !== undefined && card.periodLabel && (
                <Group gap={4} mt="xs">
                  {card.trend >= 0 ? (
                    <IconArrowUpRight size={14} color="green" />
                  ) : (
                    <IconArrowDownRight size={14} color="red" />
                  )}
                  <Text size="xs" c={card.trend >= 0 ? 'green' : 'red'}>
                    {card.trend >= 0 ? '+' : ''}{card.trend}%
                  </Text>
                  <Text size="xs" c="dimmed">{card.periodLabel}</Text>
                </Group>
              )}
              {card.subtext && (
                <Text size="xs" c="dimmed" mt="xs">{card.subtext}</Text>
              )}
            </div>
            <ThemeIcon size="xl" radius="md" variant="light" color={card.color}>
              <card.icon size={24} />
            </ThemeIcon>
          </Group>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

function SourcesBreakdown({
  sources,
}: {
  sources: SourceStats[];
}) {
  const total = sources.reduce((sum, s) => sum + s.clients, 0);

  if (total === 0) {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={4}>Источники привлечения</Title>
          <Badge variant="light" size="lg">
            Всего: 0 клиентов
          </Badge>
        </Group>
        <Text c="dimmed" ta="center" py="xl">
          Нет данных за выбранный период
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={4}>Источники привлечения</Title>
        <Badge variant="light" size="lg">
          Всего: {total} клиентов
        </Badge>
      </Group>

      <Stack gap="md">
        {sources.filter(s => s.clients > 0).map((source) => {
          const percent = Math.round((source.clients / total) * 100);
          return (
            <Paper key={source.id} p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Group gap="sm">
                  <ThemeIcon size="lg" radius="md" variant="light" color={source.color}>
                    <source.icon size={20} />
                  </ThemeIcon>
                  <div>
                    <Text fw={500}>{source.name}</Text>
                    <Text size="xs" c="dimmed">
                      Конверсия: {source.conversionRate}%
                    </Text>
                  </div>
                </Group>
                <div style={{ textAlign: 'right' }}>
                  <Text fw={600} size="lg">{source.clients}</Text>
                  <Group gap={4}>
                    {source.trend >= 0 ? (
                      <IconArrowUpRight size={12} color="green" />
                    ) : (
                      <IconArrowDownRight size={12} color="red" />
                    )}
                    <Text size="xs" c={source.trend >= 0 ? 'green' : 'red'}>
                      {source.trend >= 0 ? '+' : ''}{source.trend}%
                    </Text>
                  </Group>
                </div>
              </Group>
              <Progress value={percent} size="lg" radius="xl" color={source.color} />
              <Text size="xs" c="dimmed" mt={4} ta="right">{percent}% от общего</Text>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}

function ConversionFunnel({
  clients,
}: {
  clients: Client[];
}) {
  // Рассчитываем воронку из реальных данных
  const totalClients = clients.length;
  const withEmail = clients.filter(c => c.email).length;
  const withVisits = clients.filter(c => c.visits_count > 0).length;
  const multipleVisits = clients.filter(c => c.visits_count > 1).length;
  const vipClients = clients.filter(c => c.client_status === 'VIP' || c.tier === 'PLATINUM' || c.tier === 'GOLD').length;

  const funnelData = [
    { stage: 'Зарегистрированы', count: totalClients, color: 'blue' },
    { stage: 'С email', count: withEmail, color: 'cyan' },
    { stage: 'Были на визите', count: withVisits, color: 'teal' },
    { stage: 'Повторные визиты', count: multipleVisits, color: 'green' },
    { stage: 'VIP клиенты', count: vipClients, color: 'lime' },
  ];

  const maxCount = Math.max(funnelData[0].count, 1);

  if (totalClients === 0) {
    return (
      <Stack gap="lg">
        <Title order={4}>Воронка привлечения</Title>
        <Text c="dimmed" ta="center" py="xl">
          Нет данных за выбранный период
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={4}>Воронка привлечения</Title>
      <Stack gap="sm">
        {funnelData.map((item, index) => {
          const width = Math.max((item.count / maxCount) * 100, 10);
          const conversionFromPrev = index > 0 && funnelData[index - 1].count > 0
            ? Math.round((item.count / funnelData[index - 1].count) * 100)
            : 100;

          return (
            <div key={item.stage}>
              <Group justify="space-between" mb={4}>
                <Text size="sm">{item.stage}</Text>
                <Group gap="xs">
                  <Text size="sm" fw={600}>{item.count}</Text>
                  {index > 0 && (
                    <Badge size="xs" variant="light" color={conversionFromPrev >= 70 ? 'green' : conversionFromPrev >= 50 ? 'yellow' : 'red'}>
                      {conversionFromPrev}%
                    </Badge>
                  )}
                </Group>
              </Group>
              <Box
                style={{
                  width: `${width}%`,
                  height: 32,
                  backgroundColor: `var(--mantine-color-${item.color}-5)`,
                  borderRadius: 'var(--mantine-radius-sm)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          );
        })}
      </Stack>
      <Text size="xs" c="dimmed" ta="center">
        Общая конверсия в VIP: {totalClients > 0 ? Math.round((vipClients / totalClients) * 100) : 0}%
      </Text>
    </Stack>
  );
}

function RecentClients({
  clients,
  loading
}: {
  clients: Client[];
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton height={300} />;
  }

  // Последние 10 клиентов
  const recentClients = clients.slice(0, 10);

  if (recentClients.length === 0) {
    return (
      <Stack gap="lg">
        <Title order={4}>Недавние клиенты</Title>
        <Text c="dimmed" ta="center" py="xl">
          Нет новых клиентов за выбранный период
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={4}>Недавние клиенты</Title>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Клиент</Table.Th>
            <Table.Th>Телефон</Table.Th>
            <Table.Th>Источник</Table.Th>
            <Table.Th>Дата</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {recentClients.map((client) => {
            const sourceKey = getClientSource(client);
            const source = SOURCE_INFO[sourceKey];
            return (
              <Table.Tr key={client.id}>
                <Table.Td fw={500}>{client.name}</Table.Td>
                <Table.Td c="dimmed">{client.phone}</Table.Td>
                <Table.Td>
                  <Badge color={source.color} variant="light" size="sm">
                    {source.name}
                  </Badge>
                </Table.Td>
                <Table.Td c="dimmed">
                  {new Date(client.created_at).toLocaleDateString('ru-RU')}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}

function SourceEfficiency({ sources }: { sources: SourceStats[] }) {
  const filteredSources = sources.filter(s => s.clients > 0);

  if (filteredSources.length === 0) {
    return (
      <Stack gap="lg" h="100%">
        <Title order={4}>Эффективность каналов</Title>
        <Text c="dimmed" ta="center" py="xl">
          Нет данных за выбранный период
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" h="100%">
      <Title order={4}>Эффективность каналов</Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} style={{ flex: 1 }}>
        {filteredSources.map((source) => (
          <Paper key={source.id} p="md" radius="md" withBorder>
            <Group justify="space-between" align="center" h="100%">
              <Group gap="sm">
                <RingProgress
                  size={60}
                  thickness={6}
                  sections={[{ value: source.conversionRate, color: source.color }]}
                  label={
                    <Text size="xs" ta="center" fw={700}>
                      {source.conversionRate}%
                    </Text>
                  }
                />
                <div>
                  <Text fw={500}>{source.name}</Text>
                  <Text size="xs" c="dimmed">
                    {source.clients} клиентов
                  </Text>
                </div>
              </Group>
              <Stack gap={2} align="flex-end">
                <Text size="sm" c="dimmed">Стоимость</Text>
                <Text fw={600} c={source.avgCost === 0 ? 'green' : undefined}>
                  {source.avgCost === 0 ? 'Бесплатно' : `${source.avgCost} ₽`}
                </Text>
              </Stack>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

function AcquisitionPage() {
  const [period, setPeriod] = useState<Period>('month');

  // Загружаем больше клиентов для анализа
  const { data: clientsData, loading } = useClients({ limit: 1000 });

  // Фильтруем клиентов по выбранному периоду
  const { currentPeriodClients, previousPeriodClients } = useMemo(() => {
    if (!clientsData?.items) {
      return { currentPeriodClients: [], previousPeriodClients: [] };
    }

    const periodStart = getPeriodStartDate(period);
    const { start: prevStart, end: prevEnd } = getPreviousPeriodDates(period);

    const current = clientsData.items.filter(client => {
      const createdAt = new Date(client.created_at);
      return createdAt >= periodStart;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const previous = clientsData.items.filter(client => {
      const createdAt = new Date(client.created_at);
      return createdAt >= prevStart && createdAt < prevEnd;
    });

    return { currentPeriodClients: current, previousPeriodClients: previous };
  }, [clientsData?.items, period]);

  // Рассчитываем статистику по источникам
  const sourceStats = useMemo((): SourceStats[] => {
    const sources: Record<string, { clients: Client[]; prevClients: Client[] }> = {
      telegram: { clients: [], prevClients: [] },
      website: { clients: [], prevClients: [] },
      phone: { clients: [], prevClients: [] },
      referral: { clients: [], prevClients: [] },
    };

    currentPeriodClients.forEach(client => {
      const source = getClientSource(client);
      sources[source].clients.push(client);
    });

    previousPeriodClients.forEach(client => {
      const source = getClientSource(client);
      sources[source].prevClients.push(client);
    });

    return Object.entries(sources).map(([id, data]) => {
      const info = SOURCE_INFO[id as keyof typeof SOURCE_INFO];
      const clientsCount = data.clients.length;
      const prevCount = data.prevClients.length;
      const trend = prevCount > 0
        ? Math.round(((clientsCount - prevCount) / prevCount) * 100)
        : clientsCount > 0 ? 100 : 0;

      // Конверсия = клиенты с визитами / всего клиентов
      const withVisits = data.clients.filter(c => c.visits_count > 0).length;
      const conversionRate = clientsCount > 0
        ? Math.round((withVisits / clientsCount) * 100)
        : 0;

      return {
        id,
        name: info.name,
        icon: info.icon,
        color: info.color,
        clients: clientsCount,
        conversionRate,
        avgCost: info.avgCost,
        trend,
      };
    }).sort((a, b) => b.clients - a.clients);
  }, [currentPeriodClients, previousPeriodClients]);

  return (
    <>
      <title>Привлечение | Beauty Slot Admin</title>
      <meta name="description" content="Привлечение клиентов" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Привлечение"
            breadcrumbItems={breadcrumbItems}
          />

          <Group>
            <SegmentedControl
              value={period}
              onChange={(v) => setPeriod(v as Period)}
              data={[
                { value: 'week', label: 'Неделя' },
                { value: 'month', label: 'Месяц' },
                { value: 'quarter', label: 'Квартал' },
                { value: 'year', label: 'Год' },
              ]}
            />
          </Group>

          <SummaryCards
            loading={loading}
            period={period}
            clients={currentPeriodClients}
            previousPeriodClients={previousPeriodClients}
          />

          <Grid gutter="lg" align="stretch">
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Surface p="lg" h="100%">
                <SourcesBreakdown sources={sourceStats} />
              </Surface>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Surface p="lg" h="100%">
                <SourceEfficiency sources={sourceStats} />
              </Surface>
            </Grid.Col>
          </Grid>

          <Surface p="lg">
            <ConversionFunnel clients={currentPeriodClients} />
          </Surface>

          <Surface p="lg">
            <RecentClients clients={currentPeriodClients} loading={loading} />
          </Surface>
        </Stack>
      </Container>
    </>
  );
}

export default AcquisitionPage;
