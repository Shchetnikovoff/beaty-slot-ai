'use client';

import { useState, useEffect, useCallback } from 'react';
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
  NumberInput,
  Table,
  Progress,
  ThemeIcon,
} from '@mantine/core';
import {
  IconRefresh,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconClock,
  IconUsers,
  IconPlayerPlay,
  IconSettings,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { syncService } from '@/services/sync.service';
import type { SyncStatus, SyncHistoryItem, SyncConfig } from '@/types/sync';

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
          <IconRefresh size={14} className="animate-spin" />
        </ThemeIcon>
      );
    default:
      return null;
  }
}

export function SyncSettings() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusData, historyData, configData] = await Promise.all([
        syncService.getStatus(),
        syncService.getHistory(10),
        syncService.getConfig(),
      ]);
      setStatus(statusData);
      setHistory(historyData);
      setConfig(configData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
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

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      setSavingConfig(true);
      await syncService.updateConfig(config);
      notifications.show({
        title: 'Успешно',
        message: 'Настройки синхронизации сохранены',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить настройки',
        color: 'red',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return (
      <Stack gap="md">
        <Skeleton height={150} radius="md" />
        <Skeleton height={200} radius="md" />
        <Skeleton height={300} radius="md" />
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Статус синхронизации */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={600}>Синхронизация с YClients</Text>
            <Text size="sm" c="dimmed">
              Импорт клиентов из системы YClients
            </Text>
          </div>
          <Button
            leftSection={syncing ? <IconRefresh size={16} className="animate-spin" /> : <IconPlayerPlay size={16} />}
            onClick={handleStartSync}
            loading={syncing}
            disabled={status?.is_running}
          >
            {syncing ? 'Синхронизация...' : 'Запустить синхронизацию'}
          </Button>
        </Group>

        {syncing && (
          <Progress value={100} animated mb="md" />
        )}

        <Group gap="xl">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase">Последняя синхронизация</Text>
            <Group gap="xs">
              <IconClock size={16} />
              <Text fw={500}>{formatDate(status?.last_sync_at || null)}</Text>
            </Group>
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase">Синхронизировано</Text>
            <Group gap="xs">
              <IconUsers size={16} />
              <Text fw={500}>{status?.clients_synced || 0} клиентов</Text>
            </Group>
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase">Пропущено</Text>
            <Text fw={500} c="dimmed">{status?.clients_skipped || 0}</Text>
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase">Статус</Text>
            <Badge color={status?.is_running ? 'blue' : 'green'} size="lg">
              {status?.is_running ? 'Выполняется' : 'Готово'}
            </Badge>
          </div>
        </Group>

        {status?.errors && status.errors.length > 0 && (
          <Alert color="red" mt="md" title="Ошибки синхронизации">
            {status.errors.map((error, i) => (
              <Text key={i} size="sm">{error}</Text>
            ))}
          </Alert>
        )}
      </Card>

      {/* Настройки */}
      {config && (
        <Card withBorder>
          <Group gap="xs" mb="md">
            <IconSettings size={20} />
            <Text size="lg" fw={600}>Настройки синхронизации</Text>
          </Group>

          <Stack gap="md">
            <Switch
              label="Автоматическая синхронизация"
              description="Автоматически синхронизировать клиентов по расписанию"
              checked={config.auto_sync_enabled}
              onChange={(e) => setConfig({ ...config, auto_sync_enabled: e.currentTarget.checked })}
            />

            <NumberInput
              label="Интервал синхронизации (часов)"
              description="Как часто выполнять автоматическую синхронизацию"
              value={config.sync_interval_hours}
              onChange={(value) => setConfig({ ...config, sync_interval_hours: Number(value) || 24 })}
              min={1}
              max={168}
              disabled={!config.auto_sync_enabled}
            />

            <NumberInput
              label="Минимальное количество визитов"
              description="Импортировать только клиентов с указанным количеством визитов"
              value={config.min_visits_threshold}
              onChange={(value) => setConfig({ ...config, min_visits_threshold: Number(value) || 1 })}
              min={0}
              max={100}
            />

            <Group justify="flex-end">
              <Button onClick={handleSaveConfig} loading={savingConfig}>
                Сохранить настройки
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      {/* История синхронизаций */}
      <Card withBorder>
        <Text size="lg" fw={600} mb="md">История синхронизаций</Text>

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
                    <Text size="sm" c="green">{item.clients_created}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="blue">{item.clients_updated}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{item.clients_skipped}</Text>
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
