'use client';

import { useEffect, useState } from 'react';

import {
  Anchor,
  Avatar,
  Button,
  Container,
  Divider,
  FileButton,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconCamera,
  IconDeviceFloppy,
  IconKey,
  IconLock,
  IconLogout,
  IconMail,
  IconPhone,
  IconShieldCheck,
  IconUser,
} from '@tabler/icons-react';

import { PageHeader, Surface } from '@/components';
import { useProfile } from '@/lib/hooks/useApi';
import { PATH_DASHBOARD } from '@/routes';

const breadcrumbItems = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Профиль пользователя', href: '#' },
  { title: 'Настройки', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

// Password change modal
function ChangePasswordModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) => (!value ? 'Введите текущий пароль' : null),
      newPassword: (value) =>
        value.length < 8 ? 'Минимум 8 символов' : null,
      confirmPassword: (value, values) =>
        value !== values.newPassword ? 'Пароли не совпадают' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      notifications.show({
        title: 'Пароль изменён',
        message: 'Ваш пароль успешно обновлён',
        color: 'green',
      });
      form.reset();
      onClose();
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось изменить пароль',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Смена пароля" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <PasswordInput
            label="Текущий пароль"
            placeholder="Введите текущий пароль"
            size="sm"
            {...form.getInputProps('currentPassword')}
          />
          <PasswordInput
            label="Новый пароль"
            placeholder="Минимум 8 символов"
            size="sm"
            {...form.getInputProps('newPassword')}
          />
          <PasswordInput
            label="Подтвердите пароль"
            placeholder="Повторите новый пароль"
            size="sm"
            {...form.getInputProps('confirmPassword')}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="light" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              Изменить пароль
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

