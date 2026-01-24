import {
  Badge,
  Group,
  Skeleton,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { ErrorAlert } from '@/components';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  status: string;
  type: string;
  daysOnMarket: number;
}

interface PropertyListingsTableProps {
  data?: Property[];
  loading?: boolean;
  error?: Error | null;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'for sale':
      return 'blue';
    case 'sold':
      return 'green';
    case 'pending':
      return 'yellow';
    case 'for rent':
      return 'violet';
    default:
      return 'gray';
  }
};

export const PropertyListingsTable: React.FC<PropertyListingsTableProps> = ({
  data = [],
  loading = false,
  error = null,
}) => {
  if (error) {
    return (
      <ErrorAlert
        title="Ошибка загрузки объектов"
        message={error.message || 'Не удалось загрузить список объектов недвижимости'}
      />
    );
  }

  if (loading) {
    return (
      <Stack gap="sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`property-loading-${i}`} height={60} radius="sm" />
        ))}
      </Stack>
    );
  }

  const rows = data.map((property) => (
    <Table.Tr key={property.id}>
      <Table.Td>
        <div>
          <Text size="sm" fw={500}>
            {property.address}
          </Text>
          <Text size="xs" c="dimmed">
            {property.city}, {property.state}
          </Text>
        </div>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={600}>
          ${(property.price / 1000).toFixed(0)}K
        </Text>
        <Text size="xs" c="dimmed">
          ${Math.round(property.price / property.sqft)}/sqft
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color="blue">
          {property.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">
          {property.bedrooms} bed • {property.bathrooms} bath
        </Text>
        <Text size="xs" c="dimmed">
          {property.sqft.toLocaleString()} sqft
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color={getStatusColor(property.status)}>
          {property.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{property.daysOnMarket} дней</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={1000}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Адрес</Table.Th>
            <Table.Th>Цена</Table.Th>
            <Table.Th>Тип</Table.Th>
            <Table.Th>Детали</Table.Th>
            <Table.Th>Статус</Table.Th>
            <Table.Th>Дней на рынке</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};
