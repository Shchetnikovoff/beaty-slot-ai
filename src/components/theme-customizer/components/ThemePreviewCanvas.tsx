import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  ColorSwatch,
  Group,
  Image,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { IconComponents } from '@tabler/icons-react';

import { COLOR_SCHEMES, ThemeConfig } from '@/contexts/theme-customizer';

interface ThemePreviewCanvasProps {
  config: ThemeConfig;
}

export const ThemePreviewCanvas: React.FC<ThemePreviewCanvasProps> = ({
  config,
}) => {
  return (
    <Box p="lg" style={{ flex: 1 }}>
      <Group mb="md">
        <IconComponents size={20} />
        <Text fw={600}>Предпросмотр</Text>
      </Group>
      <ScrollArea h="calc(100vh - 180px)" offsetScrollbars>
        <Paper p="md" withBorder>
          <Stack>
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Текущий основной цвет:{' '}
                <ColorSwatch
                  color={COLOR_SCHEMES[config.appearance.primaryColor].color}
                  size={16}
                  style={{ display: 'inline-block' }}
                />{' '}
                {COLOR_SCHEMES[config.appearance.primaryColor].name}
              </Text>

              <Group>
                <Button
                  variant="filled"
                  size={config.appearance.compact ? 'xs' : 'sm'}
                  radius={config.appearance.borderRadius}
                >
                  Основная кнопка
                </Button>
                <Button
                  variant="outline"
                  size={config.appearance.compact ? 'xs' : 'sm'}
                  radius={config.appearance.borderRadius}
                >
                  Контурная кнопка
                </Button>
              </Group>

              <Paper
                p={config.appearance.compact ? 'xs' : 'sm'}
                withBorder
                radius={config.appearance.borderRadius}
              >
                <Text size="sm">Пример карточки с текущими настройками</Text>
              </Paper>
            </Stack>

            <Tabs defaultValue="preview">
              <Tabs.List>
                <Tabs.Tab value="preview">Вкладка 1</Tabs.Tab>
                <Tabs.Tab value="preview2">Вкладка 2</Tabs.Tab>
                <Tabs.Tab value="disabled" disabled>
                  Отключена
                </Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="preview" pt="xs">
                <Text>Это предпросмотр вкладки.</Text>
              </Tabs.Panel>
              <Tabs.Panel value="preview2" pt="xs">
                <Text>Это предпросмотр вкладки 2.</Text>
              </Tabs.Panel>
            </Tabs>

            <Stack>
              <Text size="lg" fw={600}>
                Бейджи
              </Text>
              <Group>
                <Badge>По умолчанию</Badge>
                <Badge color="primary">Основной</Badge>
                <Badge variant="outline">Контурный</Badge>
              </Group>
            </Stack>

            <Group>
              <TextInput
                label="Текстовое поле"
                placeholder="Ваше имя"
                radius={config.appearance.borderRadius}
                size={config.appearance.compact ? 'xs' : 'sm'}
              />
              <Select
                label="Выпадающий список"
                data={['Вариант 1', 'Вариант 2']}
                placeholder="Выберите"
                radius={config.appearance.borderRadius}
                size={config.appearance.compact ? 'xs' : 'sm'}
              />
              <NumberInput
                label="Числовое поле"
                placeholder="Введите число"
              />
            </Group>

            <Alert title="Уведомление" radius={config.appearance.borderRadius}>
              Это пример уведомления для предпросмотра.
            </Alert>

            <Accordion
              defaultValue="item-1"
              variant="contained"
              radius={config.appearance.borderRadius}
            >
              <Accordion.Item value="item-1">
                <Accordion.Control>Аккордеон 1</Accordion.Control>
                <Accordion.Panel>Содержимое панели 1</Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="item-2">
                <Accordion.Control>Аккордеон 2</Accordion.Control>
                <Accordion.Panel>Содержимое панели 2</Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="item-3">
                <Accordion.Control>Аккордеон 3</Accordion.Control>
                <Accordion.Panel>Содержимое панели 3</Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            <Card
              shadow="sm"
              radius={config.appearance.borderRadius}
              withBorder
            >
              <Card.Section>
                <Image
                  src="https://placehold.co/600x200"
                  height={140}
                  alt="Превью"
                />
              </Card.Section>
              <Text fw={500} mt="md">
                Пример карточки
              </Text>
              <Text size="sm" c="dimmed" mt={4}>
                Это пример карточки с изображением и текущим стилем темы.
              </Text>
              <Button
                variant="light"
                fullWidth
                mt="md"
                radius={config.appearance.borderRadius}
              >
                Нажми меня
              </Button>
            </Card>
          </Stack>
        </Paper>
      </ScrollArea>
    </Box>
  );
};
