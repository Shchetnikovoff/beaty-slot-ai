'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Stack,
  Text,
  Button,
  Group,
  Card,
  Badge,
  Skeleton,
  Alert,
  Switch,
  Table,
  Progress,
  ThemeIcon,
  Paper,
  SimpleGrid,
  ScrollArea,
  Tooltip,
  ActionIcon,
  Box,
  Indicator,
  Transition,
} from '@mantine/core';
import {
  IconRefresh,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconClock,
  IconUsers,
  IconPlayerPlay,
  IconWifi,
  IconWifiOff,
  IconPlugConnected,
  IconCalendarEvent,
  IconCash,
  IconUserPlus,
  IconUserEdit,
  IconTrash,
  IconActivity,
  IconBolt,
  IconPlugConnectedX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { syncService, realtimeSync } from '@/services/sync.service';
import type {
  SyncStatus,
  SyncHistoryItem,
  SyncConfig,
  ConnectionStatus,
  RealtimeEvent,
  RealtimeStats,
} from '@/types/sync';

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Никогда';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}м`;
}

function StatusIcon({ status }: { status: SyncHistoryItem['status'] }) {
  switch (status) {
    case 'success':
      return (
        <ThemeIcon color="green" size="sm" radius="xl">
          <IconCheck size={14} />
        </ThemeIcon>
      );
    case 'error':
      return (
        <ThemeIcon color="red" size="sm" radius="xl">
          <IconX size={14} />
        </ThemeIcon>
      );
    case 'partial':
      return (
        <ThemeIcon color="yellow" size="sm" radius="xl">
          <IconAlertTriangle size={14} />
        </ThemeIcon>
      );
    case 'running':
      return (
        <ThemeIcon color="blue" size="sm" radius="xl">
          <IconRefresh size={14} style={{ animation: 'spin 1s linear infinite' }} />
        </ThemeIcon>
      );
    default:
      return null;
  }
}

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    disconnected: { color: 'gray', icon: IconWifiOff, label: 'Отключено' },
    connecting: { color: 'yellow', icon: IconWifi, label: 'Подключение...' },
    connected: { color: 'green', icon: IconPlugConnected, label: 'Подключено' },
    error: { color: 'red', icon: IconPlugConnectedX, label: 'Ошибка' },
  }[status];

  const Icon = config.icon;

  return (
    <Badge
      color={config.color}
      variant="light"
      size="lg"
      leftSection={<Icon size={14} />}
    >
      {config.label}
    </Badge>
  );
}

function EventIcon({ type }: { type: RealtimeEvent['type'] }) {
  const config = {
    client_created: { color: 'green', icon: IconUserPlus },
    client_updated: { color: 'blue', icon: IconUserEdit },
    appointment_created: { color: 'teal', icon: IconCalendarEvent },
    appointment_updated: { color: 'cyan', icon: IconCalendarEvent },
    appointment_cancelled: { color: 'red', icon: IconTrash },
    payment_received: { color: 'yellow', icon: IconCash },
    connection_status: { color: 'gray', icon: IconActivity },
  }[type];

  const Icon = config.icon;

  return (
    <ThemeIcon color={config.color} size="sm" radius="xl" variant="light">
      <Icon size={14} />
    </ThemeIcon>
  );
}

function getEventDescription(event: RealtimeEvent): string {
  switch (event.type) {
    case 'client_created':
      return `Новый клиент: ${event.data.client_name || 'Без имени'}`;
    case 'client_updated':
      return `Обновлён клиент: ${event.data.client_name || 'Без имени'}`;
    case 'appointment_created':
      return `Новая запись: ${event.data.service_name || 'Услуга'}`;
    case 'appointment_updated':
      return `Изменена запись: ${event.data.service_name || 'Услуга'}`;
    case 'appointment_cancelled':
      return `Отменена запись: ${event.data.service_name || 'Услуга'}`;
    case 'payment_received':
      return `Оплата: ${event.data.amount?.toLocaleString('ru-RU')} ₽`;
    case 'connection_status':
      return event.data.message || 'Изменение статуса';
    default:
      return 'Событие';
  }
}

