'use client';

import {
  Box,
  Container,
  Title,
  Text,
  Card,
  Group,
  Badge,
  SimpleGrid,
  Stack,
} from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import type { SalonService } from '@/types/salon-settings';

interface ServicesListProps {
  services: SalonService[];
  primaryColor: string;
}

export function ServicesList({ services, primaryColor }: ServicesListProps) {
  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, SalonService[]>);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} мин`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  };

  return (
    <Box py="xl" id="services" style={{ backgroundColor: 'white' }}>
      <Container size="xl">
        <Stack gap="xl">
          <div>
            <Title order={2} mb="xs">
              Наши услуги
            </Title>
            <Text c="dimmed">
              Выберите услугу для записи онлайн
            </Text>
          </div>

          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category}>
              <Text fw={600} size="lg" mb="md" c={primaryColor}>
                {category}
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {categoryServices.map((service) => (
                  <Card key={service.id} shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                      <Text fw={600} size="md">
                        {service.name}
                      </Text>

                      {service.description && (
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {service.description}
                        </Text>
                      )}

                      <Group justify="space-between" align="center">
                        <Badge
                          size="lg"
                          variant="light"
                          color="gray"
                          leftSection={<IconClock size={14} />}
                        >
                          {formatDuration(service.duration_minutes)}
                        </Badge>
                        <Text fw={700} size="lg" style={{ color: primaryColor }}>
                          {formatPrice(service.price)}
                        </Text>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </div>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
