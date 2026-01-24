'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Drawer,
  DrawerProps,
  Group,
  LoadingOverlay,
  Stack,
  TextInput,
  Textarea,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';


import { IProductCategory } from '@/types/products';

type EditCategoryDrawer = Omit<DrawerProps, 'title' | 'children'> & {
  productCategory: IProductCategory | null;
  onCategoryUpdated?: () => void;
};

export const EditCategoryDrawer = ({
  productCategory,
  onCategoryUpdated,
  ...drawerProps
}: EditCategoryDrawer) => {
  const [loading, setLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(true);

  // In a mock data template, all users can edit
  const canEditProductCategory = true;

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
    if (!productCategory || !isCreator || !canEditProductCategory) return;

    setLoading(true);
    try {
      const payload = {
        ...values,
        modifiedById: 'user-demo-001',
      };

      const response = await fetch(
        `/api/product-categories/${productCategory.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось обновить категорию');
      }

      notifications.show({
        title: 'Успешно',
        message: 'Категория успешно обновлена',
        color: 'green',
      });

      form.reset();

      if (drawerProps.onClose) {
        drawerProps.onClose();
      }

      if (onCategoryUpdated) {
        onCategoryUpdated();
      }
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось обновить категорию',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productCategory || !isCreator) return;

    if (
      !window.confirm('Вы уверены, что хотите удалить эту категорию?')
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/product-categories/${productCategory.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Не удалось удалить категорию');
      }

      // Show success notification
      notifications.show({
        title: 'Успешно',
        message: 'Категория успешно удалена',
        color: 'green',
      });

      // Close drawer
      if (drawerProps.onClose) {
        drawerProps.onClose();
      }

      // Trigger refresh of products list
      if (onCategoryUpdated) {
        onCategoryUpdated();
      }
    } catch (error) {
      // Show error notification
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось удалить категорию',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productCategory) {
      form.setValues({
        title: productCategory.title || '',
        description: productCategory.description || '',
      });

      // Check if the current user is the creator of the product
      setIsCreator(true); // Auth removed - all users can edit for demo purposes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCategory]);

  return (
    <Drawer {...drawerProps} title="Редактировать категорию">
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
          <Group justify="space-between" mt="xl">
            <Button color="red" onClick={handleDelete} disabled={!isCreator}>
              Удалить категорию
            </Button>
            <Button type="submit" disabled={!isCreator}>
              Обновить категорию
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};

export default EditCategoryDrawer;
