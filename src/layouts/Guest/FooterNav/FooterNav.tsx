import {
  Container,
  Divider,
  Flex,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';

import { Logo } from '@/components';

import classes from './FooterNav.module.css';

const FooterNav = () => {
  return (
    <footer className={classes.footer}>
      <Container fluid mb="xl">
        <Stack gap="lg">
          <Title ta="center" order={2}>
            Beauty Slot Admin
          </Title>
          <Text ta="center">
            Панель управления салоном красоты. Управляйте клиентами, подписками
            и платежами в одном месте.
          </Text>
        </Stack>
        <Divider mt="xl" mb="md" />
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 'sm', sm: 'lg' }}
          justify={{ base: 'center', sm: 'space-between' }}
          align={{ base: 'center' }}
        >
          <Logo c="white" />
          <Group gap="xs" justify="flex-end" wrap="nowrap">
            <Text size="sm" c="dimmed">
              &copy; {new Date().getFullYear()} Beauty Slot
            </Text>
          </Group>
        </Flex>
      </Container>
    </footer>
  );
};

export default FooterNav;
