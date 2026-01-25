'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Button,
  Group,
  Menu,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCrown,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconGhost,
  IconLayoutGrid,
  IconList,
  IconMoodEmpty,
  IconPhone,
  IconRefresh,
  IconSearch,
  IconUserCheck,
  IconUsers,
  IconUserX,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { useClients } from '@/lib/hooks/useBeautySlot';
import { clientsService } from '@/services';
import type { Client, ClientFilterStatus, ClientsListParams } from '@/types';
import { PATH_DASHBOARD } from '@/routes';

type ViewMode = 'grid' | 'table';

const CLIENT_FILTERS: Array<{
  value: ClientFilterStatus;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}> = [
  { value: 'ALL', label: 'Все', icon: IconUsers, color: 'blue' },
  { value: 'VIP', label: 'VIP', icon: IconCrown, color: 'yellow' },
  { value: 'RISK', label: 'Риск', icon: IconAlertTriangle, color: 'orange' },
  { value: 'PROBLEM', label: 'Проблемные', icon: IconAlertCircle, color: 'red' },
  { value: 'NO_SHOW', label: 'Неявки', icon: IconUserX, color: 'pink' },
  { value: 'LOST', label: 'Потерянные', icon: IconGhost, color: 'gray' },
];

const STATUS_COLORS: Record<string, string> = {
  REGULAR: 'blue',
  VIP: 'yellow',
  PROBLEM: 'red',
  LOST: 'gray',
};

const STATUS_LABELS: Record<string, string> = {
  REGULAR: 'Обычный',
  VIP: 'VIP',
  PROBLEM: 'Проблемный',
  LOST: 'Потерянный',
};

const RISK_COLORS: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Клиенты', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

