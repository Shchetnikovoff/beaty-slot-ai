'use client';

import { useState } from 'react';

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Menu,
  Modal,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendar,
  IconCreditCard,
  IconDotsVertical,
  IconEye,
  IconGridDots,
  IconList,
  IconMoodEmpty,
  IconRefresh,
  IconUser,
  IconCurrencyRubel,
  IconCheck,
  IconClock,
  IconX,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { usePaymentsFromSync } from '@/lib/hooks/useBeautySlot';
import { PATH_DASHBOARD } from '@/routes';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Платежи', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Ожидает',
  PROCESSING: 'Обработка',
  SUCCEEDED: 'Оплачено',
  FAILED: 'Ошибка',
  CANCELLED: 'Отменён',
  REFUNDED: 'Возврат',
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'yellow',
  PROCESSING: 'blue',
  SUCCEEDED: 'green',
  FAILED: 'red',
  CANCELLED: 'gray',
  REFUNDED: 'orange',
};

interface YclientsPaymentData {
  paid_full: number;
  attendance: number; // 2=ожидает, 1=пришёл, 0=нет инфо, -1=неявка
  visit_attendance: number;
  confirmed: number; // 1=подтверждён
  deleted: boolean;
  online: boolean;
  seance_length: number;
  prepaid: string;
  prepaid_confirmed: boolean;
}

interface PaymentFromSync {
  id: number;
  record_id: number;
  client_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  staff_id: string;
  staff_name: string;
  service_id: string;
  service_name: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  description: string;
  created_at: string;
  visit_date: string;
  paid_at?: string;
  source: 'yclients' | 'native';
  yclients_data: YclientsPaymentData;
}

