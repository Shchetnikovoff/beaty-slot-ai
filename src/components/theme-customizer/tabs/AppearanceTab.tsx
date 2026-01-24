import React from 'react';

import {
  Box,
  Button,
  ColorSwatch,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import {
  IconBorderAll,
  IconBorderRadius,
  IconCards,
  IconCircleHalf2,
  IconComponents,
  IconCube,
  IconGlass,
  IconMoonStars,
  IconPalette,
  IconRectangle,
  IconSunHigh,
  IconZoomIn,
} from '@tabler/icons-react';

import { COLOR_SCHEMES, ThemeConfig } from '@/contexts/theme-customizer';

import { ColorPicker } from '../components/ColorPicker';

interface AppearanceTabProps {
  config: ThemeConfig;
  onConfigUpdate: (path: string[], value: any) => void;
}

export const AppearanceTab = ({
  config,
  onConfigUpdate,
}: AppearanceTabProps) => {
  return (
    <Stack gap="lg">
      {/* Color Scheme */}
      <Paper p="sm" withBorder>
        <Group mb="sm">
          <IconPalette size={20} />
          <Text fw={600}>Цветовая схема</Text>
        </Group>

        <Stack gap="md">
          <Box>
            <Text size="sm" fw={500} mb={8}>
              Режим темы
            </Text>
            <SegmentedControl
              fullWidth
              data={[
                {
                  value: 'light',
                  label: (
                    <Group gap={6}>
                      <IconSunHigh size={16} />
                      <span>Светлая</span>
                    </Group>
                  ),
                },
                {
                  value: 'dark',
                  label: (
                    <Group gap={6}>
                      <IconMoonStars size={16} />
                      <span>Тёмная</span>
                    </Group>
                  ),
                },
                {
                  value: 'auto',
                  label: (
                    <Group gap={6}>
                      <IconCircleHalf2 size={16} />
                      <span>Авто</span>
                    </Group>
                  ),
                },
              ]}
              value={config.appearance.colorScheme}
              onChange={(value) =>
                onConfigUpdate(['appearance', 'colorScheme'], value)
              }
            />
          </Box>

          <Box>
            <Text size="sm" fw={500} mb={8}>
              Основной цвет
            </Text>
            <ColorPicker
              value={config.appearance.primaryColor}
              onChange={(color) =>
                onConfigUpdate(['appearance', 'primaryColor'], color)
              }
            />
          </Box>
        </Stack>
      </Paper>

      {/* UI Density */}
      <Paper p="sm" withBorder>
        <Group mb="sm">
          <IconZoomIn size={20} />
          <Text fw={600}>Плотность интерфейса</Text>
        </Group>

        <Stack gap="md">
          <Switch
            label="Компактный режим"
            description="Уменьшить отступы для более компактного интерфейса"
            checked={config.appearance.compact}
            onChange={(e) =>
              onConfigUpdate(['appearance', 'compact'], e.currentTarget.checked)
            }
          />
        </Stack>
      </Paper>

      {/* Border Radius */}
      <Paper p="sm" withBorder>
        <Group mb="sm">
          <IconBorderRadius size={20} />
          <Text fw={600}>Скругление углов</Text>
        </Group>

        <Stack gap="md">
          <Box>
            <Text size="sm" fw={500} mb={8}>
              Радиус скругления
            </Text>
            <SegmentedControl
              fullWidth
              data={[
                { value: 'xs', label: 'Острые' },
                { value: 'sm', label: 'Малые' },
                { value: 'md', label: 'Средние' },
                { value: 'lg', label: 'Большие' },
                { value: 'xl', label: 'Круглые' },
              ]}
              value={config.appearance.borderRadius}
              onChange={(value) =>
                onConfigUpdate(['appearance', 'borderRadius'], value)
              }
            />
          </Box>
        </Stack>
      </Paper>

      {/* Card Feel */}
      <Paper p="sm" withBorder>
        <Group mb="sm">
          <IconCards size={20} />
          <Text fw={600}>Стиль карточек</Text>
        </Group>

        <Stack gap="md">
          <Box>
            <Text size="sm" fw={500} mb={8}>
              Стиль карточки
            </Text>
            <SegmentedControl
              fullWidth
              data={[
                {
                  value: 'flat',
                  label: (
                    <Group gap={4}>
                      <IconRectangle size={16} />
                      <span>Плоский</span>
                    </Group>
                  ),
                },
                {
                  value: 'elevated',
                  label: (
                    <Group gap={4}>
                      <IconCube size={16} />
                      <span>Объёмный</span>
                    </Group>
                  ),
                },
                {
                  value: 'bordered',
                  label: (
                    <Group gap={4}>
                      <IconBorderAll size={16} />
                      <span>С рамкой</span>
                    </Group>
                  ),
                },
                {
                  value: 'glassmorphism',
                  label: (
                    <Group gap={4}>
                      <IconGlass size={16} />
                      <span>Стекло</span>
                    </Group>
                  ),
                },
              ]}
              value={config.appearance.cardFeel}
              onChange={(value) =>
                onConfigUpdate(['appearance', 'cardFeel'], value)
              }
            />
          </Box>

          {/* Card Feel Preview */}
          <Box>
            <Text size="sm" fw={500} mb={8}>
              Предпросмотр
            </Text>
            <SimpleGrid cols={3} spacing="xs">
              {['flat', 'bordered', 'elevated', 'glassmorphism'].map((feel) => (
                <Paper
                  key={feel}
                  p="xs"
                  className={`surface-card surface-${feel}`}
                  style={{
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border:
                      feel === 'bordered'
                        ? '1px solid var(--mantine-color-default-border)'
                        : feel === 'glassmorphism'
                          ? '1px solid rgba(255, 255, 255, 0.25)'
                          : 'none',
                    boxShadow:
                      feel === 'elevated'
                        ? 'var(--shadow-card)'
                        : feel === 'glassmorphism'
                          ? '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                          : 'none',
                    background:
                      feel === 'glassmorphism'
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%)'
                        : undefined,
                    backdropFilter:
                      feel === 'glassmorphism'
                        ? 'blur(20px) saturate(180%)'
                        : undefined,
                    WebkitBackdropFilter:
                      feel === 'glassmorphism'
                        ? 'blur(20px) saturate(180%)'
                        : undefined,
                    position: feel === 'glassmorphism' ? 'relative' : undefined,
                    overflow: feel === 'glassmorphism' ? 'hidden' : undefined,
                  }}
                >
                  {feel === 'glassmorphism' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg,
            color-mix(in srgb, var(--theme-primary-color) 15%, transparent) 0%,
            color-mix(in srgb, var(--theme-primary-color) 5%, transparent) 100%)`,
                        opacity: 0.3,
                        pointerEvents: 'none',
                        zIndex: -1,
                      }}
                    />
                  )}
                  <Text
                    size="xs"
                    ta="center"
                    style={{ position: 'relative', zIndex: 1 }}
                  >
                    {feel.charAt(0).toUpperCase() + feel.slice(1)}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Box>
        </Stack>
      </Paper>

      <Divider />

      <Stack align="center" mt="xl">
        <Text c="dimmed" size="sm">
          Скоро появятся дополнительные опции оформления
        </Text>
      </Stack>
    </Stack>
  );
};
