import { NextRequest, NextResponse } from 'next/server';
import { getSyncedClients } from '@/lib/sync-store';
import {
  calculateIVK,
  calculateRiskFromIVK,
  determineClientStatus,
} from '@/lib/ivk-calculator';
import type { Client, ClientsListResponse } from '@/types/client';
import type { YclientsClient } from '@/lib/yclients';

/**
 * Преобразовать YclientsClient в Client (формат админки)
 * Использует умную систему расчёта ИВК на основе RFM-анализа
 */
function transformClient(yc: YclientsClient): Client {
  // Рассчитываем ИВК через новую умную систему
  const ivkResult = calculateIVK(yc);

  return {
    id: yc.id,
    yclients_id: String(yc.id),
    name: yc.name || 'Без имени',
    phone: yc.phone || '',
    email: yc.email || undefined,
    birth_date: yc.birth_date || undefined,
    comment: yc.comment || undefined,
    is_blocked: false,
    has_uploaded_photo: false,
    role: 'USER',
    created_at: yc.first_visit_date || new Date().toISOString(),
    updated_at: yc.last_visit_date || new Date().toISOString(),
    last_visit_at: yc.last_visit_date || undefined,
    visits_count: yc.visit_count || 0,
    no_show_count: 0, // YClients не возвращает это поле напрямую
    total_spent: yc.spent || 0,
    // Новая умная система ИВК
    score: ivkResult.score,
    risk_level: calculateRiskFromIVK(ivkResult),
    client_status: determineClientStatus(ivkResult),
    days_since_last_visit: ivkResult.metrics.daysSinceLastVisit ?? undefined,
    tier: ivkResult.tier,
    has_active_subscription: false, // TODO: добавить логику подписок
  };
}

/**
 * GET /api/v1/admin/clients
 * Получить список клиентов из синхронизированных данных
 */
export async function GET(request: NextRequest) {
  try {
    const yclientsClients = getSyncedClients();

    // Если данных нет - вернуть пустой массив с подсказкой
    if (yclientsClients.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        skip: 0,
        limit: 20,
        message: 'Данные не синхронизированы. Запустите синхронизацию на странице /apps/sync',
      });
    }

    // Преобразовать всех клиентов
    let clients = yclientsClients.map(transformClient);

    // Получить параметры запроса
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const clientStatus = searchParams.get('client_status');
    const riskLevel = searchParams.get('risk_level');
    const hasSubscription = searchParams.get('has_subscription');
    const minScore = searchParams.get('min_score');
    const minVisits = searchParams.get('min_visits');
    const daysInactive = searchParams.get('days_inactive');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Применить фильтры
    if (search) {
      clients = clients.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(search) ||
        (c.email && c.email.toLowerCase().includes(search))
      );
    }

    if (clientStatus && clientStatus !== 'ALL') {
      clients = clients.filter(c => c.client_status === clientStatus);
    }

    if (riskLevel) {
      clients = clients.filter(c => c.risk_level === riskLevel);
    }

    if (hasSubscription === 'true') {
      clients = clients.filter(c => c.has_active_subscription);
    }

    if (minScore) {
      clients = clients.filter(c => c.score >= parseInt(minScore, 10));
    }

    if (minVisits) {
      clients = clients.filter(c => c.visits_count >= parseInt(minVisits, 10));
    }

    if (daysInactive) {
      const days = parseInt(daysInactive, 10);
      clients = clients.filter(c =>
        c.days_since_last_visit !== undefined && c.days_since_last_visit >= days
      );
    }

    // Сортировка по score (лучшие клиенты сверху)
    clients.sort((a, b) => b.score - a.score);

    // Общее количество после фильтрации
    const total = clients.length;

    // Применить пагинацию
    const paginatedClients = clients.slice(skip, skip + limit);

    const response: ClientsListResponse = {
      items: paginatedClients,
      total,
      skip,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting clients:', error);
    return NextResponse.json(
      { error: 'Failed to get clients' },
      { status: 500 }
    );
  }
}