function PaymentCard({
  payment,
  onView,
}: {
  payment: PaymentFromSync;
  onView: (payment: PaymentFromSync) => void;
}) {
  const createdDate = new Date(payment.created_at).toLocaleDateString('ru-RU');
  const createdTime = new Date(payment.created_at).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={600} size="lg">
            {payment.amount.toLocaleString('ru-RU')} {payment.currency === 'RUB' ? '₽' : payment.currency}
          </Text>
          <Badge color={STATUS_COLORS[payment.status]} variant="light" size="md" mt={4}>
            {STATUS_LABELS[payment.status]}
          </Badge>
        </div>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onView(payment)}>
              Детали
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Stack gap="xs">
        {/* Услуга */}
        <Text size="sm" fw={500} lineClamp={2}>
          {payment.service_name}
        </Text>

        {/* Клиент */}
        <Group gap="xs">
          <IconUser size={14} color="gray" />
          <Text size="sm" c="dimmed">
            {payment.client_name}
          </Text>
        </Group>

        {/* Телефон */}
        {payment.client_phone && (
          <Text size="xs" c="dimmed">
            {payment.client_phone}
          </Text>
        )}

        {/* Мастер */}
        <Group gap="xs">
          <IconCreditCard size={14} color="gray" />
          <Text size="sm" c="dimmed">
            {payment.staff_name}
          </Text>
        </Group>

        {/* Способ записи */}
        <Group gap="xs">
          <IconCalendar size={14} color="gray" />
          <Text size="xs" c="dimmed">
            {payment.payment_method}
          </Text>
        </Group>

        {/* Дата и ID */}
        <Group justify="space-between" mt="xs">
          <Text size="xs" c="dimmed">
            {createdDate} {createdTime}
          </Text>
          <Text size="xs" c="dimmed">
            #{payment.record_id}
          </Text>
        </Group>

        {payment.paid_at && (
          <Text size="xs" c="green">
            Оплачено: {new Date(payment.paid_at).toLocaleDateString('ru-RU')}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

function PaymentsTableView({
  payments,
  onView,
}: {
  payments: PaymentFromSync[];
  onView: (payment: PaymentFromSync) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Клиент</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Услуга</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Мастер</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Сумма</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Статус</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Дата</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const createdDate = new Date(payment.created_at).toLocaleDateString('ru-RU');
            const createdTime = new Date(payment.created_at).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <tr
                key={payment.id}
                style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
              >
                <td style={{ padding: '12px' }}>
                  <Text size="sm" c="dimmed">
                    #{payment.record_id}
                  </Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>{payment.client_name}</Text>
                    <Text size="xs" c="dimmed">{payment.client_phone}</Text>
                  </Stack>
                </td>
                <td style={{ padding: '12px', maxWidth: 200 }}>
                  <Text size="sm" truncate>{payment.service_name}</Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm" c="dimmed">{payment.staff_name}</Text>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <Text size="sm" fw={600}>
                    {payment.amount.toLocaleString('ru-RU')} ₽
                  </Text>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <Badge color={STATUS_COLORS[payment.status]} variant="light" size="sm">
                    {STATUS_LABELS[payment.status]}
                  </Badge>
                </td>
                <td style={{ padding: '12px' }}>
                  <Stack gap={2}>
                    <Text size="sm">{createdDate}</Text>
                    <Text size="xs" c="dimmed">{createdTime}</Text>
                  </Stack>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <ActionIcon variant="subtle" onClick={() => onView(payment)}>
                    <IconEye size={16} />
                  </ActionIcon>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Payments() {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentFromSync | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const {
    data: paymentsData,
    loading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePaymentsFromSync({
    status: statusFilter as PaymentStatus | undefined,
    limit: 100,
  });

  const handleViewPayment = (payment: PaymentFromSync) => {
    setSelectedPayment(payment);
    openModal();
  };

  const stats = paymentsData?.stats;

  const renderContent = () => {
    if (paymentsLoading) {
      return viewMode === 'cards' ? (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`payment-loading-${i}`} visible={true} height={200} />
          ))}
        </SimpleGrid>
      ) : (
        <Surface>
          <Skeleton height={400} />
        </Surface>
      );
    }

    if (paymentsError) {
      return (
        <ErrorAlert
          title="Ошибка загрузки платежей"
          message={paymentsError?.message || 'Не удалось загрузить список платежей. Убедитесь что данные синхронизированы.'}
        />
      );
    }

    if (!paymentsData?.items?.length) {
      return (
        <Surface p="xl">
          <Stack align="center" gap="md">
            <IconMoodEmpty size={48} stroke={1.5} />
            <Title order={4}>Платежи не найдены</Title>
            <Text c="dimmed" ta="center">
              {statusFilter
                ? 'По выбранному фильтру ничего не найдено'
                : 'Синхронизируйте данные из YClients на странице "Синхронизация"'}
            </Text>
            {statusFilter && (
              <Button variant="light" onClick={() => setStatusFilter(null)}>
                Сбросить фильтр
              </Button>
            )}
          </Stack>
        </Surface>
      );
    }

    return viewMode === 'cards' ? (
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {paymentsData.items.map((payment) => (
          <PaymentCard key={payment.id} payment={payment} onView={handleViewPayment} />
        ))}
      </SimpleGrid>
    ) : (
      <Surface>
        <PaymentsTableView payments={paymentsData.items} onView={handleViewPayment} />
      </Surface>
    );
  };

  return (
    <>
      <title>Платежи | Beauty Slot Admin</title>
      <meta name="description" content="Управление платежами клиентов" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Платежи"
            breadcrumbItems={items}
            actionButton={
              <Group gap="sm">
                <Select
                  placeholder="Все статусы"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  clearable
                  data={[
                    { value: 'SUCCEEDED', label: 'Оплаченные' },
                    { value: 'PENDING', label: 'Ожидающие' },
                    { value: 'PROCESSING', label: 'В обработке' },
                    { value: 'CANCELLED', label: 'Отменённые' },
                  ]}
                  style={{ width: 180 }}
                />
                <SegmentedControl
                  value={viewMode}
                  onChange={(value) => setViewMode(value as 'cards' | 'table')}
                  data={[
                    { label: <IconGridDots size={16} />, value: 'cards' },
                    { label: <IconList size={16} />, value: 'table' },
                  ]}
                />
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={18} />}
                  onClick={() => refetchPayments()}
                >
                  Обновить
                </Button>
              </Group>
            }
          />

          {/* Статистика */}
          {stats && (
            <SimpleGrid cols={{ base: 2, sm: 4, lg: 6 }} spacing="md">
              <Paper p="md" radius="md" withBorder>
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                    <IconCreditCard size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Всего</Text>
                    <Text size="lg" fw={700}>{stats.total}</Text>
                  </div>
                </Group>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" variant="light" color="green">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Оплачено</Text>
                    <Text size="lg" fw={700} c="green">{stats.succeeded}</Text>
                  </div>
                </Group>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                    <IconClock size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Ожидает</Text>
                    <Text size="lg" fw={700} c="yellow">{stats.pending}</Text>
                  </div>
                </Group>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                    <IconClock size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">В обработке</Text>
                    <Text size="lg" fw={700} c="blue">{stats.processing}</Text>
                  </div>
                </Group>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" variant="light" color="gray">
                    <IconX size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Отменено</Text>
                    <Text size="lg" fw={700} c="gray">{stats.cancelled}</Text>
                  </div>
                </Group>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" variant="light" color="teal">
                    <IconCurrencyRubel size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Сумма</Text>
                    <Text size="lg" fw={700} c="teal">{stats.succeededAmount.toLocaleString('ru-RU')} ₽</Text>
                  </div>
                </Group>
              </Paper>
            </SimpleGrid>
          )}

          <Box>
            <Group justify="space-between" mb="md">
              <Group gap="lg">
                {paymentsData && (
                  <>
                    <Text size="sm" c="dimmed">
                      Показано: <strong>{paymentsData.items.length}</strong> из <strong>{paymentsData.total}</strong>
                    </Text>
                  </>
                )}
              </Group>
            </Group>

            {renderContent()}
          </Box>
        </Stack>
      </Container>

      {/* Модальное окно с деталями платежа */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color={selectedPayment ? STATUS_COLORS[selectedPayment.status] : 'blue'}>
              <IconCreditCard size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600}>Детали платежа</Text>
              <Text size="xs" c="dimmed">#{selectedPayment?.record_id}</Text>
            </div>
          </Group>
        }
        size="lg"
        radius="md"
      >
        {selectedPayment && (
          <Stack gap="md">
            {/* Сумма и статус */}
            <Paper p="md" radius="md" bg="gray.0">
              <Group justify="space-between" align="center">
                <div>
                  <Text size="xs" c="dimmed" mb={4}>Сумма</Text>
                  <Text size="xl" fw={700}>
                    {selectedPayment.amount.toLocaleString('ru-RU')} {selectedPayment.currency === 'RUB' ? '₽' : selectedPayment.currency}
                  </Text>
                </div>
                <Badge
                  color={STATUS_COLORS[selectedPayment.status]}
                  variant="light"
                  size="lg"
                  leftSection={
                    selectedPayment.status === 'SUCCEEDED' ? <IconCheck size={14} /> :
                    selectedPayment.status === 'PENDING' ? <IconClock size={14} /> :
                    selectedPayment.status === 'CANCELLED' ? <IconX size={14} /> :
                    <IconClock size={14} />
                  }
                >
                  {STATUS_LABELS[selectedPayment.status]}
                </Badge>
              </Group>
            </Paper>

            <Divider />

            {/* Услуга */}
            <div>
              <Text size="xs" c="dimmed" mb={4}>Услуга</Text>
              <Text fw={500}>{selectedPayment.service_name}</Text>
            </div>

            <Divider />

            {/* Клиент */}
            <div>
              <Text size="xs" c="dimmed" mb={4}>Клиент</Text>
              <Group gap="xs">
                <ThemeIcon size="sm" radius="xl" variant="light" color="blue">
                  <IconUser size={12} />
                </ThemeIcon>
                <Text fw={500}>{selectedPayment.client_name}</Text>
              </Group>
              {selectedPayment.client_phone && (
                <Text size="sm" c="dimmed" mt={4}>{selectedPayment.client_phone}</Text>
              )}
            </div>

            <Divider />

            {/* Мастер */}
            <div>
              <Text size="xs" c="dimmed" mb={4}>Мастер</Text>
              <Group gap="xs">
                <ThemeIcon size="sm" radius="xl" variant="light" color="violet">
                  <IconUser size={12} />
                </ThemeIcon>
                <Text fw={500}>{selectedPayment.staff_name}</Text>
              </Group>
            </div>

            <Divider />

            {/* Даты */}
            <SimpleGrid cols={2}>
              <div>
                <Text size="xs" c="dimmed" mb={4}>Дата визита</Text>
                <Group gap="xs">
                  <IconCalendar size={14} color="gray" />
                  <Text size="sm">
                    {new Date(selectedPayment.visit_date || selectedPayment.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {new Date(selectedPayment.visit_date || selectedPayment.created_at).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed" mb={4}>Дата создания записи</Text>
                <Group gap="xs">
                  <IconCalendar size={14} color="gray" />
                  <Text size="sm">
                    {new Date(selectedPayment.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </Group>
              </div>
            </SimpleGrid>
            {selectedPayment.paid_at && (
              <div>
                <Text size="xs" c="dimmed" mb={4}>Дата оплаты</Text>
                <Group gap="xs">
                  <IconCheck size={14} color="green" />
                  <Text size="sm" c="green">
                    {new Date(selectedPayment.paid_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </Group>
              </div>
            )}

            <Divider />

            {/* Статус из YClients */}
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed" mb="sm" fw={600}>Данные из YClients</Text>
              <SimpleGrid cols={3} spacing="md">
                {/* Оплата */}
                <div>
                  <Text size="xs" c="dimmed" mb={2}>Оплата</Text>
                  <Badge
                    color={selectedPayment.yclients_data?.paid_full === 1 ? 'green' : 'yellow'}
                    variant="light"
                    size="sm"
                  >
                    {selectedPayment.yclients_data?.paid_full === 1 ? 'Оплачено' : 'Не оплачено'}
                  </Badge>
                </div>
                {/* Посещение */}
                <div>
                  <Text size="xs" c="dimmed" mb={2}>Посещение</Text>
                  <Badge
                    color={
                      selectedPayment.yclients_data?.attendance === 1 ? 'green' :
                      selectedPayment.yclients_data?.attendance === -1 ? 'red' :
                      selectedPayment.yclients_data?.attendance === 2 ? 'yellow' : 'gray'
                    }
                    variant="light"
                    size="sm"
                  >
                    {selectedPayment.yclients_data?.attendance === 1 ? 'Пришёл' :
                     selectedPayment.yclients_data?.attendance === -1 ? 'Неявка' :
                     selectedPayment.yclients_data?.attendance === 2 ? 'Ожидает' : 'Нет инфо'}
                  </Badge>
                </div>
                {/* Подтверждение */}
                <div>
                  <Text size="xs" c="dimmed" mb={2}>Подтверждение</Text>
                  <Badge
                    color={selectedPayment.yclients_data?.confirmed === 1 ? 'green' : 'gray'}
                    variant="light"
                    size="sm"
                  >
                    {selectedPayment.yclients_data?.confirmed === 1 ? 'Подтверждено' : 'Не подтверждено'}
                  </Badge>
                </div>
              </SimpleGrid>
            </Paper>

            <Divider />

            {/* Способ записи */}
            <div>
              <Text size="xs" c="dimmed" mb={4}>Способ записи</Text>
              <Badge variant="outline" color={selectedPayment.yclients_data?.online ? 'blue' : 'gray'}>
                {selectedPayment.yclients_data?.online ? 'Онлайн-запись' : 'Запись в салоне'}
              </Badge>
            </div>

            {/* Описание */}
            {selectedPayment.description && (
              <>
                <Divider />
                <div>
                  <Text size="xs" c="dimmed" mb={4}>Описание</Text>
                  <Text size="sm">{selectedPayment.description}</Text>
                </div>
              </>
            )}

            {/* Кнопка закрытия */}
            <Button variant="light" fullWidth onClick={closeModal} mt="md">
              Закрыть
            </Button>
          </Stack>
        )}
      </Modal>
    </>
  );
}

export default Payments;
