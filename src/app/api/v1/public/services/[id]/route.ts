import { NextRequest, NextResponse } from 'next/server';
import { getSyncedServices } from '@/lib/sync-store';

/**
 * Получить конкретную услугу по ID
 * GET /api/v1/public/services/:id
 */

// Стандартные категории рынка
const MARKET_CATEGORIES = [
  { id: 1, name: 'Маникюр', aliases: ['маникюр', 'ногти', 'гель-лак', 'shellac', 'шеллак'] },
  { id: 2, name: 'Педикюр', aliases: ['педикюр', 'стопы', 'пятки'] },
  { id: 3, name: 'Брови', aliases: ['брови', 'brow', 'коррекция бровей', 'окрашивание бровей'] },
  { id: 4, name: 'Ресницы', aliases: ['ресницы', 'наращивание ресниц', 'ламинирование'] },
  { id: 5, name: 'Волосы', aliases: ['стрижка', 'окрашивание', 'укладка', 'волосы', 'hair'] },
  { id: 6, name: 'Макияж', aliases: ['макияж', 'визаж', 'makeup'] },
  { id: 7, name: 'Косметология', aliases: ['косметология', 'чистка', 'пилинг', 'уход за лицом'] },
  { id: 8, name: 'Массаж', aliases: ['массаж', 'spa', 'спа'] },
];

function getCategoryForService(title: string): { id: number; name: string } | null {
  const lowerTitle = title.toLowerCase();
  for (const cat of MARKET_CATEGORIES) {
    if (cat.aliases.some(alias => lowerTitle.includes(alias))) {
      return { id: cat.id, name: cat.name };
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    const yclientsServices = getSyncedServices();
    const service = yclientsServices.find(s => s.id === serviceId);

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    const category = getCategoryForService(service.title);

    return NextResponse.json({
      success: true,
      data: {
        id: service.id,
        name: service.title,
        description: service.comment || '',
        categoryId: category?.id || 0,
        categoryName: category?.name || 'Другое',
        priceFrom: service.price_min,
        priceTo: service.price_max,
        duration: service.seance_length,
        image: service.image || undefined,
      },
    });
  } catch (error) {
    console.error('Error getting service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get service' },
      { status: 500 }
    );
  }
}
