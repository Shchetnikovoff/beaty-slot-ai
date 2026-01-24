import React from 'react';

import {
  Box,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import {
  IconCircle,
  IconLayoutDistributeVertical,
  IconLayoutNavbar,
  IconLayoutSidebar,
  IconRectangle,
  IconSquare,
  IconTextDirectionLtr,
} from '@tabler/icons-react';

import { ThemeConfig } from '@/contexts/theme-customizer';

interface LayoutTabProps {
  config: ThemeConfig;
  onConfigUpdate: (path: string[], value: any) => void;
}

export const LayoutTab = ({ config, onConfigUpdate }: LayoutTabProps) => {
  const sidebarVariantOptions = [
    { value: 'default', label: 'По умолчанию' },
    { value: 'colored', label: 'Цветной' },
    { value: 'gradient', label: 'Градиент' },
    { value: 'glassmorphism', label: 'Стекло' },
  ];

  const headerVariantOptions = [
    { value: 'default', label: 'По умолчанию' },
    { value: 'colored', label: 'Цветной' },
    { value: 'gradient', label: 'Градиент' },
    { value: 'glassmorphism', label: 'Стекло' },
  ];

  return (
    <Stack gap="lg">
      {/* Sidebar Configuration */}
      <Paper p="sm" withBorder>
        <Group mb="sm">
          <IconLayoutSidebar size={20} />
          <Text fw={600}>Боковая панель</Text>
        </Group>

        <Stack gap="md">
          <Select
            label="Вариант"
            data={sidebarVariantOptions}
            value={config.layout.sidebar.variant}
            onChange={(value) =>
              onConfigUpdate(['layout', 'sidebar', 'variant'], value)
            }
          />

          <Stack gap={0}>
            <Text fz="sm" fw={500} mb={4}>
              Позиция
            </Text>
            <SegmentedControl
              data={[
                { value: 'left', label: 'Слева' },
                { value: 'right', label: 'Справа' },
              ]}
              value={config.layout.sidebar.position}
              onChange={(value) =>
                onConfigUpdate(['layout', 'sidebar', 'position'], value)
              }
            />
          </Stack>

          <Box>
            <Text size="sm" fw={500} mb={4}>
              Ширина
            </Text>
            <SegmentedControl
              data={[
                { value: '250', label: 'Узкая' },
                { value: '300', label: 'Обычная' },
                { value: '350', label: 'Широкая' },
              ]}
              value={config.layout.sidebar.width.toString()}
              onChange={(value) =>
                onConfigUpdate(['layout', 'sidebar', 'width'], parseInt(value))
              }
            />
          </Box>

          <Switch
            label="Видимость"
            description="Показать или скрыть боковую панель"
            checked={config.layout.sidebar.visible}
            onChange={(e) =>
              onConfigUpdate(
                ['layout', 'sidebar', 'visible'],
                e.currentTarget.checked,
              )
            }
          />

          <Switch
            label="Режим наложения"
            description="Боковая панель накладывается на контент вместо сдвига"
            checked={config.layout.sidebar.overlay}
            onChange={(e) =>
              onConfigUpdate(
                ['layout', 'sidebar', 'overlay'],
                e.currentTarget.checked,
              )
            }
          />
        </Stack>
      </Paper>

      {/* Header Configuration */}
      <Paper p="sm" withBorder>
        <Group mb="sm">
          <IconLayoutNavbar size={20} />
          <Text fw={600}>Шапка</Text>
        </Group>

        <Stack gap="md">
          <Select
            label="Вариант"
            data={headerVariantOptions}
            value={config.layout.header.variant}
            onChange={(value) =>
              onConfigUpdate(['layout', 'header', 'variant'], value)
            }
          />

          <Select
            label="Позиция"
            data={[
              { value: 'fixed', label: 'Фиксированная' },
              { value: 'sticky', label: 'Липкая' },
              { value: 'static', label: 'Статичная' },
            ]}
            value={config.layout.header.position}
            onChange={(value) =>
              onConfigUpdate(['layout', 'header', 'position'], value)
            }
          />

          <Box>
            <Text size="sm" fw={500} mb={4}>
              Высота
            </Text>
            <SegmentedControl
              data={[
                { value: '50', label: 'Малая' },
                { value: '60', label: 'Обычная' },
                { value: '80', label: 'Большая' },
              ]}
              value={config.layout.header.height.toString()}
              onChange={(value) =>
                onConfigUpdate(['layout', 'header', 'height'], parseInt(value))
              }
            />
          </Box>

          <Switch
            label="Показать тень"
            checked={config.layout.header.showShadow}
            onChange={(e) =>
              onConfigUpdate(
                ['layout', 'header', 'showShadow'],
                e.currentTarget.checked,
              )
            }
          />
        </Stack>
      </Paper>

      {/* Content Layout Configuration */}
      <Paper p="sm" withBorder>
        <Group mb="sm">
          <IconLayoutDistributeVertical size={20} />
          <Text fw={600}>Макет контента</Text>
        </Group>

        <Stack gap="md">
          <Box>
            <Text size="sm" fw={500} mb={8}>
              Тип макета
            </Text>
            <SegmentedControl
              fullWidth
              data={[
                {
                  value: 'boxed',
                  label: (
                    <Group gap={4}>
                      <IconSquare size={16} />
                      <span>Ограниченный</span>
                    </Group>
                  ),
                },
                {
                  value: 'full-width',
                  label: (
                    <Group gap={4}>
                      <IconRectangle size={16} />
                      <span>На всю ширину</span>
                    </Group>
                  ),
                },
                {
                  value: 'centered',
                  label: (
                    <Group gap={4}>
                      <IconCircle size={16} />
                      <span>По центру</span>
                    </Group>
                  ),
                },
              ]}
              value={config.layout.content.layout}
              onChange={(value) =>
                onConfigUpdate(['layout', 'content', 'layout'], value)
              }
            />
          </Box>

          <Box>
            <Text size="sm" fw={500} mb={4}>
              Отступы
            </Text>
            <SegmentedControl
              data={[
                { value: 'compact', label: 'Компактные' },
                { value: 'comfortable', label: 'Комфортные' },
                { value: 'spacious', label: 'Просторные' },
              ]}
              value={config.layout.content.padding}
              onChange={(value) =>
                onConfigUpdate(['layout', 'content', 'padding'], value)
              }
            />
          </Box>
        </Stack>
      </Paper>

      {/* Layout direction */}
      <Paper p="sm" withBorder>
        <Group mb="sm">
          <IconTextDirectionLtr size={20} />
          <Text fw={600}>Направление макета</Text>
        </Group>

        <Stack gap="md">
          <Box>
            <Text size="sm" fw={500} mb={4}>
              Направление
            </Text>
            <SegmentedControl
              data={[
                { value: 'ltr', label: 'LTR' },
                { value: 'rtl', label: 'RTL' },
              ]}
              value={config.layout.dir}
              onChange={(value) => onConfigUpdate(['layout', 'dir'], value)}
            />
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};
