'use client';

import {
  ActionIcon,
  Group,
  PaperProps,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconDotsVertical } from '@tabler/icons-react';

import { Surface } from '@/components';

type MobileDesktopChartProps = PaperProps;
const MobileDesktopChart = ({ ...others }: MobileDesktopChartProps) => {
  const theme = useMantineTheme();

  const data = [
    {
      month: 'Янв',
      'Тариф A': 44,
      'Тариф B': 13,
    },
    {
      month: 'Фев',
      'Тариф A': 55,
      'Тариф B': 23,
    },
    {
      month: 'Мар',
      'Тариф A': 41,
      'Тариф B': 20,
    },
    {
      month: 'Апр',
      'Тариф A': 67,
      'Тариф B': 8,
    },
    {
      month: 'Май',
      'Тариф A': 22,
      'Тариф B': 13,
    },
    {
      month: 'Июн',
      'Тариф A': 43,
      'Тариф B': 27,
    },
    {
      month: 'Июл',
      'Тариф A': 34,
      'Тариф B': 10,
    },
  ];

  return (
    <Surface {...others}>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>
          Мобильные/Десктоп
        </Text>
        <ActionIcon variant="subtle">
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Group>
      <BarChart
        h={300}
        data={data}
        dataKey="month"
        type="stacked"
        series={[
          { name: 'Тариф A', color: theme.colors[theme.primaryColor][8] },
          { name: 'Тариф B', color: theme.colors[theme.primaryColor][2] },
        ]}
        withLegend
        legendProps={{ verticalAlign: 'bottom', height: 50 }}
      />
    </Surface>
  );
};

export default MobileDesktopChart;
