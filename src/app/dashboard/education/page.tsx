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
  StudentEnrollmentChart,
  CourseCompletionTable,
  GradeDistributionChart,
  InstructorPerformanceTable,
  StudentActivityChart,
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
  } = useFetch<IApiResponse<any[]>>('/api/education/stats');

  const {
    data: enrollmentData,
    error: enrollmentError,
    loading: enrollmentLoading,
  } = useFetch<IApiResponse<any[]>>('/api/education/enrollment');

  const {
    data: coursesData,
    error: coursesError,
    loading: coursesLoading,
  } = useFetch<IApiResponse<any[]>>('/api/education/courses');

  const {
    data: gradesData,
    error: gradesError,
    loading: gradesLoading,
  } = useFetch<IApiResponse<any[]>>('/api/education/grades');

  const {
    data: instructorsData,
    error: instructorsError,
    loading: instructorsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/education/instructors');

  const {
    data: activityData,
    error: activityError,
    loading: activityLoading,
  } = useFetch<IApiResponse<any[]>>('/api/education/activity');

  return (
    <>
      <>
        <title>Образовательный дашборд | Панель аналитики</title>
        <meta
          name="description"
          content="Образовательный дашборд для отслеживания зачисления студентов, мониторинга завершения курсов, анализа оценок и эффективности преподавателей. Эффективное управление системой обучения."
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Образовательный дашборд" withActions={true} />

          <StatsGrid
            data={statsData?.data || []}
            error={statsError}
            loading={statsLoading}
            paperProps={PAPER_PROPS}
          />

          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Surface {...PAPER_PROPS}>
                <StudentEnrollmentChart
                  data={enrollmentData?.data || []}
                  error={enrollmentError}
                  loading={enrollmentLoading}
                />
              </Surface>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Распределение оценок
                </Text>
                <GradeDistributionChart
                  data={gradesData?.data || []}
                  error={gradesError}
                  loading={gradesLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={12}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Активность студентов (за неделю)
                </Text>
                <StudentActivityChart
                  data={activityData?.data || []}
                  error={activityError}
                  loading={activityLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Процент завершения курсов
                </Text>
                <CourseCompletionTable
                  data={coursesData?.data || []}
                  error={coursesError}
                  loading={coursesLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Эффективность преподавателей
                </Text>
                <InstructorPerformanceTable
                  data={instructorsData?.data || []}
                  error={instructorsError}
                  loading={instructorsLoading}
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
