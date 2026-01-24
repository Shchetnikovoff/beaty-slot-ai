'use client';

import { useEffect } from 'react';

import {
  Button,
  Center,
  Code,
  Group,
  Stack,
  Title,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconHome2, IconRefresh } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import classes from './error.module.css';

function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <>
      <>
        <title>Ошибка сервера | Панель аналитики</title>
        <meta
          name="description"
          content="Произошла непредвиденная ошибка сервера."
        />
      </>
      <Center
        style={{
          height: '100vh',
          width: '100vw',
          backgroundColor:
            colorScheme === 'light'
              ? theme.colors.gray[0]
              : theme.colors.dark[8],
          color:
            colorScheme === 'light'
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        }}
      >
        <Stack>
          <div className={classes.label}>400</div>
          <Title className={classes.title}>Произошла непредвиденная ошибка</Title>
          <Code
            block
            color={`${colorScheme === 'light' ? 'red.1' : 'red.8'}`}
            c={`${colorScheme === 'light' ? 'red.7' : 'red.0'}`}
            fz="md"
            ta="center"
            className={classes.description}
          >
            {error.toString()}
          </Code>
          <Group justify="center" mt="md">
            <Button
              size="md"
              leftSection={<IconRefresh size={18} />}
              variant="default"
              onClick={() => window.location.reload}
            >
              Обновить страницу
            </Button>
            <Button
              size="md"
              variant="default"
              leftSection={<IconHome2 size={18} />}
              onClick={() => router.push('/')}
            >
              На главную
            </Button>
          </Group>
        </Stack>
      </Center>
    </>
  );
}

export default Error;
