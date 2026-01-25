'use client';

import { useState } from 'react';

import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Drawer,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconBrandTelegram,
  IconCheck,
  IconChartLine,
  IconClock,
  IconMoodEmpty,
  IconPlus,
  IconRefresh,
  IconSend,
  IconUsers,
  IconX,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { useBroadcasts } from '@/lib/hooks/useBeautySlot';
import { broadcastsService } from '@/services';
import type { Broadcast, BroadcastTargetAudience } from '@/types';
import { PATH_DASHBOARD } from '@/routes';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Рассылки', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const STATUS_LABELS = {
  DRAFT: 'Черновик',
  SCHEDULED: 'Запланировано',
  SENT: 'Отправлено',
  FAILED: 'Ошибка',
};

const STATUS_COLORS = {
  DRAFT: 'gray',
  SCHEDULED: 'blue',
  SENT: 'green',
  FAILED: 'red',
};

const AUDIENCE_LABELS = {
  ALL: 'Все клиенты',
  SUBSCRIBED: 'С подпиской',
  NOT_SUBSCRIBED: 'Без подписки',
};

function BroadcastCard({
  broadcast,
  onView,
}: {
  broadcast: Broadcast;
  onView: (broadcast: Broadcast) => void;
}) {
  const createdDate = new Date(broadcast.created_at).toLocaleDateString('ru-RU');

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={600} size="lg" lineClamp={1}>
            {broadcast.title}
          </Text>
          <Text size="sm" c="dimmed">
            {AUDIENCE_LABELS[broadcast.target_audience]}
          </Text>
        </div>
        <Badge color={STATUS_COLORS[broadcast.status]} variant="light" size="lg">
          {STATUS_LABELS[broadcast.status]}
        </Badge>
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2} mb="md">
        {broadcast.message}
      </Text>

      <Stack gap="xs">
        <Group gap="xs">
          <IconUsers size={14} />
          <Text size="sm">
            Получателей: {broadcast.recipients_count}
          </Text>
        </Group>

        {broadcast.status === 'SENT' && (
          <Group gap="md">
            <Group gap="xs">
              <IconCheck size={14} color="green" />
              <Text size="sm" c="green">
                Доставлено: {broadcast.sent_count}
              </Text>
            </Group>
            {broadcast.failed_count > 0 && (
              <Group gap="xs">
                <IconX size={14} color="red" />
                <Text size="sm" c="red">
                  Ошибок: {broadcast.failed_count}
                </Text>
              </Group>
            )}
          </Group>
        )}

        {broadcast.scheduled_at && broadcast.status === 'SCHEDULED' && (
          <Group gap="xs">
            <IconClock size={14} />
            <Text size="sm" c="dimmed">
              Запланировано: {new Date(broadcast.scheduled_at).toLocaleString('ru-RU')}
            </Text>
          </Group>
        )}

        {broadcast.sent_at && (
          <Group gap="xs">
            <IconSend size={14} />
            <Text size="sm" c="dimmed">
              Отправлено: {new Date(broadcast.sent_at).toLocaleString('ru-RU')}
            </Text>
          </Group>
        )}

        <Text size="xs" c="dimmed" mt="xs">
          Создано: {createdDate}
        </Text>
      </Stack>

      <Button
        variant="light"
        fullWidth
        mt="md"
        leftSection={<IconBrandTelegram size={18} />}
        onClick={() => onView(broadcast)}
      >
        Подробнее
      </Button>
    </Paper>
  );
}

interface LocalBroadcastStats {
  total: number;
  thisMonth: number;
  totalSent: number;
  deliveryRate: number;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={700} size="xl" mt={4}>
            {value}
          </Text>
        </div>
        <Box
          style={{
            backgroundColor: `var(--mantine-color-${color}-1)`,
            borderRadius: 'var(--mantine-radius-md)',
            padding: '12px',
          }}
        >
          <Icon size={24} />
        </Box>
      </Group>
    </Paper>
  );
}

