'use client';

import { useState, useMemo } from 'react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
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
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconCrown,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconGhost,
  IconLayoutGrid,
  IconLayoutList,
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

import { ClientDetailDrawer } from './components/ClientDetailDrawer';
import { ClientEditModal } from './components/ClientEditModal';

type ViewMode = 'grid' | 'list' | 'table';

// Типы сортировки
type SortField = 'name' | 'phone' | 'score' | 'status' | 'visits' | 'noshow' | 'subscription' | 'lastVisit' | null;
type SortDirection = 'asc' | 'desc';

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

// Форматирование телефона в читаемый вид
const formatPhone = (phone: string): string => {
  if (!phone) return '';

  // Убираем все нецифровые символы
  const digits = phone.replace(/\D/g, '');

  // Если номер начинается с 8, заменяем на 7
  const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits;

  // Форматируем в +7 (XXX) XXX-XX-XX
  if (normalized.length === 11 && normalized.startsWith('7')) {
    return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
  }

  // Если 10 цифр (без кода страны)
  if (normalized.length === 10) {
    return `+7 (${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6, 8)}-${normalized.slice(8, 10)}`;
  }

  // Возвращаем как есть, если формат неизвестен
  return phone;
};

function ClientCard({
  client,
  onEdit,
  onToggleSubscription,
  onClick,
}: {
  client: Client;
  onEdit: (client: Client) => void;
  onToggleSubscription: (client: Client) => void;
  onClick: (client: Client) => void;
}) {
  return (
    <Box style={{ width: '100%' }}>
      <Paper
        p="md"
        radius="md"
        withBorder
        h="100%"
        style={{
          cursor: 'pointer',
          transition: 'all 150ms ease',
          minHeight: 220,
        }}
        onClick={() => onClick(client)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--mantine-color-blue-4)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--mantine-color-gray-3)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
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
              <Text size="sm" c="dimmed" ff="monospace">
                {formatPhone(client.phone)}
              </Text>
            </div>
          </Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEye size={14} />} onClick={(e) => { e.stopPropagation(); onClick(client); }}>
                Просмотр
              </Menu.Item>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={(e) => { e.stopPropagation(); onEdit(client); }}>
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
                onClick={(e) => { e.stopPropagation(); onToggleSubscription(client); }}
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
    </Box>
  );
}

// Компонент иконки сортировки
function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) {
    return <IconArrowsSort size={14} style={{ opacity: 0.4 }} />;
  }
  return sortDirection === 'desc'
    ? <IconArrowDown size={14} />
    : <IconArrowUp size={14} />;
}

// Стиль для сортируемого заголовка
const sortableHeaderStyle: React.CSSProperties = {
  padding: '12px',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'background-color 150ms ease',
};

