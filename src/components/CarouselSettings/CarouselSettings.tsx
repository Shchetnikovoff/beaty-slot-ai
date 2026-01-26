'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Text,
  Button,
  Group,
  Card,
  Image,
  Badge,
  ActionIcon,
  Skeleton,
  Alert,
  SimpleGrid,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconArrowUp,
  IconArrowDown,
  IconAlertCircle,
  IconPhoto,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { carouselService } from '@/services/carousel.service';
import type { CarouselItem } from '@/types/carousel';
import { AddCarouselDialog } from './AddCarouselDialog';
import { EditCarouselDialog } from './EditCarouselDialog';

export function CarouselSettings() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await carouselService.getItems();
      setItems(data);
    } catch (err) {
      setError('Не удалось загрузить элементы карусели');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleToggleActive = async (item: CarouselItem) => {
    try {
      setActionLoading(item.id);
      await carouselService.toggleActive(item.id);
      await loadItems();
      notifications.show({
        title: 'Успешно',
        message: item.is_active ? 'Элемент деактивирован' : 'Элемент активирован',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось изменить статус',
        color: 'red',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (item: CarouselItem) => {
    if (!confirm(`Удалить элемент "${item.title || `#${item.id}`}"?`)) {
      return;
    }

    try {
      setActionLoading(item.id);
      await carouselService.deleteItem(item.id);
      await loadItems();
      notifications.show({
        title: 'Успешно',
        message: 'Элемент удалён',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить элемент',
        color: 'red',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveUp = async (item: CarouselItem, index: number) => {
    if (index === 0) return;

    try {
      setActionLoading(item.id);
      const prevItem = items[index - 1];
      await carouselService.updateOrder(item.id, prevItem.order);
      await loadItems();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось изменить порядок',
        color: 'red',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveDown = async (item: CarouselItem, index: number) => {
    if (index === items.length - 1) return;

    try {
      setActionLoading(item.id);
      const nextItem = items[index + 1];
      await carouselService.updateOrder(item.id, nextItem.order);
      await loadItems();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось изменить порядок',
        color: 'red',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Stack gap="md">
        <Group justify="space-between">
          <Skeleton height={32} width={200} />
          <Skeleton height={36} width={160} />
        </Group>
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={280} radius="md" />
          ))}
        </SimpleGrid>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Ошибка" color="red">
        {error}
        <Button variant="subtle" size="xs" ml="md" onClick={loadItems}>
          Повторить
        </Button>
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Text size="lg" fw={600}>Управление каруселью</Text>
          <Text size="sm" c="dimmed">
            Настройте элементы карусели для публичной страницы
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setAddDialogOpen(true)}>
          Добавить элемент
        </Button>
      </Group>

      {items.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <IconPhoto size={48} style={{ opacity: 0.3 }} />
          <Text size="lg" fw={500} mt="md">Элементы отсутствуют</Text>
          <Text size="sm" c="dimmed" mb="md">
            Добавьте первый элемент карусели
          </Text>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setAddDialogOpen(true)}>
            Добавить элемент
          </Button>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {items.map((item, index) => (
            <Card key={item.id} withBorder padding="sm" radius="md">
              <Card.Section>
                <Image
                  src={item.image_url}
                  height={160}
                  alt={item.title || 'Carousel item'}
                  fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='160'%3E%3Crect width='300' height='160' fill='%23e9ecef'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23868e96' font-size='14'%3EИзображение%3C/text%3E%3C/svg%3E"
                />
              </Card.Section>

              <Group justify="space-between" mt="sm" mb="xs">
                <Text fw={500} lineClamp={1}>
                  {item.title || `Элемент #${item.id}`}
                </Text>
                <Badge color={item.is_active ? 'green' : 'gray'} size="sm">
                  {item.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
              </Group>

              <Text size="xs" c="dimmed" mb="sm">
                Порядок: {item.order}
              </Text>

              <Group gap="xs">
                <ActionIcon
                  variant="light"
                  color={item.is_active ? 'gray' : 'green'}
                  onClick={() => handleToggleActive(item)}
                  loading={actionLoading === item.id}
                  title={item.is_active ? 'Деактивировать' : 'Активировать'}
                >
                  {item.is_active ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </ActionIcon>

                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={() => setEditingItem(item)}
                  title="Редактировать"
                >
                  <IconEdit size={16} />
                </ActionIcon>

                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => handleDelete(item)}
                  loading={actionLoading === item.id}
                  title="Удалить"
                >
                  <IconTrash size={16} />
                </ActionIcon>

                <div style={{ flex: 1 }} />

                <ActionIcon
                  variant="light"
                  onClick={() => handleMoveUp(item, index)}
                  disabled={index === 0 || actionLoading === item.id}
                  title="Вверх"
                >
                  <IconArrowUp size={16} />
                </ActionIcon>

                <ActionIcon
                  variant="light"
                  onClick={() => handleMoveDown(item, index)}
                  disabled={index === items.length - 1 || actionLoading === item.id}
                  title="Вниз"
                >
                  <IconArrowDown size={16} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <AddCarouselDialog
        opened={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {
          setAddDialogOpen(false);
          loadItems();
        }}
      />

      <EditCarouselDialog
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={() => {
          setEditingItem(null);
          loadItems();
        }}
      />
    </Stack>
  );
}
