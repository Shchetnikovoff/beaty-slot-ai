'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Group,
  Menu,
  Modal,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCheck,
  IconCrown,
  IconDotsVertical,
  IconEdit,
  IconInfoCircle,
  IconMail,
  IconPhone,
  IconPlus,
  IconSearch,
  IconShieldCheck,
  IconShieldLock,
  IconTrash,
  IconUser,
  IconUserMinus,
  IconUserPlus,
  IconUserShield,
  IconX,
} from '@tabler/icons-react';

import { PageHeader, Surface } from '@/components';
import { PATH_APPS, PATH_DASHBOARD } from '@/routes';

// Типы
type OrganizationRole = 'owner' | 'admin' | 'manager';

interface Permission {
  key: string;
  label: string;
  description: string;
  category: 'clients' | 'subscriptions' | 'broadcasts' | 'analytics' | 'settings';
}

interface OrganizationAdmin {
  id: number;
  client_id: number;
  name: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  role: OrganizationRole;
  is_active: boolean;
  created_at: string;
  invited_by?: string;
  permissions: Record<string, boolean>;
}

// Константы
const ROLE_CONFIG: Record<OrganizationRole, { label: string; color: string; icon: React.ElementType }> = {
  owner: { label: 'Владелец', color: 'yellow', icon: IconCrown },
  admin: { label: 'Администратор', color: 'blue', icon: IconUserShield },
  manager: { label: 'Менеджер', color: 'green', icon: IconUser },
};

const PERMISSIONS: Permission[] = [
  // Клиенты
  { key: 'can_view_clients', label: 'Просмотр клиентов', description: 'Просмотр списка и карточек клиентов', category: 'clients' },
  { key: 'can_manage_clients', label: 'Управление клиентами', description: 'Создание, редактирование, удаление клиентов', category: 'clients' },
  { key: 'can_view_client_payments', label: 'Просмотр платежей', description: 'Просмотр истории платежей клиентов', category: 'clients' },
  // Подписки
  { key: 'can_view_subscriptions', label: 'Просмотр подписок', description: 'Просмотр подписок клиентов', category: 'subscriptions' },
  { key: 'can_manage_subscriptions', label: 'Управление подписками', description: 'Создание и отмена подписок', category: 'subscriptions' },
  // Рассылки
  { key: 'can_send_broadcasts', label: 'Отправка рассылок', description: 'Создание и отправка массовых рассылок', category: 'broadcasts' },
  { key: 'can_manage_notification_templates', label: 'Шаблоны уведомлений', description: 'Редактирование шаблонов уведомлений', category: 'broadcasts' },
  // Аналитика
  { key: 'can_view_analytics', label: 'Просмотр аналитики', description: 'Просмотр базовой аналитики', category: 'analytics' },
  { key: 'can_view_financial_analytics', label: 'Финансовая аналитика', description: 'Просмотр финансовых отчётов', category: 'analytics' },
  // Настройки
  { key: 'can_manage_settings', label: 'Настройки салона', description: 'Изменение настроек организации', category: 'settings' },
  { key: 'can_manage_team', label: 'Управление командой', description: 'Добавление и удаление сотрудников', category: 'settings' },
  { key: 'can_manage_integrations', label: 'Интеграции', description: 'Настройка YClients, YooKassa и др.', category: 'settings' },
  { key: 'can_manage_carousel', label: 'Баннеры и акции', description: 'Управление каруселью баннеров', category: 'settings' },
];

const PERMISSION_CATEGORIES = [
  { key: 'clients', label: 'Клиенты', color: 'blue' },
  { key: 'subscriptions', label: 'Подписки', color: 'grape' },
  { key: 'broadcasts', label: 'Рассылки', color: 'teal' },
  { key: 'analytics', label: 'Аналитика', color: 'orange' },
  { key: 'settings', label: 'Настройки', color: 'red' },
];