// Компонент для отображения real-time события
function RealtimeEventItem({ event, isNew }: { event: RealtimeEvent; isNew: boolean }) {
  return (
    <Transition mounted={true} transition="slide-right" duration={300}>
      {(styles) => (
        <Paper
          p="xs"
          withBorder
          style={{
            ...styles,
            borderLeftWidth: 3,
            borderLeftColor: isNew ? 'var(--mantine-color-green-5)' : 'transparent',
            backgroundColor: isNew ? 'var(--mantine-color-green-0)' : undefined,
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <EventIcon type={event.type} />
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" lineClamp={1}>
                {getEventDescription(event)}
              </Text>
              <Text size="xs" c="dimmed">
                {formatTime(event.timestamp)}
              </Text>
            </Box>
          </Group>
        </Paper>
      )}
    </Transition>
  );
}

export function SyncSettings() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
    latency_ms?: number;
  } | null>(null);

  const eventScrollRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusData, historyData, configData, statsData] = await Promise.all([
        syncService.getStatus(),
        syncService.getHistory(10),
        syncService.getConfig(),
        syncService.getRealtimeStats(),
      ]);
      setStatus(statusData);
      setHistory(historyData);
      setConfig(configData);
      setRealtimeStats(statsData);

      // Автоматически подключаемся если realtime включён
      if (configData.realtime_enabled) {
        realtimeSync.connect();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Подписываемся на изменения статуса подключения
    const unsubStatus = realtimeSync.onStatusChange(setConnectionStatus);

    // Подписываемся на события
    const unsubEvents = realtimeSync.onEvent((event) => {
      setRealtimeEvents((prev) => [event, ...prev].slice(0, 50));
      setNewEventIds((prev) => new Set(prev).add(event.id));

      // Убираем подсветку через 3 секунды
      setTimeout(() => {
        setNewEventIds((prev) => {
          const next = new Set(prev);
          next.delete(event.id);
          return next;
        });
      }, 3000);

      // Обновляем статистику
      setRealtimeStats((prev) =>
        prev
          ? {
              ...prev,
              events_today: prev.events_today + 1,
              last_event_at: event.timestamp,
              clients_synced_today:
                event.type === 'client_created' || event.type === 'client_updated'
                  ? prev.clients_synced_today + 1
                  : prev.clients_synced_today,
              appointments_synced_today:
                event.type.startsWith('appointment_')
                  ? prev.appointments_synced_today + 1
                  : prev.appointments_synced_today,
            }
          : prev
      );
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, [loadData]);

  // Поллинг статуса во время синхронизации
  useEffect(() => {
    if (!syncing) return;

    const interval = setInterval(async () => {
      const newStatus = await syncService.getStatus();
      setStatus(newStatus);
      if (!newStatus.is_running) {
        setSyncing(false);
        loadData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [syncing, loadData]);

  const handleStartSync = async () => {
    try {
      setSyncing(true);
      await syncService.startSync();
      notifications.show({
        title: 'Синхронизация запущена',
        message: 'Процесс может занять несколько минут',
        color: 'blue',
      });
    } catch (err) {
      setSyncing(false);
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось запустить синхронизацию',
        color: 'red',
      });
    }
  };

  const handleToggleRealtime = async (enabled: boolean) => {
    try {
      if (!config) return;

      setConfig({ ...config, realtime_enabled: enabled });

      if (enabled) {
        realtimeSync.connect();
      } else {
        realtimeSync.disconnect();
      }

      await syncService.updateConfig({ realtime_enabled: enabled });

      notifications.show({
        title: enabled ? 'Онлайн-синхронизация включена' : 'Онлайн-синхронизация выключена',
        message: enabled
          ? 'Данные будут обновляться автоматически'
          : 'Используйте ручную синхронизацию',
        color: enabled ? 'green' : 'gray',
      });
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось изменить настройки',
        color: 'red',
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionTestResult(null);
      const result = await syncService.testConnection();
      setConnectionTestResult(result);
    } catch (err) {
      setConnectionTestResult({ success: false, message: 'Ошибка проверки' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleReconnect = () => {
    realtimeSync.disconnect();
    setTimeout(() => realtimeSync.connect(), 500);
  };

  if (loading) {
    return (
      <Stack gap="md">
        <Skeleton height={200} radius="md" />
        <Skeleton height={150} radius="md" />
        <Skeleton height={300} radius="md" />
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Real-time панель */}
      <Card withBorder p="md">
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <Indicator
              processing={connectionStatus === 'connected'}
              color={connectionStatus === 'connected' ? 'green' : 'gray'}
              size={12}
            >
              <ThemeIcon
                size="lg"
                radius="md"
                variant="light"
                color={connectionStatus === 'connected' ? 'green' : 'gray'}
              >
                <IconBolt size={20} />
              </ThemeIcon>
            </Indicator>
            <div>
              <Text size="lg" fw={600}>
                Онлайн-синхронизация
              </Text>
              <Text size="sm" c="dimmed">
                Автоматическое обновление данных из YClients
              </Text>
            </div>
          </Group>

          <Group gap="sm">
            <ConnectionStatusBadge status={connectionStatus} />
            <Switch
              size="lg"
              checked={config?.realtime_enabled ?? false}
              onChange={(e) => handleToggleRealtime(e.currentTarget.checked)}
              onLabel="ON"
              offLabel="OFF"
            />
          </Group>
        </Group>

        {config?.realtime_enabled && (
          <>
            {/* Статистика real-time */}
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm" mb="md">
              <Paper p="sm" radius="md" bg="green.0">
                <Group gap="xs">
                  <ThemeIcon size="sm" color="green" variant="light">
                    <IconActivity size={14} />
                  </ThemeIcon>
                  <div>
                    <Text size="xl" fw={700} c="green.7">
                      {realtimeStats?.events_today || 0}
                    </Text>
                    <Text size="xs" c="green.6">
                      Событий сегодня
                    </Text>
                  </div>
                </Group>
              </Paper>

              <Paper p="sm" radius="md" bg="blue.0">
                <Group gap="xs">
                  <ThemeIcon size="sm" color="blue" variant="light">
                    <IconUsers size={14} />
                  </ThemeIcon>
                  <div>
                    <Text size="xl" fw={700} c="blue.7">
                      {realtimeStats?.clients_synced_today || 0}
                    </Text>
                    <Text size="xs" c="blue.6">
                      Клиентов
                    </Text>
                  </div>
                </Group>
              </Paper>

              <Paper p="sm" radius="md" bg="teal.0">
                <Group gap="xs">
                  <ThemeIcon size="sm" color="teal" variant="light">
                    <IconCalendarEvent size={14} />
                  </ThemeIcon>
                  <div>
                    <Text size="xl" fw={700} c="teal.7">
                      {realtimeStats?.appointments_synced_today || 0}
                    </Text>
                    <Text size="xs" c="teal.6">
                      Записей
                    </Text>
                  </div>
                </Group>
              </Paper>

              <Paper p="sm" radius="md" bg="violet.0">
                <Group gap="xs">
                  <ThemeIcon size="sm" color="violet" variant="light">
                    <IconClock size={14} />
                  </ThemeIcon>
                  <div>
                    <Text size="xl" fw={700} c="violet.7">
                      {formatUptime(realtimeStats?.uptime_seconds || 0)}
                    </Text>
                    <Text size="xs" c="violet.6">
                      Uptime
                    </Text>
                  </div>
                </Group>
              </Paper>
            </SimpleGrid>

            {/* Лента событий */}
            <Paper withBorder p="sm" radius="md">
              <Group justify="space-between" mb="sm">
                <Text size="sm" fw={600}>
                  Последние события
                </Text>
                <Group gap="xs">
                  {connectionStatus === 'error' && (
                    <Tooltip label="Переподключиться">
                      <ActionIcon size="sm" variant="light" color="blue" onClick={handleReconnect}>
                        <IconRefresh size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  <Text size="xs" c="dimmed">
                    {realtimeStats?.last_event_at
                      ? `Последнее: ${formatTime(realtimeStats.last_event_at)}`
                      : 'Ожидание событий...'}
                  </Text>
                </Group>
              </Group>

              <ScrollArea h={200} ref={eventScrollRef}>
                {realtimeEvents.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl" size="sm">
                    {connectionStatus === 'connected'
                      ? 'Ожидание событий из YClients...'
                      : 'Подключитесь для получения событий'}
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {realtimeEvents.map((event) => (
                      <RealtimeEventItem
                        key={event.id}
                        event={event}
                        isNew={newEventIds.has(event.id)}
                      />
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Paper>
          </>
        )}

        {/* Тест подключения */}
        <Group mt="md" gap="sm">
          <Button
            variant="light"
            size="xs"
            leftSection={<IconWifi size={14} />}
            onClick={handleTestConnection}
            loading={testingConnection}
          >
            Проверить подключение
          </Button>
          {connectionTestResult && (
            <Badge color={connectionTestResult.success ? 'green' : 'red'} variant="light">
              {connectionTestResult.message}
              {connectionTestResult.latency_ms && ` (${connectionTestResult.latency_ms}ms)`}
            </Badge>
          )}
        </Group>
      </Card>

      {/* Ручная синхронизация */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={600}>
              Полная синхронизация
            </Text>
            <Text size="sm" c="dimmed">
              Импорт всех клиентов из YClients
            </Text>
          </div>
          <Button
            leftSection={
              syncing ? (
                <IconRefresh size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <IconPlayerPlay size={16} />
              )
            }
            onClick={handleStartSync}
            loading={syncing}
            disabled={status?.is_running}
          >
            {syncing ? 'Синхронизация...' : 'Запустить'}
          </Button>
        </Group>

        {syncing && <Progress value={100} animated mb="md" />}

        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase">
              Последняя синхронизация
            </Text>
            <Group gap="xs">
              <IconClock size={16} />
              <Text fw={500}>{formatDate(status?.last_sync_at || null)}</Text>
            </Group>
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase">
              Синхронизировано
            </Text>
            <Group gap="xs">
              <IconUsers size={16} />
              <Text fw={500}>{status?.clients_synced || 0} клиентов</Text>
            </Group>
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase">
              Пропущено
            </Text>
            <Text fw={500} c="dimmed">
              {status?.clients_skipped || 0}
            </Text>
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase">
              Статус
            </Text>
            <Badge color={status?.is_running ? 'blue' : 'green'} size="lg">
              {status?.is_running ? 'Выполняется' : 'Готово'}
            </Badge>
          </div>
        </SimpleGrid>

        {status?.errors && status.errors.length > 0 && (
          <Alert color="red" mt="md" title="Ошибки синхронизации">
            {status.errors.map((error, i) => (
              <Text key={i} size="sm">
                {error}
              </Text>
            ))}
          </Alert>
        )}
      </Card>

      {/* История синхронизаций */}
      <Card withBorder>
        <Text size="lg" fw={600} mb="md">
          История синхронизаций
        </Text>

        {history.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            История синхронизаций пуста
          </Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Дата</Table.Th>
                <Table.Th>Создано</Table.Th>
                <Table.Th>Обновлено</Table.Th>
                <Table.Th>Пропущено</Table.Th>
                <Table.Th>Ошибка</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <StatusIcon status={item.status} />
                      <Text size="sm" tt="capitalize">
                        {item.status === 'success' && 'Успешно'}
                        {item.status === 'error' && 'Ошибка'}
                        {item.status === 'partial' && 'Частично'}
                        {item.status === 'running' && 'Выполняется'}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(item.started_at)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="green">
                      {item.clients_created}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="blue">
                      {item.clients_updated}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {item.clients_skipped}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="red" lineClamp={1}>
                      {item.error_message || '—'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
