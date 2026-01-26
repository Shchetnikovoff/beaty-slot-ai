'use client';

import { Anchor, Container, Stack, Title } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';

import { PageHeader } from '@/components';
import { WebPageSettings } from '@/components/WebPageSettings';
import { PATH_DASHBOARD } from '@/routes';

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Продвижение', href: '#' },
  { title: 'Публичная страница', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

function SalonPage() {
  return (
    <>
      <title>Публичная страница салона | Beauty Slot Admin</title>
      <meta name="description" content="Настройки публичной страницы салона" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Публичная страница салона"
            breadcrumbItems={breadcrumbItems}
          />

          <WebPageSettings />
        </Stack>
      </Container>
    </>
  );
}

export default SalonPage;
