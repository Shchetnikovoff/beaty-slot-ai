'use client';

import { Calendar } from '@mantine/dates';
import { Box, Text, ActionIcon, Tooltip, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
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
        <Group justify="center" gap="xs" mt={4}>
          <Text size="xs" c="dimmed">
            {selectedDate.toLocaleDateString('ru-RU')}
          </Text>
          <Tooltip label="Сбросить к сегодня">
            <ActionIcon size="xs" variant="subtle" onClick={resetToToday}>
              <IconRefresh size={12} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </Box>
  );
}
