'use client';

import { useState } from 'react';

import {
  Alert,
  Button,
  Center,
  Checkbox,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  TextProps,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Surface } from '@/components';
import { PATH_AUTH, PATH_DASHBOARD } from '@/routes';

import classes from './page.module.css';

const LINK_PROPS: TextProps = {
  className: classes.link,
};

function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || PATH_DASHBOARD.default;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: { email: 'demo@example.com', password: 'demo123' },
    validate: {
      email: (value: string) =>
        /^\S+@\S+$/.test(value) ? null : 'Некорректный email',
      password: (value: string | undefined) =>
        value && value?.length < 6
          ? 'Пароль должен содержать минимум 6 символов'
          : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simple demo login - just redirect to dashboard
      // In a real application, implement your auth logic here with Clerk or Auth0

      // Simulate a brief loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to dashboard
      router.push(PATH_DASHBOARD.default);

    } catch (error) {
      setError('Произошла непредвиденная ошибка');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <title>Вход | Панель аналитики</title>
      <meta
        name="description"
        content="Войдите в свой аккаунт для доступа к панели управления."
      />

      <Title ta="center">С возвращением!</Title>
      <Text ta="center">Войдите в аккаунт для продолжения</Text>

      <Surface component={Paper} className={classes.card}>
        {error && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Ошибка авторизации"
            color="red"
            mb="md"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="demo@example.com"
            required
            classNames={{ label: classes.label }}
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Пароль"
            placeholder="demo123"
            required
            mt="md"
            classNames={{ label: classes.label }}
            {...form.getInputProps('password')}
          />
          <Group justify="space-between" mt="lg">
            <Checkbox
              label="Запомнить меня"
              classNames={{ label: classes.label }}
            />
            <Text
              component={Link}
              href={PATH_AUTH.passwordReset}
              size="sm"
              {...LINK_PROPS}
            >
              Забыли пароль?
            </Text>
          </Group>
          <Button fullWidth mt="xl" type="submit" loading={isLoading}>
            Войти
          </Button>
        </form>
        <Center mt="md">
          <Text
            fz="sm"
            ta="center"
            component={Link}
            href={PATH_AUTH.signup}
            {...LINK_PROPS}
          >
            Нет аккаунта? Зарегистрироваться
          </Text>
        </Center>
      </Surface>
    </>
  );
}

export default Page;
