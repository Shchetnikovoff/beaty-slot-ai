'use client';

import {
  Button,
  Center,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { IconChevronLeft, IconHome2 } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { PATH_DASHBOARD } from '@/routes';

import classes from './error.module.css';

function Error404() {
  const router = useRouter();
  const theme = useMantineTheme();

  return (
    <>
      <>
        <title>Страница не найдена | Панель аналитики</title>
        <meta
          name="description"
          content="Запрашиваемая страница не найдена."
        />
      </>
      <Center
        style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: theme.colors.gray[0],
          color: theme.colors.dark[8],
        }}
      >
        <Stack>
          <div className={classes.label}>404</div>
          <Title className={classes.title}>
            Страница не найдена
          </Title>
          <Text fz="md" ta="center" className={classes.description}>
            К сожалению, запрашиваемая страница не существует. Возможно, вы
            ошиблись в адресе или страница была перемещена.
          </Text>
          <Group justify="center" mt="md">
            <Button
              size="md"
              variant="outline"
              leftSection={<IconChevronLeft size={18} />}
              onClick={() => {
                router.back();
              }}
            >
              Назад
            </Button>
            <Button
              size="md"
              variant="outline"
              component={Link}
              leftSection={<IconHome2 size={18} />}
              href={PATH_DASHBOARD.default}
            >
              На главную
            </Button>
          </Group>
        </Stack>
      </Center>
    </>
  );
}

export default Error404;
