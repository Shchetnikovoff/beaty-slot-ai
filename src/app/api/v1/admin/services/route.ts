import { NextRequest, NextResponse } from 'next/server';
import { getSyncedServices } from '@/lib/sync-store';

interface Service {
  id: number;
  title: string;
  category_id: number;
  price_min: number;
  price_max: number;
  duration: number;
  active: boolean;
  image?: string;
}

interface ServicesListResponse {
  items: Service[];
  total: number;
}

/**
 * GET /api/v1/admin/services
 * Получить список услуг из синхронизированных данных
 */
export async function GET(request: NextRequest) {
  try {
    const yclientsServices = getSyncedServices();

    // Если данных нет - вернуть пустой массив с подсказкой
    if (yclientsServices.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        message: 'Данные не синхронизированы. Запустите синхронизацию на странице /apps/sync',
      });
    }

    // Получить параметры запроса
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const categoryId = searchParams.get('category_id');
    const activeOnly = searchParams.get('active_only');

    // Преобразовать услуги
    let services: Service[] = yclientsServices.map(s => ({
      id: s.id,
      title: s.title,
      category_id: s.category_id,
      price_min: s.price_min,
      price_max: s.price_max,
      duration: s.seance_length,
      active: s.active === 1,
      image: s.image || undefined,
    }));

    // Применить фильтры
    if (search) {
      services = services.filter(s =>
        s.title.toLowerCase().includes(search)
      );
    }

    if (categoryId) {
      services = services.filter(s => s.category_id === parseInt(categoryId, 10));
    }

    if (activeOnly === 'true') {
      services = services.filter(s => s.active);
    }

    // Сортировка по названию
    services.sort((a, b) => a.title.localeCompare(b.title, 'ru'));

    const response: ServicesListResponse = {
      items: services,
      total: services.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting services:', error);
    return NextResponse.json(
      { error: 'Failed to get services' },
      { status: 500 }
    );
  }
}
