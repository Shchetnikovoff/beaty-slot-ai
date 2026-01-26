'use client';

import { useState } from 'react';

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
  Select,
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
  IconChartBar,
  IconTarget,
  IconCoin,
} from '@tabler/icons-react';

import { PageHeader, Surface } from '@/components';
import { useClients } from '@/lib/hooks/useBeautySlot';
import { PATH_DASHBOARD } from '@/routes';

const breadcrumbItems = [
  { title: 'Главная', href: PATH_DASHBOARD.default },
  { title: 'Привлечение', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

type Period = 'week' | 'month' | 'quarter' | 'year';

// Моковые данные источников привлечения
const ACQUISITION_SOURCES = [
  {
    id: 'telegram',
    name: 'Telegram бот',
    icon: IconBrandTelegram,
    color: 'blue',
    clients: 145,
    conversionRate: 68,
    avgCost: 0,
    trend: 12,
  },
  {
    id: 'website',
    name: 'Сайт салона',
    icon: IconWorld,
    color: 'green',
    clients: 78,
    conversionRate: 42,
    avgCost: 150,
    trend: 8,
  },
  {
    id: 'phone',
    name: 'Телефон',
    icon: IconPhone,
    color: 'orange',
    clients: 56,
    conversionRate: 85,
    avgCost: 0,
    trend: -3,
  },
  {
    id: 'referral',
    name: 'Рекомендации',
    icon: IconUsers,
    color: 'grape',
    clients: 34,
    conversionRate: 92,
    avgCost: 0,
    trend: 15,
  },
];

// Моковые данные по месяцам
const MONTHLY_DATA = [
  { month: 'Авг', telegram: 28, website: 15, phone: 12, referral: 6 },
  { month: 'Сен', telegram: 32, website: 18, phone: 10, referral: 8 },
  { month: 'Окт', telegram: 38, website: 22, phone: 14, referral: 9 },
  { month: 'Ноя', telegram: 42, website: 20, phone: 11, referral: 7 },
  { month: 'Дек', telegram: 35, website: 16, phone: 8, referral: 5 },
  { month: 'Янв', telegram: 45, website: 25, phone: 15, referral: 10 },
];

function SummaryCards({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={120} />
        ))}
      </SimpleGrid>
    );
  }

  const totalClients = ACQUISITION_SOURCES.reduce((sum, s) => sum + s.clients, 0);
  const avgConversion = Math.round(
    ACQUISITION_SOURCES.reduce((sum, s) => sum + s.conversionRate, 0) / ACQUISITION_SOURCES.length
  );
  const totalCost = ACQUISITION_SOURCES.reduce((sum, s) => sum + s.avgCost * s.clients, 0);
  const costPerClient = totalClients > 0 ? Math.round(totalCost / totalClients) : 0;

  const cards = [
    {
      title: 'Новых клиентов',
      value: totalClients,
      icon: IconUserPlus,
      color: 'blue',
      trend: 18,
      period: 'vs прошлый месяц',
    },
    {
      title: 'Конверсия',
      value: `${avgConversion}%`,
      icon: IconTarget,
      color: 'green',
      trend: 5,
      period: 'vs прошлый месяц',
    },
    {
      title: 'Стоимость привлечения',
      value: `${costPerClient} ₽`,
      icon: IconCoin,
      color: 'orange',
      trend: -12,
      period: 'vs прошлый месяц',
    },
    {
      title: 'Лучший источник',
      value: 'Telegram',
      icon: IconTrendingUp,
      color: 'grape',
      subtext: '46% от всех',
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
              {card.trend !== undefined && (
                <Group gap={4} mt="xs">
                  {card.trend >= 0 ? (
                    <IconArrowUpRight size={14} color="green" />
                  ) : (
                    <IconArrowDownRight size={14} color="red" />
                  )}
                  <Text size="xs" c={card.trend >= 0 ? 'green' : 'red'}>
                    {card.trend >= 0 ? '+' : ''}{card.trend}%
                  </Text>
                  <Text size="xs" c="dimmed">{card.period}</Text>
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

function SourcesBreakdown() {
  const total = ACQUISITION_SOURCES.reduce((sum, s) => sum + s.clients, 0);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={4}>Источники привлечения</Title>
        <Badge variant="light" size="lg">
          Всего: {total} клиентов
        </Badge>
      </Group>

      <Stack gap="md">
        {ACQUISITION_SOURCES.map((source) => {
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

function ConversionFunnel() {
  const funnelData = [
    { stage: 'Посетили сайт/бота', count: 1250, color: 'blue' },
    { stage: 'Начали запись', count: 580, color: 'cyan' },
    { stage: 'Завершили запись', count: 420, color: 'teal' },
    { stage: 'Пришли на визит', count: 380, color: 'green' },
    { stage: 'Стали постоянными', count: 145, color: 'lime' },
  ];

  const maxCount = funnelData[0].count;

  return (
    <Stack gap="lg">
      <Title order={4}>Воронка привлечения</Title>
      <Stack gap="sm">
        {funnelData.map((item, index) => {
          const width = Math.max((item.count / maxCount) * 100, 20);
          const conversionFromPrev = index > 0
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
        Общая конверсия: {Math.round((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100)}%
      </Text>
    </Stack>
  );
}

function MonthlyTrends() {
  const [selectedSource, setSelectedSource] = useState<string | null>('all');

  const sources = [
    { value: 'all', label: 'Все источники' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'website', label: 'Сайт' },
    { value: 'phone', label: 'Телефон' },
    { value: 'referral', label: 'Рекомендации' },
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={4}>Динамика по месяцам</Title>
        <Select
          value={selectedSource}
          onChange={setSelectedSource}
          data={sources}
          size="sm"
          w={180}
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Месяц</Table.Th>
            <Table.Th ta="center">Telegram</Table.Th>
            <Table.Th ta="center">Сайт</Table.Th>
            <Table.Th ta="center">Телефон</Table.Th>
            <Table.Th ta="center">Рекомендации</Table.Th>
            <Table.Th ta="right">Всего</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {MONTHLY_DATA.map((row) => {
            const total = row.telegram + row.website + row.phone + row.referral;
            return (
              <Table.Tr key={row.month}>
                <Table.Td fw={500}>{row.month}</Table.Td>
                <Table.Td ta="center">
                  <Badge color="blue" variant="light">{row.telegram}</Badge>
                </Table.Td>
                <Table.Td ta="center">
                  <Badge color="green" variant="light">{row.website}</Badge>
                </Table.Td>
                <Table.Td ta="center">
                  <Badge color="orange" variant="light">{row.phone}</Badge>
                </Table.Td>
                <Table.Td ta="center">
                  <Badge color="grape" variant="light">{row.referral}</Badge>
                </Table.Td>
                <Table.Td ta="right" fw={600}>{total}</Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}

function RecentClients({ clients, loading }: { clients: any[]; loading: boolean }) {
  if (loading) {
    return <Skeleton height={300} />;
  }

  // Последние 10 клиентов
  const recentClients = clients.slice(0, 10);

  // Моковый источник для каждого клиента
  const sourcesMap = ['telegram', 'website', 'phone', 'referral'];
  const sourceLabels: Record<string, { label: string; color: string }> = {
    telegram: { label: 'Telegram', color: 'blue' },
    website: { label: 'Сайт', color: 'green' },
    phone: { label: 'Телефон', color: 'orange' },
    referral: { label: 'Рекомендация', color: 'grape' },
  };

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
            <Table.Th>Статус</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {recentClients.map((client, index) => {
            const sourceKey = sourcesMap[index % sourcesMap.length];
            const source = sourceLabels[sourceKey];
            return (
              <Table.Tr key={client.id}>
                <Table.Td fw={500}>{client.name}</Table.Td>
                <Table.Td c="dimmed">{client.phone}</Table.Td>
                <Table.Td>
                  <Badge color={source.color} variant="light" size="sm">
                    {source.label}
                  </Badge>
                </Table.Td>
                <Table.Td c="dimmed">
                  {new Date(client.created_at).toLocaleDateString('ru-RU')}
                </Table.Td>
                <Table.Td>
                  {client.has_active_subscription ? (
                    <Badge color="green" variant="light" size="sm">С подпиской</Badge>
                  ) : (
                    <Badge color="gray" variant="light" size="sm">Новый</Badge>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}

function SourceEfficiency() {
  return (
    <Stack gap="lg" h="100%">
      <Title order={4}>Эффективность каналов</Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} style={{ flex: 1 }}>
        {ACQUISITION_SOURCES.map((source) => (
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
  const { data: clientsData, loading } = useClients({ limit: 50 });

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

          <SummaryCards loading={loading} />

          <Grid gutter="lg" align="stretch">
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Surface p="lg" h="100%">
                <SourcesBreakdown />
              </Surface>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Surface p="lg" h="100%">
                <SourceEfficiency />
              </Surface>
            </Grid.Col>
          </Grid>

          <Surface p="lg">
            <ConversionFunnel />
          </Surface>

          <Surface p="lg">
            <MonthlyTrends />
          </Surface>

          <Surface p="lg">
            <RecentClients clients={clientsData?.items || []} loading={loading} />
          </Surface>
        </Stack>
      </Container>
    </>
  );
}

export default AcquisitionPage;
