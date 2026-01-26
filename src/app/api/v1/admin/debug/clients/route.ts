import { NextRequest, NextResponse } from 'next/server';
import { getSyncedClients } from '@/lib/sync-store';
import { calculateIVK } from '@/lib/ivk-calculator';

/**
 * GET /api/v1/admin/debug/clients
 * Debug endpoint для проверки сырых данных клиентов из YClients
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '5', 10);
  const withIvk = searchParams.get('ivk') === 'true';

  const yclientsClients = getSyncedClients();

  // Берём первых N клиентов с наибольшим visit_count для демонстрации
  const sortedClients = [...yclientsClients]
    .sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0))
    .slice(0, limit);

  const result = sortedClients.map(client => {
    const base = {
      // Сырые данные из YClients
      raw: {
        id: client.id,
        name: client.name,
        visit_count: client.visit_count,
        spent: client.spent,
        avg_sum: client.avg_sum,
        sold_amount: client.sold_amount,
        paid: client.paid,
        balance: client.balance,
        first_visit_date: client.first_visit_date,
        last_visit_date: client.last_visit_date,
        importance_id: client.importance_id,
        importance: client.importance,
        discount: client.discount,
      },
    };

    if (withIvk) {
      const ivkResult = calculateIVK(client);
      return {
        ...base,
        ivk: ivkResult,
      };
    }

    return base;
  });

  return NextResponse.json({
    total_synced: yclientsClients.length,
    showing: result.length,
    clients: result,
  });
}
