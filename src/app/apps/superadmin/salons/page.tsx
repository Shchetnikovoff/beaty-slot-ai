'use client';

import { useState } from 'react';

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Drawer,
  Group,
  Menu,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconBuilding,
  IconCheck,
  IconClock,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconMoodEmpty,
  IconPlayerPause,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { PATH_DASHBOARD } from '@/routes';
import type { Salon, SalonSubscriptionStatus, SalonCreate } from '@/types';

// Mock data - in real app would use useSalons hook
const mockSalons: Salon[] = [
  {
    id: 1,
    yclients_company_id: '123456',
    name: 'Beauty Studio Moscow',
    description: 'Премиальный салон красоты в центре Москвы',
    phone: '+7 (495) 123-45-67',
    email: 'moscow@beautystudio.ru',
    address: 'Москва, ул. Тверская, 1',
    is_active: true,
    timezone: 'Europe/Moscow',
    status: 'ACTIVE',
    subscription_start_date: '2024-01-01T00:00:00Z',
    subscription_end_date: '2025-01-01T00:00:00Z',
    enabled_features: ['subscriptions', 'broadcasts', 'analytics'],
    limits: { max_clients: 1000, max_admins: 5 },
    created_at: '2023-06-15T10:00:00Z',
    updated_at: '2024-11-01T14:30:00Z',
  },
  {
    id: 2,
    yclients_company_id: '789012',
    name: 'Glamour SPB',
    description: 'Сеть салонов в Санкт-Петербурге',
    phone: '+7 (812) 987-65-43',
    email: 'spb@glamour.ru',
    address: 'Санкт-Петербург, Невский пр., 100',
    is_active: true,
    timezone: 'Europe/Moscow',
    status: 'TRIAL',
    trial_start_date: '2024-11-01T00:00:00Z',
    trial_end_date: '2024-11-15T00:00:00Z',
    enabled_features: ['subscriptions'],
    limits: { max_clients: 100, max_admins: 1 },
    created_at: '2024-11-01T09:00:00Z',
    updated_at: '2024-11-01T09:00:00Z',
  },
  {
    id: 3,
    yclients_company_id: '345678',
    name: 'Hair Masters',
    email: 'info@hairmasters.ru',
    is_active: false,
    timezone: 'Europe/Moscow',
    status: 'SUSPENDED',
    enabled_features: [],
    limits: {},
    created_at: '2023-03-20T12:00:00Z',
    updated_at: '2024-10-15T16:00:00Z',
  },
];

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Superadmin', href: '#' },
  { title: 'Салоны', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const STATUS_LABELS: Record<SalonSubscriptionStatus, string> = {
  TRIAL: 'Пробный период',
  ACTIVE: 'Активен',
  EXPIRED: 'Истёк',
  SUSPENDED: 'Приостановлен',
  CANCELLED: 'Отменён',
};

const STATUS_COLORS: Record<SalonSubscriptionStatus, string> = {
  TRIAL: 'blue',
  ACTIVE: 'green',
  EXPIRED: 'orange',
  SUSPENDED: 'red',
  CANCELLED: 'gray',
};

function SalonCard({
  salon,
  onView,
  onEdit,
  onActivate,
  onSuspend,
  onDelete,
}: {
  salon: Salon;
  onView: (salon: Salon) => void;
  onEdit: (salon: Salon) => void;
  onActivate: (salon: Salon) => void;
  onSuspend: (salon: Salon) => void;
  onDelete: (salon: Salon) => void;
}) {
  const createdDate = new Date(salon.created_at).toLocaleDateString('ru-RU');

  const getSubscriptionInfo = () => {
    if (salon.status === 'TRIAL' && salon.trial_end_date) {
      const daysLeft = Math.ceil(
        (new Date(salon.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return `Триал: осталось ${daysLeft} дн.`;
    }
    if (salon.subscription_end_date) {
      return `До: ${new Date(salon.subscription_end_date).toLocaleDateString('ru-RU')}`;
    }
    return null;
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={600} size="lg" lineClamp={1}>
            {salon.name}
          </Text>
          <Text size="sm" c="dimmed">
            ID: {salon.yclients_company_id}
          </Text>
        </div>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onView(salon)}>
              Просмотр
            </Menu.Item>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(salon)}>
              Редактировать
            </Menu.Item>
            {salon.status === 'SUSPENDED' ? (
              <Menu.Item
                leftSection={<IconCheck size={14} />}
                onClick={() => onActivate(salon)}
                color="green"
              >
                Активировать
              </Menu.Item>
            ) : (
              <Menu.Item
                leftSection={<IconPlayerPause size={14} />}
                onClick={() => onSuspend(salon)}
                color="orange"
              >
                Приостановить
              </Menu.Item>
            )}
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => onDelete(salon)}
            >
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Stack gap="xs">
        <Group gap="xs">
          <Badge color={STATUS_COLORS[salon.status]} variant="light" size="lg">
            {STATUS_LABELS[salon.status]}
          </Badge>
          {!salon.is_active && (
            <Badge color="gray" variant="outline" size="sm">
              Неактивен
            </Badge>
          )}
        </Group>

        {salon.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {salon.description}
          </Text>
        )}

        {salon.address && (
          <Group gap="xs">
            <IconBuilding size={14} />
            <Text size="sm" c="dimmed" lineClamp={1}>
              {salon.address}
            </Text>
          </Group>
        )}

        {salon.limits.max_clients && (
          <Group gap="xs">
            <IconUsers size={14} />
            <Text size="sm" c="dimmed">
              Лимит: {salon.limits.max_clients} клиентов
            </Text>
          </Group>
        )}

        {getSubscriptionInfo() && (
          <Group gap="xs">
            <IconClock size={14} />
            <Text size="sm" c="dimmed">
              {getSubscriptionInfo()}
            </Text>
          </Group>
        )}

        <Text size="xs" c="dimmed" mt="xs">
          Создан: {createdDate}
        </Text>
      </Stack>
    </Paper>
  );
}

