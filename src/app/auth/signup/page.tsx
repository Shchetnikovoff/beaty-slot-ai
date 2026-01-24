'use client';

import {
  Button,
  Center,
  Flex,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  TextProps,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useColorScheme, useMediaQuery } from '@mantine/hooks';
import Link from 'next/link';

import { Surface } from '@/components';
import { PATH_AUTH, PATH_DASHBOARD } from '@/routes';

import classes from './page.module.css';

function Page() {
  const theme = useMantineTheme();
  const colorScheme = useColorScheme();
  const mobile_match = useMediaQuery('(max-width: 425px)');

  const LINK_PROPS: TextProps = {
    className: classes.link,
  };

  return (
    <>
      <>
        <title>Регистрация | Панель аналитики</title>
        <meta
          name="description"
          content="Создайте аккаунт для доступа к панели управления."
        />
      </>
      <Title ta="center">Добро пожаловать!</Title>
      <Text ta="center">Создайте аккаунт для продолжения</Text>

      <Surface component={Paper} className={classes.card}>
        <Flex direction={{ base: 'column', sm: 'row' }} gap={{ base: 'md' }}>
          <TextInput
            label="Имя"
            placeholder="Иван"
            required
            classNames={{ label: classes.label }}
          />
          <TextInput
            label="Фамилия"
            placeholder="Иванов"
            required
            classNames={{ label: classes.label }}
          />
        </Flex>
        <TextInput
          label="Email"
          placeholder="you@example.com"
          required
          mt="md"
          classNames={{ label: classes.label }}
        />
        <PasswordInput
          label="Пароль"
          placeholder="Ваш пароль"
          required
          mt="md"
          classNames={{ label: classes.label }}
        />
        <PasswordInput
          label="Подтвердите пароль"
          placeholder="Повторите пароль"
          required
          mt="md"
          classNames={{ label: classes.label }}
        />
        <Button
          fullWidth
          mt="xl"
          component={Link}
          href={PATH_DASHBOARD.default}
        >
          Создать аккаунт
        </Button>
        <Center mt="md">
          <Text
            size="sm"
            component={Link}
            href={PATH_AUTH.signin}
            {...LINK_PROPS}
          >
            Уже есть аккаунт? Войти
          </Text>
        </Center>
      </Surface>
    </>
  );
}

export default Page;
