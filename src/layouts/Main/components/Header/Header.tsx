'use client';

import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Flex,
  Group,
  Indicator,
  Menu,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  rem,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconBulb,
  IconCalendarEvent,
  IconCash,
  IconChartBar,
  IconMenu2,
  IconMessageCircle,
  IconPower,
  IconSearch,
  IconSettings,
  IconTrendingUp,
  IconUser,
  IconUserOff,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { MESSAGES } from '@/constants/messages';
import { NOTIFICATIONS } from '@/constants/notifications';
import { HeaderVariant, useSidebarConfig } from '@/contexts/theme-customizer';
import UserProfileData from '@public/mocks/UserProfile.json';

// Тип для умной подсказки
interface SmartHint {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  color: string;
}

const ICON_SIZE = 20;

type HeaderNavProps = {
  toggleMobile?: () => void;
  sidebarVisible: boolean;
  onSidebarToggle: () => void;
  onSidebarShow?: () => void;
  headerVariant: HeaderVariant;
};

const HeaderNav = (props: HeaderNavProps) => {
  const {
    toggleMobile,
    headerVariant,
    sidebarVisible,
    onSidebarToggle,
    onSidebarShow,
  } = props;
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const tablet_match = useMediaQuery('(max-width: 768px)');
  const mobile_match = useMediaQuery('(max-width: 425px)');
  const sidebarConfig = useSidebarConfig();
  const router = useRouter();

  // Умные подсказки
  const [smartHints, setSmartHints] = useState<SmartHint[]>([]);
  const [hintsLoading, setHintsLoading] = useState(true);

  useEffect(() => {
    const fetchHints = async () => {
      try {
        // Загружаем данные для генерации подсказок
        const [paymentsRes, statsRes] = await Promise.all([
          fetch('/api/v1/admin/payments/data?limit=100'),
          fetch('/api/v1/admin/dashboard/stats'),
        ]);

        const hints: SmartHint[] = [];

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          const pendingPayments = paymentsData.stats?.pending || 0;
          const processingPayments = paymentsData.stats?.processing || 0;

          if (pendingPayments > 0) {
            hints.push({
              id: 'pending-payments',
              icon: <IconCash size={16} />,
              title: `${pendingPayments} неоплаченных визитов`,
              description: 'Клиенты посетили салон, но не оплатили',
              action: 'Посмотреть',
              actionUrl: '/apps/invoices?status=PENDING',
              priority: 'high',
              color: 'yellow',
            });
          }

          if (processingPayments > 5) {
            hints.push({
              id: 'processing-payments',
              icon: <IconCalendarEvent size={16} />,
              title: `${processingPayments} записей ожидают`,
              description: 'Подтверждённые записи на ближайшее время',
              action: 'Календарь',
              actionUrl: '/apps/calendar',
              priority: 'medium',
              color: 'blue',
            });
          }
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();

          // Пропадающие клиенты
          const risk60plus = statsData.risk60plus || 0;
          if (risk60plus > 0) {
            hints.push({
              id: 'lost-clients',
              icon: <IconUserOff size={16} />,
              title: `${risk60plus} клиентов не были >60 дней`,
              description: 'Рекомендуем отправить напоминание',
              action: 'Клиенты',
              actionUrl: '/apps/customers',
              priority: 'high',
              color: 'red',
            });
          }

          // Записи сегодня
          const todayAppointments = statsData.todayAppointments || 0;
          const tomorrowAppointments = statsData.tomorrowAppointments || 0;

          if (todayAppointments > 0) {
            hints.push({
              id: 'today-appointments',
              icon: <IconCalendarEvent size={16} />,
              title: `${todayAppointments} записей сегодня`,
              description: tomorrowAppointments > 0 ? `И ${tomorrowAppointments} завтра` : 'Хорошего рабочего дня!',
              action: 'Открыть',
              actionUrl: '/apps/calendar',
              priority: 'low',
              color: 'green',
            });
          }

          // Выручка
          const weekRevenue = statsData.weekRevenue || 0;
          if (weekRevenue > 0) {
            hints.push({
              id: 'week-revenue',
              icon: <IconTrendingUp size={16} />,
              title: `${weekRevenue.toLocaleString('ru-RU')} ₽ за неделю`,
              description: 'Выручка за текущую неделю',
              action: 'Аналитика',
              actionUrl: '/dashboard/default',
              priority: 'low',
              color: 'teal',
            });
          }
        }

        // Если нет данных — добавляем подсказку о синхронизации
        if (hints.length === 0) {
          hints.push({
            id: 'sync-data',
            icon: <IconChartBar size={16} />,
            title: 'Нет данных для анализа',
            description: 'Синхронизируйте данные из YClients',
            action: 'Синхронизация',
            actionUrl: '/apps/sync',
            priority: 'medium',
            color: 'gray',
          });
        }

        // Сортируем по приоритету
        hints.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        setSmartHints(hints);
      } catch (error) {
        console.error('Error fetching smart hints:', error);
      } finally {
        setHintsLoading(false);
      }
    };

    fetchHints();
    // Обновляем каждые 5 минут
    const interval = setInterval(fetchHints, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const highPriorityHints = smartHints.filter(h => h.priority === 'high').length;

  // Determine text color based on header variant
  const getTextColor = () => {
    if (headerVariant === 'colored') {
      return 'white';
    }
    return undefined; // Use default theme colors
  };

  const textColor = getTextColor();

  const handleSidebarToggle = () => {
    if (mobile_match) {
      // Mobile: toggle mobile menu
      toggleMobile?.();
    } else if (sidebarConfig.overlay && !sidebarVisible) {
      // Desktop overlay mode: show sidebar if hidden
      onSidebarShow?.();
    } else {
      // Normal mode or overlay mode with visible sidebar: toggle
      onSidebarToggle();
    }
  };

  const getSidebarToggleIcon = () => {
    if (mobile_match) {
      return <IconMenu2 size={ICON_SIZE} color={textColor} />;
    }

    // Desktop: use menu icon for overlay mode or when sidebar is hidden
    if (sidebarConfig.overlay || !sidebarVisible) {
      return <IconMenu2 size={ICON_SIZE} color={textColor} />;
    }

    // Use menu icon for normal mode when sidebar is visible
    return <IconMenu2 size={ICON_SIZE} color={textColor} />;
  };

  const getSidebarToggleTooltip = () => {
    if (mobile_match) return 'Переключить меню';
    if (!sidebarVisible) return 'Показать боковую панель';
    return 'Скрыть боковую панель';
  };

  const messages = MESSAGES.map((m) => (
    <Menu.Item
      key={m.id}
      style={{
        borderBottom: `1px solid ${
          colorScheme === 'dark' ? theme.colors.gray[7] : theme.colors.gray[3]
        }`,
      }}
    >
      <Flex gap="sm" align="center">
        <Avatar
          src={null}
          alt={`${m.first_name} ${m.last_name}`}
          variant="filled"
          size="sm"
          color={theme.colors[theme.primaryColor][7]}
        >
          {Array.from(m.first_name)[0]}
          {Array.from(m.last_name)[0]}
        </Avatar>
        <Stack gap={1}>
          <Text fz="sm" fw={600}>
            {m.first_name} {m.last_name}
          </Text>
          <Text lineClamp={2} fz="xs" c="dimmed">
            {m.message}
          </Text>
        </Stack>
      </Flex>
    </Menu.Item>
  ));

  const notifications = NOTIFICATIONS.slice(0, 3).map((n) => (
    <Menu.Item
      key={n.id}
      style={{
        borderBottom: `1px solid ${
          colorScheme === 'dark' ? theme.colors.gray[7] : theme.colors.gray[3]
        }`,
      }}
    >
      <Flex gap="sm" align="center">
        <Avatar src={n.icon} alt={n.title} variant="filled" size="sm" />
        <Stack gap={1}>
          <Text fz="sm" fw={600}>
            {n.title}
          </Text>
          <Text lineClamp={2} fz="xs" c="dimmed">
            {n.message}
          </Text>
        </Stack>
      </Flex>
    </Menu.Item>
  ));

  return (
    <Group justify="space-between" flex={1} wrap="nowrap">
      {/* Left Section: Sidebar Toggle */}
      <Group gap={0} style={{ flex: '0 0 auto' }}>
        <Tooltip label={getSidebarToggleTooltip()}>
          <ActionIcon
            onClick={handleSidebarToggle}
            variant={headerVariant === 'colored' ? 'transparent' : 'default'}
            size="lg"
          >
            {getSidebarToggleIcon()}
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Middle Section: Navigation & Search */}
      <Group gap={4} justify="center" style={{ flex: '1 1 auto' }}>
        <Tooltip label="Назад">
          <ActionIcon
            onClick={() => router.back()}
            variant={headerVariant === 'colored' ? 'transparent' : 'default'}
            size="lg"
          >
            <IconArrowLeft size={ICON_SIZE} color={textColor} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Вперёд">
          <ActionIcon
            onClick={() => router.forward()}
            variant={headerVariant === 'colored' ? 'transparent' : 'default'}
            size="lg"
          >
            <IconArrowRight size={ICON_SIZE} color={textColor} />
          </ActionIcon>
        </Tooltip>

        {!mobile_match && (
          <TextInput
            placeholder="поиск"
            rightSection={<IconSearch size={ICON_SIZE} />}
            ms="md"
            style={{
              width: tablet_match ? 'auto' : rem(400),
              '--input-color': textColor || undefined,
            }}
          />
        )}
      </Group>

      {/* Right Section: Actions & User Menu */}
      <Group style={{ flex: '0 0 auto' }}>
        {mobile_match && (
          <ActionIcon
            variant={headerVariant === 'colored' ? 'transparent' : 'default'}
          >
            <IconSearch size={ICON_SIZE} color={textColor} />
          </ActionIcon>
        )}
        <Menu shadow="lg" width={320}>
          <Menu.Target>
            <Indicator processing size={10} offset={6}>
              <Tooltip label="Сообщения">
                <ActionIcon
                  size="lg"
                  title="Сообщения"
                  variant={
                    headerVariant === 'colored' ? 'transparent' : 'default'
                  }
                >
                  <IconMessageCircle size={ICON_SIZE} color={textColor} />
                </ActionIcon>
              </Tooltip>
            </Indicator>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label tt="uppercase" ta="center" fw={600}>
              {MESSAGES.length} новых сообщений
            </Menu.Label>
            {messages}
            <Menu.Item tt="uppercase" ta="center" fw={600}>
              Показать все сообщения
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Menu shadow="lg" width={320}>
          <Menu.Target>
            <Indicator processing size={10} offset={6}>
              <Tooltip label="Уведомления">
                <ActionIcon
                  size="lg"
                  title="Уведомления"
                  variant={
                    headerVariant === 'colored' ? 'transparent' : 'default'
                  }
                >
                  <IconBell size={ICON_SIZE} color={textColor} />
                </ActionIcon>
              </Tooltip>
            </Indicator>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label tt="uppercase" ta="center" fw={600}>
              {NOTIFICATIONS.length} новых уведомлений
            </Menu.Label>
            {notifications}
            <Menu.Item tt="uppercase" ta="center" fw={600}>
              Показать все уведомления
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        {/* Умные подсказки */}
        <Menu shadow="lg" width={360}>
          <Menu.Target>
            <Indicator
              processing={highPriorityHints > 0}
              color={highPriorityHints > 0 ? 'red' : 'blue'}
              size={10}
              offset={6}
              disabled={smartHints.length === 0}
            >
              <Tooltip label="Умные подсказки">
                <ActionIcon
                  size="lg"
                  title="Умные подсказки"
                  variant={
                    headerVariant === 'colored' ? 'transparent' : 'default'
                  }
                >
                  <IconBulb size={ICON_SIZE} color={textColor} />
                </ActionIcon>
              </Tooltip>
            </Indicator>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label tt="uppercase" ta="center" fw={600}>
              {smartHints.length > 0 ? `${smartHints.length} подсказок` : 'Загрузка...'}
            </Menu.Label>
            {smartHints.slice(0, 5).map((hint) => (
              <Menu.Item
                key={hint.id}
                onClick={() => hint.actionUrl && router.push(hint.actionUrl)}
                style={{
                  borderBottom: `1px solid ${
                    colorScheme === 'dark' ? theme.colors.gray[7] : theme.colors.gray[3]
                  }`,
                }}
              >
                <Flex gap="sm" align="flex-start">
                  <ThemeIcon
                    size="md"
                    radius="md"
                    variant="light"
                    color={hint.color}
                    mt={2}
                  >
                    {hint.icon}
                  </ThemeIcon>
                  <Stack gap={2} style={{ flex: 1 }}>
                    <Group justify="space-between" wrap="nowrap">
                      <Text fz="sm" fw={600} lineClamp={1}>
                        {hint.title}
                      </Text>
                      {hint.priority === 'high' && (
                        <Badge size="xs" color="red" variant="light">
                          Важно
                        </Badge>
                      )}
                    </Group>
                    <Text fz="xs" c="dimmed" lineClamp={2}>
                      {hint.description}
                    </Text>
                    {hint.action && (
                      <Text fz="xs" c={hint.color} fw={500}>
                        {hint.action} →
                      </Text>
                    )}
                  </Stack>
                </Flex>
              </Menu.Item>
            ))}
            {smartHints.length === 0 && !hintsLoading && (
              <Menu.Item disabled>
                <Text fz="sm" c="dimmed" ta="center">
                  Нет активных подсказок
                </Text>
              </Menu.Item>
            )}
            <Menu.Item
              tt="uppercase"
              ta="center"
              fw={600}
              onClick={() => router.push('/dashboard/default')}
            >
              Открыть дашборд
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Menu shadow="lg" width={280}>
          <Menu.Target>
            <Tooltip label="Аккаунт">
              <ActionIcon
                size="lg"
                variant={
                  headerVariant === 'colored' ? 'transparent' : 'default'
                }
                style={{ borderRadius: '50%' }}
              >
                <Avatar
                  src={UserProfileData.avatar}
                  alt={UserProfileData.name}
                  size="sm"
                />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>
              <Stack gap={4}>
                <Text size="sm" fw={500}>
                  {UserProfileData.name}
                </Text>
                <Text size="xs">{UserProfileData.email}</Text>
              </Stack>
            </Menu.Label>
            <Menu.Divider />
            <Menu.Item leftSection={<IconUser size={16} />}>Профиль</Menu.Item>
            <Menu.Item leftSection={<IconSettings size={16} />}>
              Настройки
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconPower size={16} />}
              color="red"
              onClick={() => router.push('/')}
            >
              Выход
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
};

export default HeaderNav;
