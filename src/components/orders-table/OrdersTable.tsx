'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';

import {
  ActionIcon,
  Badge,
  Group,
  MantineColor,
  MultiSelect,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconEdit, IconEye, IconSearch } from '@tabler/icons-react';
import sortBy from 'lodash/sortBy';
import {
  DataTable,
  DataTableProps,
  DataTableSortStatus,
} from 'mantine-datatable';

import { ErrorAlert } from '@/components';
import type { OrderDto, OrderStatus, OrderPaymentMethod } from '@/types';

type StatusBadgeProps = {
  status?: OrderStatus;
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (!status)
    return (
      <Badge color="gray" variant="filled" radius="sm">
        Неизвестно
      </Badge>
    );

  const statusMap: Record<number, { label: string; color: MantineColor }> = {
    1: { label: 'Ожидание', color: 'yellow' },
    2: { label: 'Обработка', color: 'blue' },
    3: { label: 'Отправлен', color: 'orange' },
    4: { label: 'Доставлен', color: 'green' },
    5: { label: 'Отменён', color: 'red' },
  };

  const statusInfo = statusMap[status as number] || {
    label: 'Неизвестно',
    color: 'gray',
  };

  return (
    <Badge color={statusInfo.color} variant="filled" radius="sm">
      {statusInfo.label}
    </Badge>
  );
};

const PAGE_SIZES = [5, 10, 20];

type OrdersTableProps = {
  data: OrderDto[];
  error?: ReactNode;
  loading?: boolean;
  onEdit?: (order: OrderDto) => void;
  onView?: (order: OrderDto) => void;
};

const OrdersTable = ({
  data = [],
  loading,
  error,
  onEdit,
  onView,
}: OrdersTableProps) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [selectedRecords, setSelectedRecords] = useState<OrderDto[]>([]);
  const [records, setRecords] = useState<OrderDto[]>(data.slice(0, pageSize));
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<OrderDto>>({
    columnAccessor: 'product',
    direction: 'asc',
  });
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const statuses = useMemo(() => {
    const statusMap: Record<number, string> = {
      1: 'Ожидание',
      2: 'Обработка',
      3: 'Отправлен',
      4: 'Доставлен',
      5: 'Отменён',
    };
    const uniqueStatuses = new Set(
      data.map((e) => statusMap[e.status as number] || 'Неизвестно'),
    );
    return Array.from(uniqueStatuses);
  }, [data]);

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getOrderPaymentMethodLabel = (method?: OrderPaymentMethod): string => {
    if (!method) return 'Н/Д';
    const methodMap: Record<number, string> = {
      1: 'Кредитная карта',
      2: 'Дебетовая карта',
      3: 'PayPal',
      4: 'Наличные',
      5: 'Банковский перевод',
    };
    return methodMap[method as number] || 'Другое';
  };

  const getStatusLabel = (status?: OrderStatus): string => {
    if (!status) return 'Неизвестно';
    const statusMap: Record<number, string> = {
      1: 'Ожидание',
      2: 'Обработка',
      3: 'Отправлен',
      4: 'Доставлен',
      5: 'Отменён',
    };
    return statusMap[status as number] || 'Неизвестно';
  };

  const columns: DataTableProps<OrderDto>['columns'] = [
    {
      accessor: 'id',
      title: 'ID заказа',
      render: (item: OrderDto) => (
        <span>#{item.id?.slice(-8)?.toUpperCase() || 'N/A'}</span>
      ),
    },
    {
      accessor: 'product',
      sortable: true,
      filter: (
        <TextInput
          label="Товары"
          description="Показать товары, названия которых содержат указанный текст"
          placeholder="Поиск товаров..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      ),
      filtering: query !== '',
    },
    {
      accessor: 'date',
      sortable: true,
      render: (item: OrderDto) =>
        item.date ? formatDate(item.date ?? '') : '----',
    },
    {
      accessor: 'total',
      sortable: true,
      render: (item: OrderDto) => formatCurrency(item.total),
    },
    {
      accessor: 'status',
      render: (item: OrderDto) => <StatusBadge status={item.status} />,
      filter: (
        <MultiSelect
          label="Статус"
          description="Показать все заказы с указанным статусом"
          data={statuses}
          value={selectedStatuses}
          placeholder="Поиск статусов…"
          onChange={setSelectedStatuses}
          leftSection={<IconSearch size={16} />}
          clearable
          searchable
        />
      ),
      filtering: selectedStatuses.length > 0,
    },
    {
      accessor: 'payment_method',
      title: 'Способ оплаты',
      sortable: true,
      render: (item: OrderDto) => getOrderPaymentMethodLabel(item.payment_method),
    },
    {
      accessor: 'actions',
      title: 'Действия',
      textAlign: 'right',
      render: (item: OrderDto) => (
        <Group gap="xs" justify="flex-end">
          {onView && (
            <Tooltip label="Просмотр">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => onView(item)}
              >
                <IconEye size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip label="Редактировать">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => onEdit(item)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      ),
    },
  ];

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const d = sortBy(data, sortStatus.columnAccessor) as OrderDto[];
    const dd = d.slice(from, to) as OrderDto[];
    let filtered = sortStatus.direction === 'desc' ? dd.reverse() : dd;

    if (debouncedQuery || selectedStatuses.length) {
      filtered = data
        .filter(({ product, status }) => {
          if (
            debouncedQuery !== '' &&
            product &&
            !product.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
          ) {
            return false;
          }

          if (selectedStatuses.length && status) {
            const statusLabel = getStatusLabel(status);
            if (!selectedStatuses.includes(statusLabel)) {
              return false;
            }
          }
          return true;
        })
        .slice(from, to);
    }

    setRecords(filtered);
  }, [sortStatus, data, page, pageSize, debouncedQuery, selectedStatuses]);

  return error ? (
    <ErrorAlert title="Ошибка загрузки заказов" message={error.toString()} />
  ) : (
    <DataTable
      minHeight={200}
      verticalSpacing="sm"
      striped={true}
      columns={columns}
      records={records}
      selectedRecords={selectedRecords}
      onSelectedRecordsChange={setSelectedRecords}
      totalRecords={
        debouncedQuery || selectedStatuses.length > 0
          ? records.length
          : data.length
      }
      recordsPerPage={pageSize}
      page={page}
      onPageChange={(p) => setPage(p)}
      recordsPerPageOptions={PAGE_SIZES}
      onRecordsPerPageChange={setPageSize}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      fetching={loading}
    />
  );
};

export default OrdersTable;
