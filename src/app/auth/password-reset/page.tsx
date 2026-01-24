'use client';

import React from 'react';

import {
  Button,
  Group,
  Paper,
  Text,
  TextInput,
  Title,
  UnstyledButton,
  rem,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconChevronLeft } from '@tabler/icons-react';
import Link from 'next/link';

import { Surface } from '@/components';
import { PATH_AUTH, PATH_DASHBOARD } from '@/routes';

import classes from './page.module.css';

function Page() {
  const mobile_match = useMediaQuery('(max-width: 425px)');

  return (
    <>
      <>
        <title>Сброс пароля | Панель аналитики</title>
        <meta
          name="description"
          content="Восстановите доступ к вашему аккаунту."
        />
      </>
      <Title ta="center">Забыли пароль?</Title>
      <Text ta="center">Введите email для получения ссылки на сброс</Text>

      <Surface component={Paper} className={classes.card}>
        <TextInput label="Ваш email" placeholder="me@email.com" required />
        <Group justify="space-between" mt="lg" className={classes.controls}>
          <UnstyledButton
            component={Link}
            href={PATH_AUTH.signin}
            color="dimmed"
            className={classes.control}
          >
            <Group gap={2} align="center">
              <IconChevronLeft
                stroke={1.5}
                style={{ width: rem(14), height: rem(14) }}
              />
              <Text size="sm" ms={5}>
                Назад к входу
              </Text>
            </Group>
          </UnstyledButton>
          <Button
            component={Link}
            href={PATH_DASHBOARD.default}
            fullWidth={mobile_match}
          >
            Сбросить пароль
          </Button>
        </Group>
      </Surface>
    </>
  );
}

export default Page;
