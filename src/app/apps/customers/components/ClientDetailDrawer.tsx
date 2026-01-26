'use client';

import { useState, useEffect } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconBrandTelegram,
  IconCalendar,
  IconCheck,
  IconChartBar,
  IconClock,
  IconCrown,
  IconEdit,
  IconExternalLink,
  IconGift,
  IconHistory,
  IconLink,
  IconLock,
  IconLockOpen,
  IconMail,
  IconMessageCircle,
  IconPhone,
  IconRefresh,
  IconScissors,
  IconShare,
  IconStar,
  IconUser,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
  IconUserX,
  IconX,
} from '@tabler/icons-react';

import type { Client } from '@/types';

// Определение статуса по ИВК
type ClientScoreStatus = 'vip' | 'reliable' | 'risk' | 'problem';

interface StatusConfig {
  color: string;
  label: string;
  emoji: string;
  gradient: { from: string; to: string };
}

const statusConfig: Record<ClientScoreStatus, StatusConfig> = {
  vip: {
    color: 'yellow',
    label: 'VIP',
    emoji: '⭐',
    gradient: { from: 'yellow.4', to: 'orange.5' },
  },
  reliable: {
    color: 'green',
    label: 'Надёжный',
    emoji: '✓',
    gradient: { from: 'teal.4', to: 'green.5' },
  },
  risk: {
    color: 'orange',
    label: 'Риск',
    emoji: '⚠️',
    gradient: { from: 'orange.4', to: 'red.4' },
  },
  problem: {
    color: 'red',
    label: 'Проблемный',
    emoji: '🚫',
    gradient: { from: 'red.4', to: 'pink.5' },
  },
};

function getClientScoreStatus(score: number): ClientScoreStatus {
  if (score >= 80) return 'vip';
  if (score >= 60) return 'reliable';
  if (score >= 40) return 'risk';
  return 'problem';
}

function formatDaysAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'сегодня';
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} мес. назад`;
  return `${Math.floor(diffDays / 365)} г. назад`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Форматирование телефона в читаемый вид
function formatPhone(phone: string): string {
  if (!phone) return '';

  // Убираем все нецифровые символы
  const digits = phone.replace(/\D/g, '');

  // Если номер начинается с 8, заменяем на 7
  const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits;

  // Форматируем в +7 (XXX) XXX-XX-XX
  if (normalized.length === 11 && normalized.startsWith('7')) {
    return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
  }

  // Если 10 цифр (без кода страны)
  if (normalized.length === 10) {
    return `+7 (${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6, 8)}-${normalized.slice(8, 10)}`;
  }

  // Возвращаем как есть, если формат неизвестен
  return phone;
}

// Circular metric component
function CircularMetric({
  value,
  maxValue = 100,
  color,
  label,
  suffix = '',
}: {
  value: number | null | undefined;
  maxValue?: number;
  color: string;
  label: string;
  suffix?: string;
}) {
  const safeValue = value ?? 0;
  return (
    <Stack align="center" gap={8}>
      <RingProgress
        size={90}
        thickness={8}
        roundCaps
        sections={[{ value: Math.min((safeValue / maxValue) * 100, 100), color }]}
        label={
          <Text size="md" ta="center" fw={700}>
            {safeValue.toFixed(0)}{suffix}
          </Text>
        }
      />
      <Text size="sm" c="dimmed" ta="center">
        {label}
      </Text>
    </Stack>
  );
}

// Mock visit data type
interface VisitRecord {
  id: number;
  date: string;
  service: string;
  staff: string;
  cost: number;
  rating: number | null;
  ratingComment: string | null;
}

interface ClientDetailDrawerProps {
  client: Client | null;
  opened: boolean;
  onClose: () => void;
  onToggleSubscription?: (client: Client) => void;
  onToggleBlock?: (client: Client) => void;
  onUpdate?: (client: Client) => void;
}

export function ClientDetailDrawer({
  client,
  opened,
  onClose,
  onToggleSubscription,
  onToggleBlock,
  onUpdate,
}: ClientDetailDrawerProps) {
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Edit modal state
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    comment: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Visit history modal
  const [historyModalOpened, setHistoryModalOpened] = useState(false);

  // Rating modal
  const [ratingModalOpened, setRatingModalOpened] = useState(false);
  const [ratingVisitId, setRatingVisitId] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Mock visit data
  const [clientVisits, setClientVisits] = useState<VisitRecord[]>([]);

  // Initialize data when client changes
  useEffect(() => {
    if (client) {
      setNotes(client.comment || '');
      setEditForm({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        comment: client.comment || '',
      });

      // Mock visits data
      const mockVisits: VisitRecord[] = [
        { id: 1, date: '2025-01-20', service: 'Маникюр', staff: 'Анна Петрова', cost: 2500, rating: 9, ratingComment: 'Отлично!' },
        { id: 2, date: '2025-01-10', service: 'Педикюр', staff: 'Мария Иванова', cost: 3000, rating: 8, ratingComment: null },
        { id: 3, date: '2024-12-25', service: 'Окрашивание', staff: 'Елена Козлова', cost: 8500, rating: null, ratingComment: null },
        { id: 4, date: '2024-12-15', service: 'Стрижка', staff: 'Ольга Сидорова', cost: 1800, rating: 10, ratingComment: 'Превосходно!' },
        { id: 5, date: '2024-12-01', service: 'Чистка лица', staff: 'Наталья Орлова', cost: 4500, rating: 7, ratingComment: null },
      ];
      setClientVisits(mockVisits);
    }
  }, [client]);


  if (!client) return null;

  const status = getClientScoreStatus(client.score);
  const config = statusConfig[status];

  // Calculate metrics
  const cancelledVisits = Math.floor(client.visits_count * 0.05); // Mock 5% cancelled
  const completedVisits = client.visits_count - client.no_show_count - cancelledVisits;
  const attendanceRate = client.visits_count > 0
    ? Math.round((completedVisits / client.visits_count) * 100)
    : 100;
  const noshowRate = client.visits_count > 0
    ? Math.round((client.no_show_count / client.visits_count) * 100)
    : 0;
  const rescheduleRate = Math.round(Math.random() * 15); // Mock
  const behaviorScore = client.score;

  // Calculate average rating
  const ratedVisits = clientVisits.filter(v => v.rating !== null);
  const averageRating = ratedVisits.length > 0
    ? ratedVisits.reduce((sum, v) => sum + (v.rating || 0), 0) / ratedVisits.length
    : null;

  // Mock IVK history
  const ivkHistory = [
    { month: '2024-08', score: Math.max(0, client.score - 15) },
    { month: '2024-09', score: Math.max(0, client.score - 10) },
    { month: '2024-10', score: Math.max(0, client.score - 5) },
    { month: '2024-11', score: client.score },
    { month: '2024-12', score: Math.min(100, client.score + 3) },
    { month: '2025-01', score: client.score },
  ];

  const trend = ivkHistory[ivkHistory.length - 1].score - ivkHistory[0].score;

  // Mock referral data
  const referralData = {
    source: 'Instagram',
    referrer: Math.random() > 0.5 ? { name: 'Мария Сидорова', phone: '+7 (999) 123-45-67' } : null,
    referralCode: `REF${client.id}${Math.random().toString(36).substring(7).toUpperCase()}`,
    promoCodeUsed: Math.random() > 0.7 ? 'WELCOME20' : null,
    referrals: Math.random() > 0.5 ? [
      { id: 101, name: 'Елена Козлова', hasSubscription: true },
      { id: 102, name: 'Ольга Новикова', hasSubscription: false },
    ] : [],
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    // TODO: Implement API call to save notes
    setTimeout(() => {
      setIsSavingNotes(false);
    }, 500);
  };

  const handleRecalculateIVK = async () => {
    setIsRecalculating(true);
    // TODO: Implement API call
    setTimeout(() => {
      setIsRecalculating(false);
    }, 1000);
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    // TODO: Implement API call
    setTimeout(() => {
      setIsSavingEdit(false);
      setEditModalOpened(false);
    }, 500);
  };

  const handleRateVisit = (visitId: number) => {
    setRatingVisitId(visitId);
    setSelectedRating(5);
    setRatingComment('');
    setRatingModalOpened(true);
  };

  const handleSaveRating = () => {
    if (ratingVisitId) {
      setClientVisits(prev => prev.map(v =>
        v.id === ratingVisitId
          ? { ...v, rating: selectedRating, ratingComment: ratingComment || null }
          : v
      ));
    }
    setRatingModalOpened(false);
    setRatingVisitId(null);
  };

  const formatMonth = (monthStr: string) => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const [year, month] = monthStr.split('-');
    return `${months[parseInt(month) - 1]}'${year.slice(-2)}`;
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size={isFullscreen ? '100%' : 'xl'}
        fullScreen={isFullscreen}
        padding={0}
        withCloseButton={false}
        radius={isFullscreen ? 0 : 'lg'}
        centered={!isFullscreen}
        styles={{
          content: {
            maxWidth: isFullscreen ? '100%' : '900px',
            maxHeight: isFullscreen ? '100%' : '90vh',
            overflow: 'auto',
          },
          body: { padding: 0 },
        }}
      >
        {/* Header with gradient */}
        <Box
          p="lg"
          style={{
            background: `linear-gradient(135deg, var(--mantine-color-${config.gradient.from}) 0%, var(--mantine-color-${config.gradient.to}) 100%)`,
            position: 'relative',
            filter: client.is_blocked ? 'grayscale(1)' : 'none',
          }}
        >
          {/* Header buttons */}
          <Group style={{ position: 'absolute', top: 16, right: 16 }} gap="xs">
            <Tooltip label={isFullscreen ? 'Свернуть' : 'На весь экран'}>
              <ActionIcon
                variant="subtle"
                color="dark"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <IconArrowsMinimize size={20} /> : <IconArrowsMaximize size={20} />}
              </ActionIcon>
            </Tooltip>
            <ActionIcon
              variant="subtle"
              color="dark"
              onClick={onClose}
            >
              <IconX size={20} />
            </ActionIcon>
          </Group>

          {/* Client info */}
          <Text size="xs" c="dark.3" fw={500} mb="xs" ta="center">
            Профиль клиента
          </Text>

          <Group gap="md" mb="md">
            <Avatar
              src={client.photo_url}
              size={64}
              radius="xl"
              color={config.color}
            >
              {client.name?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Group gap="xs" mb={4}>
                <Title order={4} c="dark.7">{client.name}</Title>
                {client.is_blocked && (
                  <Badge color="dark" size="xs" leftSection={<IconLock size={10} />}>
                    Заблокирован
                  </Badge>
                )}
              </Group>
              <Group gap="xs">
                <IconPhone size={14} color="var(--mantine-color-dark-4)" />
                <Text size="sm" c="dark.5" ff="monospace">{formatPhone(client.phone)}</Text>
              </Group>
            </div>
          </Group>

          {/* Edit button */}
          <Button
            size="xs"
            variant="white"
            leftSection={<IconEdit size={14} />}
            mb="sm"
            onClick={() => setEditModalOpened(true)}
            style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
          >
            Редактировать данные
          </Button>

          {/* Subscription status */}
          <Paper
            p="sm"
            radius="md"
            style={{
              backgroundColor: client.has_active_subscription
                ? 'rgba(255, 193, 7, 0.2)'
                : 'rgba(239, 68, 68, 0.1)',
            }}
          >
            <Group justify="center" gap="xs">
              <IconCrown
                size={18}
                color={client.has_active_subscription ? '#ca8a04' : '#ef4444'}
              />
              <Text size="sm" fw={500} c={client.has_active_subscription ? 'yellow.8' : 'red.6'}>
                {client.has_active_subscription ? 'Подписка активна' : 'Подписка не активна'}
              </Text>
            </Group>
          </Paper>
        </Box>

        {/* Score Card - Floating */}
        <Box px="lg" style={{ marginTop: -20, position: 'relative', zIndex: 10 }}>
          <Paper p="md" radius="lg" shadow="md" withBorder>
            <Group justify="space-between" align="center">
              <Group gap="lg">
                <RingProgress
                  size={120}
                  thickness={10}
                  roundCaps
                  sections={[{ value: client.score, color: config.color }]}
                  label={
                    <Stack gap={0} align="center">
                      <Text size="28px" fw={700}>{client.score}</Text>
                      <Text size="xs" c="dimmed">Score</Text>
                    </Stack>
                  }
                />
                <div>
                  <Group gap="sm" mb={8}>
                    <Text size="xl">{config.emoji}</Text>
                    <Text size="xl" fw={600} c={`${config.color}.7`}>{config.label}</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Индекс взаимодействия клиента (ИВК)
                  </Text>
                </div>
              </Group>
            </Group>
          </Paper>
        </Box>

        {/* Content */}
        <Stack gap="xl" p="lg" pt="md">
            {/* Score Breakdown */}
            <Paper p="lg" radius="md" bg="gray.0">
              <Group gap="xs" mb="lg">
                <IconChartBar size={20} />
                <Text fw={600} size="md">Детализация Score</Text>
              </Group>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Box ta="center">
                  <CircularMetric
                    value={attendanceRate}
                    color="green"
                    label="Явки"
                    suffix="%"
                  />
                </Box>
                <Box ta="center">
                  <CircularMetric
                    value={rescheduleRate}
                    color="yellow"
                    label="Переносы"
                    suffix="%"
                  />
                </Box>
                <Box ta="center">
                  <CircularMetric
                    value={noshowRate}
                    color="red"
                    label="Неявки"
                    suffix="%"
                  />
                </Box>
                <Box ta="center">
                  <CircularMetric
                    value={behaviorScore}
                    color="violet"
                    label="Поведение"
                  />
                </Box>
              </SimpleGrid>
            </Paper>

            {/* Visit Stats */}
            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" fw={600} c="dimmed" tt="uppercase" mb="md">
                Статистика визитов
              </Text>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper p="md" radius="md" bg="gray.0" ta="center">
                  <Text size="28px" fw={700}>{client.visits_count}</Text>
                  <Text size="sm" c="dimmed">Всего</Text>
                </Paper>
                <Paper p="md" radius="md" bg="green.0" ta="center">
                  <Text size="28px" fw={700} c="green.7">{completedVisits}</Text>
                  <Text size="sm" c="green.6">Завершено</Text>
                </Paper>
                <Paper p="md" radius="md" bg="yellow.0" ta="center">
                  <Text size="28px" fw={700} c="yellow.7">{cancelledVisits}</Text>
                  <Text size="sm" c="yellow.6">Отменено</Text>
                </Paper>
                <Paper p="md" radius="md" bg="red.0" ta="center">
                  <Text size="28px" fw={700} c="red.7">{client.no_show_count}</Text>
                  <Text size="sm" c="red.6">Неявки</Text>
                </Paper>
              </SimpleGrid>
            </Paper>

            {/* Visit Ratings */}
            <Paper p="md" radius="md" bg="violet.0" withBorder style={{ borderColor: 'var(--mantine-color-violet-2)' }}>
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconStar size={18} color="var(--mantine-color-violet-7)" />
                  <Text fw={600} size="sm" c="violet.7">Оценка визитов</Text>
                </Group>
                {averageRating !== null && (
                  <Group gap="xs">
                    <Text size="xs" c="violet.6">Средняя:</Text>
                    <Badge color="violet">{averageRating.toFixed(1)}/10</Badge>
                    <Text size="xs" c="violet.5">({ratedVisits.length} оценено)</Text>
                  </Group>
                )}
              </Group>

              {/* Behavior score display */}
              <Paper p="sm" radius="md" mb="md" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="violet.6">Оценка поведения:</Text>
                  <Text
                    size="lg"
                    fw={700}
                    c={behaviorScore >= 80 ? 'green.6' : behaviorScore >= 60 ? 'violet.6' : behaviorScore >= 40 ? 'orange.6' : 'red.6'}
                  >
                    {behaviorScore}/100
                  </Text>
                </Group>
                <Progress
                  value={behaviorScore}
                  color={behaviorScore >= 80 ? 'green' : behaviorScore >= 60 ? 'violet' : behaviorScore >= 40 ? 'orange' : 'red'}
                  size="sm"
                  radius="xl"
                />
              </Paper>

              {/* Visits list */}
              <Stack gap="xs">
                {clientVisits.length === 0 ? (
                  <Text size="sm" c="violet.5" ta="center" py="md">
                    Нет завершённых визитов для оценки
                  </Text>
                ) : (
                  clientVisits.slice(0, 10).map((visit) => (
                    <Paper key={visit.id} p="sm" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-violet-2)', backgroundColor: 'white' }}>
                      <Group justify="space-between" wrap="nowrap">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="xs" mb={2}>
                            <IconCalendar size={12} color="var(--mantine-color-violet-4)" />
                            <Text size="xs" c="dimmed">
                              {new Date(visit.date).toLocaleDateString('ru-RU')}
                            </Text>
                          </Group>
                          <Text size="sm" fw={500} lineClamp={1}>{visit.service}</Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>{visit.staff}</Text>
                        </div>
                        <div>
                          {visit.rating !== null ? (
                            <Group gap="xs">
                              <IconStar size={16} color="var(--mantine-color-yellow-5)" fill="var(--mantine-color-yellow-5)" />
                              <Text size="sm" fw={700} c="yellow.7">{visit.rating}</Text>
                            </Group>
                          ) : (
                            <Button
                              size="xs"
                              variant="light"
                              color="violet"
                              leftSection={<IconStar size={12} />}
                              onClick={() => handleRateVisit(visit.id)}
                            >
                              Оценить
                            </Button>
                          )}
                        </div>
                      </Group>
                      {visit.ratingComment && (
                        <Text size="xs" c="dimmed" fs="italic" mt={4}>"{visit.ratingComment}"</Text>
                      )}
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>

            {/* Financial info */}
            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" fw={600} c="dimmed" tt="uppercase" mb="md">
                Финансы
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Paper p="lg" radius="md" bg="green.0" ta="center">
                  <Text size="28px" fw={700} c="green.7">
                    {formatCurrency(client.total_spent)}
                  </Text>
                  <Text size="sm" c="green.6">Всего потрачено</Text>
                </Paper>
                <Paper p="lg" radius="md" bg="blue.0" ta="center">
                  <Text size="28px" fw={700} c="blue.7">
                    {client.visits_count > 0
                      ? formatCurrency(client.total_spent / client.visits_count)
                      : '—'}
                  </Text>
                  <Text size="sm" c="blue.6">Средний чек</Text>
                </Paper>
              </SimpleGrid>
            </Paper>

            {/* Contact info */}
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">
                Контакты
              </Text>
              <Stack gap="xs">
                <Group gap="xs">
                  <ThemeIcon size="sm" variant="light" color="blue">
                    <IconPhone size={14} />
                  </ThemeIcon>
                  <Text size="sm" ff="monospace">{formatPhone(client.phone)}</Text>
                </Group>
                {client.email && (
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="grape">
                      <IconMail size={14} />
                    </ThemeIcon>
                    <Text size="sm">{client.email}</Text>
                  </Group>
                )}
                {client.telegram_id && (
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="blue">
                      <IconBrandTelegram size={14} />
                    </ThemeIcon>
                    <Text size="sm">Telegram подключён</Text>
                  </Group>
                )}
                {client.last_visit_at && (
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="gray">
                      <IconCalendar size={14} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed">
                      Последний визит: {formatDaysAgo(client.last_visit_at)}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>

            {/* Referral Information */}
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="md" style={{ backgroundColor: 'var(--mantine-color-teal-0)', margin: '-16px -16px 16px -16px', padding: '12px 16px', borderRadius: '8px 8px 0 0' }}>
                <IconShare size={16} color="var(--mantine-color-teal-6)" />
                <Text fw={600} size="sm" c="teal.7">Реферальная информация</Text>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="xs" mb={4}>
                    <IconExternalLink size={14} color="var(--mantine-color-gray-5)" />
                    <Text size="xs" c="dimmed" fw={500}>Источник</Text>
                  </Group>
                  <Text size="md" fw={600}>{referralData.source || 'Не указан'}</Text>
                </Paper>
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="xs" mb={4}>
                    <IconUserPlus size={14} color="var(--mantine-color-gray-5)" />
                    <Text size="xs" c="dimmed" fw={500}>Пригласил</Text>
                  </Group>
                  {referralData.referrer ? (
                    <>
                      <Text size="md" fw={600}>{referralData.referrer.name}</Text>
                      <Text size="sm" c="dimmed" ff="monospace">{formatPhone(referralData.referrer.phone)}</Text>
                    </>
                  ) : (
                    <Text size="md" c="dimmed">—</Text>
                  )}
                </Paper>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="xs" mb={4}>
                    <IconLink size={14} color="var(--mantine-color-gray-5)" />
                    <Text size="xs" c="dimmed" fw={500}>Реф. код</Text>
                  </Group>
                  <Text size="md" fw={600} c="teal.6" ff="monospace">{referralData.referralCode}</Text>
                </Paper>
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="xs" mb={4}>
                    <IconGift size={14} color="var(--mantine-color-gray-5)" />
                    <Text size="xs" c="dimmed" fw={500}>Промокод</Text>
                  </Group>
                  {referralData.promoCodeUsed ? (
                    <Text size="md" fw={600} c="grape.6" ff="monospace">{referralData.promoCodeUsed}</Text>
                  ) : (
                    <Text size="md" c="dimmed">—</Text>
                  )}
                </Paper>
              </SimpleGrid>

              <Divider mb="md" />

              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <IconUsers size={14} color="var(--mantine-color-gray-5)" />
                  <Text size="xs" c="dimmed" fw={500}>Приглашённые</Text>
                </Group>
                <Badge size="sm" color="gray">{referralData.referrals.length}</Badge>
              </Group>

              {referralData.referrals.length > 0 ? (
                <Stack gap="xs">
                  {referralData.referrals.map((ref) => (
                    <Paper key={ref.id} p="xs" radius="md" bg="gray.0">
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>{ref.name}</Text>
                        {ref.hasSubscription && (
                          <Badge size="xs" color="teal" leftSection={<IconCrown size={10} />}>
                            VIP
                          </Badge>
                        )}
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Paper p="md" radius="md" bg="gray.0" ta="center">
                  <IconUsers size={24} color="var(--mantine-color-gray-4)" />
                  <Text size="xs" c="dimmed" mt={4}>Нет приглашённых клиентов</Text>
                </Paper>
              )}
            </Paper>

            {/* IVK History Chart */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm" style={{ backgroundColor: 'var(--mantine-color-indigo-0)', margin: '-16px -16px 16px -16px', padding: '12px 16px', borderRadius: '8px 8px 0 0' }}>
                <Group gap="xs">
                  <IconChartBar size={16} color="var(--mantine-color-indigo-6)" />
                  <Text size="xs" fw={600} c="indigo.7">Динамика Score</Text>
                </Group>
                <Badge
                  size="sm"
                  color={trend > 0 ? 'green' : trend < 0 ? 'red' : 'gray'}
                  leftSection={trend > 0 ? <IconArrowUp size={12} /> : trend < 0 ? <IconArrowDown size={12} /> : null}
                >
                  {trend > 0 ? '+' : ''}{trend}
                </Badge>
              </Group>

              {/* Stats row */}
              <SimpleGrid cols={{ base: 3 }} spacing="md" mb="md">
                <Paper p="md" radius="md" bg="orange.0" ta="center">
                  <Text size="xl" fw={700} c="orange.6">{Math.min(...ivkHistory.map(p => p.score))}</Text>
                  <Text size="xs" c="orange.5" tt="uppercase">мин</Text>
                </Paper>
                <Paper p="md" radius="md" bg="gray.0" ta="center">
                  <Text size="xl" fw={700}>{Math.round(ivkHistory.reduce((sum, p) => sum + p.score, 0) / ivkHistory.length)}</Text>
                  <Text size="xs" c="dimmed" tt="uppercase">сред</Text>
                </Paper>
                <Paper p="md" radius="md" bg="green.0" ta="center">
                  <Text size="xl" fw={700} c="green.6">{Math.max(...ivkHistory.map(p => p.score))}</Text>
                  <Text size="xs" c="green.5" tt="uppercase">макс</Text>
                </Paper>
              </SimpleGrid>

              {/* Simple bar chart */}
              <Paper p="sm" radius="md" bg="gray.0">
                <Group gap="xs" align="flex-end" h={80}>
                  {ivkHistory.map((point, idx) => {
                    const heightPct = (point.score / 100) * 100;
                    const pointStatus = getClientScoreStatus(point.score);
                    return (
                      <Tooltip key={idx} label={`${formatMonth(point.month)}: ${point.score}`}>
                        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Text size="xs" fw={600} mb={4}>{point.score}</Text>
                          <Box
                            style={{
                              width: '100%',
                              height: `${Math.max(heightPct * 0.6, 10)}px`,
                              backgroundColor: `var(--mantine-color-${statusConfig[pointStatus].color}-5)`,
                              borderRadius: 4,
                            }}
                          />
                          <Text size="xs" c="dimmed" mt={4}>
                            {formatMonth(point.month)}
                          </Text>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Group>
              </Paper>
            </Paper>

            {/* Admin Notes */}
            <Paper p="md" radius="md" bg="blue.0" withBorder style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
              <Group gap="xs" mb="sm">
                <IconMessageCircle size={16} color="var(--mantine-color-blue-7)" />
                <Text size="sm" fw={600} c="blue.7">Заметки администратора</Text>
              </Group>
              <Textarea
                placeholder="Добавьте заметки о клиенте..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                minRows={3}
                styles={{
                  input: {
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    borderColor: 'var(--mantine-color-blue-2)',
                  },
                }}
              />
              <Group justify="flex-end" mt="sm">
                <Button
                  size="xs"
                  color="blue"
                  leftSection={<IconCheck size={14} />}
                  loading={isSavingNotes}
                  onClick={handleSaveNotes}
                  disabled={notes === (client.comment || '')}
                >
                  Сохранить
                </Button>
              </Group>
            </Paper>

            {/* Preferences */}
            {(client.drink_preferences || client.music_preferences || client.interests) && (
              <Paper p="md" radius="md" withBorder>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">
                  Предпочтения
                </Text>
                <Stack gap="xs">
                  {client.drink_preferences && (
                    <Text size="sm">🍵 {client.drink_preferences}</Text>
                  )}
                  {client.music_preferences && (
                    <Text size="sm">🎵 {client.music_preferences}</Text>
                  )}
                  {client.interests && (
                    <Text size="sm">❤️ {client.interests}</Text>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Action Buttons */}
            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" fw={600} c="dimmed" tt="uppercase" mb="md">
                Действия
              </Text>
              <Stack gap="md">
                <Button
                  variant="light"
                  size="md"
                  leftSection={<IconHistory size={18} />}
                  onClick={() => setHistoryModalOpened(true)}
                  fullWidth
                >
                  История посещений
                </Button>
                <Group grow>
                  <Button
                    variant="light"
                    size="md"
                    leftSection={isRecalculating ? <IconRefresh size={18} className="animate-spin" /> : <IconRefresh size={18} />}
                    onClick={handleRecalculateIVK}
                    loading={isRecalculating}
                  >
                    Пересчитать ИВК
                  </Button>
                  <Button
                    variant={client.is_blocked ? 'filled' : 'light'}
                    size="md"
                    color={client.is_blocked ? 'green' : 'red'}
                    leftSection={client.is_blocked ? <IconLockOpen size={18} /> : <IconLock size={18} />}
                    onClick={() => onToggleBlock?.(client)}
                  >
                    {client.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                  </Button>
                </Group>
                <Button
                  variant="light"
                  size="md"
                  color={client.has_active_subscription ? 'red' : 'green'}
                  leftSection={client.has_active_subscription ? <IconUserX size={18} /> : <IconUserCheck size={18} />}
                  onClick={() => onToggleSubscription?.(client)}
                  fullWidth
                >
                  {client.has_active_subscription ? 'Отключить подписку' : 'Включить подписку'}
                </Button>
              </Stack>
            </Paper>
          </Stack>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Редактирование данных клиента"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="ФИО"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Иванова Анна Петровна"
          />
          <TextInput
            label="Телефон"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            placeholder="+7 (999) 123-45-67"
          />
          <TextInput
            label="Email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            placeholder="example@mail.ru"
          />
          <Textarea
            label="Примечания"
            value={editForm.comment}
            onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
            placeholder="Дополнительная информация о клиенте"
            minRows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setEditModalOpened(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit} loading={isSavingEdit}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Visit History Modal */}
      <Modal
        opened={historyModalOpened}
        onClose={() => setHistoryModalOpened(false)}
        title="История посещений"
        size="lg"
      >
        <Stack gap="md">
          {clientVisits.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Нет записей о посещениях
            </Text>
          ) : (
            clientVisits.map((visit) => (
              <Paper key={visit.id} p="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <IconCalendar size={16} color="var(--mantine-color-gray-5)" />
                    <Text size="sm" fw={500}>
                      {new Date(visit.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </Group>
                  <Text size="sm" fw={600} c="green.6">
                    {formatCurrency(visit.cost)}
                  </Text>
                </Group>
                <Group gap="xs" mb="xs">
                  <IconScissors size={14} color="var(--mantine-color-gray-5)" />
                  <Text size="sm">{visit.service}</Text>
                </Group>
                <Group gap="xs">
                  <IconUser size={14} color="var(--mantine-color-gray-5)" />
                  <Text size="sm" c="dimmed">{visit.staff}</Text>
                </Group>
                {visit.rating !== null && (
                  <Group gap="xs" mt="sm">
                    <IconStar size={14} color="var(--mantine-color-yellow-5)" fill="var(--mantine-color-yellow-5)" />
                    <Text size="sm" fw={500}>Оценка: {visit.rating}/10</Text>
                    {visit.ratingComment && (
                      <Text size="xs" c="dimmed" fs="italic">— "{visit.ratingComment}"</Text>
                    )}
                  </Group>
                )}
              </Paper>
            ))
          )}
        </Stack>
      </Modal>

      {/* Rating Modal */}
      <Modal
        opened={ratingModalOpened}
        onClose={() => setRatingModalOpened(false)}
        title={
          <Group gap="xs">
            <IconStar size={20} color="var(--mantine-color-yellow-5)" />
            <Text>Оценка визита</Text>
          </Group>
        }
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Оцените качество визита клиента от 1 до 10
          </Text>

          <Group justify="center" gap="xs">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <Button
                key={rating}
                size="sm"
                variant={selectedRating === rating ? 'filled' : 'outline'}
                color={
                  selectedRating === rating
                    ? rating >= 8
                      ? 'green'
                      : rating >= 5
                      ? 'violet'
                      : 'red'
                    : 'gray'
                }
                onClick={() => setSelectedRating(rating)}
                style={{ width: 40, height: 40, padding: 0 }}
              >
                {rating}
              </Button>
            ))}
          </Group>

          <Text
            ta="center"
            size="lg"
            fw={700}
            c={selectedRating >= 8 ? 'green.6' : selectedRating >= 5 ? 'violet.6' : 'red.6'}
          >
            {selectedRating >= 8 ? 'Отлично' : selectedRating >= 5 ? 'Нормально' : 'Плохо'}
          </Text>

          <Textarea
            label="Комментарий (необязательно)"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="Добавьте заметку об этом визите..."
            minRows={2}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setRatingModalOpened(false)}>
              Отмена
            </Button>
            <Button
              color="violet"
              leftSection={<IconStar size={16} />}
              onClick={handleSaveRating}
            >
              Сохранить оценку
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
