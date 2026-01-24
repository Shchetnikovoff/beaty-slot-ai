'use client';

import {
  Button,
  Container,
  Grid,
  Group,
  PaperProps,
  Stack,
  Text,
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

import {
  MobileDesktopChart,
  PageHeader,
  ProjectsTable,
  RevenueChart,
  SalesChart,
  StatsGrid,
  Surface,
} from '@/components';
import { useFetch } from '@mantine/hooks';
import { PATH_TASKS } from '@/routes';
import { IApiResponse } from '@/types/api-response';

const PAPER_PROPS: PaperProps = {
  p: 'md',
  style: { minHeight: '100%' },
};

function Page() {
  const {
    data: projectsData,
    error: projectsError,
    loading: projectsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/projects');

  const {
    data: statsData,
    error: statsError,
    loading: statsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/stats');

  return (
    <>
      <>
        <title>Основной дашборд | Панель аналитики</title>
        <meta
          name="description"
          content="Исследуйте наш универсальный шаблон дашборда с потрясающим набором тем и тщательно разработанных компонентов. Улучшите свой веб-проект с помощью бесшовной интеграции, настраиваемых тем и богатого разнообразия компонентов для динамичного пользовательского опыта."
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Основной дашборд" withActions={true} />
          <StatsGrid
            data={statsData?.data?.slice(0, 4) || []}
            loading={statsLoading}
            error={statsError}
            paperProps={PAPER_PROPS}
          />
          <Grid gutter={{ base: 5, xs: 'md', md: 'md', lg: 'lg', xl: 'xl' }}>
            <Grid.Col span={8}>
              <RevenueChart {...PAPER_PROPS} />
            </Grid.Col>
            <Grid.Col span={4}>
              <SalesChart {...PAPER_PROPS} />
            </Grid.Col>
            <Grid.Col span={4}>
              <MobileDesktopChart {...PAPER_PROPS} />
            </Grid.Col>
            <Grid.Col span={8}>
              <Surface {...PAPER_PROPS}>
                <Group justify="space-between" mb="md">
                  <Text size="lg" fw={600}>
                    Задачи
                  </Text>
                  <Button
                    variant="subtle"
                    component={Link}
                    href={PATH_TASKS.root}
                    rightSection={<IconChevronRight size={18} />}
                  >
                    Показать все
                  </Button>
                </Group>
                <ProjectsTable
                  data={projectsData?.data?.slice(0, 6) || []}
                  error={projectsError}
                  loading={projectsLoading}
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
