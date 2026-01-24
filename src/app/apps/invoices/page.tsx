'use client';

import { useState } from 'react';

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Menu,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconCreditCard,
  IconDotsVertical,
  IconEye,
  IconGridDots,
  IconList,
  IconMoodEmpty,
  IconRefresh,
} from '@tabler/icons-react';

import { ErrorAlert, PageHeader, Surface } from '@/components';
import { usePayments } from '@/lib/hooks/useBeautySlot';
import type { Payment, PaymentStatus } from '@/types';
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

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Ожидает',
  PROCESSING: 'Обработка',
  SUCCEEDED: 'Успешно',
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

function PaymentCard({
  payment,
  onView,
}: {
  payment: Payment;
  onView: (payment: Payment) => void;
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
            {payment.amount.toLocaleString('ru-RU')} {payment.currency}
          </Text>
          <Text size="sm" c="dimmed">
            Клиент: {payment.client_id}
          </Text>
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
        <Badge color={STATUS_COLORS[payment.status]} variant="light" size="lg">
          {STATUS_LABELS[payment.status]}
        </Badge>

        {payment.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {payment.description}
          </Text>
        )}

        <Group gap="xs">
          <IconCreditCard size={14} />
          <Text size="sm" c="dimmed">
            {payment.payment_method || 'Не указан'}
          </Text>
        </Group>

        <Group justify="space-between" mt="xs">
          <Text size="xs" c="dimmed">
            {createdDate} {createdTime}
          </Text>
          {payment.yookassa_payment_id && (
            <Text size="xs" c="dimmed">
              ID: {payment.yookassa_payment_id.slice(0, 8)}...
            </Text>
          )}
        </Group>

        {payment.paid_at && (
          <Text size="xs" c="green">
            Оплачено: {new Date(payment.paid_at).toLocaleDateString('ru-RU')}
          </Text>
        )}

        {payment.error_message && (
          <Text size="xs" c="red">
            Ошибка: {payment.error_message}
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
  payments: Payment[];
  onView: (payment: Payment) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Клиент</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Сумма</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Способ</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Дата</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const createdDate = new Date(payment.created_at).toLocaleDateString('ru-RU');

            return (
              <tr
                key={payment.id}
                style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
              >
                <td style={{ padding: '12px' }}>
                  <Text size="sm" c="dimmed">
                    #{payment.id}
                  </Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm">{payment.client_id}</Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm" fw={500}>
                    {payment.amount.toLocaleString('ru-RU')} {payment.currency}
                  </Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Badge color={STATUS_COLORS[payment.status]} variant="light" size="sm">
                    {STATUS_LABELS[payment.status]}
                  </Badge>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm" c="dimmed">
                    {payment.payment_method || '—'}
                  </Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size="sm" c="dimmed">
                    {createdDate}
                  </Text>
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const {
    data: paymentsData,
    loading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments({
    status: statusFilter as PaymentStatus | undefined,
    limit: 100,
  });

  const handleViewPayment = (payment: Payment) => {
    console.log('View payment:', payment);
    // TODO: Open payment details modal/drawer
  };

  const totalAmount = paymentsData?.items?.reduce((sum, p) => {
    if (p.status === 'SUCCEEDED') {
      return sum + p.amount;
    }
    return sum;
  }, 0) || 0;

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
          message={paymentsError?.message || 'Не удалось загрузить список платежей'}
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
                : 'Пока нет ни одного платежа'}
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
                    { value: 'SUCCEEDED', label: 'Успешные' },
                    { value: 'PENDING', label: 'Ожидающие' },
                    { value: 'PROCESSING', label: 'В обработке' },
                    { value: 'FAILED', label: 'Ошибка' },
                    { value: 'CANCELLED', label: 'Отменённые' },
                    { value: 'REFUNDED', label: 'Возвраты' },
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

          <Box>
            <Group justify="space-between" mb="md">
              <Group gap="lg">
                {paymentsData && (
                  <>
                    <Text size="sm" c="dimmed">
                      Всего платежей: <strong>{paymentsData.total}</strong>
                    </Text>
                    <Text size="sm" c="dimmed">
                      •
                    </Text>
                    <Text size="sm" c="dimmed">
                      Показано: <strong>{paymentsData.items.length}</strong>
                    </Text>
                    <Text size="sm" c="dimmed">
                      •
                    </Text>
                    <Text size="sm" c="green">
                      Сумма успешных: <strong>{totalAmount.toLocaleString('ru-RU')} ₽</strong>
                    </Text>
                  </>
                )}
              </Group>
            </Group>

            {renderContent()}
          </Box>
        </Stack>
      </Container>
    </>
  );
}

export default Payments;
