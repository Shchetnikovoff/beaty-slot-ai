'use client';

import { useState } from 'react';

import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Paper,
  RingProgress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconArrowUpRight,
  IconBuilding,
  IconChartBar,
  IconCoin,
  IconRefresh,
  IconUsers,
  IconCreditCard,
  IconTrendingUp,
} from '@tabler/icons-react';

import { PageHeader, Surface } from '@/components';
import { PATH_DASHBOARD } from '@/routes';
import type { SuperadminStats } from '@/types';

// Mock data - in real app would use useSuperadminStats hook
const mockStats: SuperadminStats = {
  total_salons: 45,
  active_salons: 38,
  trial_salons: 5,
  total_clients: 12500,
  total_subscriptions: 3200,
  total_revenue: 4850000,
  revenue_this_month: 520000,
  new_salons_this_month: 3,
};

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Superadmin', href: '#' },
  { title: 'Статистика', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
  trend?: number;
}

function StatCard({ title, value, icon, color, description, trend }: StatCardProps) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
        </div>
        <Box
          style={{
            backgroundColor: `var(--mantine-color-${color}-light)`,
            borderRadius: '50%',
            padding: 8,
          }}
        >
          {icon}
        </Box>
      </Group>
      {trend !== undefined && (
        <Group gap="xs" mt="sm">
          <IconArrowUpRight
            size={16}
            color={trend >= 0 ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-red-6)'}
            style={{ transform: trend < 0 ? 'rotate(180deg)' : undefined }}
          />
          <Text size="sm" c={trend >= 0 ? 'green' : 'red'}>
            {Math.abs(trend)}%
          </Text>
          <Text size="xs" c="dimmed">
            vs прошлый месяц
          </Text>
        </Group>
      )}
    </Paper>
  );
}

function SalonDistribution({ stats }: { stats: SuperadminStats }) {
  const suspendedSalons = stats.total_salons - stats.active_salons - stats.trial_salons;

  const data = [
    { label: 'Активные', value: stats.active_salons, color: 'green' },
    { label: 'Триал', value: stats.trial_salons, color: 'blue' },
    { label: 'Приостановлены', value: suspendedSalons, color: 'red' },
  ];

  const total = stats.total_salons;

  return (
    <Paper p="md" radius="md" withBorder>
      <Text fw={600} mb="md">
        Распределение салонов
      </Text>
      <Group>
        <RingProgress
          size={150}
          thickness={16}
          roundCaps
          sections={data.map((item) => ({
            value: (item.value / total) * 100,
            color: item.color,
          }))}
        />
        <Stack gap="xs">
          {data.map((item) => (
            <Group key={item.label} gap="xs">
              <Box
                w={12}
                h={12}
                style={{
                  backgroundColor: `var(--mantine-color-${item.color}-6)`,
                  borderRadius: 2,
                }}
              />
              <Text size="sm">
                {item.label}: <strong>{item.value}</strong> ({Math.round((item.value / total) * 100)}%)
              </Text>
            </Group>
          ))}
        </Stack>
      </Group>
    </Paper>
  );
}

