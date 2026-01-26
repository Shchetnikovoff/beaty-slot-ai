import { NextRequest, NextResponse } from 'next/server';
import { getSyncedServices } from '@/lib/sync-store';

/**
 * Публичный API услуг для клиентского поиска
 * GET /api/v1/public/services
 *
 * Query params:
 * - category_id: фильтр по категории
 * - search: поиск по названию
 * - limit: лимит результатов (default: 50)
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

interface PublicService {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  priceFrom: number;
  priceTo: number;
  duration: number; // в минутах
  image?: string;
}

function getCategoryForService(title: string): { id: number; name: string } | null {
  const lowerTitle = title.toLowerCase();
  for (const cat of MARKET_CATEGORIES) {
    if (cat.aliases.some(alias => lowerTitle.includes(alias))) {
      return { id: cat.id, name: cat.name };
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const yclientsServices = getSyncedServices();

    // Преобразовать и отфильтровать услуги
    let services: PublicService[] = [];

    for (const service of yclientsServices) {
      // Пропустить неактивные
      if (service.active !== 1) continue;

      // Определить категорию
      const category = getCategoryForService(service.title);
      if (!category) continue; // Услуга не попадает ни в одну категорию

      // Фильтр по категории
      if (categoryId && category.id !== parseInt(categoryId, 10)) {
        continue;
      }

      // Фильтр по поиску
      if (search && !service.title.toLowerCase().includes(search)) {
        continue;
      }

      services.push({
        id: service.id,
        name: service.title,
        description: service.comment || '',
        categoryId: category.id,
        categoryName: category.name,
        priceFrom: service.price_min,
        priceTo: service.price_max,
        duration: service.seance_length,
        image: service.image || undefined,
      });
    }

    // Сортировка по названию
    services.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    // Лимит
    if (limit > 0) {
      services = services.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: services,
      total: services.length,
    });
  } catch (error) {
    console.error('Error getting services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get services' },
      { status: 500 }
    );
  }
}
