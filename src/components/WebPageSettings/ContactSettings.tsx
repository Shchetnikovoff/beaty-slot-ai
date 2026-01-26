'use client';

import { useState } from 'react';
import {
  Stack,
  TextInput,
  Group,
  Button,
  Paper,
  Text,
  Switch,
  SimpleGrid,
  Table,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconPhone, IconMail, IconMapPin } from '@tabler/icons-react';
import type { SalonSettings, WorkingHours } from '@/types/salon-settings';

interface ContactSettingsProps {
  settings: SalonSettings;
  onSave: (updates: Partial<SalonSettings>) => Promise<void>;
}

export function ContactSettings({ settings, onSave }: ContactSettingsProps) {
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(settings.working_hours);
  const [hasChanges, setHasChanges] = useState(false);

  const handleTextChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const handleWorkingHoursChange = (dayIndex: number, field: keyof WorkingHours, value: string | boolean) => {
    setWorkingHours(prev => prev.map((day, idx) =>
      idx === dayIndex ? { ...day, [field]: value } : day
    ));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({
      phone,
      email,
      address,
      working_hours: workingHours,
    });
    setHasChanges(false);
  };

  return (
    <Stack gap="md">
      {/* Контактная информация */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Телефон"
          placeholder="+7 (999) 123-45-67"
          value={phone}
          onChange={handleTextChange(setPhone)}
          leftSection={<IconPhone size={16} />}
        />
        <TextInput
          label="Email"
          placeholder="info@salon.ru"
          value={email}
          onChange={handleTextChange(setEmail)}
          leftSection={<IconMail size={16} />}
          type="email"
        />
      </SimpleGrid>

      <TextInput
        label="Адрес"
        placeholder="г. Москва, ул. Примерная, д. 1"
        value={address}
        onChange={handleTextChange(setAddress)}
        leftSection={<IconMapPin size={16} />}
      />

      {/* Время работы */}
      <Paper withBorder p="md">
        <Text fw={500} mb="md">Время работы</Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>День</Table.Th>
              <Table.Th w={80}>Открыто</Table.Th>
              <Table.Th w={120}>Открытие</Table.Th>
              <Table.Th w={120}>Закрытие</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {workingHours.map((day, index) => (
              <Table.Tr key={day.day}>
                <Table.Td>
                  <Text size="sm">{day.day_name}</Text>
                </Table.Td>
                <Table.Td>
                  <Switch
                    checked={day.is_open}
                    onChange={(e) => handleWorkingHoursChange(index, 'is_open', e.currentTarget.checked)}
                    size="sm"
                  />
                </Table.Td>
                <Table.Td>
                  <TimeInput
                    value={day.open_time}
                    onChange={(e) => handleWorkingHoursChange(index, 'open_time', e.currentTarget.value)}
                    disabled={!day.is_open}
                    size="xs"
                  />
                </Table.Td>
                <Table.Td>
                  <TimeInput
                    value={day.close_time}
                    onChange={(e) => handleWorkingHoursChange(index, 'close_time', e.currentTarget.value)}
                    disabled={!day.is_open}
                    size="xs"
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Кнопка сохранения */}
      <Group justify="flex-end">
        <Button onClick={handleSave} disabled={!hasChanges}>
          Сохранить изменения
        </Button>
      </Group>
    </Stack>
  );
}
