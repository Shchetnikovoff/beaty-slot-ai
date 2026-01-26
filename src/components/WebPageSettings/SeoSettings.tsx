'use client';

import { useState } from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  Group,
  Button,
  Paper,
  Text,
  FileButton,
  Image,
  ActionIcon,
  Box,
} from '@mantine/core';
import { IconUpload, IconTrash, IconSearch } from '@tabler/icons-react';
import type { SalonSettings } from '@/types/salon-settings';

interface SeoSettingsProps {
  settings: SalonSettings;
  onSave: (updates: Partial<SalonSettings>) => Promise<void>;
}

export function SeoSettings({ settings, onSave }: SeoSettingsProps) {
  const [metaTitle, setMetaTitle] = useState(settings.meta_title);
  const [metaDescription, setMetaDescription] = useState(settings.meta_description);
  const [ogImageUrl, setOgImageUrl] = useState(settings.og_image_url);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const handleOgImageUpload = (file: File | null) => {
    if (file) {
      // В демо-режиме создаем локальный URL
      const url = URL.createObjectURL(file);
      setOgImageUrl(url);
      setHasChanges(true);
    }
  };

  const handleRemoveOgImage = () => {
    setOgImageUrl(null);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({
      meta_title: metaTitle,
      meta_description: metaDescription,
      og_image_url: ogImageUrl,
    });
    setHasChanges(false);
  };

  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Text fw={500} mb="xs">Мета-теги</Text>
        <Text size="sm" c="dimmed" mb="md">
          Настройки для поисковых систем и социальных сетей
        </Text>

        <Stack gap="md">
          <TextInput
            label="Заголовок страницы (title)"
            placeholder="Название салона — ключевые услуги"
            description={`${metaTitle.length}/60 символов`}
            value={metaTitle}
            onChange={handleChange(setMetaTitle)}
            leftSection={<IconSearch size={16} />}
            maxLength={60}
          />

          <Textarea
            label="Описание (description)"
            placeholder="Краткое описание салона для поисковых систем"
            description={`${metaDescription.length}/160 символов`}
            value={metaDescription}
            onChange={handleChange(setMetaDescription)}
            maxLength={160}
            autosize
            minRows={2}
            maxRows={4}
          />
        </Stack>
      </Paper>

      {/* OG Image */}
      <Paper withBorder p="md">
        <Text fw={500} mb="xs">Изображение для соц. сетей (OG Image)</Text>
        <Text size="sm" c="dimmed" mb="md">
          Изображение, которое будет показываться при шаринге ссылки в социальных сетях.
          Рекомендуемый размер: 1200x630 пикселей.
        </Text>

        <Group align="flex-start">
          {ogImageUrl ? (
            <Box pos="relative">
              <Image
                src={ogImageUrl}
                alt="OG Image"
                w={240}
                h={126}
                fit="cover"
                radius="md"
                style={{ border: '1px solid var(--mantine-color-gray-3)' }}
              />
              <ActionIcon
                variant="filled"
                color="red"
                size="sm"
                pos="absolute"
                top={-8}
                right={-8}
                onClick={handleRemoveOgImage}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Box>
          ) : (
            <Paper
              withBorder
              w={240}
              h={126}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--mantine-color-gray-0)',
              }}
            >
              <Text c="dimmed" size="xs" ta="center">
                Нет изображения
              </Text>
            </Paper>
          )}
          <Stack gap="xs">
            <FileButton onChange={handleOgImageUpload} accept="image/png,image/jpeg,image/webp">
              {(props) => (
                <Button leftSection={<IconUpload size={16} />} variant="outline" {...props}>
                  Загрузить изображение
                </Button>
              )}
            </FileButton>
            <Text size="xs" c="dimmed">
              PNG, JPG или WebP, рекомендуемый размер 1200x630
            </Text>
          </Stack>
        </Group>
      </Paper>

      {/* Предпросмотр в поиске */}
      <Paper withBorder p="md">
        <Text fw={500} mb="sm">Предпросмотр в поисковой выдаче</Text>
        <Box
          p="md"
          style={{
            backgroundColor: 'white',
            borderRadius: 8,
            border: '1px solid var(--mantine-color-gray-2)',
          }}
        >
          <Text c="blue" size="lg" style={{ textDecoration: 'none' }}>
            {metaTitle || 'Заголовок страницы'}
          </Text>
          <Text c="green" size="sm">
            beautyslot.ru/salon
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2}>
            {metaDescription || 'Описание страницы будет показано здесь...'}
          </Text>
        </Box>
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