function ClientsTableView({
  clients,
  onEdit,
  onToggleSubscription,
  onClick,
  sortField,
  sortDirection,
  onSort,
}: {
  clients: Client[];
  onEdit: (client: Client) => void;
  onToggleSubscription: (client: Client) => void;
  onClick: (client: Client) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  // Определяем ширину колонок для равномерного распределения
  const columnWidths = {
    client: '16%',
    phone: '14%',
    score: '8%',
    status: '12%',
    visits: '9%',
    noshow: '9%',
    subscription: '10%',
    lastVisit: '14%',
    actions: '8%',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <th
              style={{ ...sortableHeaderStyle, textAlign: 'left', width: columnWidths.client }}
              onClick={() => onSort('name')}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Group gap={4} wrap="nowrap">
                <span>Клиент</span>
                <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
              </Group>
            </th>
            <th style={{ padding: '12px', textAlign: 'left', width: columnWidths.phone }}>Телефон</th>
            <th
              style={{ ...sortableHeaderStyle, textAlign: 'center', width: columnWidths.score }}
              onClick={() => onSort('score')}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Group gap={4} wrap="nowrap" justify="center">
                <span>ИВК</span>
                <SortIcon field="score" sortField={sortField} sortDirection={sortDirection} />
              </Group>
            </th>
            <th
              style={{ ...sortableHeaderStyle, textAlign: 'left', width: columnWidths.status }}
              onClick={() => onSort('status')}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Group gap={4} wrap="nowrap">
                <span>Статус</span>
                <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
              </Group>
            </th>
            <th
              style={{ ...sortableHeaderStyle, textAlign: 'center', width: columnWidths.visits }}
              onClick={() => onSort('visits')}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Group gap={4} wrap="nowrap" justify="center">
                <span>Визиты</span>
                <SortIcon field="visits" sortField={sortField} sortDirection={sortDirection} />
              </Group>
            </th>
            <th
              style={{ ...sortableHeaderStyle, textAlign: 'center', width: columnWidths.noshow }}
              onClick={() => onSort('noshow')}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Group gap={4} wrap="nowrap" justify="center">
                <span>Неявки</span>
                <SortIcon field="noshow" sortField={sortField} sortDirection={sortDirection} />
              </Group>
            </th>
            <th
              style={{ ...sortableHeaderStyle, textAlign: 'center', width: columnWidths.subscription }}
              onClick={() => onSort('subscription')}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Group gap={4} wrap="nowrap" justify="center">
                <span>Подписка</span>
                <SortIcon field="subscription" sortField={sortField} sortDirection={sortDirection} />
              </Group>
            </th>
            <th
              style={{ ...sortableHeaderStyle, textAlign: 'center', width: columnWidths.lastVisit }}
              onClick={() => onSort('lastVisit')}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Group gap={4} wrap="nowrap" justify="center">
                <span>Посл. визит</span>
                <SortIcon field="lastVisit" sortField={sortField} sortDirection={sortDirection} />
              </Group>
            </th>
            <th style={{ padding: '12px', textAlign: 'center', width: columnWidths.actions }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr
              key={client.id}
              style={{
                borderBottom: '1px solid var(--mantine-color-gray-2)',
                cursor: 'pointer',
                transition: 'background-color 150ms ease',
              }}
              onClick={() => onClick(client)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <td style={{ padding: '12px' }}>
                <Group gap="sm" wrap="nowrap">
                  <Avatar
                    src={client.photo_url}
                    size="sm"
                    radius="xl"
                    color={client.client_status === 'VIP' ? 'yellow' : client.has_active_subscription ? 'green' : 'gray'}
                  >
                    {client.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="sm" fw={500} truncate style={{ maxWidth: 120 }}>
                    {client.name}
                  </Text>
                </Group>
              </td>
              <td style={{ padding: '12px' }}>
                <Text size="sm" ff="monospace" style={{ whiteSpace: 'nowrap' }}>{formatPhone(client.phone)}</Text>
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
              <td style={{ padding: '12px', textAlign: 'center' }}>
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
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <Text size="sm" c="dimmed">
                  {client.last_visit_at
                    ? new Date(client.last_visit_at).toLocaleDateString('ru-RU')
                    : '—'}
                </Text>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <Group gap="xs" justify="center">
                  <ActionIcon variant="subtle" onClick={(e) => { e.stopPropagation(); onEdit(client); }}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color={client.has_active_subscription ? 'red' : 'green'}
                    onClick={(e) => { e.stopPropagation(); onToggleSubscription(client); }}
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false); // Отдельная модалка редактирования

  // Состояние сортировки
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Обработчик сортировки
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Переключаем направление или сбрасываем
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField(null);
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Сортировка клиентов
  const sortClients = (clients: Client[]): Client[] => {
    if (!sortField || !clients) return clients;

    return [...clients].sort((a, b) => {
      let aVal: number | string | boolean = 0;
      let bVal: number | string | boolean = 0;

      switch (sortField) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'score':
          aVal = a.score ?? 0;
          bVal = b.score ?? 0;
          break;
        case 'status':
          // Сортируем по score для статуса
          aVal = a.score ?? 0;
          bVal = b.score ?? 0;
          break;
        case 'visits':
          aVal = a.visits_count ?? 0;
          bVal = b.visits_count ?? 0;
          break;
        case 'noshow':
          aVal = a.no_show_count ?? 0;
          bVal = b.no_show_count ?? 0;
          break;
        case 'subscription':
          aVal = a.has_active_subscription ? 1 : 0;
          bVal = b.has_active_subscription ? 1 : 0;
          break;
        case 'lastVisit':
          aVal = a.last_visit_at ? new Date(a.last_visit_at).getTime() : 0;
          bVal = b.last_visit_at ? new Date(b.last_visit_at).getTime() : 0;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

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

  // Мемоизированный список отсортированных клиентов
  const sortedClients = useMemo(() => {
    if (!clientsData?.items) return [];
    return sortClients(clientsData.items);
  }, [clientsData?.items, sortField, sortDirection]);

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

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setDrawerOpened(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpened(false);
    setSelectedClient(null);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpened(true); // Открыть только модалку редактирования
  };

  const handleCloseEditModal = () => {
    setEditModalOpened(false);
    setSelectedClient(null);
  };

  const handleToggleBlock = async (client: Client) => {
    // TODO: Implement toggle block API
    console.log('Toggle block:', client);
    refetchClients();
  };

  const renderContent = () => {
    if (clientsLoading) {
      if (viewMode === 'grid') {
        return (
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
            spacing="md"
            verticalSpacing="md"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={`client-loading-${i}`} visible={true} height={220} />
            ))}
          </SimpleGrid>
        );
      }
      if (viewMode === 'list') {
        return (
          <Stack gap="md">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`client-loading-${i}`} visible={true} height={220} />
            ))}
          </Stack>
        );
      }
      return (
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

    if (viewMode === 'grid') {
      return (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing="md"
          verticalSpacing="md"
          mt="md"
        >
          {clientsData.items.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEditClient}
              onToggleSubscription={handleToggleSubscription}
              onClick={handleClientClick}
            />
          ))}
        </SimpleGrid>
      );
    }

    if (viewMode === 'list') {
      return (
        <Stack gap="md" mt="md">
          {clientsData.items.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEditClient}
              onToggleSubscription={handleToggleSubscription}
              onClick={handleClientClick}
            />
          ))}
        </Stack>
      );
    }

    return (
      <Surface mt="md">
        <ClientsTableView
          clients={sortedClients}
          onEdit={handleEditClient}
          onToggleSubscription={handleToggleSubscription}
          onClick={handleClientClick}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
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
                { value: 'list', label: <IconLayoutList size={16} /> },
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
      <Group mt="xl" mb="md" gap="xs" grow wrap="nowrap">
        {CLIENT_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = statusFilter === filter.value;
          return (
            <Button
              key={filter.value}
              variant={isActive ? 'filled' : 'light'}
              color={isActive ? filter.color : 'gray'}
              size="sm"
              radius="md"
              leftSection={<Icon size={16} />}
              onClick={() => setStatusFilter(filter.value)}
              styles={{
                root: {
                  fontWeight: isActive ? 600 : 500,
                  flex: 1,
                  minWidth: 0,
                },
                label: {
                  whiteSpace: 'nowrap',
                },
              }}
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

      {/* Client Detail Drawer (ИВК) - только просмотр */}
      <ClientDetailDrawer
        client={selectedClient}
        opened={drawerOpened}
        onClose={handleCloseDrawer}
        onToggleSubscription={(client) => {
          handleToggleSubscription(client);
          handleCloseDrawer();
        }}
        onToggleBlock={handleToggleBlock}
      />

      {/* Отдельная модалка редактирования */}
      <ClientEditModal
        client={selectedClient}
        opened={editModalOpened}
        onClose={handleCloseEditModal}
        onSave={() => {
          refetchClients();
        }}
      />
    </>
  );
}

export default Customers;
