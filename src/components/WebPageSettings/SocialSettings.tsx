'use client';

import { useState } from 'react';
import {
  Stack,
  TextInput,
  Group,
  Button,
  Paper,
  Text,
  SimpleGrid,
} from '@mantine/core';
import {
  IconBrandInstagram,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconBrandVk,
} from '@tabler/icons-react';
import type { SalonSettings } from '@/types/salon-settings';

interface SocialSettingsProps {
  settings: SalonSettings;
  onSave: (updates: Partial<SalonSettings>) => Promise<void>;
}

export function SocialSettings({ settings, onSave }: SocialSettingsProps) {
  const [instagram, setInstagram] = useState(settings.instagram || '');
  const [telegram, setTelegram] = useState(settings.telegram || '');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '');
  const [vk, setVk] = useState(settings.vk || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({
      instagram: instagram || null,
      telegram: telegram || null,
      whatsapp: whatsapp || null,
      vk: vk || null,
    });
    setHasChanges(false);
  };

  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Text fw={500} mb="md">Социальные сети</Text>
        <Text size="sm" c="dimmed" mb="md">
          Укажите ваши аккаунты в социальных сетях. Они будут отображаться на публичной странице.
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label="Instagram"
            placeholder="username"
            description="Без @, только имя пользователя"
            value={instagram}
            onChange={handleChange(setInstagram)}
            leftSection={<IconBrandInstagram size={16} />}
          />

          <TextInput
            label="Telegram"
            placeholder="username или @channel"
            description="Имя пользователя или канала"
            value={telegram}
            onChange={handleChange(setTelegram)}
            leftSection={<IconBrandTelegram size={16} />}
          />

          <TextInput
            label="WhatsApp"
            placeholder="+79991234567"
            description="Номер телефона в международном формате"
            value={whatsapp}
            onChange={handleChange(setWhatsapp)}
            leftSection={<IconBrandWhatsapp size={16} />}
          />

          <TextInput
            label="ВКонтакте"
            placeholder="username или id"
            description="Имя пользователя или ID страницы"
            value={vk}
            onChange={handleChange(setVk)}
            leftSection={<IconBrandVk size={16} />}
          />
        </SimpleGrid>
      </Paper>

      {/* Предпросмотр ссылок */}
      <Paper withBorder p="md">
        <Text fw={500} mb="sm">Предпросмотр ссылок</Text>
        <Stack gap="xs">
          {instagram && (
            <Text size="sm">
              Instagram:{' '}
              <Text component="a" href={`https://instagram.com/${instagram}`} target="_blank" c="blue" inherit>
                instagram.com/{instagram}
              </Text>
            </Text>
          )}
          {telegram && (
            <Text size="sm">
              Telegram:{' '}
              <Text component="a" href={`https://t.me/${telegram}`} target="_blank" c="blue" inherit>
                t.me/{telegram}
              </Text>
            </Text>
          )}
          {whatsapp && (
            <Text size="sm">
              WhatsApp:{' '}
              <Text component="a" href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" c="blue" inherit>
                wa.me/{whatsapp.replace(/\D/g, '')}
              </Text>
            </Text>
          )}
          {vk && (
            <Text size="sm">
              ВКонтакте:{' '}
              <Text component="a" href={`https://vk.com/${vk}`} target="_blank" c="blue" inherit>
                vk.com/{vk}
              </Text>
            </Text>
          )}
          {!instagram && !telegram && !whatsapp && !vk && (
            <Text size="sm" c="dimmed">Нет настроенных социальных сетей</Text>
          )}
        </Stack>
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
