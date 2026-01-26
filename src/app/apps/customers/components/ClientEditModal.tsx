'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Group,
  Modal,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';

import type { Client } from '@/types';

interface ClientEditModalProps {
  client: Client | null;
  opened: boolean;
  onClose: () => void;
  onSave?: (client: Client, data: EditFormData) => void;
}

interface EditFormData {
  name: string;
  phone: string;
  email: string;
  comment: string;
}

export function ClientEditModal({
  client,
  opened,
  onClose,
  onSave,
}: ClientEditModalProps) {
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    phone: '',
    email: '',
    comment: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when client changes or modal opens
  useEffect(() => {
    if (client && opened) {
      setEditForm({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        comment: client.comment || '',
      });
    }
  }, [client, opened]);

  const handleSave = async () => {
    if (!client) return;

    setIsSaving(true);
    // TODO: Implement API call
    setTimeout(() => {
      setIsSaving(false);
      onSave?.(client, editForm);
      onClose();
    }, 500);
  };

  if (!client) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconEdit size={20} />
          <span>Редактирование клиента</span>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="ФИО"
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          placeholder="Иванова Анна Петровна"
        />
        <TextInput
          label="Телефон"
          value={editForm.phone}
          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          placeholder="+7 (999) 123-45-67"
        />
        <TextInput
          label="Email"
          value={editForm.email}
          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          placeholder="example@mail.ru"
        />
        <Textarea
          label="Примечания"
          value={editForm.comment}
          onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
          placeholder="Дополнительная информация о клиенте"
          minRows={3}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
