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
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconCalendar,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconLayoutGrid,
  IconList,
  IconMoodEmpty,
  IconPhone,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconStar,
  IconUserCheck,
  IconUserX,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { useStaff } from '@/lib/hooks/useBeautySlot';
import { staffService } from '@/services';
import type { Staff, StaffRole } from '@/types';
import { PATH_DASHBOARD } from '@/routes';

type ViewMode = 'grid' | 'table';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Команда', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const ROLE_LABELS: Record<StaffRole, string> = {
  MASTER: 'Мастер',
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
};

const ROLE_COLORS: Record<StaffRole, string> = {
  MASTER: 'blue',
  ADMIN: 'violet',
  MANAGER: 'green',
};

function StaffCard({
  staff,
  onView,
  onEdit,
  onToggleActive,
}: {
  staff: Staff;
  onView: (staff: Staff) => void;
  onEdit: (staff: Staff) => void;
  onToggleActive: (staff: Staff) => void;
}) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <Avatar src={staff.photo_url} size="lg" radius="xl" color={staff.is_active ? 'blue' : 'gray'}>
            {staff.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text fw={500}>{staff.name}</Text>
            <Text size="sm" c="dimmed">
              {staff.specialization || ROLE_LABELS[staff.role]}
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
            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onView(staff)}>
              Просмотр
            </Menu.Item>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(staff)}>
              Редактировать
            </Menu.Item>
            <Menu.Item leftSection={<IconCalendar size={14} />}>
              Расписание
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={staff.is_active ? <IconUserX size={14} /> : <IconUserCheck size={14} />}
              color={staff.is_active ? 'red' : 'green'}
              onClick={() => onToggleActive(staff)}
            >
              {staff.is_active ? 'Деактивировать' : 'Активировать'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Stack gap="xs">
        <Group gap="xs">
          <Badge color={ROLE_COLORS[staff.role]} variant="light" size="sm">
            {ROLE_LABELS[staff.role]}
          </Badge>
          {staff.is_active ? (
            <Badge color="green" variant="light" size="sm">
              Активен
            </Badge>
          ) : (
            <Badge color="gray" variant="light" size="sm">
              Неактивен
            </Badge>
          )}
        </Group>

        {staff.phone && (
          <Group gap="xs">
            <IconPhone size={14} />
            <Text size="sm" c="dimmed">
              {staff.phone}
            </Text>
          </Group>
        )}

        {staff.rating !== undefined && (
          <Group gap="xs">
            <IconStar size={14} color="gold" />
            <Text size="sm">{staff.rating.toFixed(1)}</Text>
          </Group>
        )}

        {staff.appointments_count !== undefined && (
          <Text size="xs" c="dimmed">
            Записей сегодня: {staff.appointments_count}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

function StaffTableView({
  staffList,
  onView,
  onEdit,
  onToggleActive,
}: {
  staffList: Staff[];
  onView: (staff: Staff) => void;
  onEdit: (staff: Staff) => void;
  onToggleActive: (staff: Staff) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Сотрудник</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Телефон</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Специализация</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Роль</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Рейтинг</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Записей</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff) => (
            <tr key={staff.id} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <td style={{ padding: '12px' }}>
                <Group gap="sm">
                  <Avatar
                    src={staff.photo_url}
                    size="sm"
                    radius="xl"
                    color={staff.is_active ? 'blue' : 'gray'}
                  >
                    {staff.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="sm" fw={500}>
                    {staff.name}
                  </Text>
                </Group>
              </td>
              <td style={{ padding: '12px' }}>
                <Text size="sm" c={staff.phone ? undefined : 'dimmed'}>
                  {staff.phone || '—'}
                </Text>
              </td>
              <td style={{ padding: '12px' }}>
                <Text size="sm" c={staff.specialization ? undefined : 'dimmed'}>
                  {staff.specialization || '—'}
                </Text>
              </td>
              <td style={{ padding: '12px' }}>
                <Badge color={ROLE_COLORS[staff.role]} variant="light" size="sm">
                  {ROLE_LABELS[staff.role]}
                </Badge>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                {staff.rating !== undefined ? (
                  <Group gap="xs" justify="center">
                    <IconStar size={14} color="gold" />
                    <Text size="sm">{staff.rating.toFixed(1)}</Text>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">—</Text>
                )}
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <Text size="sm">{staff.appointments_count ?? '—'}</Text>
              </td>
              <td style={{ padding: '12px' }}>
                {staff.is_active ? (
                  <Badge color="green" variant="light" size="sm">
                    Активен
                  </Badge>
                ) : (
                  <Badge color="gray" variant="light" size="sm">
                    Неактивен
                  </Badge>
                )}
              </td>
              <td style={{ padding: '12px', textAlign: 'right' }}>
                <Group gap="xs" justify="flex-end">
                  <ActionIcon variant="subtle" onClick={() => onView(staff)}>
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" onClick={() => onEdit(staff)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color={staff.is_active ? 'red' : 'green'}
                    onClick={() => onToggleActive(staff)}
                  >
                    {staff.is_active ? <IconUserX size={16} /> : <IconUserCheck size={16} />}
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

function Team() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
    refetch: refetchStaff,
  } = useStaff({
    search: debouncedSearch || undefined,
    role: roleFilter as StaffRole | undefined,
    limit: 100,
  });

  const handleSyncFromYclients = async () => {
    setSyncing(true);
    try {
      const result = await staffService.syncFromYclients();
      console.log('Synced:', result);
      refetchStaff();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewStaff = (staff: Staff) => {
    console.log('View staff:', staff);
  };

  const handleEditStaff = (staff: Staff) => {
    console.log('Edit staff:', staff);
  };

  const handleToggleActive = async (staff: Staff) => {
    try {
      await staffService.toggleActive(staff.id, !staff.is_active);
      refetchStaff();
    } catch (error) {
      console.error('Failed to toggle active:', error);
    }
  };

  const renderContent = () => {
    if (staffLoading) {
      return viewMode === 'grid' ? (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`staff-loading-${i}`} visible={true} height={200} />
          ))}
        </SimpleGrid>
      ) : (
        <Surface>
          <Skeleton height={400} />
        </Surface>
      );
    }

    if (staffError) {
      return (
        <ErrorAlert
          title="Ошибка загрузки команды"
          message={staffError?.message || 'Не удалось загрузить список сотрудников'}
        />
      );
    }

    if (!staffData?.items?.length) {
      return (
        <Surface p="xl">
          <Stack align="center" gap="md">
            <IconMoodEmpty size={48} stroke={1.5} />
            <Title order={4}>Сотрудники не найдены</Title>
            <Text c="dimmed" ta="center">
              {debouncedSearch || roleFilter
                ? 'По вашему запросу ничего не найдено'
                : 'Синхронизируйте сотрудников из YClients для начала работы'}
            </Text>
            {!debouncedSearch && !roleFilter && (
              <Button
                leftSection={<IconRefresh size={18} />}
                onClick={handleSyncFromYclients}
                loading={syncing}
              >
                Синхронизировать из YClients
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
        {staffData.items.map((staff) => (
          <StaffCard
            key={staff.id}
            staff={staff}
            onView={handleViewStaff}
            onEdit={handleEditStaff}
            onToggleActive={handleToggleActive}
          />
        ))}
      </SimpleGrid>
    ) : (
      <Surface mt="md">
        <StaffTableView
          staffList={staffData.items}
          onView={handleViewStaff}
          onEdit={handleEditStaff}
          onToggleActive={handleToggleActive}
        />
      </Surface>
    );
  };

  return (
    <>
      <title>Команда | Beauty Slot Admin</title>
      <meta name="description" content="Управление командой салона" />

      <PageHeader
        title="Команда"
        breadcrumbItems={items}
        actionButton={
          <Group gap="sm">
            <TextInput
              placeholder="Поиск по имени..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Все роли"
              value={roleFilter}
              onChange={setRoleFilter}
              clearable
              data={[
                { value: 'MASTER', label: 'Мастера' },
                { value: 'ADMIN', label: 'Администраторы' },
                { value: 'MANAGER', label: 'Менеджеры' },
              ]}
              style={{ width: 150 }}
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
              onClick={handleSyncFromYclients}
              loading={syncing}
            >
              Синхронизация
            </Button>
            <Button leftSection={<IconPlus size={18} />}>
              Добавить
            </Button>
          </Group>
        }
      />

      {staffData && (
        <Group mb="md" gap="xs">
          <Text size="sm" c="dimmed">
            Всего сотрудников: <strong>{staffData.total}</strong>
          </Text>
          <Text size="sm" c="dimmed">
            •
          </Text>
          <Text size="sm" c="dimmed">
            Показано: <strong>{staffData.items.length}</strong>
          </Text>
        </Group>
      )}

      {renderContent()}
    </>
  );
}

export default Team;