function NewBroadcastDrawer({
  opened,
  onClose,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      message: '',
      target_audience: 'ALL' as 'ALL' | 'SUBSCRIBED' | 'NOT_SUBSCRIBED',
    },
    validate: {
      title: (value) => (value.length < 3 ? 'Минимум 3 символа' : null),
      message: (value) => (value.length < 10 ? 'Минимум 10 символов' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await broadcastsService.create({
        title: values.title,
        message: values.message,
        target_audience: values.target_audience as BroadcastTargetAudience,
      });

      notifications.show({
        title: 'Рассылка создана',
        message: 'Рассылка успешно создана и готова к отправке',
        color: 'green',
      });

      form.reset();
      onCreated();
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось создать рассылку',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Новая рассылка"
      position="right"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Название"
            placeholder="Название рассылки"
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Сообщение"
            placeholder="Текст сообщения для отправки в Telegram"
            required
            minRows={4}
            {...form.getInputProps('message')}
          />

          <Select
            label="Аудитория"
            data={[
              { value: 'ALL', label: 'Все клиенты' },
              { value: 'SUBSCRIBED', label: 'Только с активной подпиской' },
              { value: 'NOT_SUBSCRIBED', label: 'Без активной подписки' },
            ]}
            {...form.getInputProps('target_audience')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconSend size={18} />}>
              Создать рассылку
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}

function Broadcasts() {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  const {
    data: broadcastsData,
    loading,
    error,
    refetch,
  } = useBroadcasts({ limit: 100 });

  const broadcasts = broadcastsData?.items ?? [];

  // Calculate stats from broadcasts with safe division
  const totalRecipients = broadcasts.reduce((acc, b) => acc + b.recipients_count, 0);
  const totalSent = broadcasts.reduce((acc, b) => acc + b.sent_count, 0);

  const stats: LocalBroadcastStats = {
    total: broadcastsData?.total ?? 0,
    thisMonth: broadcasts.filter((b) => {
      const createdDate = new Date(b.created_at);
      const now = new Date();
      return (
        createdDate.getMonth() === now.getMonth() &&
        createdDate.getFullYear() === now.getFullYear()
      );
    }).length,
    totalSent,
    deliveryRate: totalRecipients > 0
      ? Math.round((totalSent / totalRecipients) * 100)
      : 0,
  };

  const handleViewBroadcast = (broadcast: Broadcast) => {
    console.log('View broadcast:', broadcast);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleCreated = () => {
    refetch();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`broadcast-loading-${i}`} visible={true} height={280} />
          ))}
        </SimpleGrid>
      );
    }

    if (error) {
      return (
        <ErrorAlert
          title="Ошибка загрузки рассылок"
          message={error.message || 'Не удалось загрузить список рассылок'}
        />
      );
    }

    if (!broadcasts.length) {
      return (
        <Surface p="xl">
          <Stack align="center" gap="md">
            <IconMoodEmpty size={48} stroke={1.5} />
            <Title order={4}>Рассылки не найдены</Title>
            <Text c="dimmed" ta="center">
              Создайте первую рассылку для отправки сообщений клиентам через Telegram
            </Text>
            <Button leftSection={<IconPlus size={18} />} onClick={openDrawer}>
              Создать рассылку
            </Button>
          </Stack>
        </Surface>
      );
    }

    return (
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {broadcasts.map((broadcast) => (
          <BroadcastCard
            key={broadcast.id}
            broadcast={broadcast}
            onView={handleViewBroadcast}
          />
        ))}
      </SimpleGrid>
    );
  };

  return (
    <>
      <title>Рассылки | Beauty Slot Admin</title>
      <meta name="description" content="Управление Telegram рассылками клиентам" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Рассылки"
            breadcrumbItems={items}
            actionButton={
              <Group gap="sm">
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={18} />}
                  onClick={handleRefresh}
                >
                  Обновить
                </Button>
                <Button leftSection={<IconPlus size={18} />} onClick={openDrawer}>
                  Новая рассылка
                </Button>
              </Group>
            }
          />

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="lg">
            <StatsCard
              title="Всего рассылок"
              value={stats.total}
              icon={IconSend}
              color="blue"
            />
            <StatsCard
              title="В этом месяце"
              value={stats.thisMonth}
              icon={IconClock}
              color="violet"
            />
            <StatsCard
              title="Отправлено"
              value={stats.totalSent}
              icon={IconCheck}
              color="green"
            />
            <StatsCard
              title="Доставка"
              value={`${stats.deliveryRate}%`}
              icon={IconChartLine}
              color="yellow"
            />
          </SimpleGrid>

          <Box>
            <Group justify="space-between" mb="md">
              <Group gap="lg">
                <Group gap="xs">
                  <IconBrandTelegram size={20} />
                  <Text fw={500}>Telegram рассылки</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  Всего: <strong>{broadcasts.length}</strong>
                </Text>
              </Group>
            </Group>

            {renderContent()}
          </Box>
        </Stack>
      </Container>

      <NewBroadcastDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        onCreated={handleCreated}
      />
    </>
  );
}

export default Broadcasts;
