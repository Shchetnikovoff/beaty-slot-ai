'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconBell,
  IconCalendarEvent,
  IconCalendarOff,
  IconCalendarPlus,
  IconCheck,
  IconClock,
  IconDeviceFloppy,
  IconEdit,
  IconGift,
  IconMail,
  IconMessageCircle,
  IconRefresh,
  IconUserCheck,
  IconUserPlus,
} from '@tabler/icons-react';

import { PageHeader } from '@/components';
import { PATH_DASHBOARD } from '@/routes';

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Уведомления клиентам', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

// Типы уведомлений (без подписок)
type NotificationType =
  | 'after_booking'
  | 'booking_reminder_day'
  | 'booking_reminder_hour'
  | 'booking_rescheduled'
  | 'booking_cancelled'
  | 'post_visit'
  | 'birthday'
  | 'welcome';

interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  description: string;
  category: 'visits' | 'marketing';
  message: string;
  isActive: boolean;
  variables: string[];
}

// Иконки для типов
const TYPE_ICONS: Record<NotificationType, typeof IconBell> = {
  after_booking: IconCalendarPlus,
  booking_reminder_day: IconClock,
  booking_reminder_hour: IconBell,
  booking_rescheduled: IconCalendarEvent,
  booking_cancelled: IconCalendarOff,
  post_visit: IconUserCheck,
  birthday: IconGift,
  welcome: IconUserPlus,
};

// Цвета для типов
const TYPE_COLORS: Record<NotificationType, string> = {
  after_booking: 'blue',
  booking_reminder_day: 'cyan',
  booking_reminder_hour: 'teal',
  booking_rescheduled: 'orange',
  booking_cancelled: 'red',
  post_visit: 'green',
  birthday: 'pink',
  welcome: 'violet',
};

// Доступные переменные
const AVAILABLE_VARIABLES = [
  { name: 'client_name', label: 'Имя клиента', example: 'Анна' },
  { name: 'client_phone', label: 'Телефон клиента', example: '+7 999 123-45-67' },
  { name: 'service_name', label: 'Название услуги', example: 'Маникюр' },
  { name: 'staff_name', label: 'Имя мастера', example: 'Мария Иванова' },
  { name: 'visit_date', label: 'Дата визита', example: '25 января' },
  { name: 'visit_time', label: 'Время визита', example: '14:00' },
  { name: 'salon_name', label: 'Название салона', example: 'Beauty Slot' },
];

function TemplateCard({
  template,
  onToggle,
  onEdit,
  loading,
}: {
  template: NotificationTemplate;
  onToggle: (id: string) => void;
  onEdit: (template: NotificationTemplate) => void;
  loading: boolean;
}) {
  const Icon = TYPE_ICONS[template.type] || IconBell;
  const color = TYPE_COLORS[template.type] || 'gray';

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="light" color={color}>
            <Icon size={20} />
          </ThemeIcon>
          <div>
            <Text fw={500}>{template.name}</Text>
            <Text size="xs" c="dimmed">{template.description}</Text>
          </div>
        </Group>
        <Switch
          checked={template.isActive}
          onChange={() => onToggle(template.id)}
          color="green"
          disabled={loading}
        />
      </Group>

      <Paper p="sm" radius="sm" bg="gray.0" mb="sm">
        <Text size="sm" c="dimmed" lineClamp={2}>
          {template.message}
        </Text>
      </Paper>

      <Group justify="space-between">
        <Group gap={4}>
          {template.variables.slice(0, 3).map((v) => (
            <Badge key={v} size="xs" variant="outline" color="gray">
              {`{${v}}`}
            </Badge>
          ))}
          {template.variables.length > 3 && (
            <Badge size="xs" variant="outline" color="gray">
              +{template.variables.length - 3}
            </Badge>
          )}
        </Group>
        <Tooltip label="Редактировать">
          <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(template)}>
            <IconEdit size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
}

