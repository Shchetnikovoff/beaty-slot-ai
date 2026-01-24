'use client';

import { useCallback, useState } from 'react';

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconBellOff,
  IconChecks,
  IconRefresh,
  IconSettings,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader } from '@/components';
import type { NotificationDto } from '@/types';
import { useNotifications } from '@/lib/hooks/useApi';
import { PATH_DASHBOARD } from '@/routes';

import { NotificationItem } from './components/NotificationItem';

type FilterType = 'all' | 'unread' | 'mentions' | 'comments' | 'updates';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Уведомления', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

function Notifications() {
  const [filter, setFilter] = useState<FilterType>('all');

  const {
    data: notificationsData,
    loading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useNotifications();

  const handleMarkAsRead = useCallback((id: string) => {
    console.log('Mark as read:', id);
    // In a real app, send PATCH request
  }, []);

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read');
    // In a real app, send PATCH request
  };

  const filteredNotifications = notificationsData?.data?.filter(
    (notification: NotificationDto) => {
      if (filter === 'unread') return !notification.read;
      if (filter === 'mentions') return notification.type === 'mention';
      if (filter === 'comments') return notification.type === 'comment';
      if (filter === 'updates') return notification.type === 'update';
      return true;
    }
  );

  const unreadCount = notificationsData?.data?.filter(
    (n: NotificationDto) => !n.read
  ).length || 0;

  // Group notifications by date
  const groupedNotifications = filteredNotifications?.reduce((groups: any, notification: NotificationDto) => {
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
                Нет уведомлений
              </Title>
              <Text size="sm" c="dimmed">
                {filter === 'unread'
                  ? 'Всё прочитано!'
                  : 'Загляните позже'}
              </Text>
            </div>
          </Stack>
        </Box>
      );
    }

    return (
      <Stack gap="xl">
        {Object.entries(groupedNotifications || {}).map(([groupKey, notifications]: [string, any]) => (
          <div key={groupKey}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm" px="md">
              {groupKey}
            </Text>
            <Stack gap={2}>
              {notifications.map((notification: NotificationDto) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </Stack>
          </div>
        ))}
      </Stack>
    );
  };

  return (
    <>
      <title>Уведомления | Beauty Slot</title>
      <meta name="description" content="Просмотр и управление уведомлениями" />

      <PageHeader
        title="Уведомления"
        breadcrumbItems={items}
        actionButton={
          <Group gap="sm">
            <Tooltip label="Обновить">
              <ActionIcon variant="subtle" onClick={() => refetchNotifications()}>
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Настройки">
              <ActionIcon variant="subtle">
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
                  <Tabs.Tab value="all">
                    <Group gap={6}>
                      Все
                      {notificationsData?.data && notificationsData?.data?.length > 0 && (
                        <Badge size="sm">
                          {notificationsData.data.length}
                        </Badge>
                      )}
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="unread">
                    <Group gap={6}>
                      Непрочитанные
                      {unreadCount > 0 && (
                        <Badge size="sm">
                          {unreadCount}
                        </Badge>
                      )}
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="mentions">Упоминания</Tabs.Tab>
                  <Tabs.Tab value="comments">Комментарии</Tabs.Tab>
                  <Tabs.Tab value="updates">Обновления</Tabs.Tab>
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
