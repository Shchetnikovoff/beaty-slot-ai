'use client';

import {
  ActionIcon,
  Group,
  PaperProps,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { IconDotsVertical } from '@tabler/icons-react';

import { Surface } from '@/components';

type RevenueChartProps = PaperProps;

const RevenueChart = ({ ...others }: RevenueChartProps) => {
  const theme = useMantineTheme();

  const data = [
    {
      date: '00:00',
      Услуги: 31,
      Товары: 11,
    },
    {
      date: '01:30',
      Услуги: 40,
      Товары: 32,
    },
    {
      date: '02:30',
      Услуги: 28,
      Товары: 45,
    },
    {
      date: '03:30',
      Услуги: 51,
      Товары: 32,
    },
    {
      date: '04:30',
      Услуги: 42,
      Товары: 34,
    },
    {
      date: '05:30',
      Услуги: 109,
      Товары: 52,
    },
    {
      date: '06:30',
      Услуги: 100,
      Товары: 41,
    },
  ];

  return (
    <Surface {...others}>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>
          Общая выручка
        </Text>
        <ActionIcon variant="subtle">
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Group>
      <AreaChart
        h={350}
        data={data}
        dataKey="date"
        series={[
          { name: 'Услуги', color: theme.colors[theme.primaryColor][5] },
          { name: 'Товары', color: theme.colors[theme.primaryColor][2] },
        ]}
        curveType="natural"
        withLegend
        legendProps={{ verticalAlign: 'bottom', height: 50 }}
      />
    </Surface>
  );
};

export default RevenueChart;
