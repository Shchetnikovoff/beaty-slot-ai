'use client';

import {
  Box,
  Container,
  Title,
  Text,
  Group,
  Badge,
  SimpleGrid,
  Paper,
  ThemeIcon,
  Stack,
} from '@mantine/core';
import {
  IconWifi,
  IconParking,
  IconAirConditioning,
  IconFlame,
  IconCoffee,
  IconCookie,
  IconBook,
  IconDeviceTv,
  IconWheelchair,
  IconElevator,
  IconBuildingCommunity,
  IconMoodKid,
  IconPaw,
  IconCreditCard,
  IconCash,
  IconDeviceMobile,
  IconReceipt,
  IconCalendarEvent,
  IconWalk,
  IconVideo,
  IconHome,
  IconGift,
  IconTrophy,
  IconRepeat,
  IconMoon,
  IconSun,
  IconCalendar,
  IconClock24,
  IconDoor,
  IconCrown,
  IconShieldCheck,
  IconTrash,
  IconLeaf,
  IconHeartbeat,
} from '@tabler/icons-react';
import type { SalonAmenities } from '@/types/salon-settings';

interface AmenitiesSectionProps {
  amenities: SalonAmenities;
  primaryColor: string;
}

interface AmenityConfig {
  key: keyof SalonAmenities;
  label: string;
  icon: React.ElementType;
  color: string;
}

const amenitiesConfig: AmenityConfig[] = [
  // Базовые удобства
  { key: 'wifi', label: 'Бесплатный WiFi', icon: IconWifi, color: 'blue' },
  { key: 'parking', label: 'Парковка', icon: IconParking, color: 'blue' },
  { key: 'parking_free', label: 'Бесплатная парковка', icon: IconParking, color: 'green' },
  { key: 'air_conditioning', label: 'Кондиционер', icon: IconAirConditioning, color: 'blue' },
  { key: 'heating', label: 'Отопление', icon: IconFlame, color: 'orange' },

  // Гостеприимство
  { key: 'drinks', label: 'Чай/Кофе', icon: IconCoffee, color: 'orange' },
  { key: 'snacks', label: 'Закуски', icon: IconCookie, color: 'yellow' },
  { key: 'magazines', label: 'Журналы', icon: IconBook, color: 'blue' },
  { key: 'tv', label: 'ТВ в зале ожидания', icon: IconDeviceTv, color: 'blue' },

  // Доступность
  { key: 'wheelchair_access', label: 'Доступно для колясок', icon: IconWheelchair, color: 'teal' },
  { key: 'elevator', label: 'Лифт', icon: IconElevator, color: 'teal' },
  { key: 'ground_floor', label: '1-й этаж', icon: IconBuildingCommunity, color: 'teal' },

  // Для семей
  { key: 'kids_room', label: 'Детская комната', icon: IconMoodKid, color: 'pink' },
  { key: 'kids_friendly', label: 'Можно с детьми', icon: IconMoodKid, color: 'pink' },
  { key: 'pet_friendly', label: 'Можно с питомцами', icon: IconPaw, color: 'orange' },

  // Способы оплаты
  { key: 'card_payment', label: 'Оплата картой', icon: IconCreditCard, color: 'green' },
  { key: 'cash_payment', label: 'Оплата наличными', icon: IconCash, color: 'green' },
  { key: 'online_payment', label: 'Онлайн-оплата', icon: IconDeviceMobile, color: 'green' },
  { key: 'installments', label: 'Рассрочка', icon: IconReceipt, color: 'green' },

  // Запись и сервис
  { key: 'appointment_only', label: 'Только по записи', icon: IconCalendarEvent, color: 'blue' },
  { key: 'walk_ins_welcome', label: 'Без записи', icon: IconWalk, color: 'blue' },
  { key: 'online_consultation', label: 'Онлайн-консультации', icon: IconVideo, color: 'violet' },
  { key: 'home_service', label: 'Выезд на дом', icon: IconHome, color: 'violet' },

  // Программы лояльности
  { key: 'loyalty_program', label: 'Программа лояльности', icon: IconTrophy, color: 'yellow' },
  { key: 'gift_cards', label: 'Подарочные сертификаты', icon: IconGift, color: 'pink' },
  { key: 'subscription_plans', label: 'Абонементы', icon: IconRepeat, color: 'cyan' },

  // Время работы
  { key: 'evening_hours', label: 'Вечерние часы', icon: IconMoon, color: 'indigo' },
  { key: 'weekend_open', label: 'Работаем в выходные', icon: IconCalendar, color: 'blue' },
  { key: 'early_morning', label: 'Раннее утро', icon: IconSun, color: 'yellow' },
  { key: 'open_24h', label: 'Круглосуточно', icon: IconClock24, color: 'red' },

  // Помещение
  { key: 'private_rooms', label: 'Отдельные кабинеты', icon: IconDoor, color: 'blue' },
  { key: 'vip_room', label: 'VIP-комната', icon: IconCrown, color: 'yellow' },

  // Гигиена и качество
  { key: 'sterile_instruments', label: 'Стерилизация инструментов', icon: IconShieldCheck, color: 'teal' },
  { key: 'disposable_tools', label: 'Одноразовые инструменты', icon: IconTrash, color: 'teal' },
  { key: 'organic_products', label: 'Органическая косметика', icon: IconLeaf, color: 'green' },
  { key: 'hypoallergenic_products', label: 'Гипоаллергенная косметика', icon: IconHeartbeat, color: 'cyan' },
];

export function AmenitiesSection({ amenities, primaryColor }: AmenitiesSectionProps) {
  // Фильтруем только включённые удобства
  const activeAmenities = amenitiesConfig.filter(
    (amenity) => amenities[amenity.key]
  );

  // Если нет активных удобств, не показываем секцию
  if (activeAmenities.length === 0) {
    return null;
  }

  return (
    <Box py="xl" id="amenities" style={{ backgroundColor: '#f8f9fa' }}>
      <Container size="xl">
        <Stack gap="lg">
          <div>
            <Title order={2} mb="xs">
              Удобства
            </Title>
            <Text c="dimmed">
              Всё для вашего комфорта в нашем салоне
            </Text>
          </div>

          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {activeAmenities.map((amenity) => {
              const IconComponent = amenity.icon;
              return (
                <Paper
                  key={amenity.key}
                  withBorder
                  p="sm"
                  radius="md"
                  style={{
                    backgroundColor: 'white',
                  }}
                >
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon
                      size="md"
                      variant="light"
                      color={amenity.color}
                      radius="md"
                    >
                      <IconComponent size={16} />
                    </ThemeIcon>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {amenity.label}
                    </Text>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
