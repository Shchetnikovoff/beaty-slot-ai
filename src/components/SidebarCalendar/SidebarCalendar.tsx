'use client';

import { Calendar } from '@mantine/dates';
import { Box, Text, ActionIcon, Group } from '@mantine/core';
import { IconCalendarEvent, IconRefresh } from '@tabler/icons-react';
import 'dayjs/locale/ru';

import { useDashboardDate } from '@/contexts/dashboard-date';

import classes from './SidebarCalendar.module.css';

export function SidebarCalendar() {
  const { selectedDate, setSelectedDate, isToday, resetToToday } = useDashboardDate();

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  return (
    <Box className={classes.root}>
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconCalendarEvent size={16} />
          <Text size="sm" fw={500}>
            Фильтр даты
          </Text>
        </Group>
        {!isToday && (
          <ActionIcon size="sm" variant="subtle" onClick={resetToToday} title="Сбросить к сегодня">
            <IconRefresh size={14} />
          </ActionIcon>
        )}
      </Group>
      <Calendar
        size="xs"
        locale="ru"
        className={classes.calendar}
        getDayProps={(date) => ({
          selected: isSameDay(date, selectedDate),
          onClick: () => setSelectedDate(date),
        })}
      />
      {!isToday && (
        <Text size="xs" c="dimmed" ta="center" mt="xs">
          Данные за {selectedDate.toLocaleDateString('ru-RU')}
        </Text>
      )}
    </Box>
  );
}
