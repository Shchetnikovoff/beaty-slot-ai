'use client';

import {
  Box,
  Container,
  Title,
  Text,
  Card,
  Group,
  Avatar,
  SimpleGrid,
  Stack,
  Badge,
} from '@mantine/core';
import type { SalonStaff } from '@/types/salon-settings';

interface StaffListProps {
  staff: SalonStaff[];
  primaryColor: string;
}

export function StaffList({ staff, primaryColor }: StaffListProps) {
  return (
    <Box py="xl" id="staff" style={{ backgroundColor: '#f8f9fa' }}>
      <Container size="xl">
        <Stack gap="xl">
          <div>
            <Title order={2} mb="xs">
              Наши мастера
            </Title>
            <Text c="dimmed">
              Профессионалы своего дела
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {staff.map((person) => (
              <Card key={person.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="md">
                  <Avatar
                    src={person.photo_url}
                    alt={person.name}
                    size={120}
                    radius={60}
                    style={{
                      border: `3px solid ${primaryColor}`,
                    }}
                  >
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>

                  <Stack align="center" gap="xs">
                    <Text fw={600} size="lg" ta="center">
                      {person.name}
                    </Text>
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor,
                      }}
                    >
                      {person.position}
                    </Badge>
                  </Stack>

                  {person.bio && (
                    <Text size="sm" c="dimmed" ta="center" lineClamp={3}>
                      {person.bio}
                    </Text>
                  )}
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
