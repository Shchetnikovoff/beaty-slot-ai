'use client';

import { useState } from 'react';
import {
  Stack,
  Switch,
  Group,
  Button,
  Paper,
  Text,
  SimpleGrid,
  Divider,
  Title,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconCalendar,
  IconCreditCard,
  IconCurrencyRubel,
  IconUsers,
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
  IconClock24,
  IconDoor,
  IconCrown,
  IconShieldCheck,
  IconTrash,
  IconLeaf,
  IconHeartbeat,
} from '@tabler/icons-react';
import type { SalonSettings, SalonAmenities } from '@/types/salon-settings';

interface FeaturesSettingsProps {
  settings: SalonSettings;
  onSave: (updates: Partial<SalonSettings>) => Promise<void>;
}

interface FeatureToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FeatureToggle({ icon, title, description, checked, onChange }: FeatureToggleProps) {
  return (
    <Paper withBorder p="md">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" wrap="nowrap">
          <Paper
            p="sm"
            style={{
              backgroundColor: checked
                ? 'var(--mantine-color-blue-0)'
                : 'var(--mantine-color-gray-0)',
            }}
          >
            {icon}
          </Paper>
          <div>
            <Text fw={500}>{title}</Text>
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          </div>
        </Group>
        <Switch
          checked={checked}
          onChange={(e) => onChange(e.currentTarget.checked)}
          size="lg"
        />
      </Group>
    </Paper>
  );
}

interface AmenityChipProps {
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
}

function AmenityChip({ icon, label, tooltip, checked, onChange, color = 'blue' }: AmenityChipProps) {
  const content = (
    <Paper
      withBorder
      p="xs"
      style={{
        cursor: 'pointer',
        backgroundColor: checked ? `var(--mantine-color-${color}-0)` : undefined,
        borderColor: checked ? `var(--mantine-color-${color}-4)` : undefined,
        transition: 'all 0.15s ease',
      }}
      onClick={() => onChange(!checked)}
    >
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon
          size="sm"
          variant={checked ? 'filled' : 'light'}
          color={color}
        >
          {icon}
        </ThemeIcon>
        <Text size="sm" fw={checked ? 500 : 400}>
          {label}
        </Text>
      </Group>
    </Paper>
  );

  if (tooltip) {
    return <Tooltip label={tooltip}>{content}</Tooltip>;
  }

  return content;
}

// Дефолтные значения для amenities
const defaultAmenities: SalonAmenities = {
  wifi: false,
  parking: false,
  parking_free: false,
  air_conditioning: false,
  heating: false,
  drinks: false,
  snacks: false,
  magazines: false,
  tv: false,
  wheelchair_access: false,
  elevator: false,
  ground_floor: false,
  kids_room: false,
  kids_friendly: false,
  pet_friendly: false,
  card_payment: false,
  cash_payment: true,
  online_payment: false,
  installments: false,
  appointment_only: false,
  walk_ins_welcome: false,
  online_consultation: false,
  home_service: false,
  loyalty_program: false,
  gift_cards: false,
  subscription_plans: false,
  evening_hours: false,
  weekend_open: false,
  early_morning: false,
  open_24h: false,
  private_rooms: false,
  vip_room: false,
  sterile_instruments: false,
  disposable_tools: false,
  organic_products: false,
  hypoallergenic_products: false,
};

