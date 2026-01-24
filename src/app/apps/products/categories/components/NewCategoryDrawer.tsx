'use client';

import { useState } from 'react';

import {
  Button,
  Drawer,
  DrawerProps,
  LoadingOverlay,
  Stack,
  TextInput,
  Textarea,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';



type NewCategoryDrawer = Omit<DrawerProps, 'title' | 'children'> & {
  onCategoryCreated?: () => void;
};

export const NewCategoryDrawer = ({
  onCategoryCreated,
  ...drawerProps
}: NewCategoryDrawer) => {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      title: '',
      description: '',
    },
    validate: {
      title: isNotEmpty('Название категории обязательно'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        createdById: 'user-demo-001',
      };

      const response = await fetch('/api/product-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось создать категорию');
      }

      notifications.show({
        title: 'Успешно',
        message: 'Категория успешно создана',
        color: 'green',
      });

      form.reset();

      if (drawerProps.onClose) {
        drawerProps.onClose();
      }

      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось создать категорию',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer {...drawerProps} title="Создать категорию тарифов">
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Название"
            placeholder="Название категории"
            key={form.key('title')}
            {...form.getInputProps('title')}
            required
          />
          <Textarea
            label="Описание"
            placeholder="Описание категории"
            key={form.key('description')}
            {...form.getInputProps('description')}
          />
          <Button type="submit" mt="md" loading={loading}>
            Создать категорию
          </Button>
        </Stack>
      </form>
    </Drawer>
  );
};

export default NewCategoryDrawer;
