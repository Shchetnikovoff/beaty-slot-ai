'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBell,
  IconBellOff,
  IconCalendar,
  IconChecks,
  IconChartBar,
  IconChevronDown,
  IconChevronRight,
  IconRefresh,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader } from '@/components';
import type { NotificationDto } from '@/types';
import { useSystemNotifications } from '@/lib/hooks/useApi';
import { PATH_DASHBOARD } from '@/routes';

import { NotificationItem } from './components/NotificationItem';

type FilterType = 'all' | 'bookings' | 'clients' | 'system';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Системные уведомления', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

// Типы уведомлений для каждой категории
const BOOKING_TYPES = ['mention', 'assignment', 'reminder'];
const CLIENT_TYPES = ['invite', 'comment', 'share'];
const SYSTEM_TYPES = ['update', 'system', 'security'];

function Notifications() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [localNotifications, setLocalNotifications] = useState<NotificationDto[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const {
    data: notificationsData,
    loading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useSystemNotifications();

  // Синхронизация с загруженными данными
  useEffect(() => {
    if (notificationsData?.data) {
      setLocalNotifications(notificationsData.data);
    }
  }, [notificationsData?.data]);

  const handleMarkAsRead = useCallback((id: string) => {
    setLocalNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const handleMarkAllAsRead = () => {
    setLocalNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const toggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const filteredNotifications = localNotifications.filter(
    (notification: NotificationDto) => {
      if (filter === 'bookings') {
        return BOOKING_TYPES.includes(notification.type);
      }
      if (filter === 'clients') {
        return CLIENT_TYPES.includes(notification.type);
      }
      if (filter === 'system') {
        return SYSTEM_TYPES.includes(notification.type);
      }
      return true;
    }
  );

  const unreadCount = localNotifications.filter(
    (n: NotificationDto) => !n.read
  ).length || 0;

  // Подсчёт по категориям
  const bookingsCount = localNotifications.filter(n => BOOKING_TYPES.includes(n.type)).length;
  const clientsCount = localNotifications.filter(n => CLIENT_TYPES.includes(n.type)).length;
  const systemCount = localNotifications.filter(n => SYSTEM_TYPES.includes(n.type)).length;

  // Group notifications by date
  const groupedNotifications = filteredNotifications?.reduce((groups: Record<string, NotificationDto[]>, notification: NotificationDto) => {
    const date = new Date(notification.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Вчера';
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      groupKey = 'На этой неделе';
    } else {
      groupKey = 'Ранее';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {});

  const renderContent = () => {
    if (notificationsLoading) {
      return (
        <Stack gap="xs">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`notif-loading-${i}`} height={80} radius="md" />
          ))}
        </Stack>
      );
    }

    if (notificationsError) {
      return (
        <Box p="xl">
          <ErrorAlert
            title="Ошибка загрузки уведомлений"
            message={notificationsError?.message || 'Не удалось загрузить уведомления'}
          />
        </Box>
      );
    }

    if (!filteredNotifications?.length) {
      return (
        <Box p="xl">
          <Stack align="center" gap="md">
            <IconBellOff size={64} color="gray" opacity={0.3} />
            <div style={{ textAlign: 'center' }}>
              <Title order={4} c="dimmed">
                {filter === 'all' ? 'Нет уведомлений' : `Нет уведомлений в категории "${
                  filter === 'bookings' ? 'Записи' :
                  filter === 'clients' ? 'Клиенты' : 'Система'
                }"`}
              </Title>
              <Text size="sm" c="dimmed">
                {localNotifications.length === 0
                  ? 'Запустите синхронизацию YClients для получения уведомлений'
                  : 'Уведомления появятся здесь автоматически'
                }
              </Text>
            </div>
            {localNotifications.length === 0 && (
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={() => window.location.href = '/apps/sync'}
              >
                Перейти к синхронизации
              </Button>
            )}
          </Stack>
        </Box>
      );
    }

    return (
      <Stack gap="md">
        {Object.entries(groupedNotifications || {}).map(([groupKey, notifications]) => {
          const isCollapsed = collapsedGroups[groupKey] ?? false;
          return (
            <div key={groupKey}>
              <UnstyledButton
                onClick={() => toggleGroup(groupKey)}
                style={{ width: '100%' }}
                px="md"
                py="xs"
              >
                <Group gap="xs">
                  {isCollapsed ? (
                    <IconChevronRight size={14} color="gray" />
                  ) : (
                    <IconChevronDown size={14} color="gray" />
                  )}
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    {groupKey}
                  </Text>
                  <Badge size="xs" variant="light" color="gray">
                    {notifications.length}
                  </Badge>
                </Group>
              </UnstyledButton>
              <Collapse in={!isCollapsed}>
                <Stack gap={2}>
                  {notifications.map((notification: NotificationDto) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
                </Stack>
              </Collapse>
            </div>
          );
        })}
      </Stack>
    );
  };

  return (
    <>
      <title>Системные уведомления | Beauty Slot</title>
      <meta name="description" content="Просмотр и управление системными уведомлениями на основе данных YClients" />

      <PageHeader
        title="Системные уведомления"
        breadcrumbItems={items}
        actionButton={
          <Group gap="sm">
            <Tooltip label="Обновить">
              <ActionIcon variant="subtle" onClick={() => refetchNotifications()}>
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Настройки">
              <ActionIcon variant="subtle" component="a" href="/apps/settings">
                <IconSettings size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        }
      />

      <Box mt="md">
        <Paper withBorder radius="md">
          <Tabs value={filter} onChange={(value) => setFilter(value as FilterType)}>
            <Box px="md" pt="md">
              <Group justify="space-between" mb="xs">
                <Tabs.List>
                  <Tabs.Tab value="all" leftSection={<IconBell size={14} />}>
                    <Group gap={6}>
                      Все
                      {localNotifications.length > 0 && (
                        <Badge size="sm" variant="light">
                          {localNotifications.length}
                        </Badge>
                      )}
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="bookings" leftSection={<IconCalendar size={14} />}>
                    <Group gap={6}>
                      Записи
                      {bookingsCount > 0 && (
                        <Badge size="sm" variant="light" color="blue">
                          {bookingsCount}
                        </Badge>
                      )}
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="clients" leftSection={<IconUsers size={14} />}>
                    <Group gap={6}>
                      Клиенты
                      {clientsCount > 0 && (
                        <Badge size="sm" variant="light" color="green">
                          {clientsCount}
                        </Badge>
                      )}
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="system" leftSection={<IconChartBar size={14} />}>
                    <Group gap={6}>
                      Система
                      {systemCount > 0 && (
                        <Badge size="sm" variant="light" color="gray">
                          {systemCount}
                        </Badge>
                      )}
                    </Group>
                  </Tabs.Tab>
                </Tabs.List>

                {unreadCount > 0 && (
                  <Tooltip label="Прочитать все">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconChecks size={14} />}
                      onClick={handleMarkAllAsRead}
                    >
                      Прочитать все
                    </Button>
                  </Tooltip>
                )}
              </Group>
            </Box>

            <Tabs.Panel value={filter} pt="md">
              <Box px="md" pb="md">
                <ScrollArea style={{ maxHeight: 'calc(100vh - 320px)' }}>
                  {renderContent()}
                </ScrollArea>
              </Box>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Box>
    </>
  );
}

export default Notifications;