function RevenueOverview({ stats }: { stats: SuperadminStats }) {
  const monthlyGoal = 600000;
  const progress = Math.round((stats.revenue_this_month / monthlyGoal) * 100);

  return (
    <Paper p="md" radius="md" withBorder>
      <Text fw={600} mb="md">
        Выручка за месяц
      </Text>
      <Group justify="space-between" mb="xs">
        <Text size="xl" fw={700}>
          {stats.revenue_this_month.toLocaleString('ru-RU')} ₽
        </Text>
        <Text size="sm" c="dimmed">
          Цель: {monthlyGoal.toLocaleString('ru-RU')} ₽
        </Text>
      </Group>
      <Box
        h={8}
        style={{
          backgroundColor: 'var(--mantine-color-gray-2)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Box
          h="100%"
          w={`${Math.min(progress, 100)}%`}
          style={{
            backgroundColor: progress >= 100 ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-blue-6)',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </Box>
      <Text size="xs" c="dimmed" mt="xs">
        {progress}% от месячной цели
      </Text>
    </Paper>
  );
}

function TopMetrics({ stats }: { stats: SuperadminStats }) {
  const avgClientsPerSalon = Math.round(stats.total_clients / stats.total_salons);
  const avgRevenuePerSalon = Math.round(stats.total_revenue / stats.total_salons);
  const subscriptionRate = Math.round((stats.total_subscriptions / stats.total_clients) * 100);

  return (
    <Paper p="md" radius="md" withBorder>
      <Text fw={600} mb="md">
        Ключевые метрики
      </Text>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Среднее кол-во клиентов на салон
          </Text>
          <Text fw={600}>{avgClientsPerSalon.toLocaleString('ru-RU')}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Средняя выручка на салон
          </Text>
          <Text fw={600}>{avgRevenuePerSalon.toLocaleString('ru-RU')} ₽</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Конверсия в подписки
          </Text>
          <Text fw={600}>{subscriptionRate}%</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Новых салонов в этом месяце
          </Text>
          <Text fw={600} c="green">
            +{stats.new_salons_this_month}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

function SuperadminStatsPage() {
  const [stats] = useState<SuperadminStats>(mockStats);
  const [loading] = useState(false);

  const handleRefresh = () => {
    // TODO: Refetch stats
  };

  if (loading) {
    return (
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Статистика" breadcrumbItems={items} />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`stat-${i}`} height={120} />
            ))}
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Skeleton height={200} />
            <Skeleton height={200} />
          </SimpleGrid>
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <title>Статистика | Beauty Slot Superadmin</title>
      <meta name="description" content="Общая статистика системы (Superadmin)" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Статистика системы"
            breadcrumbItems={items}
            actionButton={
              <Button
                variant="light"
                leftSection={<IconRefresh size={18} />}
                onClick={handleRefresh}
              >
                Обновить
              </Button>
            }
          />

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <StatCard
              title="Всего салонов"
              value={stats.total_salons}
              icon={<IconBuilding size={24} color="var(--mantine-color-blue-6)" />}
              color="blue"
              description={`${stats.active_salons} активных`}
              trend={8}
            />
            <StatCard
              title="Всего клиентов"
              value={stats.total_clients.toLocaleString('ru-RU')}
              icon={<IconUsers size={24} color="var(--mantine-color-green-6)" />}
              color="green"
              description="Во всех салонах"
              trend={12}
            />
            <StatCard
              title="Активных подписок"
              value={stats.total_subscriptions.toLocaleString('ru-RU')}
              icon={<IconCreditCard size={24} color="var(--mantine-color-violet-6)" />}
              color="violet"
              description={`${Math.round((stats.total_subscriptions / stats.total_clients) * 100)}% конверсия`}
              trend={5}
            />
            <StatCard
              title="Общая выручка"
              value={`${(stats.total_revenue / 1000000).toFixed(1)}M ₽`}
              icon={<IconCoin size={24} color="var(--mantine-color-yellow-6)" />}
              color="yellow"
              description="За всё время"
              trend={15}
            />
          </SimpleGrid>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <SalonDistribution stats={stats} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <RevenueOverview stats={stats} />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TopMetrics stats={stats} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" radius="md" withBorder>
                <Text fw={600} mb="md">
                  Быстрые действия
                </Text>
                <Stack gap="sm">
                  <Button
                    variant="light"
                    leftSection={<IconBuilding size={18} />}
                    fullWidth
                    justify="flex-start"
                    component="a"
                    href="/apps/superadmin/salons"
                  >
                    Управление салонами
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconChartBar size={18} />}
                    fullWidth
                    justify="flex-start"
                    component="a"
                    href="/dashboard/analytics"
                  >
                    Детальная аналитика
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconTrendingUp size={18} />}
                    fullWidth
                    justify="flex-start"
                    disabled
                  >
                    Экспорт отчётов (скоро)
                  </Button>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}

export default SuperadminStatsPage;
