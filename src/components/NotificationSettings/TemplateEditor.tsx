'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Group,
  Button,
  Paper,
  Text,
  NumberInput,
  Divider,
  Code,
  Box,
  Tooltip,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { IconCopy, IconRefreshDot, IconDeviceFloppy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { notificationSettingsService } from '@/services/notification-settings.service';
import type { NotificationTemplate, NotificationTemplateUpdate } from '@/types/notification-settings';
import { VariablesHelp } from './VariablesHelp';

interface TemplateEditorProps {
  template: NotificationTemplate | null;
  onClose: () => void;
  onSave: (id: number, data: NotificationTemplateUpdate) => Promise<void>;
  onReset: (type: string) => Promise<void>;
  saving: boolean;
}

export function TemplateEditor({
  template,
  onClose,
  onSave,
  onReset,
  saving,
}: TemplateEditorProps) {
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendDelay, setSendDelay] = useState<number | ''>('');
  const [showVariables, setShowVariables] = useState(false);

  // Сброс формы при открытии
  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setMessageText(template.message_text);
      setSendDelay(template.send_delay_minutes ?? '');
    }
  }, [template]);

  if (!template) return null;

  const preview = notificationSettingsService.previewMessage(messageText);

  const handleSave = () => {
    onSave(template.id, {
      title,
      message_text: messageText,
      send_delay_minutes: sendDelay === '' ? null : sendDelay,
    });
  };

  const handleReset = () => {
    onReset(template.type);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message-text') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = messageText;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = `${before}{${variable}}${after}`;
      setMessageText(newText);

      // Фокус и позиция курсора
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + variable.length + 2;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      setMessageText(prev => `${prev}{${variable}}`);
    }
  };

  const hasChanges =
    title !== template.title ||
    messageText !== template.message_text ||
    (sendDelay === '' ? null : sendDelay) !== template.send_delay_minutes;

  return (
    <Modal
      opened={!!template}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={600}>Редактирование шаблона</Text>
          <Badge variant="light" color={template.is_active ? 'green' : 'gray'}>
            {template.is_active ? 'Включено' : 'Отключено'}
          </Badge>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        {/* Название уведомления (readonly) */}
        <Paper withBorder p="sm" bg="gray.0">
          <Text size="sm" c="dimmed">
            Тип уведомления
          </Text>
          <Text fw={500}>{template.name}</Text>
          {template.description && (
            <Text size="sm" c="dimmed">
              {template.description}
            </Text>
          )}
        </Paper>

        {/* Заголовок */}
        <TextInput
          label="Заголовок сообщения"
          placeholder="Введите заголовок"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Текст сообщения */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Текст сообщения
            </Text>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => setShowVariables(!showVariables)}
            >
              {showVariables ? 'Скрыть переменные' : 'Показать переменные'}
            </Button>
          </Group>
          <Textarea
            id="message-text"
            placeholder="Введите текст сообщения..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            autosize
            minRows={4}
            maxRows={10}
          />
          <Text size="xs" c="dimmed" mt="xs">
            Используйте {'{переменная}'} для подстановки данных. Например: {'{client_name}'}
          </Text>
        </div>

        {/* Справка по переменным */}
        {showVariables && (
          <VariablesHelp onInsert={insertVariable} />
        )}

        {/* Задержка отправки */}
        <NumberInput
          label="Задержка отправки (минуты)"
          description="Оставьте пустым для мгновенной отправки"
          placeholder="0"
          value={sendDelay}
          onChange={(value) => setSendDelay(value === '' ? '' : Number(value))}
          min={0}
          max={1440}
        />

        <Divider />

        {/* Превью */}
        <div>
          <Text size="sm" fw={500} mb="xs">
            Предпросмотр
          </Text>
          <Paper withBorder p="md" bg="gray.0">
            <Text fw={500} mb="xs">
              {title || 'Заголовок'}
            </Text>
            <Text
              style={{ whiteSpace: 'pre-wrap' }}
              size="sm"
            >
              {preview || 'Текст сообщения...'}
            </Text>
          </Paper>
          <Text size="xs" c="dimmed" mt="xs">
            Переменные заменены на примерные данные
          </Text>
        </div>

        <Divider />

        {/* Кнопки */}
        <Group justify="space-between">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconRefreshDot size={16} />}
            onClick={handleReset}
            disabled={saving}
          >
            Сбросить
          </Button>
          <Group>
            <Button variant="default" onClick={onClose} disabled={saving}>
              Отмена
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
            >
              Сохранить
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