function Settings() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [telegramNotifications, setTelegramNotifications] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const { data: profileData, loading: profileLoading } = useProfile();
  const profile = profileData?.data;

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      position: 'admin',
    },
    validate: {
      name: (value) => (!value ? 'Имя обязательно' : null),
      email: (value) => {
        if (!value) return 'Email обязателен';
        return /^\S+@\S+$/.test(value) ? null : 'Некорректный email';
      },
      phone: (value) => {
        if (!value) return null;
        return /^[\d\s\-+()]+$/.test(value) ? null : 'Некорректный телефон';
      },
    },
  });

  useEffect(() => {
    if (profile) {
      form.setValues({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        position: 'admin',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Handle avatar file change
  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [avatarFile]);

  const handleSaveProfile = async (values: typeof form.values) => {
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      notifications.show({
        title: 'Сохранено',
        message: 'Профиль успешно обновлён',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить профиль',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = () => {
    notifications.show({
      title: 'Выход выполнен',
      message: 'Вы вышли со всех устройств',
      color: 'blue',
    });
  };

  const avatarSrc = avatarPreview || profile?.avatar || '/assets/default_user.jpg';

  return (
    <>
      <title>Настройки | Beauty Slot</title>
      <meta name="description" content="Настройки профиля администратора" />

      <Container fluid>
        <Stack gap="md">
          <PageHeader title="Настройки профиля" breadcrumbItems={breadcrumbItems} />

          {/* Profile Section */}
          <Surface p="sm">
            <Text size="sm" fw={600} mb="sm">
              <IconUser size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Основная информация
            </Text>

            <form onSubmit={form.onSubmit(handleSaveProfile)}>
              <Group align="flex-start" gap="md" wrap="nowrap">
                {/* Avatar */}
                <Stack align="center" gap="xs">
                  <Avatar
                    src={avatarSrc}
                    size={80}
                    radius="xl"
                  />
                  <FileButton onChange={setAvatarFile} accept="image/png,image/jpeg">
                    {(props) => (
                      <Button
                        {...props}
                        variant="subtle"
                        size="xs"
                        leftSection={<IconCamera size={12} />}
                      >
                        Изменить
                      </Button>
                    )}
                  </FileButton>
                </Stack>

                {/* Form Fields */}
                <Stack style={{ flex: 1 }} gap="xs">
                  <Group grow gap="xs">
                    <TextInput
                      label="Имя"
                      placeholder="Ваше имя"
                      size="sm"
                      leftSection={<IconUser size={14} />}
                      {...form.getInputProps('name')}
                    />
                    <Select
                      label="Должность"
                      size="sm"
                      data={[
                        { value: 'owner', label: 'Владелец' },
                        { value: 'admin', label: 'Администратор' },
                        { value: 'manager', label: 'Менеджер' },
                      ]}
                      {...form.getInputProps('position')}
                    />
                  </Group>
                  <Group grow gap="xs">
                    <TextInput
                      label="Email"
                      placeholder="email@example.com"
                      size="sm"
                      leftSection={<IconMail size={14} />}
                      {...form.getInputProps('email')}
                    />
                    <TextInput
                      label="Телефон"
                      placeholder="+7 (999) 123-45-67"
                      size="sm"
                      leftSection={<IconPhone size={14} />}
                      {...form.getInputProps('phone')}
                    />
                  </Group>
                </Stack>
              </Group>

              <Group justify="flex-end" mt="sm">
                <Button
                  type="submit"
                  size="xs"
                  leftSection={<IconDeviceFloppy size={14} />}
                  loading={saving || profileLoading}
                >
                  Сохранить
                </Button>
              </Group>
            </form>
          </Surface>

          {/* Security Section */}
          <Surface p="sm">
            <Text size="sm" fw={600} mb="sm">
              <IconShieldCheck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Безопасность
            </Text>

            <Stack gap="xs">
              <Group justify="space-between">
                <div>
                  <Text size="sm">Пароль</Text>
                  <Text size="xs" c="dimmed">Последнее изменение: неизвестно</Text>
                </div>
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconKey size={14} />}
                  onClick={openPasswordModal}
                >
                  Изменить
                </Button>
              </Group>

              <Divider />

              <Group justify="space-between">
                <div>
                  <Text size="sm">Двухфакторная аутентификация</Text>
                  <Text size="xs" c="dimmed">Дополнительная защита аккаунта</Text>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.currentTarget.checked)}
                  size="sm"
                />
              </Group>

              <Divider />

              <Group justify="space-between">
                <div>
                  <Text size="sm">Последний вход</Text>
                  <Text size="xs" c="dimmed">
                    {new Date().toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </div>
                <Button
                  variant="subtle"
                  size="xs"
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogoutAll}
                >
                  Выйти везде
                </Button>
              </Group>
            </Stack>
          </Surface>

          {/* Notifications Section */}
          <Surface p="sm">
            <Text size="sm" fw={600} mb="sm">
              <IconMail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Уведомления
            </Text>

            <Stack gap="xs">
              <Group justify="space-between">
                <div>
                  <Text size="sm">Email-уведомления</Text>
                  <Text size="xs" c="dimmed">Получать уведомления на почту</Text>
                </div>
                <Switch
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.currentTarget.checked)}
                  size="sm"
                />
              </Group>

              <Divider />

              <Group justify="space-between">
                <div>
                  <Text size="sm">Push-уведомления</Text>
                  <Text size="xs" c="dimmed">Уведомления в браузере</Text>
                </div>
                <Switch
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.currentTarget.checked)}
                  size="sm"
                />
              </Group>

              <Divider />

              <Group justify="space-between">
                <div>
                  <Text size="sm">Telegram-уведомления</Text>
                  <Text size="xs" c="dimmed">Уведомления через Telegram-бот</Text>
                </div>
                <Switch
                  checked={telegramNotifications}
                  onChange={(e) => setTelegramNotifications(e.currentTarget.checked)}
                  size="sm"
                />
              </Group>
            </Stack>
          </Surface>
        </Stack>
      </Container>

      <ChangePasswordModal opened={passwordModalOpened} onClose={closePasswordModal} />
    </>
  );
}

export default Settings;
