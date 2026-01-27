'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Text,
  Image,
  FileButton,
  Paper,
  CloseButton,
  Switch,
} from '@mantine/core';
import { IconPhoto, IconFileText } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { carouselService } from '@/services/carousel.service';
import type { CarouselItem } from '@/types/carousel';

interface EditCarouselDialogProps {
  item: CarouselItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCarouselDialog({ item, onClose, onSuccess }: EditCarouselDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setIsActive(item.is_active);
      setImagePreview(item.image_url);
      setDocumentPreview(item.pdf_images_urls?.[0] || null);
      setImageFile(null);
      setDocumentFile(null);
    }
  }, [item]);

  const handleImageChange = (file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        notifications.show({
          title: 'Ошибка',
          message: 'Выберите изображение',
          color: 'red',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        notifications.show({
          title: 'Ошибка',
          message: 'Размер изображения не должен превышать 5MB',
          color: 'red',
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDocumentChange = (file: File | null) => {
    if (file) {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');

      if (!isPdf && !isImage) {
        notifications.show({
          title: 'Ошибка',
          message: 'Выберите PDF или изображение',
          color: 'red',
        });
        return;
      }

      const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        notifications.show({
          title: 'Ошибка',
          message: `Размер файла не должен превышать ${maxSize / 1024 / 1024}MB`,
          color: 'red',
        });
        return;
      }

      setDocumentFile(file);
      if (isImage) {
        setDocumentPreview(URL.createObjectURL(file));
      } else {
        setDocumentPreview(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!item) return;

    try {
      setLoading(true);
      await carouselService.updateItem(item.id, {
        title: title || undefined,
        description: description || undefined,
        is_active: isActive,
        image: imageFile || undefined,
        document: documentFile || undefined,
      });
      notifications.show({
        title: 'Успешно',
        message: 'Элемент карусели обновлён',
        color: 'green',
      });
      onSuccess();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось обновить элемент',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setIsActive(true);
    setImageFile(null);
    setDocumentFile(null);
    setImagePreview(null);
    setDocumentPreview(null);
    onClose();
  };

  return (
    <Modal
      opened={!!item}
      onClose={handleClose}
      title="Редактировать элемент карусели"
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Заголовок"
          placeholder="Название элемента (необязательно)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          label="Описание"
          placeholder="Текст акции или описание (необязательно)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minRows={2}
          maxRows={4}
          autosize
        />

        <Switch
          label="Активен"
          description="Отображается на публичной странице"
          checked={isActive}
          onChange={(e) => setIsActive(e.currentTarget.checked)}
        />

        <div>
          <Text size="sm" fw={500} mb="xs">
            Изображение для карусели
          </Text>
          <FileButton onChange={handleImageChange} accept="image/*">
            {(props) => (
              <Button
                variant="light"
                leftSection={<IconPhoto size={16} />}
                fullWidth
                {...props}
              >
                {imageFile ? imageFile.name : 'Заменить изображение'}
              </Button>
            )}
          </FileButton>
          {imagePreview && (
            <Paper withBorder p="xs" mt="xs" pos="relative">
              {imageFile && (
                <CloseButton
                  pos="absolute"
                  top={4}
                  right={4}
                  size="sm"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(item?.image_url || null);
                  }}
                />
              )}
              <Image
                src={imagePreview}
                alt="Preview"
                height={120}
                fit="contain"
                radius="sm"
              />
            </Paper>
          )}
          <Text size="xs" c="dimmed" mt={4}>
            JPG, PNG или WebP, максимум 5MB
          </Text>
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">
            Документ (PDF или изображение)
          </Text>
          <FileButton onChange={handleDocumentChange} accept="application/pdf,image/*">
            {(props) => (
              <Button
                variant="light"
                leftSection={<IconFileText size={16} />}
                fullWidth
                {...props}
              >
                {documentFile ? documentFile.name : 'Заменить документ'}
              </Button>
            )}
          </FileButton>
          {(documentFile || documentPreview) && (
            <Paper withBorder p="xs" mt="xs" pos="relative">
              {documentFile && (
                <CloseButton
                  pos="absolute"
                  top={4}
                  right={4}
                  size="sm"
                  onClick={() => {
                    setDocumentFile(null);
                    setDocumentPreview(item?.pdf_images_urls?.[0] || null);
                  }}
                />
              )}
              {documentPreview ? (
                <Image
                  src={documentPreview}
                  alt="Document preview"
                  height={120}
                  fit="contain"
                  radius="sm"
                />
              ) : documentFile ? (
                <Group gap="xs" p="sm">
                  <IconFileText size={24} />
                  <Text size="sm">{documentFile.name}</Text>
                </Group>
              ) : null}
            </Paper>
          )}
          <Text size="xs" c="dimmed" mt={4}>
            PDF (до 10MB) или изображение (до 5MB)
          </Text>
        </div>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
