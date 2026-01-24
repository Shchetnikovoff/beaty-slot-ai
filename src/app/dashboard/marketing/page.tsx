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
  CampaignPerformanceChart,
  SocialMediaTable,
  EmailCampaignsTable,
  TrafficSourcesChart,
  TopCampaignsTable,
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
  } = useFetch<IApiResponse<any[]>>('/api/marketing/stats');

  const {
    data: campaignsData,
    error: campaignsError,
    loading: campaignsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/marketing/campaigns');

  const {
    data: socialMediaData,
    error: socialMediaError,
    loading: socialMediaLoading,
  } = useFetch<IApiResponse<any[]>>('/api/marketing/social-media');

  const {
    data: emailData,
    error: emailError,
    loading: emailLoading,
  } = useFetch<IApiResponse<any[]>>('/api/marketing/email-campaigns');

  const {
    data: trafficData,
    error: trafficError,
    loading: trafficLoading,
  } = useFetch<IApiResponse<any[]>>('/api/marketing/traffic-sources');

  const {
    data: topCampaignsData,
    error: topCampaignsError,
    loading: topCampaignsLoading,
  } = useFetch<IApiResponse<any[]>>('/api/marketing/top-campaigns');

  return (
    <>
      <>
        <title>Маркетинговый дашборд | Панель аналитики</title>
        <meta
          name="description"
          content="Маркетинговый дашборд для отслеживания кампаний, аналитики социальных сетей, эффективности email-маркетинга и анализа ROI. Мониторинг маркетинговых метрик и оптимизация кампаний."
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Маркетинговый дашборд" withActions={true} />

          <StatsGrid
            data={statsData?.data || []}
            error={statsError}
            loading={statsLoading}
            paperProps={PAPER_PROPS}
          />

          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Surface {...PAPER_PROPS}>
                <CampaignPerformanceChart
                  data={campaignsData?.data || []}
                  error={campaignsError}
                  loading={campaignsLoading}
                />
              </Surface>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Источники трафика
                </Text>
                <TrafficSourcesChart
                  data={trafficData?.data || []}
                  error={trafficError}
                  loading={trafficLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Эффективность социальных сетей
                </Text>
                <SocialMediaTable
                  data={socialMediaData?.data || []}
                  error={socialMediaError}
                  loading={socialMediaLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Email-кампании
                </Text>
                <EmailCampaignsTable
                  data={emailData?.data?.slice(0, 5) || []}
                  error={emailError}
                  loading={emailLoading}
                />
              </Surface>
            </Grid.Col>

            <Grid.Col span={12}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Лучшие кампании
                </Text>
                <TopCampaignsTable
                  data={topCampaignsData?.data || []}
                  error={topCampaignsError}
                  loading={topCampaignsLoading}
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
