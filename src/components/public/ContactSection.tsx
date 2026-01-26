'use client';

import {
  Box,
  Container,
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Paper,
  ThemeIcon,
  Table,
} from '@mantine/core';
import {
  IconPhone,
  IconMail,
  IconMapPin,
  IconClock,
} from '@tabler/icons-react';
import type { SalonSettings } from '@/types/salon-settings';

interface ContactSectionProps {
  settings: SalonSettings;
}

export function ContactSection({ settings }: ContactSectionProps) {
  const contacts = [
    {
      icon: IconPhone,
      label: 'Телефон',
      value: settings.phone,
      href: `tel:${settings.phone.replace(/\D/g, '')}`,
    },
    {
      icon: IconMail,
      label: 'Email',
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    {
      icon: IconMapPin,
      label: 'Адрес',
      value: settings.address,
      href: settings.map_coordinates
        ? `https://yandex.ru/maps/?pt=${settings.map_coordinates.lng},${settings.map_coordinates.lat}&z=17`
        : undefined,
    },
  ];

  return (
    <Box py="xl" id="contacts" style={{ backgroundColor: 'white' }}>
      <Container size="xl">
        <Stack gap="xl">
          <div>
            <Title order={2} mb="xs">
              Контакты
            </Title>
            <Text c="dimmed">
              Свяжитесь с нами или приходите в салон
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            {/* Contact Info */}
            <Stack gap="md">
              {contacts.map((contact) => (
                <Paper key={contact.label} withBorder p="md" radius="md">
                  <Group>
                    <ThemeIcon
                      size="lg"
                      variant="light"
                      color={settings.primary_color}
                    >
                      <contact.icon size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">
                        {contact.label}
                      </Text>
                      {contact.href ? (
                        <Text
                          component="a"
                          href={contact.href}
                          target={contact.label === 'Адрес' ? '_blank' : undefined}
                          fw={500}
                          style={{
                            color: 'inherit',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {contact.value}
                        </Text>
                      ) : (
                        <Text fw={500}>{contact.value}</Text>
                      )}
                    </div>
                  </Group>
                </Paper>
              ))}
            </Stack>

            {/* Working Hours */}
            <Paper withBorder p="md" radius="md">
              <Group mb="md">
                <ThemeIcon
                  size="lg"
                  variant="light"
                  color={settings.primary_color}
                >
                  <IconClock size={20} />
                </ThemeIcon>
                <Text fw={600}>Время работы</Text>
              </Group>

              <Table
                horizontalSpacing="sm"
                verticalSpacing="xs"
                striped
                highlightOnHover
              >
                <Table.Tbody>
                  {settings.working_hours.map((day) => (
                    <Table.Tr key={day.day}>
                      <Table.Td>
                        <Text size="sm">{day.day_name}</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        {day.is_open ? (
                          <Text size="sm" fw={500}>
                            {day.open_time} — {day.close_time}
                          </Text>
                        ) : (
                          <Text size="sm" c="dimmed">
                            Выходной
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
