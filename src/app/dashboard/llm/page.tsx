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
  ModelUsageTable,
  TokenUsageChart,
  UseCaseChart,
  PerformanceMetricsChart,
  CostAnalysisChart,
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
  } = useFetch<IApiResponse<any[]>>('/api/llm/stats');

  const {
    data: modelsData,
    error: modelsError,
    loading: modelsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/llm/model-usage');

  const {
    data: tokensData,
    error: tokensError,
    loading: tokensLoading,
  } = useFetch<IApiResponse<any[]>>('/api/llm/token-trends');

  const {
    data: useCasesData,
    error: useCasesError,
    loading: useCasesLoading,
  } = useFetch<IApiResponse<any[]>>('/api/llm/use-cases');

  const {
    data: performanceData,
    error: performanceError,
    loading: performanceLoading,
  } = useFetch<IApiResponse<any[]>>('/api/llm/performance');

  const {
    data: costsData,
    error: costsError,
    loading: costsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/llm/costs');

  return (
    <>
      <>
        <title>LLM дашборд | Панель аналитики</title>
        <meta
          name="description"
          content="LLM и AI дашборд для отслеживания использования API, производительности моделей, потребления токенов и анализа затрат. Мониторинг метрик AI-моделей и оптимизация использования ресурсов."
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="LLM дашборд" withActions={true} />

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
                  Тренды использования токенов
                </Text>
                <TokenUsageChart
                  data={tokensData?.data || []}
                  error={tokensError}
                  loading={tokensLoading}
                />
              </Surface>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Распределение по сценариям использования
                </Text>
                <UseCaseChart
                  data={useCasesData?.data || []}
                  error={useCasesError}
                  loading={useCasesLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Метрики производительности
                </Text>
                <PerformanceMetricsChart
                  data={performanceData?.data || []}
                  error={performanceError}
                  loading={performanceLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Анализ затрат
                </Text>
                <CostAnalysisChart
                  data={costsData?.data || []}
                  error={costsError}
                  loading={costsLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={12}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Статистика использования моделей
                </Text>
                <ModelUsageTable
                  data={modelsData?.data || []}
                  error={modelsError}
                  loading={modelsLoading}
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
