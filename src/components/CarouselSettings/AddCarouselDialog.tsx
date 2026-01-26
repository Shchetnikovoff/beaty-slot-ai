'use client';

import { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  Image,
  FileButton,
  Paper,
  CloseButton,
} from '@mantine/core';
import { IconUpload, IconPhoto, IconFileText } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { carouselService } from '@/services/carousel.service';

interface AddCarouselDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCarouselDialog({ opened, onClose, onSuccess }: AddCarouselDialogProps) {
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!imageFile) {
      notifications.show({
        title: 'Ошибка',
        message: 'Выберите изображение для карусели',
        color: 'red',
      });
      return;
    }

    if (!documentFile) {
      notifications.show({
        title: 'Ошибка',
        message: 'Выберите документ (PDF или изображение)',
        color: 'red',
      });
      return;
    }

    try {
      setLoading(true);
      await carouselService.createItem({
        image: imageFile,
        document: documentFile,
        title: title || undefined,
      });
      notifications.show({
        title: 'Успешно',
        message: 'Элемент карусели добавлен',
        color: 'green',
      });
      handleClose();
      onSuccess();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось добавить элемент',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setImageFile(null);
    setDocumentFile(null);
    setImagePreview(null);
    setDocumentPreview(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Добавить элемент карусели"
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Заголовок"
          placeholder="Название элемента (необязательно)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <Text size="sm" fw={500} mb="xs">
            Изображение для карусели *
          </Text>
          <FileButton onChange={handleImageChange} accept="image/*">
            {(props) => (
              <Button
                variant="light"
                leftSection={<IconPhoto size={16} />}
                fullWidth
                {...props}
              >
                {imageFile ? imageFile.name : 'Выбрать изображение'}
              </Button>
            )}
          </FileButton>
          {imagePreview && (
            <Paper withBorder p="xs" mt="xs" pos="relative">
              <CloseButton
                pos="absolute"
                top={4}
                right={4}
                size="sm"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
              />
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
            Документ (PDF или изображение) *
          </Text>
          <FileButton onChange={handleDocumentChange} accept="application/pdf,image/*">
            {(props) => (
              <Button
                variant="light"
                leftSection={<IconFileText size={16} />}
                fullWidth
                {...props}
              >
                {documentFile ? documentFile.name : 'Выбрать документ'}
              </Button>
            )}
          </FileButton>
          {documentFile && (
            <Paper withBorder p="xs" mt="xs" pos="relative">
              <CloseButton
                pos="absolute"
                top={4}
                right={4}
                size="sm"
                onClick={() => {
                  setDocumentFile(null);
                  setDocumentPreview(null);
                }}
              />
              {documentPreview ? (
                <Image
                  src={documentPreview}
                  alt="Document preview"
                  height={120}
                  fit="contain"
                  radius="sm"
                />
              ) : (
                <Group gap="xs" p="sm">
                  <IconFileText size={24} />
                  <Text size="sm">{documentFile.name}</Text>
                </Group>
              )}
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
            Добавить
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
