'use client';

import { useState } from 'react';

import {
  Button,
  Drawer,
  DrawerProps,
  Grid,
  LoadingOverlay,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { isEmail, isNotEmpty, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

interface NewCustomerFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  status: number;
}

type NewCustomerDrawerProps = Omit<DrawerProps, 'title' | 'children'> & {
  onCustomerCreated?: () => void;
};

export const NewCustomerDrawer = ({
  onCustomerCreated,
  ...drawerProps
}: NewCustomerDrawerProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<NewCustomerFormValues>({
    mode: 'controlled',
    initialValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      street: '',
      city: '',
      state: '',
      country: 'Россия',
      zipCode: '',
      status: 1, // Active
    },
    validate: {
      name: isNotEmpty('Имя обязательно'),
      email: isEmail('Некорректный email'),
      phone: isNotEmpty('Телефон обязателен'),
    },
  });

  const handleSubmit = async (values: NewCustomerFormValues) => {
    setLoading(true);
    try {
      // Note: In this mock template, customers are read-only from JSON files
      // For a real implementation, you would send a POST request here
      notifications.show({
        title: 'Демо-режим',
        message: 'Это демо-версия. Создание клиента симулируется.',
        color: 'blue',
      });

      form.reset();

      if (drawerProps.onClose) {
        drawerProps.onClose();
      }

      if (onCustomerCreated) {
        onCustomerCreated();
      }
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось создать клиента',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: '1', label: 'Активный' },
    { value: '2', label: 'Неактивный' },
    { value: '3', label: 'Заблокирован' },
  ];

  return (
    <Drawer {...drawerProps} title="Создать клиента" size="lg">
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Title order={4}>Информация о клиенте</Title>
          <TextInput
            label="Имя"
            placeholder="Введите имя клиента"
            key={form.key('name')}
            {...form.getInputProps('name')}
            required
          />
          <TextInput
            label="Email"
            placeholder="client@email.com"
            key={form.key('email')}
            {...form.getInputProps('email')}
            required
          />
          <TextInput
            label="Телефон"
            placeholder="+7 (999) 000-0000"
            key={form.key('phone')}
            {...form.getInputProps('phone')}
            required
          />
          <TextInput
            label="Компания"
            placeholder="Название компании (необязательно)"
            key={form.key('company')}
            {...form.getInputProps('company')}
          />

          <Title order={4} mt="md">
            Адрес
          </Title>
          <TextInput
            label="Улица"
            placeholder="ул. Примерная, д. 1"
            key={form.key('street')}
            {...form.getInputProps('street')}
          />
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Город"
                placeholder="Город"
                key={form.key('city')}
                {...form.getInputProps('city')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Регион"
                placeholder="Регион"
                key={form.key('state')}
                {...form.getInputProps('state')}
              />
            </Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Страна"
                placeholder="Страна"
                key={form.key('country')}
                {...form.getInputProps('country')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Индекс"
                placeholder="000000"
                key={form.key('zipCode')}
                {...form.getInputProps('zipCode')}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Статус"
            data={statusOptions}
            key={form.key('status')}
            {...form.getInputProps('status')}
            required
          />

          <Button type="submit" mt="md" loading={loading}>
            Создать клиента
          </Button>
        </Stack>
      </form>
    </Drawer>
  );
};
