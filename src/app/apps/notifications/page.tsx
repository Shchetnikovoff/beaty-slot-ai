'use client';

import { useState } from 'react';

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBell,
  IconBellRinging,
  IconCalendarEvent,
  IconCalendarOff,
  IconCalendarPlus,
  IconCheck,
  IconClock,
  IconCreditCard,
  IconDeviceFloppy,
  IconEdit,
  IconGift,
  IconMail,
  IconMessageCircle,
  IconRefresh,
  IconStar,
  IconUserCheck,
  IconUserPlus,
  IconX,
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

// Типы уведомлений
type NotificationType =
  | 'after_booking'
  | 'booking_reminder'
  | 'booking_rescheduled'
  | 'booking_cancelled'
  | 'post_visit'
  | 'subscription_activated'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'subscription_renewed'
  | 'birthday'
  | 'welcome'
  | 'feedback_request';

interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  description: string;
  category: 'visits' | 'subscriptions' | 'marketing';
  icon: typeof IconBell;
  color: string;
  message: string;
  isActive: boolean;
  variables: string[];
}

// Шаблоны уведомлений
const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // Визиты
  {
    id: '1',
    type: 'after_booking',
    name: 'После записи',
    description: 'Отправляется сразу после создания записи',
    category: 'visits',
    icon: IconCalendarPlus,
    color: 'blue',
    message: 'Здравствуйте, {client_name}! Вы записаны на {service_name} к мастеру {staff_name} на {visit_date} в {visit_time}. Ждём вас!',
    isActive: true,
    variables: ['client_name', 'service_name', 'staff_name', 'visit_date', 'visit_time'],
  },
  {
    id: '2',
    type: 'booking_reminder',
    name: 'Напоминание о записи',
    description: 'Отправляется за день до визита',
    category: 'visits',
    icon: IconClock,
    color: 'cyan',
    message: '{client_name}, напоминаем о вашей записи завтра в {visit_time} на {service_name}. Ждём вас в {salon_name}!',
    isActive: true,
    variables: ['client_name', 'service_name', 'visit_time', 'salon_name'],
  },
  {
    id: '3',
    type: 'booking_rescheduled',
    name: 'Запись перенесена',
    description: 'При изменении даты/времени записи',
    category: 'visits',
    icon: IconCalendarEvent,
    color: 'orange',
    message: '{client_name}, ваша запись перенесена на {visit_date} в {visit_time}. Если у вас есть вопросы, свяжитесь с нами.',
    isActive: true,
    variables: ['client_name', 'visit_date', 'visit_time'],
  },
  {
    id: '4',
    type: 'booking_cancelled',
    name: 'Запись отменена',
    description: 'При отмене записи',
    category: 'visits',
    icon: IconCalendarOff,
    color: 'red',
    message: '{client_name}, ваша запись на {visit_date} отменена. Будем рады видеть вас снова!',
    isActive: true,
    variables: ['client_name', 'visit_date'],
  },
  {
    id: '5',
    type: 'post_visit',
    name: 'После посещения',
    description: 'Отправляется после завершения визита',
    category: 'visits',
    icon: IconUserCheck,
    color: 'green',
    message: '{client_name}, спасибо за визит! Надеемся, вам всё понравилось. Будем рады видеть вас снова!',
    isActive: false,
    variables: ['client_name'],
  },
  // Подписки
  {
    id: '6',
    type: 'subscription_activated',
    name: 'Подписка активирована',
    description: 'При активации новой подписки',
    category: 'subscriptions',
    icon: IconCreditCard,
    color: 'green',
    message: '{client_name}, ваша подписка "{subscription_name}" успешно активирована! Действует до {subscription_end_date}.',
    isActive: true,
    variables: ['client_name', 'subscription_name', 'subscription_end_date'],
  },
  {
    id: '7',
    type: 'subscription_expiring',
    name: 'Подписка истекает',
    description: 'За 3 дня до окончания подписки',
    category: 'subscriptions',
    icon: IconBellRinging,
    color: 'yellow',
    message: '{client_name}, ваша подписка истекает через {days_left} дня. Продлите её, чтобы не потерять преимущества!',
    isActive: true,
    variables: ['client_name', 'days_left'],
  },
  {
    id: '8',
    type: 'subscription_expired',
    name: 'Подписка истекла',
    description: 'После окончания подписки',
    category: 'subscriptions',
    icon: IconX,
    color: 'red',
    message: '{client_name}, ваша подписка истекла. Возобновите её, чтобы продолжить пользоваться преимуществами!',
    isActive: true,
    variables: ['client_name'],
  },
  {
    id: '9',
    type: 'subscription_renewed',
    name: 'Подписка продлена',
    description: 'При продлении подписки',
    category: 'subscriptions',
    icon: IconRefresh,
    color: 'teal',
    message: '{client_name}, ваша подписка успешно продлена до {subscription_end_date}. Спасибо, что остаётесь с нами!',
    isActive: true,
    variables: ['client_name', 'subscription_end_date'],
  },
  // Маркетинг
  {
    id: '10',
    type: 'birthday',
    name: 'День рождения',
    description: 'Поздравление с днём рождения',
    category: 'marketing',
    icon: IconGift,
    color: 'pink',
    message: '{client_name}, поздравляем с днём рождения! 🎂 Дарим вам скидку 15% на любую услугу в течение недели!',
    isActive: true,
    variables: ['client_name'],
  },
  {
    id: '11',
    type: 'welcome',
    name: 'Приветствие',
    description: 'При регистрации нового клиента',
    category: 'marketing',
    icon: IconUserPlus,
    color: 'blue',
    message: 'Добро пожаловать в {salon_name}, {client_name}! Мы рады, что вы с нами. Запишитесь на первую процедуру со скидкой 10%!',
    isActive: true,
    variables: ['client_name', 'salon_name'],
  },
  {
    id: '12',
    type: 'feedback_request',
    name: 'Запрос отзыва',
    description: 'Просьба оставить отзыв после визита',
    category: 'marketing',
    icon: IconStar,
    color: 'yellow',
    message: '{client_name}, как вам визит? Оставьте отзыв и помогите нам стать лучше! ⭐',
    isActive: false,
    variables: ['client_name'],
  },
];

