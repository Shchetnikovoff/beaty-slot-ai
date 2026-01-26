'use client';

import { Anchor, Container, Stack } from '@mantine/core';

import { PageHeader } from '@/components';
import { SyncSettings } from '@/components/SyncSettings';
import { PATH_DASHBOARD } from '@/routes';

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Профиль организации', href: '#' },
  { title: 'Синхронизация', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

function SyncPage() {
  return (
    <>
      <title>Синхронизация | Beauty Slot Admin</title>
      <meta name="description" content="Синхронизация данных с YClients" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Синхронизация"
            breadcrumbItems={breadcrumbItems}
          />

          <SyncSettings />
        </Stack>
      </Container>
    </>
  );
}

export default SyncPage;