function NewSalonDrawer({
  opened,
  onClose,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      yclients_company_id: '',
      name: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      timezone: 'Europe/Moscow',
    },
    validate: {
      yclients_company_id: (value) => (!value ? 'Обязательное поле' : null),
      name: (value) => (value.length < 2 ? 'Минимум 2 символа' : null),
      email: (value) => (value && !/^\S+@\S+$/.test(value) ? 'Некорректный email' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // TODO: API call to create salon
      await new Promise((resolve) => setTimeout(resolve, 1000));

      notifications.show({
        title: 'Салон создан',
        message: `Салон "${values.name}" успешно создан`,
        color: 'green',
      });

      form.reset();
      onCreated();
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось создать салон',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Новый салон"
      position="right"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="YClients Company ID"
            placeholder="ID компании в YClients"
            required
            {...form.getInputProps('yclients_company_id')}
          />

          <TextInput
            label="Название"
            placeholder="Название салона"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Описание"
            placeholder="Краткое описание салона"
            {...form.getInputProps('description')}
          />

          <TextInput
            label="Телефон"
            placeholder="+7 (999) 123-45-67"
            {...form.getInputProps('phone')}
          />

          <TextInput
            label="Email"
            placeholder="salon@example.com"
            {...form.getInputProps('email')}
          />

          <TextInput
            label="Адрес"
            placeholder="Город, улица, дом"
            {...form.getInputProps('address')}
          />

          <Select
            label="Часовой пояс"
            data={[
              { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
              { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
              { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
              { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
              { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
            ]}
            {...form.getInputProps('timezone')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconPlus size={18} />}>
              Создать салон
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}

function Salons() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [salons] = useState<Salon[]>(mockSalons);
  const [loading] = useState(false);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  const filteredSalons = salons.filter((salon) => {
    if (statusFilter && salon.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        salon.name.toLowerCase().includes(query) ||
        salon.yclients_company_id.includes(query) ||
        salon.email?.toLowerCase().includes(query) ||
        salon.address?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleViewSalon = (salon: Salon) => {
    console.log('View salon:', salon);
  };

  const handleEditSalon = (salon: Salon) => {
    console.log('Edit salon:', salon);
  };

  const handleActivateSalon = async (salon: Salon) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      notifications.show({
        title: 'Салон активирован',
        message: `"${salon.name}" успешно активирован`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось активировать салон',
        color: 'red',
      });
    }
  };

  const handleSuspendSalon = async (salon: Salon) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      notifications.show({
        title: 'Салон приостановлен',
        message: `"${salon.name}" приостановлен`,
        color: 'orange',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось приостановить салон',
        color: 'red',
      });
    }
  };

  const handleDeleteSalon = async (salon: Salon) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      notifications.show({
        title: 'Салон удалён',
        message: `"${salon.name}" успешно удалён`,
        color: 'red',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить салон',
        color: 'red',
      });
    }
  };

  const handleRefresh = () => {
    // TODO: Refetch salons
  };

  const handleCreated = () => {
    // TODO: Refetch salons
  };

  const renderContent = () => {
    if (loading) {
      return (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`salon-loading-${i}`} visible={true} height={280} />
          ))}
        </SimpleGrid>
      );
    }

    if (!filteredSalons.length) {
      return (
        <Surface p="xl">
          <Stack align="center" gap="md">
            <IconMoodEmpty size={48} stroke={1.5} />
            <Title order={4}>Салоны не найдены</Title>
            <Text c="dimmed" ta="center">
              {searchQuery || statusFilter
                ? 'По выбранным фильтрам ничего не найдено'
                : 'Добавьте первый салон в систему'}
            </Text>
            {(searchQuery || statusFilter) ? (
              <Button
                variant="light"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter(null);
                }}
              >
                Сбросить фильтры
              </Button>
            ) : (
              <Button leftSection={<IconPlus size={18} />} onClick={openDrawer}>
                Добавить салон
              </Button>
            )}
          </Stack>
        </Surface>
      );
    }

    return (
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {filteredSalons.map((salon) => (
          <SalonCard
            key={salon.id}
            salon={salon}
            onView={handleViewSalon}
            onEdit={handleEditSalon}
            onActivate={handleActivateSalon}
            onSuspend={handleSuspendSalon}
            onDelete={handleDeleteSalon}
          />
        ))}
      </SimpleGrid>
    );
  };

  return (
    <>
      <title>Салоны | Beauty Slot Superadmin</title>
      <meta name="description" content="Управление салонами (Superadmin)" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Управление салонами"
            breadcrumbItems={items}
            actionButton={
              <Group gap="sm">
                <TextInput
                  placeholder="Поиск..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 200 }}
                />
                <Select
                  placeholder="Все статусы"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  clearable
                  data={[
                    { value: 'ACTIVE', label: 'Активные' },
                    { value: 'TRIAL', label: 'Пробный период' },
                    { value: 'EXPIRED', label: 'Истекшие' },
                    { value: 'SUSPENDED', label: 'Приостановленные' },
                    { value: 'CANCELLED', label: 'Отменённые' },
                  ]}
                  style={{ width: 180 }}
                />
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={18} />}
                  onClick={handleRefresh}
                >
                  Обновить
                </Button>
                <Button leftSection={<IconPlus size={18} />} onClick={openDrawer}>
                  Добавить салон
                </Button>
              </Group>
            }
          />

          <Box>
            <Group justify="space-between" mb="md">
              <Group gap="lg">
                <Group gap="xs">
                  <IconBuilding size={20} />
                  <Text fw={500}>Салоны в системе</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  Всего: <strong>{filteredSalons.length}</strong>
                </Text>
                <Text size="sm" c="green">
                  Активных: <strong>{salons.filter((s) => s.status === 'ACTIVE').length}</strong>
                </Text>
                <Text size="sm" c="blue">
                  Триал: <strong>{salons.filter((s) => s.status === 'TRIAL').length}</strong>
                </Text>
              </Group>
            </Group>

            {renderContent()}
          </Box>
        </Stack>
      </Container>

      <NewSalonDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        onCreated={handleCreated}
      />
    </>
  );
}

export default Salons;
