'use client';

import { useState } from 'react';

import {
  Alert,
  Button,
  Checkbox,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  TextProps,
  Title,
  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconScissors } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Surface } from '@/components';
import { authService } from '@/services';
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
    initialValues: { username: '', password: '' },
    validate: {
      username: (value: string) =>
        value.length < 3 ? 'Логин должен содержать минимум 3 символа' : null,
      password: (value: string | undefined) =>
        value && value?.length < 4
          ? 'Пароль должен содержать минимум 4 символа'
          : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.login({
        username: values.username,
        password: values.password,
      });

      router.push(callbackUrl);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.toLowerCase().includes('invalid')) {
          setError('Неверный логин или пароль');
        } else if (err.message.includes('fetch') || err.message.includes('network')) {
          setError('Ошибка подключения к серверу');
        } else {
          setError(err.message || 'Произошла ошибка при входе');
        }
      } else {
        setError('Произошла непредвиденная ошибка');
      }
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <title>Вход | Beauty Slot Admin</title>
      <meta
        name="description"
        content="Войдите в панель управления салоном Beauty Slot"
      />

      <Stack align="center" gap="xs" mb="lg">
        <IconScissors size={48} stroke={1.5} color="var(--mantine-color-blue-6)" />
        <Title ta="center">Beauty Slot</Title>
        <Text ta="center" c="dimmed">Панель администратора</Text>
      </Stack>

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
            label="Логин"
            placeholder="admin"
            required
            classNames={{ label: classes.label }}
            {...form.getInputProps('username')}
          />
          <PasswordInput
            label="Пароль"
            placeholder="Введите пароль"
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

        <Text size="xs" c="dimmed" ta="center" mt="xl">
          Доступ только для администраторов салона
        </Text>
      </Surface>
    </>
  );
}

export default Page;
