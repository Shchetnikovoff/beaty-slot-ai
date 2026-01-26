import { NextResponse } from 'next/server';
import { getSyncedServices } from '@/lib/sync-store';

/**
 * Глобальные категории услуг (для клиентского поиска)
 * GET /api/v1/public/categories
 */

interface ServiceCategory {
  id: number;
  name: string;
  icon: string;
  order: number;
  servicesCount: number;
}

// Маппинг категорий Yclients на стандартные категории рынка
const CATEGORY_MAPPING: Record<number, { name: string; icon: string; order: number }> = {
  // Эти ID нужно получить из реальных данных Yclients
  // Пока используем примерный маппинг
};

// Стандартные категории рынка (MVP: 6-8 категорий)
const MARKET_CATEGORIES = [
  { id: 1, name: 'Маникюр', icon: '💅', order: 1, aliases: ['маникюр', 'ногти', 'гель-лак', 'shellac', 'шеллак'] },
  { id: 2, name: 'Педикюр', icon: '🦶', order: 2, aliases: ['педикюр', 'стопы', 'пятки'] },
  { id: 3, name: 'Брови', icon: '👁️', order: 3, aliases: ['брови', 'brow', 'коррекция бровей', 'окрашивание бровей'] },
  { id: 4, name: 'Ресницы', icon: '👁️', order: 4, aliases: ['ресницы', 'наращивание ресниц', 'ламинирование'] },
  { id: 5, name: 'Волосы', icon: '💇', order: 5, aliases: ['стрижка', 'окрашивание', 'укладка', 'волосы', 'hair'] },
  { id: 6, name: 'Макияж', icon: '💄', order: 6, aliases: ['макияж', 'визаж', 'makeup'] },
  { id: 7, name: 'Косметология', icon: '✨', order: 7, aliases: ['косметология', 'чистка', 'пилинг', 'уход за лицом'] },
  { id: 8, name: 'Массаж', icon: '💆', order: 8, aliases: ['массаж', 'spa', 'спа'] },
];

export async function GET() {
  try {
    const yclientsServices = getSyncedServices();

    // Подсчитать услуги по категориям
    const categoryCounts = new Map<number, number>();

    yclientsServices.forEach(service => {
      if (service.active !== 1) return;

      const title = service.title.toLowerCase();

      // Найти подходящую категорию по алиасам
      for (const cat of MARKET_CATEGORIES) {
        if (cat.aliases.some(alias => title.includes(alias))) {
          categoryCounts.set(cat.id, (categoryCounts.get(cat.id) || 0) + 1);
          break;
        }
      }
    });

    // Сформировать ответ только с категориями, где есть услуги
    const categories: ServiceCategory[] = MARKET_CATEGORIES
      .filter(cat => (categoryCounts.get(cat.id) || 0) > 0)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        order: cat.order,
        servicesCount: categoryCounts.get(cat.id) || 0,
      }))
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get categories' },
      { status: 500 }
    );
  }
}
