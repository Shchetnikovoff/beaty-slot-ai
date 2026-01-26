'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Tabs,
  Stack,
  Title,
  Text,
  LoadingOverlay,
  Alert,
  Button,
  Group,
} from '@mantine/core';
import {
  IconPalette,
  IconPhone,
  IconBrandInstagram,
  IconSeo,
  IconSettings,
  IconExternalLink,
  IconAlertCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { salonSettingsService } from '@/services/salon-settings.service';
import type { SalonSettings } from '@/types/salon-settings';

import { BrandingSettings } from './BrandingSettings';
import { ContactSettings } from './ContactSettings';
import { SocialSettings } from './SocialSettings';
import { SeoSettings } from './SeoSettings';
import { FeaturesSettings } from './FeaturesSettings';

export function WebPageSettings() {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('branding');

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await salonSettingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Ошибка загрузки настроек:', err);
      setError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (updates: Partial<SalonSettings>) => {
    if (!settings) return;

    try {
      setSaving(true);
      const updated = await salonSettingsService.updateSettings(updates);
      setSettings(updated);
      notifications.show({
        title: 'Сохранено',
        message: 'Настройки успешно обновлены',
        color: 'green',
      });
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить настройки',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setSaving(true);
      const logoUrl = await salonSettingsService.uploadLogo(file);
      setSettings(prev => prev ? { ...prev, logo_url: logoUrl } : null);
      notifications.show({
        title: 'Логотип загружен',
        message: 'Логотип успешно обновлен',
        color: 'green',
      });
    } catch (err) {
      console.error('Ошибка загрузки логотипа:', err);
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить логотип',
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
        <Button
          variant="white"
          size="xs"
          mt="xs"
          onClick={loadSettings}
        >
          Повторить
        </Button>
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>Настройки веб-страницы</Title>
          <Text c="dimmed" size="sm">
            Настройте публичную страницу вашего салона
          </Text>
        </div>
        <Button
          variant="light"
          leftSection={<IconExternalLink size={16} />}
          component="a"
          href="/salon"
          target="_blank"
        >
          Открыть страницу
        </Button>
      </Group>

      <Paper shadow="xs" p="md" pos="relative">
        <LoadingOverlay visible={loading || saving} />

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="branding" leftSection={<IconPalette size={16} />}>
              Брендинг
            </Tabs.Tab>
            <Tabs.Tab value="contacts" leftSection={<IconPhone size={16} />}>
              Контакты
            </Tabs.Tab>
            <Tabs.Tab value="social" leftSection={<IconBrandInstagram size={16} />}>
              Соц. сети
            </Tabs.Tab>
            <Tabs.Tab value="seo" leftSection={<IconSeo size={16} />}>
              SEO
            </Tabs.Tab>
            <Tabs.Tab value="features" leftSection={<IconSettings size={16} />}>
              Функции
            </Tabs.Tab>
          </Tabs.List>

          {settings && (
            <>
              <Tabs.Panel value="branding" pt="md">
                <BrandingSettings
                  settings={settings}
                  onSave={handleSave}
                  onLogoUpload={handleLogoUpload}
                />
              </Tabs.Panel>

              <Tabs.Panel value="contacts" pt="md">
                <ContactSettings
                  settings={settings}
                  onSave={handleSave}
                />
              </Tabs.Panel>

              <Tabs.Panel value="social" pt="md">
                <SocialSettings
                  settings={settings}
                  onSave={handleSave}
                />
              </Tabs.Panel>

              <Tabs.Panel value="seo" pt="md">
                <SeoSettings
                  settings={settings}
                  onSave={handleSave}
                />
              </Tabs.Panel>

              <Tabs.Panel value="features" pt="md">
                <FeaturesSettings
                  settings={settings}
                  onSave={handleSave}
                />
              </Tabs.Panel>
            </>
          )}
        </Tabs>
      </Paper>
    </Stack>
  );
}
