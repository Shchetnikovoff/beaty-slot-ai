'use client';

import { useEffect } from 'react';

import {
  Container,
  Grid,
  PaperProps,
  SimpleGrid,
  Skeleton,
  Stack,
} from '@mantine/core';

import {
  ErrorAlert,
  LanguageTable,
  MobileDesktopChart,
  PageHeader,
  SalesChart,
  StatsCard,
  TrafficTable,
} from '@/components';
import { usePageData } from '@/contexts/page-data';
import { useStats, useLanguages, useTraffic } from '@/lib/hooks/useApi';

const PAPER_PROPS: PaperProps = {
  p: 'md',
  style: { minHeight: '100%' },
};

function Page() {
  const { setPageData, clearPageData } = usePageData();
  const {
    data: statsData,
    error: statsError,
    loading: statsLoading,
  } = useStats();
  const {
    data: languagesData,
    error: languageError,
    loading: languageLoading,
  } = useLanguages();
  const {
    data: trafficData,
    error: trafficError,
    loading: trafficLoading,
  } = useTraffic();

  // Передаём данные страницы в AI контекст
  useEffect(() => {
    if (!statsLoading && statsData?.data) {
      setPageData({
        pageType: 'analytics',
        stats: statsData.data.map((s: { title: string; value: string; diff?: number; period?: string }) => ({
          title: s.title,
          value: s.value,
          diff: s.diff,
          period: s.period,
        })),
        tableData: trafficData?.data ? {
          rows: trafficData.data,
          total: trafficData.data.length,
        } : undefined,
        metadata: {
          languages: languagesData?.data?.slice(0, 6) || [],
        },
      });
    }

    return () => clearPageData();
  }, [statsLoading, statsData, trafficData, languagesData, setPageData, clearPageData]);

  return (
    <>
      <>
        <title>Дашборд аналитики | Панель аналитики</title>
        <meta
          name="description"
          content="Исследуйте наш универсальный шаблон дашборда с потрясающим набором тем и тщательно разработанных компонентов. Улучшите свой веб-проект с помощью бесшовной интеграции, настраиваемых тем и богатого разнообразия компонентов для динамичного пользовательского опыта."
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Дашборд аналитики" withActions={true} />
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 2 }}
            spacing={{ base: 10, sm: 'xl' }}
            verticalSpacing={{ base: 'md', sm: 'xl' }}
          >
            {statsError ? (
              <ErrorAlert
                title="Ошибка загрузки статистики"
                message={statsError.toString()}
              />
            ) : (
              <SimpleGrid cols={2}>
                {statsLoading
                  ? Array.from({ length: 4 }).map((o, i) => (
                      <Skeleton
                        key={`stats-loading-${i}`}
                        visible={true}
                        height={200}
                      />
                    ))
                  : statsData?.data
                      ?.slice(0, 4)
                      ?.map((s: any) => (
                        <StatsCard key={s.title} data={s} {...PAPER_PROPS} />
                      ))}
              </SimpleGrid>
            )}
            <MobileDesktopChart {...PAPER_PROPS} />
          </SimpleGrid>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6, lg: 8 }}>
              <SalesChart {...PAPER_PROPS} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <LanguageTable
                data={languagesData?.data?.slice(0, 6) || []}
                error={languageError}
                loading={languageLoading}
                {...PAPER_PROPS}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 8 }}>
              <TrafficTable
                data={trafficData?.data?.slice(0, 6) || []}
                error={trafficError}
                loading={trafficLoading}
                {...PAPER_PROPS}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}

export default Page;
