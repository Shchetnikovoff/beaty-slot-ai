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
  PaperProps,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure, useFetch } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconDotsVertical,
  IconLayoutGrid,
  IconList,
  IconMoodEmpty,
  IconPackage,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconShoppingCart,
  IconTags,
  IconTruckDelivery,
  IconX,
} from '@tabler/icons-react';

import EditProductDrawer from '@/app/apps/products/components/EditProductDrawer';
import NewProductDrawer from '@/app/apps/products/components/NewProductDrawer';
import ProductsCard from '@/app/apps/products/components/ProductCard/ProductsCard';
import { ErrorAlert, PageHeader, Surface } from '@/components';
import { PATH_DASHBOARD } from '@/routes';
import type { IApiResponse } from '@/types/api-response';
import type { IProduct } from '@/types/products';
import type { ShopOrder, OrderStatus } from '@/types/shop';

import { CartDrawer } from './components/CartDrawer';
import { CartIcon } from './components/CartIcon';
import { ShopProductCard } from './components/ShopProductCard';

// ==========================================
// Constants
// ==========================================

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Магазин', href: '#' },
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

const CARD_PROPS: Omit<PaperProps, 'children'> = {
  p: 'md',
  shadow: 'md',
  radius: 'md',
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

// ==========================================
// Order Components
// ==========================================

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

// ==========================================
// Main Component
// ==========================================

function ShopPage() {
  const [activeTab, setActiveTab] = useState<string | null>('catalog');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

  // Drawers
  const [newDrawerOpened, { open: newProductOpen, close: newProductClose }] =
    useDisclosure(false);
  const [editDrawerOpened, { open: editProductOpen, close: editProductClose }] =
    useDisclosure(false);

  // Data fetching
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useFetch<IApiResponse<IProduct[]>>('/api/products');

  const {
    data: ordersData,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useFetch<OrdersResponse>('/api/v1/shop/orders');

  // Handlers
  const handleProductCreated = useCallback(() => {
    refetchProducts();
  }, [refetchProducts]);

  const handleProductUpdated = useCallback(() => {
    refetchProducts();
  }, [refetchProducts]);

  const handleEditProduct = (product: IProduct) => {
    setSelectedProduct(product);
    editProductOpen();
  };

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

      refetchOrders();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось обновить статус заказа',
        color: 'red',
      });
    }
  }, [refetchOrders]);

  // Computed values
  const categories = productsData?.data
    ? Array.from(
        new Set(
          productsData.data
            .map((p) => p.categoryName || p.category?.title)
            .filter(Boolean)
        )
      ).map((cat) => ({ value: cat as string, label: cat as string }))
    : [];

  const filteredProducts = productsData?.data?.filter((product) => {
    if (!product.isActive) return false;
    if (!categoryFilter) return true;
    const productCategory = product.categoryName || product.category?.title;
    return productCategory === categoryFilter;
  });

  const filteredOrders = statusFilter
    ? ordersData?.items.filter((o) => o.status === statusFilter)
    : ordersData?.items;

  // ==========================================
  // Render: Catalog Tab
  // ==========================================

  const renderCatalog = () => {
    if (productsLoading) {
      return (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`product-skeleton-${i}`} height={350} radius="md" />
          ))}
        </SimpleGrid>
      );
    }

    if (productsError || !productsData?.succeeded) {
      return (
        <ErrorAlert
          title="Ошибка загрузки товаров"
          message={productsData?.errors?.join(', ')}
        />
      );
    }

    if (!filteredProducts?.length) {
      return (
        <Stack align="center" justify="center" h={300}>
          <IconMoodEmpty size={48} stroke={1.5} />
          <Title order={4}>Товары не найдены</Title>
          <Text c="dimmed">
            {categoryFilter
              ? 'В выбранной категории нет доступных товаров'
              : 'В магазине пока нет товаров'}
          </Text>
          {categoryFilter && (
            <Button variant="light" onClick={() => setCategoryFilter(null)}>
              Сбросить фильтр
            </Button>
          )}
        </Stack>
      );
    }

    return (
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {filteredProducts.map((product) => (
          <ShopProductCard key={product.id} product={product} />
        ))}
      </SimpleGrid>
    );
  };

  // ==========================================
  // Render: Orders Tab
  // ==========================================

  const renderOrders = () => {
    if (ordersLoading) {
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

    if (ordersError) {
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

    return (
      <>
        {/* Stats */}
        {ordersData?.stats && (
          <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
            <Paper p="md" radius="md" withBorder>
              <Text size="sm" c="dimmed">Всего заказов</Text>
              <Text size="xl" fw={700}>{ordersData.stats.total}</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="sm" c="dimmed">Ожидают обработки</Text>
              <Text size="xl" fw={700} c="yellow">{ordersData.stats.byStatus.pending}</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="sm" c="dimmed">Заказов сегодня</Text>
              <Text size="xl" fw={700}>{ordersData.stats.todayOrders}</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="sm" c="dimmed">Выручка (выполнено)</Text>
              <Text size="xl" fw={700} c="green">
                {ordersData.stats.totalRevenue.toLocaleString('ru-RU')} ₽
              </Text>
            </Paper>
          </SimpleGrid>
        )}

        {viewMode === 'grid' ? (
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
        )}
      </>
    );
  };

  // ==========================================
  // Render: Products Tab
  // ==========================================

  const renderProducts = () => {
    if (productsLoading) {
      return (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`product-loading-${i}`} visible={true} height={300} />
          ))}
        </SimpleGrid>
      );
    }

    if (productsError || !productsData?.succeeded) {
      return (
        <ErrorAlert
          title="Ошибка загрузки товаров"
          message={productsData?.errors?.join(',')}
        />
      );
    }

    if (!productsData?.data?.length) {
      return (
        <Surface p="md">
          <Stack align="center">
            <IconMoodEmpty size={24} />
            <Title order={4}>Товары не найдены</Title>
            <Text>У вас пока нет товаров. Создайте первый.</Text>
            <Button leftSection={<IconPlus size={18} />} onClick={newProductOpen}>
              Новый товар
            </Button>
          </Stack>
        </Surface>
      );
    }

    return (
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {productsData.data.map((p: IProduct) => (
          <ProductsCard
            key={p.id}
            data={p}
            onEdit={handleEditProduct}
            {...CARD_PROPS}
          />
        ))}
      </SimpleGrid>
    );
  };

  // ==========================================
  // Render: Tab Actions
  // ==========================================

  const renderTabActions = () => {
    if (activeTab === 'catalog') {
      return (
        <Group>
          <Select
            placeholder="Все категории"
            value={categoryFilter}
            onChange={setCategoryFilter}
            data={categories}
            clearable
            w={200}
          />
          <CartIcon />
        </Group>
      );
    }

    if (activeTab === 'orders') {
      return (
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
            onClick={() => refetchOrders()}
          >
            Обновить
          </Button>
        </Group>
      );
    }

    if (activeTab === 'products') {
      return (
        <Button leftSection={<IconPlus size={18} />} onClick={newProductOpen}>
          Новый товар
        </Button>
      );
    }

    return null;
  };

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <>
      <title>Магазин | Beauty Slot</title>
      <meta name="description" content="Онлайн-магазин салона красоты" />

      <PageHeader
        title="Магазин"
        breadcrumbItems={breadcrumbItems}
        actionButton={renderTabActions()}
      />

      <Tabs value={activeTab} onChange={setActiveTab} mb="lg">
        <Tabs.List>
          <Tabs.Tab value="catalog" leftSection={<IconShoppingCart size={16} />}>
            Каталог
          </Tabs.Tab>
          <Tabs.Tab
            value="orders"
            leftSection={<IconTruckDelivery size={16} />}
            rightSection={
              ordersData?.stats?.byStatus?.pending ? (
                <Badge size="xs" color="yellow" variant="filled">
                  {ordersData.stats.byStatus.pending}
                </Badge>
              ) : null
            }
          >
            Заказы
          </Tabs.Tab>
          <Tabs.Tab value="products" leftSection={<IconTags size={16} />}>
            Товары
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="catalog" pt="lg">
          {renderCatalog()}
        </Tabs.Panel>

        <Tabs.Panel value="orders" pt="lg">
          {renderOrders()}
        </Tabs.Panel>

        <Tabs.Panel value="products" pt="lg">
          {renderProducts()}
        </Tabs.Panel>
      </Tabs>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Product Drawers */}
      <NewProductDrawer
        opened={newDrawerOpened}
        onClose={newProductClose}
        position="right"
        onProductCreated={handleProductCreated}
      />

      <EditProductDrawer
        opened={editDrawerOpened}
        onClose={editProductClose}
        position="right"
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />
    </>
  );
}

export default ShopPage;
