'use client';

import {
  Box,
  Container,
  Group,
  Text,
  ActionIcon,
  Stack,
  Divider,
} from '@mantine/core';
import {
  IconBrandInstagram,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconBrandVk,
} from '@tabler/icons-react';
import type { SalonSettings } from '@/types/salon-settings';

interface SalonFooterProps {
  settings: SalonSettings;
}

export function SalonFooter({ settings }: SalonFooterProps) {
  const socialLinks = [
    {
      icon: IconBrandInstagram,
      href: settings.instagram ? `https://instagram.com/${settings.instagram}` : null,
      label: 'Instagram',
    },
    {
      icon: IconBrandTelegram,
      href: settings.telegram ? `https://t.me/${settings.telegram}` : null,
      label: 'Telegram',
    },
    {
      icon: IconBrandWhatsapp,
      href: settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : null,
      label: 'WhatsApp',
    },
    {
      icon: IconBrandVk,
      href: settings.vk ? `https://vk.com/${settings.vk}` : null,
      label: 'ВКонтакте',
    },
  ].filter((link) => link.href);

  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      py="xl"
      style={{
        background: `linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color} 100%)`,
        color: 'white',
      }}
    >
      <Container size="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            {/* Logo & Description */}
            <Stack gap="xs" maw={400}>
              <Text fw={700} size="xl">
                {settings.name}
              </Text>
              <Text size="sm" opacity={0.9}>
                {settings.description}
              </Text>
            </Stack>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <Stack gap="xs" align="flex-end">
                <Text size="sm" fw={500}>
                  Мы в социальных сетях
                </Text>
                <Group gap="sm">
                  {socialLinks.map((link) => (
                    <ActionIcon
                      key={link.label}
                      component="a"
                      href={link.href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="lg"
                      variant="subtle"
                      color="white"
                      aria-label={link.label}
                    >
                      <link.icon size={24} />
                    </ActionIcon>
                  ))}
                </Group>
              </Stack>
            )}
          </Group>

          <Divider color="rgba(255, 255, 255, 0.2)" />

          <Group justify="space-between" wrap="wrap">
            <Text size="sm" opacity={0.8}>
              {currentYear} {settings.name}. Все права защищены.
            </Text>
            <Text size="sm" opacity={0.6}>
              Работает на Beauty Slot
            </Text>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