const DEFAULT_PERMISSIONS: Record<OrganizationRole, Record<string, boolean>> = {
  owner: Object.fromEntries(PERMISSIONS.map(p => [p.key, true])),
  admin: {
    can_view_clients: true,
    can_manage_clients: true,
    can_view_client_payments: true,
    can_view_subscriptions: true,
    can_manage_subscriptions: true,
    can_send_broadcasts: true,
    can_manage_notification_templates: true,
    can_view_analytics: true,
    can_view_financial_analytics: true,
    can_manage_settings: false,
    can_manage_team: false,
    can_manage_integrations: false,
    can_manage_carousel: true,
  },
  manager: {
    can_view_clients: true,
    can_manage_clients: false,
    can_view_client_payments: false,
    can_view_subscriptions: true,
    can_manage_subscriptions: false,
    can_send_broadcasts: false,
    can_manage_notification_templates: false,
    can_view_analytics: true,
    can_view_financial_analytics: false,
    can_manage_settings: false,
    can_manage_team: false,
    can_manage_integrations: false,
    can_manage_carousel: false,
  },
};

// Моковые данные
const MOCK_ADMINS: OrganizationAdmin[] = [
  {
    id: 1,
    client_id: 1,
    name: 'Иван Петров',
    email: 'ivan@salon.ru',
    phone: '+7 999 123-45-67',
    role: 'owner',
    is_active: true,
    created_at: '2024-01-15',
    permissions: DEFAULT_PERMISSIONS.owner,
  },
  {
    id: 2,
    client_id: 2,
    name: 'Анна Сидорова',
    email: 'anna@salon.ru',
    phone: '+7 999 234-56-78',
    role: 'admin',
    is_active: true,
    created_at: '2024-06-01',
    invited_by: 'Иван Петров',
    permissions: DEFAULT_PERMISSIONS.admin,
  },
  {
    id: 3,
    client_id: 3,
    name: 'Мария Козлова',
    email: 'maria@salon.ru',
    phone: '+7 999 345-67-89',
    role: 'manager',
    is_active: true,
    created_at: '2024-09-15',
    invited_by: 'Иван Петров',
    permissions: DEFAULT_PERMISSIONS.manager,
  },
  {
    id: 4,
    client_id: 4,
    name: 'Елена Новикова',
    phone: '+7 999 456-78-90',
    role: 'manager',
    is_active: false,
    created_at: '2024-08-01',
    invited_by: 'Анна Сидорова',
    permissions: DEFAULT_PERMISSIONS.manager,
  },
];

