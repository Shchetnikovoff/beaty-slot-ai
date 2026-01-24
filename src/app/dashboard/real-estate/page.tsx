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
  PropertyListingsTable,
  PropertyTypesChart,
  SalesTrendsChart,
  LocationAnalyticsTable,
  PriceDistributionChart,
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
  } = useFetch<IApiResponse<any[]>>('/api/real-estate/stats');

  const {
    data: propertiesData,
    error: propertiesError,
    loading: propertiesLoading,
  } = useFetch<IApiResponse<any[]>>('/api/real-estate/properties');

  const {
    data: typesData,
    error: typesError,
    loading: typesLoading,
  } = useFetch<IApiResponse<any[]>>('/api/real-estate/property-types');

  const {
    data: salesData,
    error: salesError,
    loading: salesLoading,
  } = useFetch<IApiResponse<any[]>>('/api/real-estate/sales-trends');

  const {
    data: locationsData,
    error: locationsError,
    loading: locationsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/real-estate/locations');

  const {
    data: priceData,
    error: priceError,
    loading: priceLoading,
  } = useFetch<IApiResponse<any[]>>('/api/real-estate/price-distribution');

  return (
    <>
      <>
        <title>Дашборд недвижимости | Панель аналитики</title>
        <meta
          name="description"
          content="Дашборд недвижимости для управления объектами, отслеживания продаж, рыночной аналитики и анализа локаций. Мониторинг объявлений и анализ трендов рынка недвижимости."
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Дашборд недвижимости" withActions={true} />

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
                  Тренды продаж и выручки
                </Text>
                <SalesTrendsChart
                  data={salesData?.data || []}
                  error={salesError}
                  loading={salesLoading}
                />
              </Surface>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Распределение по типам недвижимости
                </Text>
                <PropertyTypesChart
                  data={typesData?.data || []}
                  error={typesError}
                  loading={typesLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Распределение цен
                </Text>
                <PriceDistributionChart
                  data={priceData?.data || []}
                  error={priceError}
                  loading={priceLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Популярные локации
                </Text>
                <LocationAnalyticsTable
                  data={locationsData?.data || []}
                  error={locationsError}
                  loading={locationsLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={12}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Объекты недвижимости
                </Text>
                <PropertyListingsTable
                  data={propertiesData?.data || []}
                  error={propertiesError}
                  loading={propertiesLoading}
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
