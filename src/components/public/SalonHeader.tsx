'use client';

import {
  Box,
  Container,
  Group,
  Text,
  Button,
  Image,
  Burger,
  Drawer,
  Stack,
  Anchor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCalendar, IconPhone } from '@tabler/icons-react';
import type { SalonSettings } from '@/types/salon-settings';

interface SalonHeaderProps {
  settings: SalonSettings;
}

export function SalonHeader({ settings }: SalonHeaderProps) {
  const [opened, { toggle, close }] = useDisclosure(false);

  const navLinks = [
    { label: 'Услуги', href: '#services' },
    { label: 'Мастера', href: '#staff' },
    { label: 'Контакты', href: '#contacts' },
  ];

  return (
    <Box
      component="header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'white',
        borderBottom: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Container size="xl" py="md">
        <Group justify="space-between">
          {/* Logo & Name */}
          <Group gap="sm">
            {settings.logo_url ? (
              <Image
                src={settings.logo_url}
                alt={settings.name}
                h={40}
                w="auto"
                fit="contain"
              />
            ) : (
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text c="white" fw={700} size="lg">
                  {settings.name.charAt(0)}
                </Text>
              </Box>
            )}
            <Text fw={600} size="lg" visibleFrom="sm">
              {settings.name}
            </Text>
          </Group>

          {/* Desktop Navigation */}
          <Group gap="xl" visibleFrom="md">
            {navLinks.map((link) => (
              <Anchor
                key={link.href}
                href={link.href}
                c="dark"
                underline="never"
                fw={500}
                style={{ '&:hover': { color: settings.primary_color } }}
              >
                {link.label}
              </Anchor>
            ))}
          </Group>

          {/* Actions */}
          <Group gap="sm">
            <Button
              variant="subtle"
              leftSection={<IconPhone size={16} />}
              component="a"
              href={`tel:${settings.phone.replace(/\D/g, '')}`}
              visibleFrom="sm"
            >
              {settings.phone}
            </Button>

            {settings.booking_enabled && (
              <Button
                style={{
                  backgroundColor: settings.primary_color,
                }}
                leftSection={<IconCalendar size={16} />}
              >
                Записаться
              </Button>
            )}

            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="md"
              size="sm"
            />
          </Group>
        </Group>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title={settings.name}
        padding="md"
        size="xs"
        position="right"
      >
        <Stack gap="lg">
          {navLinks.map((link) => (
            <Anchor
              key={link.href}
              href={link.href}
              c="dark"
              underline="never"
              fw={500}
              size="lg"
              onClick={close}
            >
              {link.label}
            </Anchor>
          ))}

          <Button
            variant="subtle"
            leftSection={<IconPhone size={16} />}
            component="a"
            href={`tel:${settings.phone.replace(/\D/g, '')}`}
            fullWidth
          >
            {settings.phone}
          </Button>

          {settings.booking_enabled && (
            <Button
              style={{
                backgroundColor: settings.primary_color,
              }}
              leftSection={<IconCalendar size={16} />}
              fullWidth
            >
              Записаться
            </Button>
          )}
        </Stack>
      </Drawer>
    </Box>
  );
}
