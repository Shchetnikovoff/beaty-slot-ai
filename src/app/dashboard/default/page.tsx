'use client';

import {
  Badge,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  PaperProps,
  Progress,
  RingProgress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowUpRight,
  IconChevronRight,
  IconCoin,
  IconCreditCard,
  IconUserCheck,
  IconUsers,
} from '@tabler/icons-react';
import Link from 'next/link';

import { PageHeader, Surface } from '@/components';
import { useClients, useSubscriptions, usePayments } from '@/lib/hooks/useBeautySlot';
import { PATH_APPS } from '@/routes';

const PAPER_PROPS: PaperProps = {
  p: 'md',
  style: { minHeight: '100%' },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: number;
  loading?: boolean;
}

function StatCard({ title, value, icon, color, change, loading }: StatCardProps) {
  if (loading) {
    return <Skeleton height={120} radius="md" />;
  }

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={700} size="xl" mt={4}>
            {value}
          </Text>
          {change !== undefined && (
            <Group gap={4} mt={4}>
              <IconArrowUpRight size={16} color={change >= 0 ? 'green' : 'red'} />
              <Text size="xs" c={change >= 0 ? 'green' : 'red'}>
                {change >= 0 ? '+' : ''}
                {change}%
              </Text>
              <Text size="xs" c="dimmed">
                за месяц
              </Text>
            </Group>
          )}
        </div>
        <ThemeIcon size={48} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

function RecentClientsTable({
  clients,
  loading,
}: {
  clients: Array<{
    id: number;
    name: string;
    phone: string;
    has_active_subscription?: boolean;
    created_at: string;
  }>;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton height={300} />;
  }

  if (!clients.length) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Нет клиентов
      </Text>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', color: 'gray' }}>
              Клиент
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', color: 'gray' }}>
              Телефон
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', color: 'gray' }}>
              Подписка
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', color: 'gray' }}>
              Дата регистрации
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <td style={{ padding: '12px' }}>
                <Text size="sm" fw={500}>
                  {client.name}
                </Text>
              </td>
              <td style={{ padding: '12px' }}>
                <Text size="sm">{client.phone}</Text>
              </td>
              <td style={{ padding: '12px' }}>
                {client.has_active_subscription ? (
                  <Badge color="green" size="sm" variant="light">
                    Активна
                  </Badge>
                ) : (
                  <Badge color="gray" size="sm" variant="light">
                    Нет
                  </Badge>
                )}
              </td>
              <td style={{ padding: '12px' }}>
                <Text size="sm" c="dimmed">
                  {new Date(client.created_at).toLocaleDateString('ru-RU')}
                </Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionStats({
  active,
  total,
  loading,
}: {
  active: number;
  total: number;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton height={200} />;
  }

  const percentage = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <Stack align="center" gap="md">
      <RingProgress
        size={180}
        thickness={16}
        roundCaps
        sections={[{ value: percentage, color: 'green' }]}
        label={
          <Text ta="center" size="xl" fw={700}>
            {percentage}%
          </Text>
        }
      />
      <div>
        <Text ta="center" size="sm" c="dimmed">
          Активных подписок
        </Text>
        <Text ta="center" size="lg" fw={600}>
          {active} из {total}
        </Text>
      </div>
    </Stack>
  );
}

function RevenueProgress({ payments, loading }: { payments: any[]; loading: boolean }) {
  if (loading) {
    return <Skeleton height={200} />;
  }

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthlyGoal = 100000; // Цель на месяц
  const progress = Math.min((totalRevenue / monthlyGoal) * 100, 100);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Выручка за месяц
        </Text>
        <Text size="sm" fw={600}>
          {totalRevenue.toLocaleString('ru-RU')} ₽
        </Text>
      </Group>
      <Progress value={progress} size="xl" radius="xl" color="blue" />
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          Цель: {monthlyGoal.toLocaleString('ru-RU')} ₽
        </Text>
        <Text size="xs" c="dimmed">
          {progress.toFixed(0)}%
        </Text>
      </Group>

      <Stack gap="xs" mt="md">
        <Text size="sm" fw={500}>
          Последние платежи
        </Text>
        {payments.slice(0, 5).map((payment, index) => (
          <Group key={index} justify="space-between">
            <Text size="sm" c="dimmed">
              {payment.description || 'Оплата подписки'}
            </Text>
            <Badge color={payment.status === 'SUCCEEDED' ? 'green' : 'yellow'} size="sm">
              {payment.amount?.toLocaleString('ru-RU')} ₽
            </Badge>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}

function Page() {
  const { data: clientsData, loading: clientsLoading } = useClients({ limit: 10 });
  const { data: subscriptionsData, loading: subscriptionsLoading } = useSubscriptions({
    status: 'ACTIVE',
    limit: 100,
  });
  const { data: allSubscriptions, loading: allSubsLoading } = useSubscriptions({ limit: 100 });
  const { data: paymentsData, loading: paymentsLoading } = usePayments({
    status: 'SUCCEEDED',
    limit: 100,
  });

  const totalClients = clientsData?.total || 0;
  const activeSubscriptions = subscriptionsData?.total || 0;
  const totalSubscriptions = allSubscriptions?.total || 0;
  const totalRevenue =
    paymentsData?.items?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return (
    <>
      <title>Beauty Slot Admin | Главная</title>
      <meta name="description" content="Панель управления салоном красоты Beauty Slot" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Главная" withActions={false} />

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <StatCard
              title="Всего клиентов"
              value={totalClients}
              icon={<IconUsers size={24} />}
              color="blue"
              loading={clientsLoading}
            />
            <StatCard
              title="Активные подписки"
              value={activeSubscriptions}
              icon={<IconUserCheck size={24} />}
              color="green"
              loading={subscriptionsLoading}
            />
            <StatCard
              title="Выручка"
              value={`${totalRevenue.toLocaleString('ru-RU')} ₽`}
              icon={<IconCoin size={24} />}
              color="yellow"
              loading={paymentsLoading}
            />
            <StatCard
              title="Платежей"
              value={paymentsData?.items?.length || 0}
              icon={<IconCreditCard size={24} />}
              color="violet"
              loading={paymentsLoading}
            />
          </SimpleGrid>

          <Grid gutter={{ base: 5, xs: 'md', md: 'md', lg: 'lg', xl: 'xl' }}>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Surface {...PAPER_PROPS}>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Последние клиенты</Title>
                  <Button
                    variant="subtle"
                    component={Link}
                    href={PATH_APPS.customers}
                    rightSection={<IconChevronRight size={18} />}
                  >
                    Все клиенты
                  </Button>
                </Group>
                <RecentClientsTable
                  clients={clientsData?.items || []}
                  loading={clientsLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">
                  Подписки
                </Title>
                <SubscriptionStats
                  active={activeSubscriptions}
                  total={totalSubscriptions || totalClients}
                  loading={subscriptionsLoading || allSubsLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">
                  Финансы
                </Title>
                <RevenueProgress
                  payments={paymentsData?.items || []}
                  loading={paymentsLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Title order={4} mb="md">
                  Быстрые действия
                </Title>
                <Stack gap="sm">
                  <Button
                    variant="light"
                    fullWidth
                    component={Link}
                    href={PATH_APPS.customers}
                    leftSection={<IconUsers size={18} />}
                  >
                    Управление клиентами
                  </Button>
                  <Button
                    variant="light"
                    fullWidth
                    component={Link}
                    href={PATH_APPS.orders}
                    leftSection={<IconCreditCard size={18} />}
                  >
                    Подписки
                  </Button>
                  <Button
                    variant="light"
                    fullWidth
                    component={Link}
                    href={PATH_APPS.invoices.root}
                    leftSection={<IconCoin size={18} />}
                  >
                    Платежи
                  </Button>
                  <Button
                    variant="light"
                    fullWidth
                    component={Link}
                    href={PATH_APPS.calendar}
                    leftSection={<IconChevronRight size={18} />}
                  >
                    Календарь записей
                  </Button>
                </Stack>
              </Surface>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}

export default Page;
