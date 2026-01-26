'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Grid,
  Group,
  Menu,
  Modal,
  NumberInput,
  Paper,
  Progress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconCalendar,
  IconCalendarStats,
  IconCheck,
  IconClock,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconLayoutGrid,
  IconList,
  IconMail,
  IconMoodEmpty,
  IconPhone,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconStar,
  IconUser,
  IconUserCheck,
  IconUserX,
  IconX,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { useStaff } from '@/lib/hooks/useBeautySlot';
import { staffService } from '@/services';
import type { Staff, StaffRole } from '@/types';
import { PATH_DASHBOARD } from '@/routes';

type ViewMode = 'grid' | 'table';

const items = [
  { title: 'Главная', href: PATH_DASHBOARD.default },
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

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Понедельник', short: 'Пн' },
  { key: 'tuesday', label: 'Вторник', short: 'Вт' },
  { key: 'wednesday', label: 'Среда', short: 'Ср' },
  { key: 'thursday', label: 'Четверг', short: 'Чт' },
  { key: 'friday', label: 'Пятница', short: 'Пт' },
  { key: 'saturday', label: 'Суббота', short: 'Сб' },
  { key: 'sunday', label: 'Воскресенье', short: 'Вс' },
];

// ==================== МОДАЛЬНОЕ ОКНО ПРОСМОТРА ====================
function ViewStaffModal({
  staff,
  opened,
  onClose,
  onEdit,
  onSchedule,
}: {
  staff: Staff | null;
  opened: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSchedule: () => void;
}) {
  if (!staff) return null;

  // Моковые данные статистики
  const stats = {
    appointmentsToday: staff.appointments_count || 3,
    appointmentsWeek: 18,
    revenue: 45600,
    avgRating: staff.rating || 4.8,
    reviewsCount: 124,
    clientsCount: 89,
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Профиль сотрудника" size="lg">
      <Stack gap="lg">
        {/* Шапка профиля */}
        <Group>
          <Avatar
            src={staff.photo_url}
            size={100}
            radius="xl"
            color={staff.is_active ? 'blue' : 'gray'}
          >
            {staff.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={3}>{staff.name}</Title>
                <Text c="dimmed">{staff.specialization || ROLE_LABELS[staff.role]}</Text>
              </div>
              <Group gap="xs">
                <Badge color={ROLE_COLORS[staff.role]} size="lg">
                  {ROLE_LABELS[staff.role]}
                </Badge>
                {staff.is_active ? (
                  <Badge color="green" size="lg">Активен</Badge>
                ) : (
                  <Badge color="gray" size="lg">Неактивен</Badge>
                )}
              </Group>
            </Group>
          </div>
        </Group>

        <Divider />

        {/* Контактная информация */}
        <Stack gap="xs">
          <Title order={5}>Контактная информация</Title>
          <Group gap="xl">
            {staff.phone && (
              <Group gap="xs">
                <ThemeIcon variant="light" size="sm">
                  <IconPhone size={14} />
                </ThemeIcon>
                <Text size="sm">{staff.phone}</Text>
              </Group>
            )}
            {staff.email && (
              <Group gap="xs">
                <ThemeIcon variant="light" size="sm">
                  <IconMail size={14} />
                </ThemeIcon>
                <Text size="sm">{staff.email}</Text>
              </Group>
            )}
          </Group>
        </Stack>

        <Divider />

        {/* Статистика */}
        <Stack gap="xs">
          <Title order={5}>Статистика</Title>
          <SimpleGrid cols={3}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap={4} align="center">
                <Text size="2rem" fw={700} c="blue">{stats.appointmentsToday}</Text>
                <Text size="xs" c="dimmed">Записей сегодня</Text>
              </Stack>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Stack gap={4} align="center">
                <Text size="2rem" fw={700} c="teal">{stats.appointmentsWeek}</Text>
                <Text size="xs" c="dimmed">За неделю</Text>
              </Stack>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Stack gap={4} align="center">
                <Text size="2rem" fw={700} c="green">{stats.revenue.toLocaleString('ru-RU')} ₽</Text>
                <Text size="xs" c="dimmed">Выручка за месяц</Text>
              </Stack>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={3}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap={4} align="center">
                <Group gap={4}>
                  <IconStar size={20} color="gold" />
                  <Text size="xl" fw={700}>{stats.avgRating.toFixed(1)}</Text>
                </Group>
                <Text size="xs" c="dimmed">Средний рейтинг</Text>
              </Stack>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Stack gap={4} align="center">
                <Text size="xl" fw={700}>{stats.reviewsCount}</Text>
                <Text size="xs" c="dimmed">Отзывов</Text>
              </Stack>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Stack gap={4} align="center">
                <Text size="xl" fw={700}>{stats.clientsCount}</Text>
                <Text size="xs" c="dimmed">Клиентов</Text>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>

        {/* Загрузка на неделю */}
        <Stack gap="xs">
          <Title order={5}>Загрузка на эту неделю</Title>
          <Stack gap="xs">
            {DAYS_OF_WEEK.slice(0, 5).map((day, idx) => {
              const occupancy = [78, 85, 62, 90, 45][idx];
              return (
                <Group key={day.key} gap="xs">
                  <Text size="sm" w={30}>{day.short}</Text>
                  <Progress
                    value={occupancy}
                    size="lg"
                    radius="xl"
                    style={{ flex: 1 }}
                    color={occupancy >= 80 ? 'green' : occupancy >= 50 ? 'yellow' : 'orange'}
                  />
                  <Text size="sm" fw={500} w={40} ta="right">{occupancy}%</Text>
                </Group>
              );
            })}
          </Stack>
        </Stack>

        <Divider />

        {/* Кнопки действий */}
        <Group justify="flex-end">
          <Button variant="light" leftSection={<IconCalendar size={16} />} onClick={onSchedule}>
            Расписание
          </Button>
          <Button leftSection={<IconEdit size={16} />} onClick={onEdit}>
            Редактировать
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ==================== МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ ====================
function EditStaffModal({
  staff,
  opened,
  onClose,
  onSave,
}: {
  staff: Staff | null;
  opened: boolean;
  onClose: () => void;
  onSave: (data: Partial<Staff>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const form = useForm({
    initialValues: {
      name: staff?.name || '',
      phone: staff?.phone || '',
      email: staff?.email || '',
      specialization: staff?.specialization || '',
      role: staff?.role || 'MASTER',
      is_active: staff?.is_active ?? true,
      description: '',
    },
  });

  // Обновляем форму при смене сотрудника
  if (staff && form.values.name !== staff.name && !form.isDirty()) {
    form.setValues({
      name: staff.name || '',
      phone: staff.phone || '',
      email: staff.email || '',
      specialization: staff.specialization || '',
      role: staff.role || 'MASTER',
      is_active: staff.is_active ?? true,
      description: '',
    });
  }

  const handleSubmit = async (values: typeof form.values) => {
    setSaving(true);
    try {
      await onSave(values);
      notifications.show({
        title: 'Успешно',
        message: 'Данные сотрудника обновлены',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить изменения',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!staff) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Редактирование сотрудника" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group align="flex-start">
            <Avatar
              src={staff.photo_url}
              size={80}
              radius="xl"
              color="blue"
            >
              {staff.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text size="sm" c="dimmed">Фото загружается из YClients</Text>
              <Button variant="light" size="xs" disabled>
                Изменить фото
              </Button>
            </Stack>
          </Group>

          <TextInput
            label="Имя"
            placeholder="Введите имя сотрудника"
            leftSection={<IconUser size={16} />}
            {...form.getInputProps('name')}
            required
          />

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

          <TextInput
            label="Специализация"
            placeholder="Например: Стилист-колорист"
            {...form.getInputProps('specialization')}
          />

          <Select
            label="Роль"
            data={[
              { value: 'MASTER', label: 'Мастер' },
              { value: 'ADMIN', label: 'Администратор' },
              { value: 'MANAGER', label: 'Менеджер' },
            ]}
            {...form.getInputProps('role')}
          />

          <Textarea
            label="Описание"
            placeholder="Краткое описание сотрудника..."
            rows={3}
            {...form.getInputProps('description')}
          />

          <Switch
            label="Активен"
            description="Неактивные сотрудники не отображаются в записи"
            {...form.getInputProps('is_active', { type: 'checkbox' })}
          />

          <Divider />

          <Group justify="flex-end">
            <Button variant="light" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ==================== МОДАЛЬНОЕ ОКНО РАСПИСАНИЯ ====================
interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
}

type WeekSchedule = Record<string, DaySchedule>;

function ScheduleModal({
  staff,
  opened,
  onClose,
  onSave,
}: {
  staff: Staff | null;
  opened: boolean;
  onClose: () => void;
  onSave: (schedule: WeekSchedule) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const initial: WeekSchedule = {};
    DAYS_OF_WEEK.forEach((day, idx) => {
      initial[day.key] = {
        enabled: idx < 5, // Пн-Пт включены по умолчанию
        start: '09:00',
        end: '19:00',
        breakStart: '13:00',
        breakEnd: '14:00',
      };
    });
    return initial;
  });

  const handleDayToggle = (dayKey: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], enabled: !prev[dayKey].enabled },
    }));
  };

  const handleTimeChange = (dayKey: string, field: keyof DaySchedule, value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(schedule);
      notifications.show({
        title: 'Успешно',
        message: 'Расписание сохранено',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить расписание',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setSaving(false);
    }
  };

  const applyToAll = () => {
    const monday = schedule.monday;
    setSchedule((prev) => {
      const newSchedule: WeekSchedule = {};
      DAYS_OF_WEEK.forEach((day) => {
        newSchedule[day.key] = { ...monday };
      });
      return newSchedule;
    });
  };

  if (!staff) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Расписание работы" size="xl">
      <Stack gap="lg">
        <Group>
          <Avatar src={staff.photo_url} size="md" radius="xl" color="blue">
            {staff.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text fw={500}>{staff.name}</Text>
            <Text size="sm" c="dimmed">{staff.specialization || ROLE_LABELS[staff.role]}</Text>
          </div>
        </Group>

        <Group justify="space-between">
          <Title order={5}>Рабочие дни</Title>
          <Button variant="light" size="xs" onClick={applyToAll}>
            Применить Пн ко всем дням
          </Button>
        </Group>

        <Stack gap="sm">
          {DAYS_OF_WEEK.map((day) => (
            <Paper key={day.key} p="sm" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Group gap="md" style={{ minWidth: 140 }}>
                  <Switch
                    checked={schedule[day.key].enabled}
                    onChange={() => handleDayToggle(day.key)}
                  />
                  <Text size="sm" fw={500} c={schedule[day.key].enabled ? undefined : 'dimmed'}>
                    {day.label}
                  </Text>
                </Group>

                {schedule[day.key].enabled ? (
                  <Group gap="md" wrap="nowrap">
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">Работа:</Text>
                      <TextInput
                        size="xs"
                        w={70}
                        value={schedule[day.key].start}
                        onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                        placeholder="09:00"
                      />
                      <Text size="xs">—</Text>
                      <TextInput
                        size="xs"
                        w={70}
                        value={schedule[day.key].end}
                        onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                        placeholder="19:00"
                      />
                    </Group>

                    <Divider orientation="vertical" />

                    <Group gap="xs">
                      <Text size="xs" c="dimmed">Перерыв:</Text>
                      <TextInput
                        size="xs"
                        w={70}
                        value={schedule[day.key].breakStart}
                        onChange={(e) => handleTimeChange(day.key, 'breakStart', e.target.value)}
                        placeholder="13:00"
                      />
                      <Text size="xs">—</Text>
                      <TextInput
                        size="xs"
                        w={70}
                        value={schedule[day.key].breakEnd}
                        onChange={(e) => handleTimeChange(day.key, 'breakEnd', e.target.value)}
                        placeholder="14:00"
                      />
                    </Group>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">Выходной</Text>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>

        {/* Визуализация расписания */}
        <Stack gap="xs">
          <Title order={5}>Визуализация недели</Title>
          <Paper p="md" radius="md" withBorder bg="gray.0">
            <Group gap="xs" justify="space-between">
              {DAYS_OF_WEEK.map((day) => {
                const dayData = schedule[day.key];
                return (
                  <Stack key={day.key} align="center" gap={4} style={{ flex: 1 }}>
                    <Text size="xs" fw={500}>{day.short}</Text>
                    {dayData.enabled ? (
                      <Tooltip label={`${dayData.start} — ${dayData.end}`}>
                        <Box
                          style={{
                            width: '100%',
                            height: 60,
                            borderRadius: 4,
                            backgroundColor: 'var(--mantine-color-blue-5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text size="xs" c="white" fw={500}>
                            {parseInt(dayData.end) - parseInt(dayData.start)}ч
                          </Text>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Box
                        style={{
                          width: '100%',
                          height: 60,
                          borderRadius: 4,
                          backgroundColor: 'var(--mantine-color-gray-3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text size="xs" c="dimmed">—</Text>
                      </Box>
                    )}
                  </Stack>
                );
              })}
            </Group>
          </Paper>
        </Stack>

        <Divider />

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} loading={saving} leftSection={<IconCheck size={16} />}>
            Сохранить расписание
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ==================== КАРТОЧКА СОТРУДНИКА ====================
function StaffCard({
  staff,
  onView,
  onEdit,
  onSchedule,
  onToggleActive,
}: {
  staff: Staff;
  onView: (staff: Staff) => void;
  onEdit: (staff: Staff) => void;
  onSchedule: (staff: Staff) => void;
  onToggleActive: (staff: Staff) => void;
}) {
  return (
    <Paper p="md" radius="md" withBorder style={{ position: 'relative' }}>
      {/* Кнопка меню - всегда в правом верхнем углу */}
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon variant="subtle" style={{ position: 'absolute', top: 12, right: 12 }}>
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
          <Menu.Item leftSection={<IconCalendar size={14} />} onClick={() => onSchedule(staff)}>
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

      <Group mb="md" style={{ paddingRight: 32 }}>
        <Avatar src={staff.photo_url} size="lg" radius="xl" color={staff.is_active ? 'blue' : 'gray'}>
          {staff.name?.charAt(0).toUpperCase()}
        </Avatar>
        <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
          <Group gap="xs" mb={4}>
            <Text fw={500} truncate style={{ flex: 1 }}>{staff.name}</Text>
            <Badge color={staff.is_active ? 'green' : 'red'} variant="light" size="sm">
              {staff.is_active ? 'Активен' : 'Неактивен'}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed" truncate>
            {staff.specialization || ROLE_LABELS[staff.role]}
          </Text>
        </div>
      </Group>

      <Stack gap="xs">
        <Group gap="xs">
          <Badge color={ROLE_COLORS[staff.role]} variant="light" size="sm">
            {ROLE_LABELS[staff.role]}
          </Badge>
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

// ==================== ТАБЛИЧНЫЙ ВИД ====================
function StaffTableView({
  staffList,
  onView,
  onEdit,
  onSchedule,
  onToggleActive,
}: {
  staffList: Staff[];
  onView: (staff: Staff) => void;
  onEdit: (staff: Staff) => void;
  onSchedule: (staff: Staff) => void;
  onToggleActive: (staff: Staff) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Сотрудник</Table.Th>
            <Table.Th>Телефон</Table.Th>
            <Table.Th>Специализация</Table.Th>
            <Table.Th>Роль</Table.Th>
            <Table.Th ta="center">Рейтинг</Table.Th>
            <Table.Th ta="center">Записей</Table.Th>
            <Table.Th>Статус</Table.Th>
            <Table.Th ta="right">Действия</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {staffList.map((staff) => (
            <Table.Tr key={staff.id}>
              <Table.Td>
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
              </Table.Td>
              <Table.Td>
                <Text size="sm" c={staff.phone ? undefined : 'dimmed'}>
                  {staff.phone || '—'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c={staff.specialization ? undefined : 'dimmed'}>
                  {staff.specialization || '—'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge color={ROLE_COLORS[staff.role]} variant="light" size="sm">
                  {ROLE_LABELS[staff.role]}
                </Badge>
              </Table.Td>
              <Table.Td ta="center">
                {staff.rating !== undefined ? (
                  <Group gap="xs" justify="center">
                    <IconStar size={14} color="gold" />
                    <Text size="sm">{staff.rating.toFixed(1)}</Text>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">—</Text>
                )}
              </Table.Td>
              <Table.Td ta="center">
                <Text size="sm">{staff.appointments_count ?? '—'}</Text>
              </Table.Td>
              <Table.Td>
                {staff.is_active ? (
                  <Badge color="green" variant="light" size="sm">
                    Активен
                  </Badge>
                ) : (
                  <Badge color="gray" variant="light" size="sm">
                    Неактивен
                  </Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <Tooltip label="Просмотр">
                    <ActionIcon variant="subtle" onClick={() => onView(staff)}>
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Редактировать">
                    <ActionIcon variant="subtle" onClick={() => onEdit(staff)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Расписание">
                    <ActionIcon variant="subtle" onClick={() => onSchedule(staff)}>
                      <IconCalendar size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={staff.is_active ? 'Деактивировать' : 'Активировать'}>
                    <ActionIcon
                      variant="subtle"
                      color={staff.is_active ? 'red' : 'green'}
                      onClick={() => onToggleActive(staff)}
                    >
                      {staff.is_active ? <IconUserX size={16} /> : <IconUserCheck size={16} />}
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}

// ==================== ГЛАВНАЯ СТРАНИЦА ====================
function Team() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Модальные окна
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [scheduleModalOpened, { open: openScheduleModal, close: closeScheduleModal }] = useDisclosure(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

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
      notifications.show({
        title: 'Синхронизация завершена',
        message: `Обновлено сотрудников: ${result?.updated || 0}`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      refetchStaff();
    } catch (error) {
      notifications.show({
        title: 'Ошибка синхронизации',
        message: 'Не удалось синхронизировать данные',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    openViewModal();
  };

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    closeViewModal();
    openEditModal();
  };

  const handleScheduleStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    closeViewModal();
    openScheduleModal();
  };

  const handleSaveStaff = async (data: Partial<Staff>) => {
    if (!selectedStaff) return;
    await staffService.updateStaffMember(selectedStaff.id, data);
    refetchStaff();
  };

  const handleSaveSchedule = async (schedule: WeekSchedule) => {
    if (!selectedStaff) return;
    // Здесь будет вызов API для сохранения расписания
    console.log('Saving schedule for', selectedStaff.name, schedule);
    // await staffService.updateSchedule(selectedStaff.id, schedule);
    refetchStaff();
  };

  const handleToggleActive = async (staff: Staff) => {
    const newStatus = !staff.is_active;
    try {
      await staffService.toggleActive(staff.id, newStatus);
      notifications.show({
        title: newStatus ? 'Сотрудник активирован' : 'Сотрудник деактивирован',
        message: staff.name,
        color: newStatus ? 'green' : 'orange',
        icon: newStatus ? <IconUserCheck size={16} /> : <IconUserX size={16} />,
      });
      await refetchStaff();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось изменить статус сотрудника',
        color: 'red',
        icon: <IconX size={16} />,
      });
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
            onSchedule={handleScheduleStaff}
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
          onSchedule={handleScheduleStaff}
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

      {/* Модальные окна */}
      <ViewStaffModal
        staff={selectedStaff}
        opened={viewModalOpened}
        onClose={closeViewModal}
        onEdit={() => handleEditStaff(selectedStaff!)}
        onSchedule={() => handleScheduleStaff(selectedStaff!)}
      />

      <EditStaffModal
        staff={selectedStaff}
        opened={editModalOpened}
        onClose={closeEditModal}
        onSave={handleSaveStaff}
      />

      <ScheduleModal
        staff={selectedStaff}
        opened={scheduleModalOpened}
        onClose={closeScheduleModal}
        onSave={handleSaveSchedule}
      />
    </>
  );
}

export default Team;
