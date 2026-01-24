import { Group, RingProgress, Stack, Text, SimpleGrid, Skeleton } from '@mantine/core';
import { ErrorAlert } from '@/components';

interface OrderStatus {
  status: string;
  count: number;
  value: number;
  percentage: number;
  color: string;
}

interface OrderStatusChartProps {
  data?: OrderStatus[];
  loading?: boolean;
  error?: Error | null;
}

export const OrderStatusChart: React.FC<OrderStatusChartProps> = ({
  data = [],
  loading = false,
  error = null,
}) => {
  if (error) {
    return (
      <ErrorAlert
        title="Ошибка загрузки статуса заказов"
        message={error.message || 'Не удалось загрузить статус заказов'}
      />
    );
  }

  if (loading) {
    return <Skeleton height={300} radius="sm" />;
  }

  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const sections = data.map((item) => ({
    value: item.percentage,
    color: `var(--mantine-color-${item.color}-6)`,
    tooltip: `${item.status}: ${item.count} заказов`,
  }));

  return (
    <Stack gap="xl">
      <Group justify="center">
        <RingProgress
          size={240}
          thickness={24}
          sections={sections}
          label={
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700}>
                {totalOrders.toLocaleString()}
              </Text>
              <Text size="xs" c="dimmed">
                Всего заказов
              </Text>
            </div>
          }
        />
      </Group>

      <SimpleGrid cols={2} spacing="md">
        {data.map((item) => (
          <Group key={item.status} justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: `var(--mantine-color-${item.color}-6)`,
                }}
              />
              <div>
                <Text size="sm" fw={500}>
                  {item.status}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.count} заказов
                </Text>
              </div>
            </Group>
            <div style={{ textAlign: 'right' }}>
              <Text size="sm" fw={600}>
                ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text size="xs" c="dimmed">
                {item.percentage.toFixed(1)}%
              </Text>
            </div>
          </Group>
        ))}
      </SimpleGrid>

      <Group justify="center" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <div style={{ textAlign: 'center' }}>
          <Text size="xs" c="dimmed" mb={4}>
            Общая сумма
          </Text>
          <Text size="lg" fw={700}>
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </div>
      </Group>
    </Stack>
  );
};
