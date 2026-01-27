'use client';

import { useCallback, useState } from 'react';
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
import { useFetch } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconClock,
  IconDotsVertical,
  IconEye,
  IconLayoutGrid,
  IconList,
  IconMoodEmpty,
  IconPackage,
  IconPlayerPlay,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { PATH_DASHBOARD } from '@/routes';
import type {
  ShopOrder,
  OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/types/shop';

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Магазин', href: '/apps/shop' },
  { title: 'Заказы', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  processing: 'В работе',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'yellow',
  confirmed: 'blue',
  processing: 'cyan',
  completed: 'green',
  cancelled: 'red',
};

type ViewMode = 'grid' | 'table';

interface OrdersResponse {
  items: ShopOrder[];
  total: number;
  stats: {
    total: number;
    byStatus: Record<OrderStatus, number>;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
  };
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: ShopOrder;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  const createdDate = new Date(order.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="sm">
        <div>
          <Text fw={600}>{order.orderNumber}</Text>
          <Text size="xs" c="dimmed">{createdDate}</Text>
        </div>
        <Menu shadow="md" width={180}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Изменить статус</Menu.Label>
            {order.status === 'pending' && (
              <Menu.Item
                leftSection={<IconCheck size={14} />}
                color="blue"
                onClick={() => onStatusChange(order.id, 'confirmed')}
              >
                Подтвердить
              </Menu.Item>
            )}
            {order.status === 'confirmed' && (
              <Menu.Item
                leftSection={<IconPlayerPlay size={14} />}
                color="cyan"
                onClick={() => onStatusChange(order.id, 'processing')}
              >
                В работу
              </Menu.Item>
            )}
            {order.status === 'processing' && (
              <Menu.Item
                leftSection={<IconPackage size={14} />}
                color="green"
                onClick={() => onStatusChange(order.id, 'completed')}
              >
                Выполнен
              </Menu.Item>
            )}
            {['pending', 'confirmed', 'processing'].includes(order.status) && (
              <>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconX size={14} />}
                  color="red"
                  onClick={() => onStatusChange(order.id, 'cancelled')}
                >
                  Отменить
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Stack gap="xs">
        <Badge color={STATUS_COLORS[order.status]} variant="light">
          {STATUS_LABELS[order.status]}
        </Badge>

        <div>
          <Text size="sm" fw={500}>{order.customer.name}</Text>
          <Text size="xs" c="dimmed">{order.customer.phone}</Text>
        </div>

        <Stack gap={2}>
          {order.items.slice(0, 2).map((item) => (
            <Text key={item.product.id} size="xs" c="dimmed" lineClamp={1}>
              {item.product.title} × {item.quantity}
            </Text>
          ))}
          {order.items.length > 2 && (
            <Text size="xs" c="dimmed">
              +{order.items.length - 2} ещё
            </Text>
          )}
        </Stack>

        <Group justify="space-between" mt="xs">
          <Text size="sm" c="dimmed">Итого:</Text>
          <Text fw={600}>{order.total.toLocaleString('ru-RU')} ₽</Text>
        </Group>
      </Stack>
    </Paper>
  );
}

function OrdersTableView({
  orders,
  onStatusChange,
}: {
  orders: ShopOrder[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Номер</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Дата</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Клиент</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Товары</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Сумма</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const createdDate = new Date(order.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <tr
                key={order.id}
                style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
              >
                <td style={{ padding: '12px' }}>
                  <Text size="sm" fw={500}>{order.orderNumber}</Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm">{createdDate}</Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm" fw={500}>{order.customer.name}</Text>
                  <Text size="xs" c="dimmed">{order.customer.phone}</Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Badge color={STATUS_COLORS[order.status]} variant="light" size="sm">
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm">
                    {order.items.length} {order.items.length === 1 ? 'товар' : 'товара'}
                  </Text>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <Text size="sm" fw={500}>
                    {order.total.toLocaleString('ru-RU')} ₽
                  </Text>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <Menu shadow="md" width={180}>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {order.status === 'pending' && (
                        <Menu.Item
                          leftSection={<IconCheck size={14} />}
                          onClick={() => onStatusChange(order.id, 'confirmed')}
                        >
                          Подтвердить
                        </Menu.Item>
                      )}
                      {order.status === 'confirmed' && (
                        <Menu.Item
                          leftSection={<IconPlayerPlay size={14} />}
                          onClick={() => onStatusChange(order.id, 'processing')}
                        >
                          В работу
                        </Menu.Item>
                      )}
                      {order.status === 'processing' && (
                        <Menu.Item
                          leftSection={<IconPackage size={14} />}
                          onClick={() => onStatusChange(order.id, 'completed')}
                        >
                          Выполнен
                        </Menu.Item>
                      )}
                      {['pending', 'confirmed', 'processing'].includes(order.status) && (
                        <>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconX size={14} />}
                            color="red"
                            onClick={() => onStatusChange(order.id, 'cancelled')}
                          >
                            Отменить
                          </Menu.Item>
                        </>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ShopOrdersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const {
    data,
    loading,
    error,
    refetch,
  } = useFetch<OrdersResponse>('/api/v1/shop/orders');

  const handleStatusChange = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch(`/api/v1/shop/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      notifications.show({
        title: 'Статус обновлён',
        message: `Статус заказа изменён на "${STATUS_LABELS[status]}"`,
        color: 'green',
      });

      refetch();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось обновить статус заказа',
        color: 'red',
      });
    }
  }, [refetch]);

  const filteredOrders = statusFilter
    ? data?.items.filter((o) => o.status === statusFilter)
    : data?.items;

  const renderContent = () => {
    if (loading) {
      return viewMode === 'grid' ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`order-skeleton-${i}`} height={250} radius="md" />
          ))}
        </SimpleGrid>
      ) : (
        <Surface>
          <Skeleton height={400} />
        </Surface>
      );
    }

    if (error) {
      return (
        <ErrorAlert
          title="Ошибка загрузки заказов"
          message="Не удалось загрузить список заказов"
        />
      );
    }

    if (!filteredOrders?.length) {
      return (
        <Surface p="xl">
          <Stack align="center" gap="md">
            <IconMoodEmpty size={48} stroke={1.5} />
            <Title order={4}>Заказов нет</Title>
            <Text c="dimmed" ta="center">
              {statusFilter
                ? 'По выбранному фильтру заказы не найдены'
                : 'Пока не поступило ни одного заказа'}
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
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusChange={handleStatusChange}
          />
        ))}
      </SimpleGrid>
    ) : (
      <Surface>
        <OrdersTableView
          orders={filteredOrders}
          onStatusChange={handleStatusChange}
        />
      </Surface>
    );
  };

  return (
    <>
      <title>Заказы | Beauty Slot</title>
      <meta name="description" content="Управление заказами онлайн-магазина" />

      <PageHeader
        title="Заказы"
        breadcrumbItems={breadcrumbItems}
        actionButton={
          <Group>
            <Select
              placeholder="Все статусы"
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
              data={[
                { value: 'pending', label: 'Ожидают' },
                { value: 'confirmed', label: 'Подтверждённые' },
                { value: 'processing', label: 'В работе' },
                { value: 'completed', label: 'Выполненные' },
                { value: 'cancelled', label: 'Отменённые' },
              ]}
              w={180}
            />
            <SegmentedControl
              value={viewMode}
              onChange={(v) => setViewMode(v as ViewMode)}
              data={[
                { value: 'grid', label: <IconLayoutGrid size={16} /> },
                { value: 'table', label: <IconList size={16} /> },
              ]}
            />
            <Button
              variant="light"
              leftSection={<IconRefresh size={18} />}
              onClick={() => refetch()}
            >
              Обновить
            </Button>
          </Group>
        }
      />

      {/* Stats */}
      {data?.stats && (
        <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
          <Paper p="md" radius="md" withBorder>
            <Text size="sm" c="dimmed">Всего заказов</Text>
            <Text size="xl" fw={700}>{data.stats.total}</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Text size="sm" c="dimmed">Ожидают обработки</Text>
            <Text size="xl" fw={700} c="yellow">{data.stats.byStatus.pending}</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Text size="sm" c="dimmed">Заказов сегодня</Text>
            <Text size="xl" fw={700}>{data.stats.todayOrders}</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Text size="sm" c="dimmed">Выручка (выполнено)</Text>
            <Text size="xl" fw={700} c="green">
              {data.stats.totalRevenue.toLocaleString('ru-RU')} ₽
            </Text>
          </Paper>
        </SimpleGrid>
      )}

      {renderContent()}
    </>
  );
}

export default ShopOrdersPage;
