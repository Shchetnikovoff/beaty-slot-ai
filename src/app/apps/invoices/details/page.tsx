'use client';

import { Anchor, Container, PaperProps, Stack } from '@mantine/core';
import { Metadata } from 'next';

import { InvoiceDetailsCard, PageHeader } from '@/components';
import { PATH_DASHBOARD, PATH_INVOICES } from '@/routes';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Платежи', href: PATH_INVOICES.invoices.all },
  { title: 'Детали', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const sampleData = {
  id: '8677a3e2-dde3-4d04-8edd-9d0bcf178f89',
  full_name: 'Dannie MacTrustie',
  email: 'atysack2r@washingtonpost.com',
  address: '5160 Iowa Point',
  country: 'China',
  status: 'approved',
  amount: 6221.88,
  issue_date: '7/12/2022',
  description:
    'In quis justo. Maecenas rhoncus aliquam lacus. Morbi quis tortor id nulla ultrices aliquet.\n\nMaecenas leo odio, condimentum id, luctus nec, molestie sed, justo. Pellentesque viverra pede ac diam. Cras pellentesque volutpat dui.\n\nMaecenas tristique, est et tempus semper, est quam pharetra magna, ac consequat metus sapien ut nunc. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Mauris viverra diam vitae quam. Suspendisse potenti.\n\nNullam porttitor lacus at turpis. Donec posuere metus vitae ipsum. Aliquam non mauris.\n\nMorbi non lectus. Aliquam sit amet diam in magna bibendum imperdiet. Nullam orci pede, venenatis non, sodales sed, tincidunt eu, felis.',
  client_email: 'atysack2r@illinois.edu',
  client_address: '13 Loeprich Point',
  client_country: 'Russia',
  client_name: 'Alayne Tysack',
  client_company: 'Raynor and Sons',
};

const PAPER_PROPS: PaperProps = {
  p: 'md',
  shadow: 'md',
  radius: 'md',
};

const metadata: Metadata = {
  title: 'Детали платежа | Beauty Slot',
  description:
    'Детали платежа в системе Beauty Slot',
};

function SampleInvoiceDetails() {
  return (
    <>
      <>
        <title>Детали платежа | Beauty Slot</title>
        <meta
          name="description"
          content="Детали платежа в системе Beauty Slot"
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            title={`Платёж #${sampleData.id.slice(0, 7)}`}
            breadcrumbItems={items}
          />
          <InvoiceDetailsCard data={sampleData} {...PAPER_PROPS} />
        </Stack>
      </Container>
    </>
  );
}

export default SampleInvoiceDetails;