// Доступные переменные
const AVAILABLE_VARIABLES = [
  { name: 'client_name', label: 'Имя клиента', example: 'Анна' },
  { name: 'client_phone', label: 'Телефон клиента', example: '+7 999 123-45-67' },
  { name: 'service_name', label: 'Название услуги', example: 'Маникюр' },
  { name: 'staff_name', label: 'Имя мастера', example: 'Мария Иванова' },
  { name: 'visit_date', label: 'Дата визита', example: '25 января' },
  { name: 'visit_time', label: 'Время визита', example: '14:00' },
  { name: 'salon_name', label: 'Название салона', example: 'Beauty Slot' },
  { name: 'subscription_name', label: 'Название подписки', example: 'Премиум' },
  { name: 'subscription_end_date', label: 'Дата окончания подписки', example: '31 марта' },
  { name: 'days_left', label: 'Дней до окончания', example: '3' },
];

function TemplateCard({
  template,
  onToggle,
  onEdit,
}: {
  template: NotificationTemplate;
  onToggle: (id: string) => void;
  onEdit: (template: NotificationTemplate) => void;
}) {
  const Icon = template.icon;

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="light" color={template.color}>
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
}: {
  template: NotificationTemplate | null;
  opened: boolean;
  onClose: () => void;
  onSave: (id: string, message: string) => void;
}) {
  const [message, setMessage] = useState(template?.message || '');

  const handleSave = () => {
    if (template) {
      onSave(template.id, message);
      onClose();
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="md" variant="light" color={template.color}>
            <template.icon size={16} />
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
          <Text size="sm">{previewMessage}</Text>
        </Paper>

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose}>
            Отмена
          </Button>
          <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function NotificationSettings() {
  const [templates, setTemplates] = useState(NOTIFICATION_TEMPLATES);
  const [activeTab, setActiveTab] = useState<string | null>('visits');
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const handleToggle = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    openModal();
  };

  const handleSave = (id: string, message: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, message } : t))
    );
  };

  const visitTemplates = templates.filter((t) => t.category === 'visits');
  const subscriptionTemplates = templates.filter((t) => t.category === 'subscriptions');
  const marketingTemplates = templates.filter((t) => t.category === 'marketing');

  const activeCount = templates.filter((t) => t.isActive).length;

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
              <Text fw={500}>Настройка автоматических уведомлений</Text>
              <Text size="sm" c="dimmed">
                Управляйте сообщениями, которые получают ваши клиенты
              </Text>
            </div>
            <Badge size="lg" variant="light" color="green">
              {activeCount} из {templates.length} активно
            </Badge>
          </Group>
        </Paper>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="lg">
            <Tabs.Tab value="visits" leftSection={<IconCalendarEvent size={16} />}>
              Визиты ({visitTemplates.length})
            </Tabs.Tab>
            <Tabs.Tab value="subscriptions" leftSection={<IconCreditCard size={16} />}>
              Подписки ({subscriptionTemplates.length})
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
                />
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="subscriptions">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {subscriptionTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
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
      />
    </>
  );
}

export default NotificationSettings;
