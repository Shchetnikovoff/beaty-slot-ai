'use client';

import { useState } from 'react';
import {
  Stack,
  Switch,
  Group,
  Button,
  Paper,
  Text,
} from '@mantine/core';
import {
  IconCalendar,
  IconCreditCard,
  IconCurrencyRubel,
  IconUsers,
} from '@tabler/icons-react';
import type { SalonSettings } from '@/types/salon-settings';

interface FeaturesSettingsProps {
  settings: SalonSettings;
  onSave: (updates: Partial<SalonSettings>) => Promise<void>;
}

interface FeatureToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FeatureToggle({ icon, title, description, checked, onChange }: FeatureToggleProps) {
  return (
    <Paper withBorder p="md">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" wrap="nowrap">
          <Paper
            p="sm"
            style={{
              backgroundColor: checked
                ? 'var(--mantine-color-blue-0)'
                : 'var(--mantine-color-gray-0)',
            }}
          >
            {icon}
          </Paper>
          <div>
            <Text fw={500}>{title}</Text>
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          </div>
        </Group>
        <Switch
          checked={checked}
          onChange={(e) => onChange(e.currentTarget.checked)}
          size="lg"
        />
      </Group>
    </Paper>
  );
}

export function FeaturesSettings({ settings, onSave }: FeaturesSettingsProps) {
  const [bookingEnabled, setBookingEnabled] = useState(settings.booking_enabled);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(settings.online_payment_enabled);
  const [showPrices, setShowPrices] = useState(settings.show_prices);
  const [showStaff, setShowStaff] = useState(settings.show_staff);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: (value: boolean) => void) => (value: boolean) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({
      booking_enabled: bookingEnabled,
      online_payment_enabled: onlinePaymentEnabled,
      show_prices: showPrices,
      show_staff: showStaff,
    });
    setHasChanges(false);
  };

  return (
    <Stack gap="md">
      <Text fw={500}>Функции публичной страницы</Text>
      <Text size="sm" c="dimmed">
        Настройте, какие функции будут доступны на публичной странице вашего салона.
      </Text>

      <Stack gap="sm">
        <FeatureToggle
          icon={<IconCalendar size={24} color="var(--mantine-color-blue-6)" />}
          title="Онлайн-запись"
          description="Клиенты смогут записываться на услуги прямо с сайта"
          checked={bookingEnabled}
          onChange={handleChange(setBookingEnabled)}
        />

        <FeatureToggle
          icon={<IconCreditCard size={24} color="var(--mantine-color-green-6)" />}
          title="Онлайн-оплата"
          description="Возможность оплатить услуги при бронировании"
          checked={onlinePaymentEnabled}
          onChange={handleChange(setOnlinePaymentEnabled)}
        />

        <FeatureToggle
          icon={<IconCurrencyRubel size={24} color="var(--mantine-color-yellow-7)" />}
          title="Показывать цены"
          description="Отображать цены на услуги на публичной странице"
          checked={showPrices}
          onChange={handleChange(setShowPrices)}
        />

        <FeatureToggle
          icon={<IconUsers size={24} color="var(--mantine-color-violet-6)" />}
          title="Показывать мастеров"
          description="Отображать список мастеров и их специализации"
          checked={showStaff}
          onChange={handleChange(setShowStaff)}
        />
      </Stack>

      {/* Кнопка сохранения */}
      <Group justify="flex-end" mt="md">
        <Button onClick={handleSave} disabled={!hasChanges}>
          Сохранить изменения
        </Button>
      </Group>
    </Stack>
  );
}
