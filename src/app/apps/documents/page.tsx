'use client';

import { useState } from 'react';

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Drawer,
  Group,
  Menu,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArchive,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconFileText,
  IconGridDots,
  IconList,
  IconMoodEmpty,
  IconPlus,
  IconRefresh,
  IconRocket,
  IconTrash,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { PATH_DASHBOARD } from '@/routes';
import type { Document, DocumentType, DocumentStatus } from '@/types';

// Mock data - in real app this would come from API (useDocuments hook)
const mockDocuments: Document[] = [
  {
    id: 1,
    title: 'Пользовательское соглашение',
    type: 'AGREEMENT',
    content: 'Полный текст пользовательского соглашения...',
    version: 3,
    status: 'ACTIVE',
    is_required: true,
    salon_id: 1,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-06-20T14:30:00Z',
    published_at: '2024-06-20T14:30:00Z',
  },
  {
    id: 2,
    title: 'Политика конфиденциальности',
    type: 'POLICY',
    content: 'Информация о сборе и обработке персональных данных...',
    version: 2,
    status: 'ACTIVE',
    is_required: true,
    salon_id: 1,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-03-10T11:00:00Z',
    published_at: '2024-03-10T11:00:00Z',
  },
  {
    id: 3,
    title: 'Правила посещения салона',
    type: 'TERMS',
    content: 'Правила поведения и посещения салона красоты...',
    version: 1,
    status: 'DRAFT',
    is_required: false,
    salon_id: 1,
    created_at: '2024-11-01T09:00:00Z',
    updated_at: '2024-11-01T09:00:00Z',
  },
];

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Документы', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: 'Черновик',
  ACTIVE: 'Активен',
  ARCHIVED: 'В архиве',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  ARCHIVED: 'orange',
};

const TYPE_LABELS: Record<DocumentType, string> = {
  AGREEMENT: 'Соглашение',
  POLICY: 'Политика',
  TERMS: 'Правила',
  OTHER: 'Другое',
};

const TYPE_COLORS: Record<DocumentType, string> = {
  AGREEMENT: 'blue',
  POLICY: 'violet',
  TERMS: 'cyan',
  OTHER: 'gray',
};