export function FeaturesSettings({ settings, onSave }: FeaturesSettingsProps) {
  const [bookingEnabled, setBookingEnabled] = useState(settings.booking_enabled);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(settings.online_payment_enabled);
  const [showPrices, setShowPrices] = useState(settings.show_prices);
  const [showStaff, setShowStaff] = useState(settings.show_staff);
  const [amenities, setAmenities] = useState<SalonAmenities>(
    settings.amenities || defaultAmenities
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: (value: boolean) => void) => (value: boolean) => {
    setter(value);
    setHasChanges(true);
  };

  const handleAmenityChange = (key: keyof SalonAmenities) => (value: boolean) => {
    setAmenities((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({
      booking_enabled: bookingEnabled,
      online_payment_enabled: onlinePaymentEnabled,
      show_prices: showPrices,
      show_staff: showStaff,
      amenities,
    });
    setHasChanges(false);
  };

  return (
    <Stack gap="lg">
      {/* Основные функции страницы */}
      <div>
        <Title order={5} mb="xs">Функции публичной страницы</Title>
        <Text size="sm" c="dimmed" mb="md">
          Настройте, какие функции будут доступны на публичной странице вашего салона.
        </Text>

        <Stack gap="sm">
          <FeatureToggle
            icon={<IconCalendar size={24} color="var(--mantine-color-blue-6)" />}
            title="Онлайн-запись"
            description="Клиенты смогут записываться на услуги прямо с сайта"
            checked={bookingEnabled}
            onChange={handleChange(setBookingEnabled)}
          />

          <FeatureToggle
            icon={<IconCreditCard size={24} color="var(--mantine-color-green-6)" />}
            title="Онлайн-оплата"
            description="Возможность оплатить услуги при бронировании"
            checked={onlinePaymentEnabled}
            onChange={handleChange(setOnlinePaymentEnabled)}
          />

          <FeatureToggle
            icon={<IconCurrencyRubel size={24} color="var(--mantine-color-yellow-7)" />}
            title="Показывать цены"
            description="Отображать цены на услуги на публичной странице"
            checked={showPrices}
            onChange={handleChange(setShowPrices)}
          />

          <FeatureToggle
            icon={<IconUsers size={24} color="var(--mantine-color-violet-6)" />}
            title="Показывать мастеров"
            description="Отображать список мастеров и их специализации"
            checked={showStaff}
            onChange={handleChange(setShowStaff)}
          />
        </Stack>
      </div>

      <Divider />

      {/* Удобства салона */}
      <div>
        <Title order={5} mb="xs">Удобства салона</Title>
        <Text size="sm" c="dimmed" mb="md">
          Отметьте удобства, которые есть в вашем салоне. Они будут отображаться на публичной странице.
        </Text>

        {/* Базовые удобства */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Базовые удобства
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconWifi size={14} />}
            label="Бесплатный WiFi"
            checked={amenities.wifi}
            onChange={handleAmenityChange('wifi')}
          />
          <AmenityChip
            icon={<IconParking size={14} />}
            label="Парковка"
            checked={amenities.parking}
            onChange={handleAmenityChange('parking')}
          />
          <AmenityChip
            icon={<IconParking size={14} />}
            label="Бесплатная парковка"
            checked={amenities.parking_free}
            onChange={handleAmenityChange('parking_free')}
            color="green"
          />
          <AmenityChip
            icon={<IconAirConditioning size={14} />}
            label="Кондиционер"
            checked={amenities.air_conditioning}
            onChange={handleAmenityChange('air_conditioning')}
          />
          <AmenityChip
            icon={<IconFlame size={14} />}
            label="Отопление"
            checked={amenities.heating}
            onChange={handleAmenityChange('heating')}
            color="orange"
          />
        </SimpleGrid>

        {/* Гостеприимство */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Гостеприимство
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconCoffee size={14} />}
            label="Чай/Кофе"
            tooltip="Бесплатные напитки для клиентов"
            checked={amenities.drinks}
            onChange={handleAmenityChange('drinks')}
            color="orange"
          />
          <AmenityChip
            icon={<IconCookie size={14} />}
            label="Закуски"
            checked={amenities.snacks}
            onChange={handleAmenityChange('snacks')}
            color="yellow"
          />
          <AmenityChip
            icon={<IconBook size={14} />}
            label="Журналы"
            checked={amenities.magazines}
            onChange={handleAmenityChange('magazines')}
          />
          <AmenityChip
            icon={<IconDeviceTv size={14} />}
            label="ТВ в зале ожидания"
            checked={amenities.tv}
            onChange={handleAmenityChange('tv')}
          />
        </SimpleGrid>

        {/* Доступность */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Доступность
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconWheelchair size={14} />}
            label="Для колясок"
            tooltip="Доступ для инвалидных колясок"
            checked={amenities.wheelchair_access}
            onChange={handleAmenityChange('wheelchair_access')}
            color="teal"
          />
          <AmenityChip
            icon={<IconElevator size={14} />}
            label="Лифт"
            checked={amenities.elevator}
            onChange={handleAmenityChange('elevator')}
            color="teal"
          />
          <AmenityChip
            icon={<IconBuildingCommunity size={14} />}
            label="1-й этаж"
            checked={amenities.ground_floor}
            onChange={handleAmenityChange('ground_floor')}
            color="teal"
          />
        </SimpleGrid>

        {/* Для семей */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Для семей
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconMoodKid size={14} />}
            label="Детская комната"
            checked={amenities.kids_room}
            onChange={handleAmenityChange('kids_room')}
            color="pink"
          />
          <AmenityChip
            icon={<IconMoodKid size={14} />}
            label="Можно с детьми"
            checked={amenities.kids_friendly}
            onChange={handleAmenityChange('kids_friendly')}
            color="pink"
          />
          <AmenityChip
            icon={<IconPaw size={14} />}
            label="Можно с питомцами"
            checked={amenities.pet_friendly}
            onChange={handleAmenityChange('pet_friendly')}
            color="orange"
          />
        </SimpleGrid>

        {/* Способы оплаты */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Способы оплаты
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconCreditCard size={14} />}
            label="Оплата картой"
            checked={amenities.card_payment}
            onChange={handleAmenityChange('card_payment')}
            color="green"
          />
          <AmenityChip
            icon={<IconCash size={14} />}
            label="Оплата наличными"
            checked={amenities.cash_payment}
            onChange={handleAmenityChange('cash_payment')}
            color="green"
          />
          <AmenityChip
            icon={<IconDeviceMobile size={14} />}
            label="Онлайн-оплата"
            checked={amenities.online_payment}
            onChange={handleAmenityChange('online_payment')}
            color="green"
          />
          <AmenityChip
            icon={<IconReceipt size={14} />}
            label="Рассрочка"
            checked={amenities.installments}
            onChange={handleAmenityChange('installments')}
            color="green"
          />
        </SimpleGrid>

        {/* Запись и сервис */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Запись и сервис
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconCalendarEvent size={14} />}
            label="Только по записи"
            checked={amenities.appointment_only}
            onChange={handleAmenityChange('appointment_only')}
          />
          <AmenityChip
            icon={<IconWalk size={14} />}
            label="Без записи"
            tooltip="Принимаем без предварительной записи"
            checked={amenities.walk_ins_welcome}
            onChange={handleAmenityChange('walk_ins_welcome')}
          />
          <AmenityChip
            icon={<IconVideo size={14} />}
            label="Онлайн-консультации"
            checked={amenities.online_consultation}
            onChange={handleAmenityChange('online_consultation')}
            color="violet"
          />
          <AmenityChip
            icon={<IconHome size={14} />}
            label="Выезд на дом"
            checked={amenities.home_service}
            onChange={handleAmenityChange('home_service')}
            color="violet"
          />
        </SimpleGrid>

        {/* Программы лояльности */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Программы и бонусы
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconTrophy size={14} />}
            label="Программа лояльности"
            checked={amenities.loyalty_program}
            onChange={handleAmenityChange('loyalty_program')}
            color="yellow"
          />
          <AmenityChip
            icon={<IconGift size={14} />}
            label="Подарочные сертификаты"
            checked={amenities.gift_cards}
            onChange={handleAmenityChange('gift_cards')}
            color="pink"
          />
          <AmenityChip
            icon={<IconRepeat size={14} />}
            label="Абонементы"
            checked={amenities.subscription_plans}
            onChange={handleAmenityChange('subscription_plans')}
            color="cyan"
          />
        </SimpleGrid>

        {/* Время работы */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Особенности расписания
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconMoon size={14} />}
            label="Вечерние часы"
            tooltip="Работаем допоздна"
            checked={amenities.evening_hours}
            onChange={handleAmenityChange('evening_hours')}
            color="indigo"
          />
          <AmenityChip
            icon={<IconCalendar size={14} />}
            label="Работаем в выходные"
            checked={amenities.weekend_open}
            onChange={handleAmenityChange('weekend_open')}
          />
          <AmenityChip
            icon={<IconSun size={14} />}
            label="Раннее утро"
            tooltip="Работаем с раннего утра"
            checked={amenities.early_morning}
            onChange={handleAmenityChange('early_morning')}
            color="yellow"
          />
          <AmenityChip
            icon={<IconClock24 size={14} />}
            label="Круглосуточно"
            checked={amenities.open_24h}
            onChange={handleAmenityChange('open_24h')}
            color="red"
          />
        </SimpleGrid>

        {/* Помещение */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Помещение
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconDoor size={14} />}
            label="Отдельные кабинеты"
            checked={amenities.private_rooms}
            onChange={handleAmenityChange('private_rooms')}
          />
          <AmenityChip
            icon={<IconCrown size={14} />}
            label="VIP-комната"
            checked={amenities.vip_room}
            onChange={handleAmenityChange('vip_room')}
            color="yellow"
          />
        </SimpleGrid>

        {/* Гигиена и качество */}
        <Text size="sm" fw={500} mb="xs" c="dimmed">
          Гигиена и качество
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="md">
          <AmenityChip
            icon={<IconShieldCheck size={14} />}
            label="Стерилизация инструментов"
            checked={amenities.sterile_instruments}
            onChange={handleAmenityChange('sterile_instruments')}
            color="teal"
          />
          <AmenityChip
            icon={<IconTrash size={14} />}
            label="Одноразовые инструменты"
            checked={amenities.disposable_tools}
            onChange={handleAmenityChange('disposable_tools')}
            color="teal"
          />
          <AmenityChip
            icon={<IconLeaf size={14} />}
            label="Органическая косметика"
            checked={amenities.organic_products}
            onChange={handleAmenityChange('organic_products')}
            color="green"
          />
          <AmenityChip
            icon={<IconHeartbeat size={14} />}
            label="Гипоаллергенная косметика"
            checked={amenities.hypoallergenic_products}
            onChange={handleAmenityChange('hypoallergenic_products')}
            color="cyan"
          />
        </SimpleGrid>
      </div>

      {/* Кнопка сохранения */}
      <Group justify="flex-end" mt="md">
        <Button onClick={handleSave} disabled={!hasChanges}>
          Сохранить изменения
        </Button>
      </Group>
    </Stack>
  );
}
