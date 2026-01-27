'use client';

import { useState } from 'react';
import {
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconUser, IconPhone, IconMail, IconMessageCircle } from '@tabler/icons-react';

import type { ShopCustomer, CartItem } from '@/types/shop';

interface CheckoutFormProps {
  items: CartItem[];
  total: number;
  onSubmit: (customer: ShopCustomer) => Promise<void>;
  loading?: boolean;
}

export function CheckoutForm({ items, total, onSubmit, loading }: CheckoutFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ShopCustomer>({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      notes: '',
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length < 2) {
          return 'Введите ваше имя';
        }
        return null;
      },
      phone: (value) => {
        if (!value || value.trim().length < 10) {
          return 'Введите корректный номер телефона';
        }
        // Простая валидация российского номера
        const digits = value.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) {
          return 'Некорректный номер телефона';
        }
        return null;
      },
      email: (value) => {
        if (value && !/^\S+@\S+\.\S+$/.test(value)) {
          return 'Некорректный email';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: ShopCustomer) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="lg">
        {/* Customer Info */}
        <Paper p="lg" radius="md" withBorder>
          <Title order={4} mb="md">Контактные данные</Title>

          <Stack gap="sm">
            <TextInput
              label="Имя"
              placeholder="Ваше имя"
              required
              leftSection={<IconUser size={16} />}
              {...form.getInputProps('name')}
            />

            <TextInput
              label="Телефон"
              placeholder="+7 (999) 123-45-67"
              required
              leftSection={<IconPhone size={16} />}
              {...form.getInputProps('phone')}
            />

            <TextInput
              label="Email"
              placeholder="email@example.com"
              leftSection={<IconMail size={16} />}
              {...form.getInputProps('email')}
            />

            <Textarea
              label="Комментарий к заказу"
              placeholder="Дополнительные пожелания..."
              leftSection={<IconMessageCircle size={16} />}
              minRows={2}
              {...form.getInputProps('notes')}
            />
          </Stack>
        </Paper>

        {/* Order Summary */}
        <Paper p="lg" radius="md" withBorder>
          <Title order={4} mb="md">Ваш заказ</Title>

          <Stack gap="xs">
            {items.map((item) => (
              <Group key={item.product.id} justify="space-between">
                <Text size="sm">
                  {item.product.title} × {item.quantity}
                </Text>
                <Text size="sm" fw={500}>
                  {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                </Text>
              </Group>
            ))}

            <Divider my="xs" />

            <Group justify="space-between">
              <Text size="lg" fw={600}>
                Итого:
              </Text>
              <Text size="xl" fw={700} c="blue">
                {total.toLocaleString('ru-RU')} ₽
              </Text>
            </Group>
          </Stack>
        </Paper>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading || submitting}
          leftSection={<IconCheck size={20} />}
        >
          Подтвердить заказ
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных
        </Text>
      </Stack>
    </form>
  );
}

export default CheckoutForm;