function DocumentCard({
  document,
  onView,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}: {
  document: Document;
  onView: (document: Document) => void;
  onEdit: (document: Document) => void;
  onPublish: (document: Document) => void;
  onArchive: (document: Document) => void;
  onDelete: (document: Document) => void;
}) {
  const updatedDate = new Date(document.updated_at).toLocaleDateString('ru-RU');

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={600} size="lg" lineClamp={1}>
            {document.title}
          </Text>
          <Group gap="xs" mt={4}>
            <Badge color={TYPE_COLORS[document.type]} variant="light" size="sm">
              {TYPE_LABELS[document.type]}
            </Badge>
            <Text size="xs" c="dimmed">
              v{document.version}
            </Text>
          </Group>
        </div>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onView(document)}>
              Просмотр
            </Menu.Item>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(document)}>
              Редактировать
            </Menu.Item>
            {document.status === 'DRAFT' && (
              <Menu.Item
                leftSection={<IconRocket size={14} />}
                onClick={() => onPublish(document)}
                color="green"
              >
                Опубликовать
              </Menu.Item>
            )}
            {document.status === 'ACTIVE' && (
              <Menu.Item
                leftSection={<IconArchive size={14} />}
                onClick={() => onArchive(document)}
                color="orange"
              >
                В архив
              </Menu.Item>
            )}
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => onDelete(document)}
            >
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Stack gap="xs">
        <Badge color={STATUS_COLORS[document.status]} variant="light" size="lg">
          {STATUS_LABELS[document.status]}
        </Badge>

        <Text size="sm" c="dimmed" lineClamp={2}>
          {document.content.substring(0, 100)}...
        </Text>

        <Group gap="xs">
          <IconFileText size={14} />
          <Text size="sm" c="dimmed">
            {document.is_required ? 'Обязательный' : 'Необязательный'}
          </Text>
        </Group>

        <Group justify="space-between" mt="xs">
          <Text size="xs" c="dimmed">
            Обновлён: {updatedDate}
          </Text>
          {document.published_at && (
            <Text size="xs" c="green">
              Опубликован
            </Text>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

function NewDocumentDrawer({
  opened,
  onClose,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      type: 'AGREEMENT' as DocumentType,
      content: '',
      is_required: true,
    },
    validate: {
      title: (value) => (value.length < 3 ? 'Минимум 3 символа' : null),
      content: (value) => (value.length < 50 ? 'Минимум 50 символов' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // TODO: API call to create document
      await new Promise((resolve) => setTimeout(resolve, 1000));

      notifications.show({
        title: 'Документ создан',
        message: 'Документ успешно создан как черновик',
        color: 'green',
      });

      form.reset();
      onCreated();
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось создать документ',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Новый документ"
      position="right"
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Название"
            placeholder="Название документа"
            required
            {...form.getInputProps('title')}
          />

          <Select
            label="Тип документа"
            data={[
              { value: 'AGREEMENT', label: 'Пользовательское соглашение' },
              { value: 'POLICY', label: 'Политика конфиденциальности' },
              { value: 'TERMS', label: 'Правила и условия' },
              { value: 'OTHER', label: 'Другой документ' },
            ]}
            {...form.getInputProps('type')}
          />

          <Textarea
            label="Содержание"
            placeholder="Текст документа..."
            required
            minRows={10}
            autosize
            {...form.getInputProps('content')}
          />

          <Switch
            label="Обязательный документ"
            description="Клиенты должны принять этот документ для использования сервиса"
            {...form.getInputProps('is_required', { type: 'checkbox' })}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconPlus size={18} />}>
              Создать черновик
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}

function Documents() {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [documents] = useState<Document[]>(mockDocuments);
  const [loading] = useState(false);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  const filteredDocuments = documents.filter((doc) => {
    if (statusFilter && doc.status !== statusFilter) return false;
    if (typeFilter && doc.type !== typeFilter) return false;
    return true;
  });

  const handleViewDocument = (document: Document) => {
    console.log('View document:', document);
    // TODO: Open document view modal
  };

  const handleEditDocument = (document: Document) => {
    console.log('Edit document:', document);
    // TODO: Open document edit drawer
  };

  const handlePublishDocument = async (document: Document) => {
    try {
      // TODO: API call to publish
      await new Promise((resolve) => setTimeout(resolve, 500));
      notifications.show({
        title: 'Документ опубликован',
        message: `"${document.title}" теперь активен`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось опубликовать документ',
        color: 'red',
      });
    }
  };

  const handleArchiveDocument = async (document: Document) => {
    try {
      // TODO: API call to archive
      await new Promise((resolve) => setTimeout(resolve, 500));
      notifications.show({
        title: 'Документ архивирован',
        message: `"${document.title}" перемещён в архив`,
        color: 'orange',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось архивировать документ',
        color: 'red',
      });
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    try {
      // TODO: API call to delete
      await new Promise((resolve) => setTimeout(resolve, 500));
      notifications.show({
        title: 'Документ удалён',
        message: `"${document.title}" успешно удалён`,
        color: 'red',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить документ',
        color: 'red',
      });
    }
  };

  const handleRefresh = () => {
    // TODO: Refetch documents from API
  };

  const handleCreated = () => {
    // TODO: Refetch documents
  };

  const renderContent = () => {
    if (loading) {
      return (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`doc-loading-${i}`} visible={true} height={250} />
          ))}
        </SimpleGrid>
      );
    }

    if (!filteredDocuments.length) {
      return (
        <Surface p="xl">
          <Stack align="center" gap="md">
            <IconMoodEmpty size={48} stroke={1.5} />
            <Title order={4}>Документы не найдены</Title>
            <Text c="dimmed" ta="center">
              {statusFilter || typeFilter
                ? 'По выбранным фильтрам ничего не найдено'
                : 'Создайте первый документ для вашего салона'}
            </Text>
            {(statusFilter || typeFilter) ? (
              <Button
                variant="light"
                onClick={() => {
                  setStatusFilter(null);
                  setTypeFilter(null);
                }}
              >
                Сбросить фильтры
              </Button>
            ) : (
              <Button leftSection={<IconPlus size={18} />} onClick={openDrawer}>
                Создать документ
              </Button>
            )}
          </Stack>
        </Surface>
      );
    }

    return (
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {filteredDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onView={handleViewDocument}
            onEdit={handleEditDocument}
            onPublish={handlePublishDocument}
            onArchive={handleArchiveDocument}
            onDelete={handleDeleteDocument}
          />
        ))}
      </SimpleGrid>
    );
  };

  return (
    <>
      <title>Документы | Beauty Slot Admin</title>
      <meta name="description" content="Управление документами и соглашениями салона" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Документы"
            breadcrumbItems={items}
            actionButton={
              <Group gap="sm">
                <Select
                  placeholder="Все типы"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  clearable
                  data={[
                    { value: 'AGREEMENT', label: 'Соглашения' },
                    { value: 'POLICY', label: 'Политики' },
                    { value: 'TERMS', label: 'Правила' },
                    { value: 'OTHER', label: 'Другие' },
                  ]}
                  style={{ width: 150 }}
                />
                <Select
                  placeholder="Все статусы"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  clearable
                  data={[
                    { value: 'DRAFT', label: 'Черновики' },
                    { value: 'ACTIVE', label: 'Активные' },
                    { value: 'ARCHIVED', label: 'В архиве' },
                  ]}
                  style={{ width: 150 }}
                />
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={18} />}
                  onClick={handleRefresh}
                >
                  Обновить
                </Button>
                <Button leftSection={<IconPlus size={18} />} onClick={openDrawer}>
                  Новый документ
                </Button>
              </Group>
            }
          />

          <Box>
            <Group justify="space-between" mb="md">
              <Group gap="lg">
                <Group gap="xs">
                  <IconFileText size={20} />
                  <Text fw={500}>Документы салона</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  Всего: <strong>{filteredDocuments.length}</strong>
                </Text>
              </Group>
            </Group>

            {renderContent()}
          </Box>
        </Stack>
      </Container>

      <NewDocumentDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        onCreated={handleCreated}
      />
    </>
  );
}

export default Documents;
