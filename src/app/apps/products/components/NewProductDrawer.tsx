'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Button,
  Drawer,
  DrawerProps,
  LoadingOverlay,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { isNotEmpty, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';


import { IProductCategory } from '@/types/products';

type NewProjectDrawerProps = Omit<DrawerProps, 'title' | 'children'> & {
  onProductCreated?: () => void;
};

export const NewProductDrawer = ({
  onProductCreated,
  ...drawerProps
}: NewProjectDrawerProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const response = await fetch('/api/product-categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.succeeded && result.data) {
        const categoryOptions = result.data.map(
          (category: IProductCategory) => ({
            value: category.id,
            label: category.title,
          }),
        );
        setCategories(categoryOptions);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch categories when drawer opens
  useEffect(() => {
    if (drawerProps.opened) {
      fetchCategories();
    }
  }, [drawerProps.opened, fetchCategories]);

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      title: '',
      description: '',
      price: 0,
      quantityInStock: 0,
      sku: '',
      status: 1,
      categoryId: '',
    },
    validate: {
      title: isNotEmpty('Название тарифа обязательно'),
      description: isNotEmpty('Описание тарифа обязательно'),
      price: isNotEmpty('Цена обязательна'),
      quantityInStock: isNotEmpty('Количество обязательно'),
      categoryId: isNotEmpty('Категория обязательна'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        createdById: 'user-demo-001',
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось создать тариф');
      }

      // Show success notification
      notifications.show({
        title: 'Успешно',
        message: 'Тариф успешно создан',
        color: 'green',
      });

      // Reset form
      form.reset();

      // Close drawer
      if (drawerProps.onClose) {
        drawerProps.onClose();
      }

      // Trigger refresh of products list
      if (onProductCreated) {
        onProductCreated();
      }
    } catch (error) {
      // Show error notification
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось создать тариф',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer {...drawerProps} title="Создать новый тариф">
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Название"
            placeholder="название тарифа"
            key={form.key('title')}
            {...form.getInputProps('title')}
            required
          />
          <Textarea
            label="Описание"
            placeholder="описание тарифа"
            key={form.key('description')}
            {...form.getInputProps('description')}
            required
          />
          <NumberInput
            label="Цена"
            placeholder="цена"
            {...form.getInputProps('price')}
            required
          />
          <NumberInput
            label="Количество"
            placeholder="количество"
            {...form.getInputProps('quantityInStock')}
            required
          />
          <TextInput
            label="Артикул"
            placeholder="артикул"
            {...form.getInputProps('sku')}
          />
          <Select
            label="Категория"
            placeholder="Выберите категорию"
            data={categories}
            disabled={categoriesLoading}
            {...form.getInputProps('categoryId')}
            required
          />
          <Button type="submit" mt="md" loading={loading}>
            Создать тариф
          </Button>
        </Stack>
      </form>
    </Drawer>
  );
};

export default NewProductDrawer;
