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
          <Surface>
            <Group justify="space-between" mb="lg">
              <div>
                <Group gap="sm">
                  <ThemeIcon size="lg" color="blue" variant="light">
                    <IconCrown size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" c="dimmed">Текущий тариф</Text>
                    <Group gap="xs">
                      <Title order={3}>{currentPlan.name}</Title>
                      <Badge color="green" variant="light">Активна</Badge>
                    </Group>
                  </div>
                </Group>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text size="sm" c="dimmed">Действует до</Text>
                <Text size="lg" fw={600}>
                  {new Date(currentPlan.expiresAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text size="sm" c="orange">Осталось {currentPlan.daysLeft} дней</Text>
              </div>
            </Group>

            <Paper p="md" radius="md" bg="gray.0" mb="md">
              <Group justify="space-between" mb="xs">
                <Text size="sm">Использовано клиентов</Text>
                <Text size="sm" fw={600}>
                  {currentPlan.clientsUsed} / {currentPlan.clientsLimit}
                </Text>
              </Group>
              <Progress
                value={(currentPlan.clientsUsed / currentPlan.clientsLimit) * 100}
                color={currentPlan.clientsUsed / currentPlan.clientsLimit > 0.8 ? 'orange' : 'blue'}
                size="lg"
                radius="xl"
              />
            </Paper>

            <Group>
              <Button variant="light" leftSection={<IconReceipt size={18} />}>
                История платежей
              </Button>
              <Button variant="light" leftSection={<IconRocket size={18} />}>
                Улучшить тариф
              </Button>
            </Group>
          </Surface>

          {/* Тарифные планы */}
          <Title order={4}>Доступные тарифы</Title>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                withBorder
                radius="md"
                p="xl"
                style={{
                  borderColor: plan.popular ? 'var(--mantine-color-blue-5)' : undefined,
                  borderWidth: plan.popular ? 2 : 1,
                }}
              >
                {plan.popular && (
                  <Badge
                    color="blue"
                    variant="filled"
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: 20,
                    }}
                  >
                    Популярный
                  </Badge>
                )}

                <Text size="lg" fw={600} mb="xs">{plan.name}</Text>
                <Text size="sm" c="dimmed" mb="md">{plan.description}</Text>

                <Group align="baseline" mb="lg">
                  <Text size="36px" fw={700}>{plan.price.toLocaleString('ru-RU')}</Text>
                  <Text size="sm" c="dimmed">₽/месяц</Text>
                </Group>

                <Stack gap="xs" mb="xl">
                  {plan.features.map((feature) => (
                    <Group key={feature} gap="xs">
                      <ThemeIcon size="sm" color={plan.color} variant="light">
                        <IconCheck size={12} />
                      </ThemeIcon>
                      <Text size="sm">{feature}</Text>
                    </Group>
                  ))}
                </Stack>

                <Button
                  fullWidth
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
          <Surface>
            <Title order={4} mb="lg">Статистика использования</Title>
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
              <Paper p="md" radius="md" bg="blue.0" ta="center">
                <ThemeIcon size="xl" color="blue" variant="light" mx="auto" mb="sm">
                  <IconUsers size={24} />
                </ThemeIcon>
                <Text size="24px" fw={700} c="blue.7">287</Text>
                <Text size="sm" c="blue.6">Клиентов</Text>
              </Paper>
              <Paper p="md" radius="md" bg="green.0" ta="center">
                <ThemeIcon size="xl" color="green" variant="light" mx="auto" mb="sm">
                  <IconCalendar size={24} />
                </ThemeIcon>
                <Text size="24px" fw={700} c="green.7">1,245</Text>
                <Text size="sm" c="green.6">Записей</Text>
              </Paper>
              <Paper p="md" radius="md" bg="violet.0" ta="center">
                <ThemeIcon size="xl" color="violet" variant="light" mx="auto" mb="sm">
                  <IconMessageCircle size={24} />
                </ThemeIcon>
                <Text size="24px" fw={700} c="violet.7">3,892</Text>
                <Text size="sm" c="violet.6">Уведомлений</Text>
              </Paper>
              <Paper p="md" radius="md" bg="orange.0" ta="center">
                <ThemeIcon size="xl" color="orange" variant="light" mx="auto" mb="sm">
                  <IconChartBar size={24} />
                </ThemeIcon>
                <Text size="24px" fw={700} c="orange.7">15.2K</Text>
                <Text size="sm" c="orange.6">API запросов</Text>
              </Paper>
            </SimpleGrid>
          </Surface>
        </Stack>
      </Container>
    </>
  );
}

export default SubscriptionPage;
