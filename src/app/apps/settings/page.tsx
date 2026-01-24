'use client';

import { useEffect, useState } from 'react';

import {
  Anchor,
  Box,
  Button,
  Container,
  FileButton,
  Grid,
  Group,
  Image,
  PaperProps,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCloudUpload, IconDeviceFloppy } from '@tabler/icons-react';

import { PageHeader, Surface, TextEditor } from '@/components';
import { useProfile } from '@/lib/hooks/useApi';
import { PATH_DASHBOARD } from '@/routes';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Настройки', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const ICON_SIZE = 16;

const PAPER_PROPS: PaperProps = {
  p: 'md',
  style: { minHeight: '100%' },
};

const BIO =
  'Администратор салона красоты с опытом работы в сфере управления и обслуживания клиентов. Отвечает за координацию работы персонала, ведение клиентской базы и контроль качества услуг.\n' +
  '\n' +
  'Стремится к постоянному улучшению сервиса и повышению удовлетворённости клиентов.';

function Settings() {
  const [file, setFile] = useState<File | null>(null);

  const {
    data: profileData,
    loading: profileLoading,
  } = useProfile();

  const profile = profileData?.data;

  const accountForm = useForm({
    initialValues: {
      username: profile?.name || '',
      biograghy: BIO,
    },
  });

  const accountInfoForm = useForm({
    initialValues: {
      email: profile?.email || '',
      phoneNumber: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email обязателен';
        return /^\S+@\S+$/.test(value) ? null : 'Некорректный email';
      },
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      accountForm.setValues({
        username: profile.name || '',
        biograghy: BIO,
      });
      accountInfoForm.setValues({
        email: profile.email || '',
        phoneNumber: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleSaveAccountInfo = async () => {
    try {
      // Note: In this mock template, profile data is read-only from JSON files
      // For a real implementation, you would send a PUT request here
      notifications.show({
        title: 'Успешно',
        message: 'Профиль успешно обновлён',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось обновить профиль',
        color: 'red',
      });
    }
  };

  return (
    <>
      <>
        <title>Настройки | Beauty Slot</title>
        <meta
          name="description"
          content="Настройки профиля администратора салона красоты Beauty Slot"
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Настройки" breadcrumbItems={items} />
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Surface {...PAPER_PROPS}>
                <Text size="lg" fw={600} mb="md">
                  Информация о пользователе
                </Text>
                <Grid gutter={{ base: 5, xs: 'md', md: 'md', lg: 'lg' }}>
                  <Grid.Col span={{ base: 12, md: 6, lg: 9, xl: 9 }}>
                    <Stack>
                      <TextInput
                        label="Имя пользователя"
                        placeholder="имя пользователя"
                        {...accountForm.getInputProps('username')}
                      />
                      <TextEditor content={BIO} label="Биография" />
                      <Button
                        style={{ width: 'fit-content' }}
                        leftSection={<IconDeviceFloppy size={ICON_SIZE} />}
                      >
                        Сохранить изменения
                      </Button>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6, lg: 3, xl: 3 }}>
                    <Stack align="center">
                      <Image
                        src={
                          profile?.avatar ||
                          'https://res.cloudinary.com/ddh7hfzso/image/upload/v1700303804/me/ovqjhhs79u3g2fwbl2dd.jpg'
                        }
                        h={128}
                        w={128}
                        radius="50%"
                        alt=""
                      />
                      <FileButton
                        onChange={setFile}
                        accept="image/png,image/jpeg"
                      >
                        {(props) => (
                          <Button
                            {...props}
                            variant="subtle"
                            leftSection={<IconCloudUpload size={ICON_SIZE} />}
                          >
                            Загрузить изображение
                          </Button>
                        )}
                      </FileButton>
                      <Text ta="center" size="xs" c="dimmed">
                        Для лучшего результата используйте изображение не менее
                        128x128 пикселей в формате .jpg
                      </Text>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Surface>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Surface {...PAPER_PROPS}>
                <Stack>
                  <Text size="lg" fw={600}>
                    Данные аккаунта
                  </Text>
                  <Group grow>
                    <TextInput
                      label="Имя"
                      placeholder="имя"
                      {...accountInfoForm.getInputProps('firstname')}
                    />
                    <TextInput
                      label="Фамилия"
                      placeholder="фамилия"
                      {...accountInfoForm.getInputProps('lastname')}
                    />
                  </Group>
                  <TextInput
                    label="Email"
                    placeholder="email"
                    {...accountInfoForm.getInputProps('email')}
                  />
                  <TextInput
                    label="Адрес"
                    placeholder="адрес"
                    {...accountInfoForm.getInputProps('address')}
                  />
                  <TextInput
                    label="Квартира/Офис/Этаж"
                    placeholder="квартира, офис или этаж"
                    {...accountInfoForm.getInputProps('apartment')}
                  />
                  <Group grow>
                    <TextInput
                      label="Город"
                      placeholder="город"
                      {...accountInfoForm.getInputProps('city')}
                    />
                    <TextInput
                      label="Регион"
                      placeholder="регион"
                      {...accountInfoForm.getInputProps('state')}
                    />
                    <TextInput
                      label="Индекс"
                      placeholder="индекс"
                      {...accountInfoForm.getInputProps('zip')}
                    />
                  </Group>
                  <Box style={{ width: 'auto' }}>
                    <Button
                      leftSection={<IconDeviceFloppy size={16} />}
                      onClick={handleSaveAccountInfo}
                      loading={profileLoading}
                    >
                      Сохранить изменения
                    </Button>
                  </Box>
                </Stack>
              </Surface>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}

export default Settings;
