'use client';

import {
  Container,
  Grid,
  PaperProps,
  Stack,
  Text,
} from '@mantine/core';

import {
  PageHeader,
  StatsGrid,
  Surface,
  ActiveShipmentsTable,
  FleetStatusChart,
  DeliveryPerformanceChart,
  RouteEfficiencyTable,
  WarehouseInventoryChart,
} from '@/components';
import { useFetch } from '@mantine/hooks';
import { IApiResponse } from '@/types/api-response';

const PAPER_PROPS: PaperProps = {
  p: 'md',
  style: { minHeight: '100%' },
};

function Page() {
  const {
    data: statsData,
    error: statsError,
    loading: statsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/logistics/stats');

  const {
    data: shipmentsData,
    error: shipmentsError,
    loading: shipmentsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/logistics/shipments');

  const {
    data: fleetData,
    error: fleetError,
    loading: fleetLoading,
  } = useFetch<IApiResponse<any[]>>('/api/logistics/fleet-status');

  const {
    data: deliveryData,
    error: deliveryError,
    loading: deliveryLoading,
  } = useFetch<IApiResponse<any[]>>('/api/logistics/delivery-performance');

  const {
    data: routeData,
    error: routeError,
    loading: routeLoading,
  } = useFetch<IApiResponse<any[]>>('/api/logistics/route-efficiency');

  const {
    data: warehouseData,
    error: warehouseError,
    loading: warehouseLoading,
  } = useFetch<IApiResponse<any[]>>('/api/logistics/warehouse-inventory');

  return (
    <>
      <>
        <title>Логистический дашборд | Панель аналитики</title>
        <meta
          name="description"
          content="Логистический дашборд для отслеживания грузов, управления автопарком, мониторинга эффективности доставки и оптимизации маршрутов. Управление складскими запасами и анализ логистических операций."
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Логистический дашборд" withActions={true} />

          <StatsGrid
            data={statsData?.data || []}
            error={statsError}
            loading={statsLoading}
            paperProps={PAPER_PROPS}
          />

          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Эффективность доставки
                </Text>
                <DeliveryPerformanceChart
                  data={deliveryData?.data || []}
                  error={deliveryError}
                  loading={deliveryLoading}
                />
              </Surface>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Статус автопарка
                </Text>
                <FleetStatusChart
                  data={fleetData?.data || []}
                  error={fleetError}
                  loading={fleetLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Эффективность маршрутов
                </Text>
                <RouteEfficiencyTable
                  data={routeData?.data || []}
                  error={routeError}
                  loading={routeLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Вместимость склада
                </Text>
                <WarehouseInventoryChart
                  data={warehouseData?.data || []}
                  error={warehouseError}
                  loading={warehouseLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={12}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Активные отправки
                </Text>
                <ActiveShipmentsTable
                  data={shipmentsData?.data || []}
                  error={shipmentsError}
                  loading={shipmentsLoading}
                />
              </Surface>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}

export default Page;
