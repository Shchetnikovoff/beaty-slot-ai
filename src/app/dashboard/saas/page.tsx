'use client';

import {
  Button,
  Container,
  Grid,
  Group,
  Paper,
  PaperProps,
  Stack,
  Text,
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';

import {
  MapChart,
  PageHeader,
  ProjectsTable,
  RevenueChart,
  SalesChart,
  StatsGrid,
  Surface,
} from '@/components';
import { useStats, useProjects } from '@/lib/hooks/useApi';

const PAPER_PROPS: PaperProps = {
  p: 'md',
  style: { minHeight: '100%' },
};

function Page() {
  const {
    data: statsData,
    error: statsError,
    loading: statsLoading,
  } = useStats();
  const {
    data: projectsData,
    error: projectsError,
    loading: projectsLoading,
  } = useProjects();

  return (
    <>
      <>
        <title>SaaS дашборд | Панель аналитики</title>
        <meta
          name="description"
          content="Исследуйте наш универсальный шаблон дашборда с потрясающим набором тем и тщательно разработанных компонентов. Улучшите свой веб-проект с помощью бесшовной интеграции, настраиваемых тем и богатого разнообразия компонентов для динамичного пользовательского опыта."
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="SaaS дашборд" withActions={true} />
          <StatsGrid
            data={statsData?.data || []}
            error={statsError}
            loading={statsLoading}
            paperProps={PAPER_PROPS}
          />
          <Grid>
            <Grid.Col span={{ base: 12, md: 6, lg: 5 }}>
              <MapChart {...PAPER_PROPS} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 7 }}>
              <RevenueChart {...PAPER_PROPS} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <SalesChart {...PAPER_PROPS} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 8 }}>
              <Surface {...PAPER_PROPS}>
                <Group justify="space-between" mb="md">
                  <Text size="lg" fw={600}>
                    Задачи
                  </Text>
                  <Button
                    variant="subtle"
                    rightSection={<IconChevronRight size={16} />}
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
