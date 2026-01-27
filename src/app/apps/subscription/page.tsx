'use client';

import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconCheck,
  IconCrown,
  IconReceipt,
  IconRocket,
  IconUsers,
  IconCalendar,
  IconMessageCircle,
  IconChartBar,
} from '@tabler/icons-react';

import { PageHeader, Surface } from '@/components';
import { PATH_DASHBOARD } from '@/routes';

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Профиль организации', href: '#' },
  { title: 'Подписка салона', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

// Тарифные планы
const plans = [
  {
    name: 'Старт',
    price: 1990,
    description: 'Для небольших салонов',
    features: [
      'До 100 клиентов',
      'Базовая аналитика',
      'Telegram-уведомления',
      'Поддержка по email',
    ],
    color: 'gray',
    popular: false,
  },
  {
    name: 'Бизнес',
    price: 4990,
    description: 'Для растущего бизнеса',
    features: [
      'До 500 клиентов',
      'Расширенная аналитика',
      'Telegram + SMS уведомления',
      'Приоритетная поддержка',
      'API интеграции',
    ],
    color: 'blue',
    popular: true,
  },
  {
    name: 'Премиум',
    price: 9990,
    description: 'Для сети салонов',
    features: [
      'Неограниченно клиентов',
      'Полная аналитика',
      'Все каналы уведомлений',
      'Персональный менеджер',
      'White-label решение',
      'Мультисалонная система',
    ],
    color: 'violet',
    popular: false,
  },
];

function SubscriptionPage() {
  // Mock данные текущей подписки
  const currentPlan = {
    name: 'Бизнес',
    status: 'active',
    expiresAt: '2025-03-01',
    daysLeft: 35,
    clientsUsed: 287,
    clientsLimit: 500,
  };

  return (
    <>
      <title>Подписка салона | Beauty Slot Admin</title>
      <meta name="description" content="Управление подпиской салона" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Подписка салона"
            breadcrumbItems={breadcrumbItems}
          />

          {/* Текущий план */}
          <Surface p="sm">
            <Group justify="space-between" mb="sm" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size="md" color="blue" variant="light">
                  <IconCrown size={16} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" lh={1.2}>Текущий тариф</Text>
                  <Group gap={6}>
                    <Text size="md" fw={600}>{currentPlan.name}</Text>
                    <Badge size="xs" color="green" variant="light">Активна</Badge>
                  </Group>
                </div>
              </Group>
              <div style={{ textAlign: 'right' }}>
                <Text size="xs" c="dimmed" lh={1.2}>Действует до</Text>
                <Text size="sm" fw={600} lh={1.3}>
                  {new Date(currentPlan.expiresAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text size="xs" c="orange" lh={1.2}>Осталось {currentPlan.daysLeft} дней</Text>
              </div>
            </Group>

            <Paper p="xs" radius="sm" bg="gray.0" mb="sm">
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">Использовано клиентов</Text>
                <Text size="xs" fw={600}>
                  {currentPlan.clientsUsed} / {currentPlan.clientsLimit}
                </Text>
              </Group>
              <Progress
                value={(currentPlan.clientsUsed / currentPlan.clientsLimit) * 100}
                color={currentPlan.clientsUsed / currentPlan.clientsLimit > 0.8 ? 'orange' : 'blue'}
                size="sm"
                radius="xl"
              />
            </Paper>

            <Group gap="xs">
              <Button size="xs" variant="light" leftSection={<IconReceipt size={14} />}>
                История платежей
              </Button>
              <Button size="xs" variant="light" leftSection={<IconRocket size={14} />}>
                Улучшить тариф
              </Button>
            </Group>
          </Surface>

          {/* Тарифные планы */}
          <Text size="sm" fw={600}>Доступные тарифы</Text>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                withBorder
                radius="md"
                p="md"
                style={{
                  borderColor: plan.popular ? 'var(--mantine-color-blue-5)' : undefined,
                  borderWidth: plan.popular ? 2 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Заголовок с бейджем */}
                <Group justify="space-between" align="flex-start" mb="xs">
                  <div>
                    <Text size="md" fw={600}>{plan.name}</Text>
                    <Text size="xs" c="dimmed">{plan.description}</Text>
                  </div>
                  {plan.popular && (
                    <Badge size="xs" color="blue" variant="filled">
                      Популярный
                    </Badge>
                  )}
                </Group>

                {/* Цена */}
                <Group align="baseline" gap="xs" mb="md">
                  <Text size="xl" fw={700}>{plan.price.toLocaleString('ru-RU')}</Text>
                  <Text size="xs" c="dimmed">₽/месяц</Text>
                </Group>

                {/* Фичи - растягиваются */}
                <Stack gap={6} style={{ flex: 1 }} mb="md">
                  {plan.features.map((feature) => (
                    <Group key={feature} gap={6} wrap="nowrap">
                      <ThemeIcon size="xs" color={plan.color} variant="light">
                        <IconCheck size={10} />
                      </ThemeIcon>
                      <Text size="xs">{feature}</Text>
                    </Group>
                  ))}
                </Stack>

                {/* Кнопка всегда внизу */}
                <Button
                  fullWidth
                  size="sm"
                  variant={currentPlan.name === plan.name ? 'light' : 'filled'}
                  color={plan.color}
                  disabled={currentPlan.name === plan.name}
                >
                  {currentPlan.name === plan.name ? 'Текущий тариф' : 'Выбрать'}
                </Button>
              </Card>
            ))}
          </SimpleGrid>

          {/* Статистика использования */}
          <Surface p="sm">
            <Text size="sm" fw={600} mb="sm">Статистика использования</Text>
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xs">
              <Paper p="xs" radius="sm" bg="blue.0" ta="center">
                <ThemeIcon size="md" color="blue" variant="light" mx="auto" mb={4}>
                  <IconUsers size={16} />
                </ThemeIcon>
                <Text size="md" fw={700} c="blue.7">287</Text>
                <Text size="xs" c="blue.6">Клиентов</Text>
              </Paper>
              <Paper p="xs" radius="sm" bg="green.0" ta="center">
                <ThemeIcon size="md" color="green" variant="light" mx="auto" mb={4}>
                  <IconCalendar size={16} />
                </ThemeIcon>
                <Text size="md" fw={700} c="green.7">1,245</Text>
                <Text size="xs" c="green.6">Записей</Text>
              </Paper>
              <Paper p="xs" radius="sm" bg="violet.0" ta="center">
                <ThemeIcon size="md" color="violet" variant="light" mx="auto" mb={4}>
                  <IconMessageCircle size={16} />
                </ThemeIcon>
                <Text size="md" fw={700} c="violet.7">3,892</Text>
                <Text size="xs" c="violet.6">Уведомлений</Text>
              </Paper>
              <Paper p="xs" radius="sm" bg="orange.0" ta="center">
                <ThemeIcon size="md" color="orange" variant="light" mx="auto" mb={4}>
                  <IconChartBar size={16} />
                </ThemeIcon>
                <Text size="md" fw={700} c="orange.7">15.2K</Text>
                <Text size="xs" c="orange.6">API запросов</Text>
              </Paper>
            </SimpleGrid>
          </Surface>
        </Stack>
      </Container>
    </>
  );
}

export default SubscriptionPage;
