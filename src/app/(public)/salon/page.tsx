'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Stack,
  Center,
  Loader,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

import { salonSettingsService, carouselService } from '@/services';
import type { SalonSettings, SalonService, SalonStaff } from '@/types/salon-settings';
import type { CarouselItem } from '@/types/carousel';

import { SalonHeader } from '@/components/public/SalonHeader';
import { HeroCarousel } from '@/components/public/HeroCarousel';
import { ServicesList } from '@/components/public/ServicesList';
import { StaffList } from '@/components/public/StaffList';
import { ContactSection } from '@/components/public/ContactSection';
import { SalonFooter } from '@/components/public/SalonFooter';

interface PublicData {
  settings: SalonSettings;
  services: SalonService[];
  staff: SalonStaff[];
  carouselItems: CarouselItem[];
}

export default function SalonPage() {
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [publicInfo, carouselItems] = await Promise.all([
          salonSettingsService.getPublicInfo(),
          carouselService.getActiveItems(),
        ]);
        setData({
          ...publicInfo,
          carouselItems,
        });
      } catch (err) {
        console.error('Error loading salon data:', err);
        setError('Не удалось загрузить данные салона');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Container py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Ошибка"
          color="red"
        >
          {error || 'Данные не найдены'}
        </Alert>
      </Container>
    );
  }

  const { settings, services, staff, carouselItems } = data;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fafafa',
      }}
    >
      <SalonHeader settings={settings} />

      <main>
        {/* Hero Carousel */}
        {carouselItems.length > 0 && (
          <HeroCarousel items={carouselItems} />
        )}

        {/* Services */}
        {settings.show_prices && services.length > 0 && (
          <ServicesList services={services} primaryColor={settings.primary_color} />
        )}

        {/* Staff */}
        {settings.show_staff && staff.length > 0 && (
          <StaffList staff={staff} primaryColor={settings.primary_color} />
        )}

        {/* Contact Info */}
        <ContactSection settings={settings} />
      </main>

      <SalonFooter settings={settings} />
    </div>
  );
}
