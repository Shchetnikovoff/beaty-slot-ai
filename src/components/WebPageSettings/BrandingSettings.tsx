'use client';

import { useState } from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  ColorInput,
  Group,
  Button,
  FileButton,
  Image,
  Paper,
  Text,
  ActionIcon,
  Box,
} from '@mantine/core';
import { IconUpload, IconTrash } from '@tabler/icons-react';
import type { SalonSettings } from '@/types/salon-settings';

interface BrandingSettingsProps {
  settings: SalonSettings;
  onSave: (updates: Partial<SalonSettings>) => Promise<void>;
  onLogoUpload: (file: File) => Promise<void>;
}

export function BrandingSettings({ settings, onSave, onLogoUpload }: BrandingSettingsProps) {
  const [name, setName] = useState(settings.name);
  const [description, setDescription] = useState(settings.description);
  const [primaryColor, setPrimaryColor] = useState(settings.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(settings.secondary_color);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });
    setHasChanges(false);
  };

  const handleLogoUpload = (file: File | null) => {
    if (file) {
      onLogoUpload(file);
    }
  };

  const handleRemoveLogo = () => {
    onSave({ logo_url: null });
  };

  return (
    <Stack gap="md">
      {/* Логотип */}
      <Paper withBorder p="md">
        <Text fw={500} mb="sm">Логотип</Text>
        <Group align="flex-start">
          {settings.logo_url ? (
            <Box pos="relative">
              <Image
                src={settings.logo_url}
                alt="Логотип"
                w={120}
                h={120}
                fit="contain"
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
                onClick={handleRemoveLogo}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Box>
          ) : (
            <Paper
              withBorder
              w={120}
              h={120}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--mantine-color-gray-0)',
              }}
            >
              <Text c="dimmed" size="xs" ta="center">
                Нет логотипа
              </Text>
            </Paper>
          )}
          <Stack gap="xs">
            <FileButton onChange={handleLogoUpload} accept="image/png,image/jpeg,image/webp">
              {(props) => (
                <Button leftSection={<IconUpload size={16} />} variant="outline" {...props}>
                  Загрузить логотип
                </Button>
              )}
            </FileButton>
            <Text size="xs" c="dimmed">
              PNG, JPG или WebP, максимум 2MB
            </Text>
          </Stack>
        </Group>
      </Paper>

      {/* Название и описание */}
      <TextInput
        label="Название салона"
        placeholder="Введите название"
        value={name}
        onChange={(e) => handleChange(setName)(e.target.value)}
        required
      />

      <Textarea
        label="Описание"
        placeholder="Краткое описание салона"
        value={description}
        onChange={(e) => handleChange(setDescription)(e.target.value)}
        autosize
        minRows={3}
        maxRows={6}
      />

      {/* Цвета */}
      <Group grow>
        <ColorInput
          label="Основной цвет"
          placeholder="Выберите цвет"
          value={primaryColor}
          onChange={handleChange(setPrimaryColor)}
          swatches={['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']}
        />
        <ColorInput
          label="Дополнительный цвет"
          placeholder="Выберите цвет"
          value={secondaryColor}
          onChange={handleChange(setSecondaryColor)}
          swatches={['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
        />
      </Group>

      {/* Предпросмотр цветов */}
      <Paper withBorder p="sm">
        <Text size="sm" mb="xs">Предпросмотр</Text>
        <Group>
          <Box
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              backgroundColor: primaryColor,
            }}
          />
          <Box
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              backgroundColor: secondaryColor,
            }}
          />
          <Box
            style={{
              width: 120,
              height: 60,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            }}
          />
        </Group>
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