const breadcrumbItems = [
  { title: 'Главная', href: PATH_DASHBOARD.default },
  { title: 'Доступы', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

// ==================== МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ====================
function AddAdminModal({
  opened,
  onClose,
  onAdd,
}: {
  opened: boolean;
  onClose: () => void;
  onAdd: (data: Partial<OrganizationAdmin>) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'search' | 'configure'>('search');
  const [selectedRole, setSelectedRole] = useState<OrganizationRole>('manager');
  const [permissions, setPermissions] = useState<Record<string, boolean>>(DEFAULT_PERMISSIONS.manager);

  const form = useForm({
    initialValues: {
      searchQuery: '',
      name: '',
      email: '',
      phone: '',
    },
  });

  const handleRoleChange = (role: OrganizationRole) => {
    setSelectedRole(role);
    setPermissions(DEFAULT_PERMISSIONS[role]);
  };

  const handlePermissionToggle = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onAdd({
        name: form.values.name || 'Новый пользователь',
        email: form.values.email,
        phone: form.values.phone,
        role: selectedRole,
        permissions,
        is_active: true,
      });
      notifications.show({
        title: 'Успешно',
        message: 'Администратор добавлен',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      onClose();
      setStep('search');
      form.reset();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось добавить администратора',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep('search');
    form.reset();
    setSelectedRole('manager');
    setPermissions(DEFAULT_PERMISSIONS.manager);
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Добавить администратора" size="lg">
      <Stack gap="lg">
        {step === 'search' ? (
          <>
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              Найдите пользователя по номеру телефона или email, либо создайте приглашение.
            </Alert>

            <TextInput
              label="Поиск пользователя"
              placeholder="Телефон или email"
              leftSection={<IconSearch size={16} />}
              {...form.getInputProps('searchQuery')}
            />

            <Divider label="Или введите данные вручную" labelPosition="center" />

            <TextInput
              label="Имя"
              placeholder="Имя сотрудника"
              leftSection={<IconUser size={16} />}
              {...form.getInputProps('name')}
            />

            <Group grow>
              <TextInput
                label="Телефон"
                placeholder="+7 999 123-45-67"
                leftSection={<IconPhone size={16} />}
                {...form.getInputProps('phone')}
              />
              <TextInput
                label="Email"
                placeholder="email@example.com"
                leftSection={<IconMail size={16} />}
                {...form.getInputProps('email')}
              />
            </Group>

            <Group justify="flex-end">
              <Button variant="light" onClick={handleClose}>
                Отмена
              </Button>
              <Button onClick={() => setStep('configure')}>
                Далее: Настройка прав
              </Button>
            </Group>
          </>
        ) : (
          <>
            <Stack gap="md">
              <div>
                <Text fw={500} mb="xs">Роль</Text>
                <SegmentedControl
                  fullWidth
                  value={selectedRole}
                  onChange={(v) => handleRoleChange(v as OrganizationRole)}
                  data={[
                    { value: 'admin', label: 'Администратор' },
                    { value: 'manager', label: 'Менеджер' },
                  ]}
                />
                <Text size="xs" c="dimmed" mt="xs">
                  {selectedRole === 'admin'
                    ? 'Расширенные права: управление клиентами, подписками, рассылками'
                    : 'Базовые права: только просмотр информации'}
                </Text>
              </div>

              <Divider label="Детальные права" labelPosition="center" />

              {PERMISSION_CATEGORIES.map((category) => (
                <Paper key={category.key} p="md" radius="md" withBorder>
                  <Group justify="space-between" mb="sm">
                    <Badge color={category.color} variant="light">
                      {category.label}
                    </Badge>
                  </Group>
                  <Stack gap="xs">
                    {PERMISSIONS.filter(p => p.category === category.key).map((permission) => (
                      <Checkbox
                        key={permission.key}
                        label={permission.label}
                        description={permission.description}
                        checked={permissions[permission.key] || false}
                        onChange={() => handlePermissionToggle(permission.key)}
                        disabled={selectedRole === 'owner'}
                      />
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>

            <Group justify="space-between">
              <Button variant="light" onClick={() => setStep('search')}>
                Назад
              </Button>
              <Button onClick={handleSubmit} loading={loading} leftSection={<IconUserPlus size={16} />}>
                Добавить
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}

// ==================== МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ ПРАВ ====================
function EditPermissionsModal({
  admin,
  opened,
  onClose,
  onSave,
}: {
  admin: OrganizationAdmin | null;
  opened: boolean;
  onClose: () => void;
  onSave: (id: number, permissions: Record<string, boolean>, role: OrganizationRole) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<OrganizationRole>(admin?.role || 'manager');
  const [permissions, setPermissions] = useState<Record<string, boolean>>(admin?.permissions || {});

  // Обновляем при смене админа
  if (admin && (selectedRole !== admin.role || Object.keys(permissions).length === 0)) {
    setSelectedRole(admin.role);
    setPermissions(admin.permissions);
  }

  const handleRoleChange = (role: OrganizationRole) => {
    setSelectedRole(role);
    setPermissions(DEFAULT_PERMISSIONS[role]);
  };

  const handlePermissionToggle = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!admin) return;
    setLoading(true);
    try {
      await onSave(admin.id, permissions, selectedRole);
      notifications.show({
        title: 'Успешно',
        message: 'Права обновлены',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось обновить права',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!admin) return null;

  const isOwner = admin.role === 'owner';
  const RoleIcon = ROLE_CONFIG[admin.role].icon;

  return (
    <Modal opened={opened} onClose={onClose} title="Редактирование прав" size="lg">
      <Stack gap="lg">
        <Group>
          <Avatar src={admin.photo_url} size="lg" radius="xl" color={ROLE_CONFIG[admin.role].color}>
            {admin.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text fw={500}>{admin.name}</Text>
            <Group gap="xs">
              <Badge
                color={ROLE_CONFIG[admin.role].color}
                variant="light"
                leftSection={<RoleIcon size={12} />}
              >
                {ROLE_CONFIG[admin.role].label}
              </Badge>
              {admin.email && <Text size="sm" c="dimmed">{admin.email}</Text>}
            </Group>
          </div>
        </Group>

        {isOwner ? (
          <Alert icon={<IconCrown size={16} />} color="yellow">
            Владелец салона имеет все права. Права владельца нельзя изменить.
          </Alert>
        ) : (
          <>
            <div>
              <Text fw={500} mb="xs">Роль</Text>
              <SegmentedControl
                fullWidth
                value={selectedRole}
                onChange={(v) => handleRoleChange(v as OrganizationRole)}
                data={[
                  { value: 'admin', label: 'Администратор' },
                  { value: 'manager', label: 'Менеджер' },
                ]}
              />
            </div>

            <Divider label="Детальные права" labelPosition="center" />

            {PERMISSION_CATEGORIES.map((category) => (
              <Paper key={category.key} p="md" radius="md" withBorder>
                <Group justify="space-between" mb="sm">
                  <Badge color={category.color} variant="light">
                    {category.label}
                  </Badge>
                </Group>
                <Stack gap="xs">
                  {PERMISSIONS.filter(p => p.category === category.key).map((permission) => (
                    <Checkbox
                      key={permission.key}
                      label={permission.label}
                      description={permission.description}
                      checked={permissions[permission.key] || false}
                      onChange={() => handlePermissionToggle(permission.key)}
                    />
                  ))}
                </Stack>
              </Paper>
            ))}
          </>
        )}

        <Divider />

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Отмена
          </Button>
          {!isOwner && (
            <Button onClick={handleSave} loading={loading}>
              Сохранить
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}

// ==================== КАРТОЧКА АДМИНИСТРАТОРА ====================
function AdminCard({
  admin,
  onEdit,
  onToggleActive,
  onRemove,
}: {
  admin: OrganizationAdmin;
  onEdit: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
}) {
  const RoleIcon = ROLE_CONFIG[admin.role].icon;
  const isOwner = admin.role === 'owner';

  const activePermissions = Object.entries(admin.permissions).filter(([, v]) => v).length;
  const totalPermissions = PERMISSIONS.length;

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <Avatar src={admin.photo_url} size="lg" radius="xl" color={ROLE_CONFIG[admin.role].color}>
            {admin.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Group gap="xs">
              <Text fw={500}>{admin.name}</Text>
              {!admin.is_active && (
                <Badge size="xs" color="gray">Неактивен</Badge>
              )}
            </Group>
            <Badge
              size="sm"
              color={ROLE_CONFIG[admin.role].color}
              variant="light"
              leftSection={<RoleIcon size={12} />}
            >
              {ROLE_CONFIG[admin.role].label}
            </Badge>
          </div>
        </Group>

        {!isOwner && (
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={onEdit}>
                Редактировать права
              </Menu.Item>
              <Menu.Item
                leftSection={admin.is_active ? <IconUserMinus size={14} /> : <IconUserPlus size={14} />}
                onClick={onToggleActive}
              >
                {admin.is_active ? 'Деактивировать' : 'Активировать'}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={onRemove}>
                Удалить
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <Stack gap="xs">
        {admin.email && (
          <Group gap="xs">
            <IconMail size={14} color="gray" />
            <Text size="sm" c="dimmed">{admin.email}</Text>
          </Group>
        )}
        {admin.phone && (
          <Group gap="xs">
            <IconPhone size={14} color="gray" />
            <Text size="sm" c="dimmed">{admin.phone}</Text>
          </Group>
        )}

        <Divider my="xs" />

        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Права доступа
          </Text>
          <Badge size="sm" variant="outline" color={isOwner ? 'yellow' : 'blue'}>
            {isOwner ? 'Все права' : `${activePermissions} из ${totalPermissions}`}
          </Badge>
        </Group>

        {admin.invited_by && (
          <Text size="xs" c="dimmed">
            Приглашён: {admin.invited_by}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

// ==================== ГЛАВНАЯ СТРАНИЦА ====================
function AccessPage() {
  const [admins, setAdmins] = useState<OrganizationAdmin[]>(MOCK_ADMINS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<OrganizationAdmin | null>(null);

  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(search.toLowerCase()) ||
    admin.email?.toLowerCase().includes(search.toLowerCase()) ||
    admin.phone?.includes(search)
  );

  const handleAddAdmin = async (data: Partial<OrganizationAdmin>) => {
    // Имитация API-вызова
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newAdmin: OrganizationAdmin = {
      id: admins.length + 1,
      client_id: admins.length + 1,
      name: data.name || 'Новый администратор',
      email: data.email,
      phone: data.phone,
      role: data.role || 'manager',
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
      invited_by: 'Иван Петров',
      permissions: data.permissions || DEFAULT_PERMISSIONS.manager,
    };
    setAdmins([...admins, newAdmin]);
  };

  const handleEditPermissions = async (id: number, permissions: Record<string, boolean>, role: OrganizationRole) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAdmins(admins.map(a => a.id === id ? { ...a, permissions, role } : a));
  };

  const handleToggleActive = (admin: OrganizationAdmin) => {
    setAdmins(admins.map(a => a.id === admin.id ? { ...a, is_active: !a.is_active } : a));
    notifications.show({
      title: admin.is_active ? 'Деактивирован' : 'Активирован',
      message: admin.name,
      color: admin.is_active ? 'orange' : 'green',
    });
  };

  const handleRemove = (admin: OrganizationAdmin) => {
    setAdmins(admins.filter(a => a.id !== admin.id));
    notifications.show({
      title: 'Удалён',
      message: admin.name,
      color: 'red',
    });
  };

  const openEdit = (admin: OrganizationAdmin) => {
    setSelectedAdmin(admin);
    openEditModal();
  };

  // Статистика
  const stats = {
    total: admins.length,
    active: admins.filter(a => a.is_active).length,
    owners: admins.filter(a => a.role === 'owner').length,
    adminsCount: admins.filter(a => a.role === 'admin').length,
    managers: admins.filter(a => a.role === 'manager').length,
  };

  return (
    <>
      <title>Доступы | Beauty Slot Admin</title>
      <meta name="description" content="Управление доступами администраторов салона" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Доступы"
            breadcrumbItems={breadcrumbItems}
            actionButton={
              <Group gap="sm">
                <TextInput
                  placeholder="Поиск..."
                  leftSection={<IconSearch size={16} />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 200 }}
                />
                <Button leftSection={<IconPlus size={18} />} onClick={openAddModal}>
                  Добавить
                </Button>
              </Group>
            }
          />

          {/* Статистика */}
          <SimpleGrid cols={{ base: 2, sm: 4 }}>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xl" fw={700}>{stats.total}</Text>
                  <Text size="xs" c="dimmed">Всего</Text>
                </div>
                <ThemeIcon size="lg" variant="light" color="gray">
                  <IconUserShield size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xl" fw={700} c="yellow">{stats.owners}</Text>
                  <Text size="xs" c="dimmed">Владельцев</Text>
                </div>
                <ThemeIcon size="lg" variant="light" color="yellow">
                  <IconCrown size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xl" fw={700} c="blue">{stats.adminsCount}</Text>
                  <Text size="xs" c="dimmed">Администраторов</Text>
                </div>
                <ThemeIcon size="lg" variant="light" color="blue">
                  <IconShieldCheck size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xl" fw={700} c="green">{stats.managers}</Text>
                  <Text size="xs" c="dimmed">Менеджеров</Text>
                </div>
                <ThemeIcon size="lg" variant="light" color="green">
                  <IconUser size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          {/* Информация о ролях */}
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
            <Text size="sm">
              <strong>Владелец</strong> — полный доступ ко всем функциям.
              <strong> Администратор</strong> — расширенные права без доступа к настройкам.
              <strong> Менеджер</strong> — только просмотр информации.
            </Text>
          </Alert>

          {/* Список администраторов */}
          <Surface p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Администраторы салона</Title>
                <Badge size="lg" variant="light">
                  {stats.active} активных
                </Badge>
              </Group>

              {loading ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} height={200} />
                  ))}
                </SimpleGrid>
              ) : filteredAdmins.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                  {filteredAdmins.map((admin) => (
                    <AdminCard
                      key={admin.id}
                      admin={admin}
                      onEdit={() => openEdit(admin)}
                      onToggleActive={() => handleToggleActive(admin)}
                      onRemove={() => handleRemove(admin)}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Stack align="center" py="xl">
                  <ThemeIcon size={60} variant="light" color="gray">
                    <IconUserShield size={30} />
                  </ThemeIcon>
                  <Title order={4}>Администраторы не найдены</Title>
                  <Text c="dimmed">Добавьте первого администратора</Text>
                  <Button leftSection={<IconPlus size={16} />} onClick={openAddModal}>
                    Добавить
                  </Button>
                </Stack>
              )}
            </Stack>
          </Surface>
        </Stack>
      </Container>

      {/* Модальные окна */}
      <AddAdminModal
        opened={addModalOpened}
        onClose={closeAddModal}
        onAdd={handleAddAdmin}
      />

      <EditPermissionsModal
        admin={selectedAdmin}
        opened={editModalOpened}
        onClose={closeEditModal}
        onSave={handleEditPermissions}
      />
    </>
  );
}

export default AccessPage;