function ClientCard({
  client,
  onEdit,
  onToggleSubscription,
}: {
  client: Client;
  onEdit: (client: Client) => void;
  onToggleSubscription: (client: Client) => void;
}) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <Avatar
            src={client.photo_url}
            size="lg"
            radius="xl"
            color={client.has_active_subscription ? 'green' : 'gray'}
          >
            {client.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text fw={500}>{client.name}</Text>
            <Text size="sm" c="dimmed">
              {client.phone}
            </Text>
          </div>
        </Group>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onEdit(client)}>
              Просмотр
            </Menu.Item>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(client)}>
              Редактировать
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={
                client.has_active_subscription ? (
                  <IconUserX size={14} />
                ) : (
                  <IconUserCheck size={14} />
                )
              }
              color={client.has_active_subscription ? 'red' : 'green'}
              onClick={() => onToggleSubscription(client)}
            >
              {client.has_active_subscription ? 'Отключить подписку' : 'Включить подписку'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Stack gap="xs">
        {client.email && (
          <Text size="sm" c="dimmed">
            {client.email}
          </Text>
        )}

        {/* Score (ИВК) */}
        {client.score !== undefined && (
          <Group gap="xs">
            <Text size="xs" c="dimmed">ИВК:</Text>
            <Badge
              color={client.score >= 70 ? 'green' : client.score >= 40 ? 'yellow' : 'red'}
              variant="filled"
              size="sm"
            >
              {client.score}
            </Badge>
          </Group>
        )}

        <Group gap="xs" wrap="wrap">
          {/* Client Status Badge */}
          {client.client_status && client.client_status !== 'REGULAR' && (
            <Badge color={STATUS_COLORS[client.client_status] || 'gray'} variant="light" size="sm">
              {STATUS_LABELS[client.client_status] || client.client_status}
            </Badge>
          )}

          {/* Risk Level Badge */}
          {client.risk_level && client.risk_level !== 'LOW' && (
            <Badge color={RISK_COLORS[client.risk_level] || 'gray'} variant="outline" size="sm">
              Риск: {client.risk_level}
            </Badge>
          )}

          {client.has_active_subscription ? (
            <Badge color="green" variant="light" size="sm">
              Подписка
            </Badge>
          ) : (
            <Badge color="gray" variant="light" size="sm">
              Без подписки
            </Badge>
          )}
          {client.is_blocked && (
            <Badge color="red" variant="light" size="sm">
              Заблокирован
            </Badge>
          )}
        </Group>

        <Group gap="md">
          {client.visits_count !== undefined && (
            <Text size="xs" c="dimmed">
              Визиты: {client.visits_count}
            </Text>
          )}
          {client.no_show_count !== undefined && client.no_show_count > 0 && (
            <Text size="xs" c="red">
              Неявки: {client.no_show_count}
            </Text>
          )}
        </Group>

        {client.last_visit_at && (
          <Text size="xs" c="dimmed">
            Последний визит: {new Date(client.last_visit_at).toLocaleDateString('ru-RU')}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

function ClientsTableView({
  clients,
  onEdit,
  onToggleSubscription,
}: {
  clients: Client[];
  onEdit: (client: Client) => void;
  onToggleSubscription: (client: Client) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Клиент</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Телефон</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>ИВК</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Визиты</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Неявки</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Подписка</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Последний визит</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <td style={{ padding: '12px' }}>
                <Group gap="sm">
                  <Avatar
                    src={client.photo_url}
                    size="sm"
                    radius="xl"
                    color={client.client_status === 'VIP' ? 'yellow' : client.has_active_subscription ? 'green' : 'gray'}
                  >
                    {client.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="sm" fw={500}>
                    {client.name}
                  </Text>
                </Group>
              </td>
              <td style={{ padding: '12px' }}>
                <Group gap="xs">
                  <IconPhone size={14} />
                  <Text size="sm">{client.phone}</Text>
                </Group>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                {client.score !== undefined ? (
                  <Badge
                    color={client.score >= 70 ? 'green' : client.score >= 40 ? 'yellow' : 'red'}
                    variant="filled"
                    size="sm"
                  >
                    {client.score}
                  </Badge>
                ) : (
                  <Text size="sm" c="dimmed">—</Text>
                )}
              </td>
              <td style={{ padding: '12px' }}>
                <Group gap="xs">
                  {client.client_status && (
                    <Badge color={STATUS_COLORS[client.client_status] || 'gray'} variant="light" size="sm">
                      {STATUS_LABELS[client.client_status] || client.client_status}
                    </Badge>
                  )}
                  {client.risk_level && client.risk_level !== 'LOW' && (
                    <Badge color={RISK_COLORS[client.risk_level] || 'gray'} variant="outline" size="xs">
                      {client.risk_level}
                    </Badge>
                  )}
                </Group>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <Text size="sm">{client.visits_count ?? '—'}</Text>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <Text size="sm" c={client.no_show_count && client.no_show_count > 0 ? 'red' : undefined}>
                  {client.no_show_count ?? '—'}
                </Text>
              </td>
              <td style={{ padding: '12px' }}>
                {client.has_active_subscription ? (
                  <Badge color="green" variant="light" size="sm">
                    Активна
                  </Badge>
                ) : (
                  <Badge color="gray" variant="light" size="sm">
                    Нет
                  </Badge>
                )}
              </td>
              <td style={{ padding: '12px' }}>
                <Text size="sm" c="dimmed">
                  {client.last_visit_at
                    ? new Date(client.last_visit_at).toLocaleDateString('ru-RU')
                    : '—'}
                </Text>
              </td>
              <td style={{ padding: '12px', textAlign: 'right' }}>
                <Group gap="xs" justify="flex-end">
                  <ActionIcon variant="subtle" onClick={() => onEdit(client)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color={client.has_active_subscription ? 'red' : 'green'}
                    onClick={() => onToggleSubscription(client)}
                  >
                    {client.has_active_subscription ? (
                      <IconUserX size={16} />
                    ) : (
                      <IconUserCheck size={16} />
                    )}
                  </ActionIcon>
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Customers() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [importing, setImporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ClientFilterStatus>('ALL');

  // Преобразование UI фильтров в параметры API
  const getFilterParams = (): ClientsListParams => {
    const params: ClientsListParams = {
      search: debouncedSearch || undefined,
      limit: 100,
    };

    switch (statusFilter) {
      case 'VIP':
        params.client_status = 'VIP';
        break;
      case 'PROBLEM':
        params.client_status = 'PROBLEM';
        break;
      case 'LOST':
        params.client_status = 'LOST';
        break;
      case 'RISK':
        // Фильтр по уровню риска (MEDIUM, HIGH, CRITICAL)
        params.risk_level = 'HIGH';
        break;
      case 'NO_SHOW':
        // Фильтр по клиентам с неявками
        params.max_no_shows = 999; // Показать всех с неявками
        params.min_visits = 0;
        break;
      default:
        break;
    }

    return params;
  };

  const {
    data: clientsData,
    loading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useClients(getFilterParams());

  const handleToggleSubscription = async (client: Client) => {
    try {
      await clientsService.toggleSubscription(
        client.yclients_id || String(client.id),
        !client.has_active_subscription
      );
      refetchClients();
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
    }
  };

  const handleImportFromYclients = async () => {
    setImporting(true);
    try {
      const result = await clientsService.importFromYclients();
      console.log('Imported:', result);
      refetchClients();
    } catch (error) {
      console.error('Failed to import:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleEditClient = (client: Client) => {
    // TODO: Open edit drawer
    console.log('Edit client:', client);
  };

  const renderContent = () => {
    if (clientsLoading) {
      return viewMode === 'grid' ? (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`client-loading-${i}`} visible={true} height={180} />
          ))}
        </SimpleGrid>
      ) : (
        <Surface>
          <Skeleton height={400} />
        </Surface>
      );
    }

    if (clientsError) {
      return (
        <ErrorAlert
          title="Ошибка загрузки клиентов"
          message={clientsError?.message || 'Не удалось загрузить список клиентов'}
        />
      );
    }

    if (!clientsData?.items?.length) {
      return (
        <Surface p="xl">
          <Stack align="center" gap="md">
            <IconMoodEmpty size={48} stroke={1.5} />
            <Title order={4}>Клиенты не найдены</Title>
            <Text c="dimmed" ta="center">
              {debouncedSearch
                ? 'По вашему запросу ничего не найдено'
                : 'Импортируйте клиентов из YClients для начала работы'}
            </Text>
            {!debouncedSearch && (
              <Button
                leftSection={<IconRefresh size={18} />}
                onClick={handleImportFromYclients}
                loading={importing}
              >
                Импортировать из YClients
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
        {clientsData.items.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onEdit={handleEditClient}
            onToggleSubscription={handleToggleSubscription}
          />
        ))}
      </SimpleGrid>
    ) : (
      <Surface mt="md">
        <ClientsTableView
          clients={clientsData.items}
          onEdit={handleEditClient}
          onToggleSubscription={handleToggleSubscription}
        />
      </Surface>
    );
  };

  return (
    <>
      <title>Клиенты | Beauty Slot Admin</title>
      <meta name="description" content="Управление клиентами салона" />

      <PageHeader
        title="Клиенты"
        breadcrumbItems={items}
        actionButton={
          <Group gap="sm">
            <TextInput
              placeholder="Поиск по имени или телефону..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ width: 250 }}
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
              onClick={handleImportFromYclients}
              loading={importing}
            >
              Синхронизация
            </Button>
          </Group>
        }
      />

      {/* Filter Buttons */}
      <Group mb="md" gap="xs">
        {CLIENT_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = statusFilter === filter.value;
          return (
            <Button
              key={filter.value}
              variant={isActive ? 'filled' : 'light'}
              color={isActive ? filter.color : 'gray'}
              size="sm"
              leftSection={<Icon size={16} />}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          );
        })}
      </Group>

      {clientsData && (
        <Group mb="md" gap="xs">
          <Text size="sm" c="dimmed">
            Всего клиентов: <strong>{clientsData.total}</strong>
          </Text>
          <Text size="sm" c="dimmed">
            •
          </Text>
          <Text size="sm" c="dimmed">
            Показано: <strong>{clientsData.items.length}</strong>
          </Text>
        </Group>
      )}

      {renderContent()}
    </>
  );
}

export default Customers;
