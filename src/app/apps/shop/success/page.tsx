'use client';

import { Suspense } from 'react';
import {
  Anchor,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck, IconHome, IconShoppingCart } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components';
import { PATH_DASHBOARD } from '@/routes';

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Магазин', href: '/apps/shop' },
  { title: 'Заказ оформлен', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <Container size="sm" mt="xl">
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="lg">
          <ThemeIcon size={80} radius="xl" color="green" variant="light">
            <IconCheck size={48} />
          </ThemeIcon>

          <Stack align="center" gap="xs">
            <Title order={2}>Заказ оформлен!</Title>
            {orderNumber && (
              <Text size="lg" c="dimmed">
                Номер заказа: <strong>{orderNumber}</strong>
              </Text>
            )}
          </Stack>

          <Text ta="center" c="dimmed">
            Спасибо за ваш заказ! Мы свяжемся с вами в ближайшее время для подтверждения.
            Если вы подключены к нашему Telegram-боту, уведомление придёт в чат.
          </Text>

          <Group mt="md">
            <Button
              variant="light"
              leftSection={<IconHome size={18} />}
              onClick={() => router.push(PATH_DASHBOARD.default)}
            >
              На главную
            </Button>
            <Button
              leftSection={<IconShoppingCart size={18} />}
              onClick={() => router.push('/apps/shop')}
            >
              Продолжить покупки
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}

function SuccessPage() {
  return (
    <>
      <title>Заказ оформлен | Beauty Slot</title>
      <meta name="description" content="Ваш заказ успешно оформлен" />

      <PageHeader
        title="Заказ оформлен"
        breadcrumbItems={breadcrumbItems}
      />

      <Suspense fallback={<div>Загрузка...</div>}>
        <SuccessContent />
      </Suspense>
    </>
  );
}

export default SuccessPage;
