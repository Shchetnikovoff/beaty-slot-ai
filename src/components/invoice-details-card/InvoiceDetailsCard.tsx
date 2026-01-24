'use client';

import {
  Button,
  Divider,
  Flex,
  Menu,
  Paper,
  PaperProps,
  Stack,
  Table,
  Text,
  TextProps,
  useMantineTheme,
} from '@mantine/core';
import { useColorScheme, useMediaQuery } from '@mantine/hooks';
import {
  IconCloudDownload,
  IconMail,
  IconPrinter,
  IconSend,
  IconShare,
} from '@tabler/icons-react';

import { Surface } from '@/components';

const ICON_SIZE = 16;

type InvoiceDetailsProps = {
  data?: any;
} & PaperProps;

const elements = [
  { description: 'Передние и задние тормозные тросы', unitPrice: 100, amount: 100 },
  { description: 'Новый комплект педальных рычагов', unitPrice: 25, amount: 25 },
  { description: 'Работа - 3 часа', unitPrice: 15, amount: 15 },
];

const TEXT_PROPS: TextProps = {
  fz: 'sm',
};

const InvoiceDetails = ({ data, ...others }: InvoiceDetailsProps) => {
  const theme = useMantineTheme();
  const colorScheme = useColorScheme();
  const LINK_PROPS: TextProps = {
    c:
      colorScheme === 'dark'
        ? theme.colors[theme.primaryColor][4]
        : theme.colors[theme.primaryColor][6],
    td: 'underline',
  };
  const tablet_match = useMediaQuery('(max-width: 768px)');

  const rows = elements.map((element) => (
    <Table.Tr key={element.description}>
      <Table.Td>{element.description}</Table.Td>
      <Table.Td>${element.unitPrice}</Table.Td>
      <Table.Td>${element.amount}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Surface {...others}>
      {data ? (
        <Stack>
          <Flex gap="sm" justify="flex-end">
            <Button
              leftSection={<IconCloudDownload size={ICON_SIZE} />}
              variant="light"
            >
              Скачать
            </Button>
            <Button
              leftSection={<IconPrinter size={ICON_SIZE} />}
              variant="light"
            >
              Печать
            </Button>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button
                  leftSection={<IconShare size={ICON_SIZE} />}
                  variant="light"
                >
                  Поделиться
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item leftSection={<IconMail size={14} />}>
                  Отправить по email
                </Menu.Item>
                <Menu.Item leftSection={<IconSend size={14} />}>
                  Переслать в чат
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Flex>
          <Text {...TEXT_PROPS}>Здравствуйте, {data.full_name},</Text>
          <Text {...TEXT_PROPS}>
            Это счёт на оплату в размере ${data.amount}, которую вы сделали{' '}
            {data.client_company}
          </Text>
          <Flex
            justify="space-between"
            direction={{ base: 'column', sm: 'row' }}
            gap={{ base: 'sm', sm: 4 }}
          >
            <Stack gap={4}>
              <Text {...TEXT_PROPS} fw={600}>
                Номер платежа
              </Text>
              <Text {...TEXT_PROPS}>{data.id}</Text>
            </Stack>
            <Stack
              gap={4}
              style={{ textAlign: tablet_match ? 'start' : 'end' }}
            >
              <Text {...TEXT_PROPS} fw={600}>
                Дата платежа
              </Text>
              <Text {...TEXT_PROPS}>{data.issue_date}</Text>
            </Stack>
          </Flex>
          <Divider />
          <Flex
            justify="space-between"
            direction={{ base: 'column', sm: 'row' }}
            gap={{ base: 'sm', sm: 4 }}
          >
            <Stack gap={4}>
              <Text {...TEXT_PROPS} fw={600}>
                Клиент
              </Text>
              <Text {...TEXT_PROPS}>{data.client_name}</Text>
              <Text {...TEXT_PROPS}>{data.client_address}</Text>
              <Text {...TEXT_PROPS}>{data.client_country}</Text>
              <Text
                component="a"
                href={`mailto:${data.client_email}`}
                {...TEXT_PROPS}
                {...LINK_PROPS}
              >
                {data.client_email}
              </Text>
            </Stack>
            <Stack
              gap={4}
              style={{ textAlign: tablet_match ? 'start' : 'end' }}
            >
              <Text {...TEXT_PROPS} fw={600}>
                Получатель
              </Text>
              <Text {...TEXT_PROPS}>{data.client_company}</Text>
              <Text {...TEXT_PROPS}>{data.address}</Text>
              <Text {...TEXT_PROPS}>{data.country}</Text>
              <Text
                component="a"
                href={`mailto:${data.email}`}
                {...TEXT_PROPS}
                {...LINK_PROPS}
              >
                {data.email}
              </Text>
            </Stack>
          </Flex>
          <Divider />
          <Table striped horizontalSpacing="xs" verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Описание</Table.Th>
                <Table.Th>Цена за ед.</Table.Th>
                <Table.Th>Сумма</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows}
              <Table.Tr>
                <Table.Td></Table.Td>
                <Table.Td>Промежуточный итог</Table.Td>
                <Table.Td>$140</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td></Table.Td>
                <Table.Td>Доставка</Table.Td>
                <Table.Td>$5</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td></Table.Td>
                <Table.Td>Скидка</Table.Td>
                <Table.Td>2.5%</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td></Table.Td>
                <Table.Td>Итого</Table.Td>
                <Table.Td>$137.75</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
          <Text ta="center" fz="sm" c="dimmed" mt="md">
            Примечание: Пожалуйста, отправьте все товары одновременно по адресу
            доставки. Заранее благодарим.
          </Text>
        </Stack>
      ) : (
        <p>Счёт не выбран</p>
      )}
    </Surface>
  );
};

export default InvoiceDetails;