function EditTemplateModal({
  template,
  opened,
  onClose,
  onSave,
  loading,
}: {
  template: NotificationTemplate | null;
  opened: boolean;
  onClose: () => void;
  onSave: (id: string, message: string) => void;
  loading: boolean;
}) {
  const [message, setMessage] = useState(template?.message || '');

  useEffect(() => {
    if (template) {
      setMessage(template.message);
    }
  }, [template]);

  const handleSave = () => {
    if (template) {
      onSave(template.id, message);
    }
  };

  const insertVariable = (varName: string) => {
    setMessage((prev) => prev + `{${varName}}`);
  };

  // Превью с подставленными значениями
  const previewMessage = message.replace(/\{(\w+)\}/g, (_, varName) => {
    const variable = AVAILABLE_VARIABLES.find((v) => v.name === varName);
    return variable?.example || `{${varName}}`;
  });

  if (!template) return null;

  const Icon = TYPE_ICONS[template.type] || IconBell;
  const color = TYPE_COLORS[template.type] || 'gray';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="md" variant="light" color={color}>
            <Icon size={16} />
          </ThemeIcon>
          <Text fw={600}>Редактирование: {template.name}</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <Textarea
          label="Текст сообщения"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minRows={4}
          autosize
        />

        <div>
          <Text size="sm" fw={500} mb="xs">Доступные переменные</Text>
          <Group gap={4}>
            {template.variables.map((varName) => {
              const variable = AVAILABLE_VARIABLES.find((v) => v.name === varName);
              return (
                <Tooltip key={varName} label={variable?.label || varName}>
                  <Badge
                    size="sm"
                    variant="light"
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => insertVariable(varName)}
                  >
                    {`{${varName}}`}
                  </Badge>
                </Tooltip>
              );
            })}
          </Group>
        </div>

        <Divider label="Предпросмотр" labelPosition="center" />

        <Paper p="md" radius="md" withBorder bg="blue.0">
          <Group gap="xs" mb="xs">
            <IconMessageCircle size={16} />
            <Text size="xs" fw={500} c="dimmed">Как увидит клиент:</Text>
          </Group>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{previewMessage}</Text>
        </Paper>

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose}>
            Отмена
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={loading}
          >
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function NotificationSettings() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('visits');
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  // Загрузка настроек из API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/v1/admin/notification-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setTemplates(data.items || []);
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      setError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Переключение активности
  const handleToggle = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const newValue = !template.isActive;

    // Оптимистичное обновление
    setTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, isActive: newValue } : t))
    );

    try {
      const response = await fetch('/api/v1/admin/notification-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: newValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      notifications.show({
        title: newValue ? 'Уведомление включено' : 'Уведомление отключено',
        message: template.name,
        color: newValue ? 'green' : 'gray',
        icon: newValue ? <IconCheck size={16} /> : undefined,
      });
    } catch {
      // Откатываем при ошибке
      setTemplates(prev =>
        prev.map(t => (t.id === id ? { ...t, isActive: !newValue } : t))
      );
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить изменения',
        color: 'red',
      });
    }
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    openModal();
  };

  const handleSave = async (id: string, message: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/admin/notification-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setTemplates(prev =>
        prev.map(t => (t.id === id ? { ...t, message } : t))
      );

      notifications.show({
        title: 'Сохранено',
        message: 'Шаблон успешно обновлён',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      closeModal();
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить шаблон',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const visitTemplates = templates.filter((t) => t.category === 'visits');
  const marketingTemplates = templates.filter((t) => t.category === 'marketing');
  const activeCount = templates.filter((t) => t.isActive).length;

  if (loading) {
    return (
      <>
        <PageHeader
          title="Уведомления клиентам"
          breadcrumbItems={breadcrumbItems}
        />
        <Box mt="xl" ta="center">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Загрузка настроек...</Text>
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Уведомления клиентам"
          breadcrumbItems={breadcrumbItems}
        />
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Ошибка загрузки"
          color="red"
          mt="md"
        >
          {error}
          <Button
            variant="light"
            color="red"
            size="xs"
            mt="sm"
            leftSection={<IconRefresh size={14} />}
            onClick={fetchSettings}
          >
            Повторить
          </Button>
        </Alert>
      </>
    );
  }

  return (
    <>
      <title>Уведомления клиентам | Beauty Slot</title>
      <meta name="description" content="Настройка уведомлений для клиентов" />

      <PageHeader
        title="Уведомления клиентам"
        breadcrumbItems={breadcrumbItems}
      />

      <Box mt="md">
        <Paper p="md" radius="md" withBorder mb="lg">
          <Group justify="space-between">
            <div>
              <Text fw={500}>Автоматические уведомления через Telegram</Text>
              <Text size="sm" c="dimmed">
                Клиенты получают напоминания автоматически после подключения к боту
              </Text>
            </div>
            <Group>
              <Badge size="lg" variant="light" color="green">
                {activeCount} из {templates.length} активно
              </Badge>
              <Tooltip label="Обновить">
                <ActionIcon variant="subtle" onClick={fetchSettings}>
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Paper>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="lg">
            <Tabs.Tab value="visits" leftSection={<IconCalendarEvent size={16} />}>
              Визиты ({visitTemplates.length})
            </Tabs.Tab>
            <Tabs.Tab value="marketing" leftSection={<IconMail size={16} />}>
              Маркетинг ({marketingTemplates.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="visits">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {visitTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  loading={saving}
                />
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="marketing">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {marketingTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  loading={saving}
                />
              ))}
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>
      </Box>

      <EditTemplateModal
        template={editingTemplate}
        opened={modalOpened}
        onClose={closeModal}
        onSave={handleSave}
        loading={saving}
      />
    </>
  );
}

export default NotificationSettings;
