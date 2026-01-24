'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Group,
  Menu,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendar,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconLayoutGrid,
  IconList,
  IconMoodEmpty,
  IconPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { useSubscriptions, useSubscriptionPlans } from '@/lib/hooks/useBeautySlot';
import { subscriptionsService } from '@/services';
import type { Subscription, SubscriptionStatus } from '@/types';
import { PATH_DASHBOARD } from '@/routes';

type ViewMode = 'grid' | 'table';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Подписки', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING: 'Ожидает',
  ACTIVE: 'Активна',
  PAUSED: 'Приостановлена',
  EXPIRED: 'Истекла',
  CANCELLED: 'Отменена',
};

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  PENDING: 'yellow',
  ACTIVE: 'green',
  PAUSED: 'orange',
  EXPIRED: 'gray',
  CANCELLED: 'red',
};

function SubscriptionCard({
  subscription,
  onView,
  onPause,
  onResume,
  onCancel,
}: {
  subscription: Subscription;
  onView: (sub: Subscription) => void;
  onPause: (sub: Subscription) => void;
  onResume: (sub: Subscription) => void;
  onCancel: (sub: Subscription) => void;
}) {
  const startDate = new Date(subscription.start_date).toLocaleDateString('ru-RU');
  const endDate = new Date(subscription.end_date).toLocaleDateString('ru-RU');
  const daysLeft = Math.ceil(
    (new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={600} size="lg">
            {subscription.plan?.name || 'План подписки'}
          </Text>
          <Text size="sm" c="dimmed">
            Клиент: {subscription.client_id}
          </Text>
        </div>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onView(subscription)}>
              Просмотр
            </Menu.Item>
            {subscription.status === 'ACTIVE' && (
              <Menu.Item
                leftSection={<IconPause size={14} />}
                onClick={() => onPause(subscription)}
              >
                Приостановить
              </Menu.Item>
            )}
            {subscription.status === 'PAUSED' && (
              <Menu.Item
                leftSection={<IconPlayerPlay size={14} />}
                color="green"
                onClick={() => onResume(subscription)}
              >
                Возобновить
              </Menu.Item>
            )}
            {['ACTIVE', 'PAUSED', 'PENDING'].includes(subscription.status) && (
              <>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconX size={14} />}
                  color="red"
                  onClick={() => onCancel(subscription)}
                >
                  Отменить
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Stack gap="xs">
        <Badge color={STATUS_COLORS[subscription.status]} variant="light" size="lg">
          {STATUS_LABELS[subscription.status]}
        </Badge>

        <Group gap="xs">
          <IconCalendar size={14} />
          <Text size="sm">
            {startDate} — {endDate}
          </Text>
        </Group>

        {subscription.status === 'ACTIVE' && daysLeft > 0 && (
          <Text size="sm" c={daysLeft <= 7 ? 'orange' : 'dimmed'}>
            Осталось дней: {daysLeft}
          </Text>
        )}

        {subscription.visits_remaining !== undefined && (
          <Text size="sm" c="dimmed">
            Визитов использовано: {subscription.visits_used}
            {subscription.plan?.max_visits && ` из ${subscription.plan.max_visits}`}
          </Text>
        )}

        <Group justify="space-between" mt="xs">
          <Text size="sm" c="dimmed">
            Стоимость:
          </Text>
          <Text size="sm" fw={600}>
            {subscription.plan?.price?.toLocaleString('ru-RU')} ₽
          </Text>
        </Group>

        {subscription.discount_percent > 0 && (
          <Badge color="blue" variant="light" size="sm">
            Скидка {subscription.discount_percent}%
          </Badge>
        )}

        {subscription.auto_renew && (
          <Badge color="teal" variant="outline" size="sm">
            Автопродление
          </Badge>
        )}
      </Stack>
    </Paper>
  );
}

function SubscriptionsTableView({
  subscriptions,
  onView,
  onPause,
  onResume,
  onCancel,
}: {
  subscriptions: Subscription[];
  onView: (sub: Subscription) => void;
  onPause: (sub: Subscription) => void;
  onResume: (sub: Subscription) => void;
  onCancel: (sub: Subscription) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>План</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Клиент</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Период</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Визиты</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Стоимость</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => {
            const startDate = new Date(subscription.start_date).toLocaleDateString('ru-RU');
            const endDate = new Date(subscription.end_date).toLocaleDateString('ru-RU');

            return (
              <tr
                key={subscription.id}
                style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
              >
                <td style={{ padding: '12px' }}>
                  <Text size="sm" fw={500}>
                    {subscription.plan?.name || 'План подписки'}
                  </Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm">{subscription.client_id}</Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Badge color={STATUS_COLORS[subscription.status]} variant="light" size="sm">
                    {STATUS_LABELS[subscription.status]}
                  </Badge>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm">
                    {startDate} — {endDate}
                  </Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm">
                    {subscription.visits_used}
                    {subscription.plan?.max_visits && ` / ${subscription.plan.max_visits}`}
                  </Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {subscription.plan?.price?.toLocaleString('ru-RU')} ₽
                    </Text>
                    {subscription.discount_percent > 0 && (
                      <Badge color="blue" variant="light" size="xs">
                        -{subscription.discount_percent}%
                      </Badge>
                    )}
                  </Group>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" onClick={() => onView(subscription)}>
                      <IconEye size={16} />
                    </ActionIcon>
                    {subscription.status === 'ACTIVE' && (
                      <ActionIcon
                        variant="subtle"
                        color="orange"
                        onClick={() => onPause(subscription)}
                      >
                        <IconPause size={16} />
                      </ActionIcon>
                    )}
                    {subscription.status === 'PAUSED' && (
                      <ActionIcon
                        variant="subtle"
                        color="green"
                        onClick={() => onResume(subscription)}
                      >
                        <IconPlayerPlay size={16} />
                      </ActionIcon>
                    )}
                    {['ACTIVE', 'PAUSED', 'PENDING'].includes(subscription.status) && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => onCancel(subscription)}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Subscriptions() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const {
    data: subscriptionsData,
    loading: subscriptionsLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useSubscriptions({
    status: statusFilter as SubscriptionStatus | undefined,
    limit: 100,
  });

  const { data: plansData } = useSubscriptionPlans(true);

  const handlePauseSubscription = async (subscription: Subscription) => {
    try {
      await subscriptionsService.pauseSubscription(subscription.id, 'Приостановлено администратором');
      refetchSubscriptions();
    } catch (error) {
      console.error('Failed to pause subscription:', error);
    }
  };

  const handleResumeSubscription = async (subscription: Subscription) => {
    try {
      await subscriptionsService.resumeSubscription(subscription.id);
      refetchSubscriptions();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
    }
  };

  const handleCancelSubscription = async (subscription: Subscription) => {
    try {
      await subscriptionsService.cancelSubscription(subscription.id, 'Отменено администратором');
      refetchSubscriptions();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const handleViewSubscription = (subscription: Subscription) => {
    console.log('View subscription:', subscription);
  };

  const renderContent = () => {
    if (subscriptionsLoading) {
      return viewMode === 'grid' ? (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`sub-loading-${i}`} visible={true} height={250} />
          ))}
        </SimpleGrid>
      ) : (
        <Surface>
          <Skeleton height={400} />
        </Surface>
      );
    }

    if (subscriptionsError) {
      return (
        <ErrorAlert
          title="Ошибка загрузки подписок"
          message={subscriptionsError?.message || 'Не удалось загрузить список подписок'}
        />
      );
    }

    if (!subscriptionsData?.items?.length) {
      return (
        <Surface p="xl">
          <Stack align="center" gap="md">
            <IconMoodEmpty size={48} stroke={1.5} />
            <Title order={4}>Подписки не найдены</Title>
            <Text c="dimmed" ta="center">
              {statusFilter
                ? 'По выбранному фильтру ничего не найдено'
                : 'Пока нет ни одной подписки'}
            </Text>
            {statusFilter && (
              <Button variant="light" onClick={() => setStatusFilter(null)}>
                Сбросить фильтр
              </Button>
            )}
          </Stack>
        </Surface>
      );
    }

    return viewMode === 'grid' ? (
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
        mt="md"
      >
        {subscriptionsData.items.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            onView={handleViewSubscription}
            onPause={handlePauseSubscription}
            onResume={handleResumeSubscription}
            onCancel={handleCancelSubscription}
          />
        ))}
      </SimpleGrid>
    ) : (
      <Surface mt="md">
        <SubscriptionsTableView
          subscriptions={subscriptionsData.items}
          onView={handleViewSubscription}
          onPause={handlePauseSubscription}
          onResume={handleResumeSubscription}
          onCancel={handleCancelSubscription}
        />
      </Surface>
    );
  };

  return (
    <>
      <title>Подписки | Beauty Slot Admin</title>
      <meta name="description" content="Управление подписками клиентов" />

      <PageHeader
        title="Подписки"
        breadcrumbItems={items}
        actionButton={
          <Group gap="sm">
            <Select
              placeholder="Все статусы"
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
              data={[
                { value: 'ACTIVE', label: 'Активные' },
                { value: 'PENDING', label: 'Ожидающие' },
                { value: 'PAUSED', label: 'Приостановленные' },
                { value: 'EXPIRED', label: 'Истекшие' },
                { value: 'CANCELLED', label: 'Отмененные' },
              ]}
              style={{ width: 180 }}
            />
            <SegmentedControl
              value={viewMode}
              onChange={(value) => setViewMode(value as ViewMode)}
              data={[
                { value: 'grid', label: <IconLayoutGrid size={16} /> },
                { value: 'table', label: <IconList size={16} /> },
              ]}
            />
            <Button
              variant="light"
              leftSection={<IconRefresh size={18} />}
              onClick={() => refetchSubscriptions()}
            >
              Обновить
            </Button>
          </Group>
        }
      />

      {subscriptionsData && (
        <Group mb="md" gap="xs">
          <Text size="sm" c="dimmed">
            Всего подписок: <strong>{subscriptionsData.total}</strong>
          </Text>
          <Text size="sm" c="dimmed">
            •
          </Text>
          <Text size="sm" c="dimmed">
            Показано: <strong>{subscriptionsData.items.length}</strong>
          </Text>
        </Group>
      )}

      {renderContent()}
    </>
  );
}

export default Subscriptions;
