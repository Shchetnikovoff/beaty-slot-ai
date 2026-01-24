'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Button,
  Drawer,
  DrawerProps,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';


import { IProduct, IProductCategory } from '@/types/products';

type EditProductDrawerProps = Omit<DrawerProps, 'title' | 'children'> & {
  product: IProduct | null;
  onProductUpdated?: () => void;
};

export const EditProductDrawer = ({
  product,
  onProductUpdated,
  ...drawerProps
}: EditProductDrawerProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // In a mock data template, all users can edit
  const canEditProduct = true;

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      title: '',
      description: '',
      price: 0,
      quantityInStock: 0,
      sku: '',
      isActive: true,
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

  // Load product data when product changes
  useEffect(() => {
    if (product) {
      form.setValues({
        title: product.title || '',
        description: product.description || '',
        price: product.price || 0,
        quantityInStock: product.quantityInStock || 0,
        sku: product.sku || '',
        isActive: product.isActive || false,
        status: product.status || 1,
        categoryId: product.categoryId || '',
      });

      // Check if the current user is the creator of the product
      setIsCreator(true); // Auth removed - all users can edit for demo purposes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!product || !isCreator || !canEditProduct) return;

    setLoading(true);
    try {
      const payload = {
        ...values,
        modifiedById: 'user-demo-001',
      };

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось обновить тариф');
      }

      // Show success notification
      notifications.show({
        title: 'Успешно',
        message: 'Тариф успешно обновлён',
        color: 'green',
      });

      // Close drawer
      if (drawerProps.onClose) {
        drawerProps.onClose();
      }

      // Trigger refresh of products list
      if (onProductUpdated) {
        onProductUpdated();
      }
    } catch (error) {
      // Show error notification
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось обновить тариф',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !isCreator) return;

    if (!window.confirm('Вы уверены, что хотите удалить этот тариф?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Не удалось удалить тариф');
      }

      // Show success notification
      notifications.show({
        title: 'Успешно',
        message: 'Тариф успешно удалён',
        color: 'green',
      });

      // Close drawer
      if (drawerProps.onClose) {
        drawerProps.onClose();
      }

      // Trigger refresh of products list
      if (onProductUpdated) {
        onProductUpdated();
      }
    } catch (error) {
      // Show error notification
      notifications.show({
        title: 'Ошибка',
        message:
          error instanceof Error ? error.message : 'Не удалось удалить тариф',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer {...drawerProps} title="Редактировать тариф">
      <LoadingOverlay visible={loading} />
      {!isCreator && (
        <Text color="red" mb="md">
          Вы можете редактировать только созданные вами тарифы.
        </Text>
      )}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Название"
            placeholder="название тарифа"
            key={form.key('title')}
            {...form.getInputProps('title')}
            required
            disabled={!isCreator}
          />
          <Textarea
            label="Описание"
            placeholder="описание тарифа"
            key={form.key('description')}
            {...form.getInputProps('description')}
            required
            disabled={!isCreator}
          />
          <NumberInput
            label="Цена"
            placeholder="цена"
            {...form.getInputProps('price')}
            required
            disabled={!isCreator}
          />
          <NumberInput
            label="Количество"
            placeholder="количество"
            {...form.getInputProps('quantityInStock')}
            required
            disabled={!isCreator}
          />
          <TextInput
            label="Артикул"
            placeholder="артикул"
            {...form.getInputProps('sku')}
            disabled={!isCreator}
          />
          <Select
            label="Категория"
            placeholder="Выберите категорию"
            data={categories}
            disabled={categoriesLoading || !isCreator}
            {...form.getInputProps('categoryId')}
            required
          />
          <Switch
            label="Активный"
            {...form.getInputProps('isActive', { type: 'checkbox' })}
            disabled={!isCreator}
          />

          <Group justify="space-between" mt="xl">
            <Button color="red" onClick={handleDelete} disabled={!isCreator}>
              Удалить тариф
            </Button>
            <Button type="submit" disabled={!isCreator}>
              Обновить тариф
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};

export default EditProductDrawer;
