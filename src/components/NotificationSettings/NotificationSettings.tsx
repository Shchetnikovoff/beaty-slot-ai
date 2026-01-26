'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  LoadingOverlay,
  Alert,
  Button,
  Group,
  Switch,
  Card,
  Badge,
  ActionIcon,
  Tooltip,
  SimpleGrid,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCalendar,
  IconCreditCard,
  IconEdit,
  IconRefresh,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { notificationSettingsService } from '@/services/notification-settings.service';
import type { NotificationTemplate, NotificationCategory } from '@/types/notification-settings';
import { NOTIFICATION_TYPES } from '@/types/notification-settings';
import { TemplateEditor } from './TemplateEditor';

interface TemplateItemProps {
  template: NotificationTemplate;
  onToggle: (id: number) => void;
  onEdit: (template: NotificationTemplate) => void;
  saving: boolean;
}

function TemplateItem({ template, onToggle, onEdit, saving }: TemplateItemProps) {
  const typeInfo = NOTIFICATION_TYPES.find(t => t.type === template.type);

  return (
    <Card withBorder p="md" h="100%">
      <Stack gap="sm" h="100%" justify="space-between">
        <div>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <Text fw={600} size="sm">
                {template.name}
              </Text>
              {template.send_delay_minutes && (
                <Badge size="xs" variant="light" color="gray">
                  +{template.send_delay_minutes} мин
                </Badge>
              )}
            </Group>
            <Tooltip label="Редактировать шаблон">
              <ActionIcon variant="subtle" size="sm" onClick={() => onEdit(template)}>
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {typeInfo?.description || template.description}
          </Text>
        </div>
        <Group justify="space-between" align="center">
          <Text size="xs" c={template.is_active ? 'green' : 'gray'}>
            {template.is_active ? 'Включено' : 'Отключено'}
          </Text>
          <Switch
            checked={template.is_active}
            onChange={() => onToggle(template.id)}
            disabled={saving}
            size="md"
          />
        </Group>
      </Stack>
    </Card>
  );
}

interface CategorySectionProps {
  category: NotificationCategory;
  title: string;
  icon: React.ReactNode;
  templates: NotificationTemplate[];
  onToggle: (id: number) => void;
  onEdit: (template: NotificationTemplate) => void;
  saving: boolean;
}

function CategorySection({
  category,
  title,
  icon,
  templates,
  onToggle,
  onEdit,
  saving,
}: CategorySectionProps) {
  const categoryTemplates = templates.filter(t => {
    const typeInfo = NOTIFICATION_TYPES.find(info => info.type === t.type);
    return typeInfo?.category === category;
  });

  if (categoryTemplates.length === 0) return null;

  const activeCount = categoryTemplates.filter(t => t.is_active).length;

  return (
    <Paper withBorder p="md">
      <Group mb="md">
        {icon}
        <div>
          <Text fw={600}>{title}</Text>
          <Text size="sm" c="dimmed">
            {activeCount} из {categoryTemplates.length} включено
          </Text>
        </div>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {categoryTemplates.map(template => (
          <TemplateItem
            key={template.id}
            template={template}
            onToggle={onToggle}
            onEdit={onEdit}
            saving={saving}
          />
        ))}
      </SimpleGrid>
    </Paper>
  );
}

export function NotificationSettings() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationSettingsService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Ошибка загрузки шаблонов:', err);
      setError('Не удалось загрузить шаблоны уведомлений');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleToggle = async (id: number) => {
    try {
      setSaving(true);
      const updated = await notificationSettingsService.toggleTemplate(id);
      setTemplates(prev => prev.map(t => (t.id === id ? updated : t)));
      notifications.show({
        title: updated.is_active ? 'Уведомление включено' : 'Уведомление отключено',
        message: updated.name,
        color: updated.is_active ? 'green' : 'gray',
      });
    } catch (err) {
      console.error('Ошибка переключения:', err);
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось изменить статус уведомления',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
  };

  const handleSave = async (id: number, data: Partial<NotificationTemplate>) => {
    try {
      setSaving(true);
      const updated = await notificationSettingsService.updateTemplate(id, data);
      setTemplates(prev => prev.map(t => (t.id === id ? updated : t)));
      setEditingTemplate(null);
      notifications.show({
        title: 'Сохранено',
        message: 'Шаблон успешно обновлен',
        color: 'green',
      });
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить шаблон',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (type: string) => {
    try {
      setSaving(true);
      const updated = await notificationSettingsService.resetToDefault(type as any);
      setTemplates(prev => prev.map(t => (t.type === type ? updated : t)));
      setEditingTemplate(null);
      notifications.show({
        title: 'Сброшено',
        message: 'Шаблон восстановлен по умолчанию',
        color: 'blue',
      });
    } catch (err) {
      console.error('Ошибка сброса:', err);
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сбросить шаблон',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Ошибка"
        color="red"
        variant="filled"
      >
        {error}
        <Button variant="white" size="xs" mt="xs" onClick={loadTemplates}>
          Повторить
        </Button>
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>Настройки уведомлений</Title>
          <Text c="dimmed" size="sm">
            Управляйте уведомлениями, которые отправляются клиентам
          </Text>
        </div>
        <Button
          variant="subtle"
          leftSection={<IconRefresh size={16} />}
          onClick={loadTemplates}
          loading={loading}
        >
          Обновить
        </Button>
      </Group>

      <Paper pos="relative" p={0}>
        <LoadingOverlay visible={loading} />

        <Stack gap="lg">
          {/* Визиты */}
          <CategorySection
            category="visits"
            title="Уведомления о записях"
            icon={<IconCalendar size={24} color="var(--mantine-color-blue-6)" />}
            templates={templates}
            onToggle={handleToggle}
            onEdit={handleEdit}
            saving={saving}
          />

          {/* Подписки */}
          <CategorySection
            category="subscriptions"
            title="Уведомления о подписках"
            icon={<IconCreditCard size={24} color="var(--mantine-color-green-6)" />}
            templates={templates}
            onToggle={handleToggle}
            onEdit={handleEdit}
            saving={saving}
          />
        </Stack>
      </Paper>

      {/* Редактор шаблона */}
      <TemplateEditor
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
      />
    </Stack>
  );
}
