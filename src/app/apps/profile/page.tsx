'use client';

import {
  ActionIcon,
  Anchor,
  Badge,
  Container,
  Flex,
  Grid,
  Group,
  Paper,
  PaperProps,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBusinessplan,
  IconCoins,
  IconDotsVertical,
  IconHome,
  IconListCheck,
  IconMapPinFilled,
} from '@tabler/icons-react';

import {
  PageHeader,
  ProfileStatsCard,
  ProjectsTable,
  RevenueChart,
  Surface,
  UserProfileCard,
} from '@/components';
import { useFetchData } from '@/hooks';
import UserData from '@public/mocks/UserProfile.json';
import { PATH_DASHBOARD } from '@/routes';

import classes from './page.module.css';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Профиль', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const ICON_SIZE = 16;

const skills = [
  'React',
  'Mantine',
  'Figma',
  'Bootstrap',
  'Typescript',
  'Sass/SCSS',
];

const PAPER_PROPS: PaperProps = {
  p: 'md',
  style: { minHeight: '100%' },
};

function Profile() {
  const {
    data: projectsData,
    loading: projectsLoading,
    error: projectsError,
  } = useFetchData('/mocks/Projects.json');
  const linkProps = {
    target: '_blank',
    className: classes.socialLink,
  };

  return (
    <>
      <>
        <title>Профиль | Beauty Slot</title>
        <meta
          name="description"
          content="Профиль администратора салона красоты Beauty Slot"
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Профиль" breadcrumbItems={items} />
          <Grid>
            <Grid.Col span={{ base: 12, md: 5, lg: 4 }}>
              <Stack>
                <UserProfileCard data={UserData} {...PAPER_PROPS} />
                <Surface {...PAPER_PROPS}>
                  <Text size="lg" fw={600} mb="md">
                    Навыки
                  </Text>
                  <Group gap="xs">
                    {skills.map((s) => (
                      <Badge key={s} variant="filled" c="primary.8">
                        {s}
                      </Badge>
                    ))}
                  </Group>
                </Surface>
                <Surface {...PAPER_PROPS}>
                  <Stack>
                    <Text size="lg" fw={600}>
                      О себе
                    </Text>
                    <Group>
                      <IconHome size={ICON_SIZE} />
                      <Text>Москва, Россия</Text>
                    </Group>
                    <Group>
                      <IconMapPinFilled size={ICON_SIZE} />
                      <Text>Работает в Beauty Slot</Text>
                    </Group>
                  </Stack>
                </Surface>
                <Surface {...PAPER_PROPS}>
                  <Flex
                    direction={{ base: 'row', md: 'column' }}
                    gap={{ base: 'sm', md: 'xs' }}
                    align={{ base: 'center', md: 'stretch' }}
                  >
                    <Text size="lg" fw={600}>
                      Соц. сети
                    </Text>
                    <UnstyledButton
                      component="a"
                      href="https://www.facebook.com/kelvinkk96"
                      {...linkProps}
                    >
                      <Group>
                        <IconBrandFacebook size={ICON_SIZE} />
                        <Text>Facebook</Text>
                      </Group>
                    </UnstyledButton>
                    <UnstyledButton
                      component="a"
                      href="https://twitter.com/kelvink_96"
                      {...linkProps}
                    >
                      <Group>
                        <IconBrandTwitter size={ICON_SIZE} />
                        <Text>Twitter</Text>
                      </Group>
                    </UnstyledButton>
                    <UnstyledButton
                      component="a"
                      href="https://www.linkedin.com/in/kelvink96/"
                      {...linkProps}
                    >
                      <Group>
                        <IconBrandLinkedin size={ICON_SIZE} />
                        <Text>LinkedIn</Text>
                      </Group>
                    </UnstyledButton>
                    <UnstyledButton
                      component="a"
                      href="https://github.com/kelvink96"
                      {...linkProps}
                    >
                      <Group>
                        <IconBrandGithub size={ICON_SIZE} />
                        <Text>Github</Text>
                      </Group>
                    </UnstyledButton>
                  </Flex>
                </Surface>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 7, lg: 8 }}>
              <Stack>
                <RevenueChart {...PAPER_PROPS} />
                <SimpleGrid
                  cols={{ base: 1, md: 1, lg: 3 }}
                  spacing={{ base: 10, sm: 'xl' }}
                  verticalSpacing={{ base: 'md', sm: 'xl' }}
                >
                  <ProfileStatsCard
                    amount={81314}
                    title="общий доход"
                    icon={IconCoins}
                    progressValue={45}
                    color="indigo.7"
                    asCurrency
                    {...PAPER_PROPS}
                  />
                  <ProfileStatsCard
                    amount={2532}
                    title="заказов сегодня"
                    icon={IconListCheck}
                    progressValue={72}
                    color="teal.7"
                    {...PAPER_PROPS}
                  />
                  <ProfileStatsCard
                    amount={97219}
                    title="общая выручка"
                    icon={IconBusinessplan}
                    progressValue={12}
                    color="lime.7"
                    asCurrency
                    {...PAPER_PROPS}
                  />
                </SimpleGrid>
                <Surface {...PAPER_PROPS}>
                  <Group justify="space-between" mb="md">
                    <Text size="lg" fw={600}>
                      Проекты
                    </Text>
                    <ActionIcon>
                      <IconDotsVertical size={ICON_SIZE} />
                    </ActionIcon>
                  </Group>
                  <ProjectsTable
                    data={projectsData.slice(0, 10)}
                    loading={projectsLoading}
                    error={projectsError}
                  />
                </Surface>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}

export default Profile;
