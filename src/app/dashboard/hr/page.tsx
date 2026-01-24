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
  EmployeeDistributionChart,
  RecruitmentPipelineChart,
  EmployeePerformanceChart,
  OpenPositionsTable,
  AttendanceChart,
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
  } = useFetch<IApiResponse<any[]>>('/api/hr/stats');

  const {
    data: distributionData,
    error: distributionError,
    loading: distributionLoading,
  } = useFetch<IApiResponse<any[]>>('/api/hr/employee-distribution');

  const {
    data: pipelineData,
    error: pipelineError,
    loading: pipelineLoading,
  } = useFetch<IApiResponse<any[]>>('/api/hr/recruitment-pipeline');

  const {
    data: performanceData,
    error: performanceError,
    loading: performanceLoading,
  } = useFetch<IApiResponse<any[]>>('/api/hr/performance');

  const {
    data: positionsData,
    error: positionsError,
    loading: positionsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/hr/open-positions');

  const {
    data: attendanceData,
    error: attendanceError,
    loading: attendanceLoading,
  } = useFetch<IApiResponse<any[]>>('/api/hr/attendance');

  return (
    <>
      <>
        <title>HR дашборд | Панель аналитики</title>
        <meta
          name="description"
          content="HR дашборд для управления сотрудниками, отслеживания найма, мониторинга эффективности и аналитики посещаемости. Управление персоналом и анализ HR-операций."
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="HR дашборд" withActions={true} />

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
                  Тренды эффективности сотрудников
                </Text>
                <EmployeePerformanceChart
                  data={performanceData?.data || []}
                  error={performanceError}
                  loading={performanceLoading}
                />
              </Surface>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Распределение сотрудников
                </Text>
                <EmployeeDistributionChart
                  data={distributionData?.data || []}
                  error={distributionError}
                  loading={distributionLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Воронка найма
                </Text>
                <RecruitmentPipelineChart
                  data={pipelineData?.data || []}
                  error={pipelineError}
                  loading={pipelineLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Отслеживание посещаемости
                </Text>
                <AttendanceChart
                  data={attendanceData?.data || []}
                  error={attendanceError}
                  loading={attendanceLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={12}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Открытые вакансии
                </Text>
                <OpenPositionsTable
                  data={positionsData?.data || []}
                  error={positionsError}
                  loading={positionsLoading}
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
