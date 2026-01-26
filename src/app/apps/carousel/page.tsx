'use client';

import { Anchor, Container, Stack } from '@mantine/core';

import { PageHeader } from '@/components';
import { CarouselSettings } from '@/components/CarouselSettings';
import { PATH_DASHBOARD } from '@/routes';

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Продвижение', href: '#' },
  { title: 'Баннеры и акции', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

function CarouselPage() {
  return (
    <>
      <title>Баннеры и акции | Beauty Slot Admin</title>
      <meta name="description" content="Управление баннерами и акциями для карусели" />

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title="Баннеры и акции"
            breadcrumbItems={breadcrumbItems}
          />

          <CarouselSettings />
        </Stack>
      </Container>
    </>
  );
}

export default CarouselPage;
