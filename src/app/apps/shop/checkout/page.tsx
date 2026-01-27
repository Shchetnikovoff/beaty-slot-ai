'use client';

import { useEffect } from 'react';
import {
  Anchor,
  Button,
  Container,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconShoppingCart } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components';
import { useCartStore } from '@/lib/cart-store';
import { PATH_DASHBOARD } from '@/routes';
import type { ShopCustomer } from '@/types/shop';

import { CheckoutForm } from '../components/CheckoutForm';

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Магазин', href: '/apps/shop' },
  { title: 'Оформление заказа', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();

  // Редирект если корзина пуста
  useEffect(() => {
    if (items.length === 0) {
      router.replace('/apps/shop');
    }
  }, [items.length, router]);

  const handleSubmit = async (customer: ShopCustomer) => {
    try {
      const response = await fetch('/api/v1/shop/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания заказа');
      }

      const order = await response.json();

      // Очищаем корзину
      clearCart();

      // Показываем уведомление
      notifications.show({
        title: 'Заказ оформлен!',
        message: `Номер заказа: ${order.orderNumber}. Мы свяжемся с вами для подтверждения.`,
        color: 'green',
      });

      // Переходим на страницу успеха
      router.push(`/apps/shop/success?order=${order.orderNumber}`);
    } catch (error) {
      console.error('Checkout error:', error);
      notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось оформить заказ',
        color: 'red',
      });
    }
  };

  // Не рендерим если корзина пуста
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <title>Оформление заказа | Beauty Slot</title>
      <meta name="description" content="Оформление заказа в онлайн-магазине" />

      <PageHeader
        title="Оформление заказа"
        breadcrumbItems={breadcrumbItems}
        actionButton={
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/apps/shop')}
          >
            Назад в магазин
          </Button>
        }
      />

      <Container size="sm" mt="lg">
        <CheckoutForm
          items={items}
          total={getTotal()}
          onSubmit={handleSubmit}
        />
      </Container>
    </>
  );
}

export default CheckoutPage;
