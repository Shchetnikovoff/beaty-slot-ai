import { NextRequest, NextResponse } from 'next/server';
import { getSyncedClients } from '@/lib/sync-store';
import {
  calculateIVK,
  calculateRiskFromIVK,
  determineClientStatus,
  getClientRecommendations,
} from '@/lib/ivk-calculator';
import type { Client } from '@/types/client';
import type { YclientsClient } from '@/lib/yclients';

/**
 * Преобразовать YclientsClient в Client с детальной информацией об ИВК
 * Для детального просмотра клиента включаем полную информацию о расчёте ИВК
 */
function transformClientWithDetails(yc: YclientsClient): Client {
  // Рассчитываем ИВК через умную систему RFM-анализа
  const ivkResult = calculateIVK(yc);
  const recommendations = getClientRecommendations(ivkResult);

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
    no_show_count: 0,
    total_spent: yc.spent || 0,
    // Новая умная система ИВК
    score: ivkResult.score,
    risk_level: calculateRiskFromIVK(ivkResult),
    client_status: determineClientStatus(ivkResult),
    days_since_last_visit: ivkResult.metrics.daysSinceLastVisit ?? undefined,
    tier: ivkResult.tier,
    has_active_subscription: false,
    // Детальная информация об ИВК (только для детального просмотра)
    ivk_details: {
      components: ivkResult.components,
      percentages: ivkResult.percentages,
      metrics: ivkResult.metrics,
      tier: ivkResult.tier,
      recommendations,
    },
  };
}

/**
 * GET /api/v1/admin/clients/[id]
 * Получить клиента по ID с детальной информацией об ИВК
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const yclientsClients = getSyncedClients();
    const yclientsClient = yclientsClients.find(c => c.id === clientId);

    if (!yclientsClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const client = transformClientWithDetails(yclientsClient);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error getting client:', error);
    return NextResponse.json(
      { error: 'Failed to get client' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/admin/clients/[id]
 * Обновить клиента
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const yclientsClients = getSyncedClients();
    const yclientsClient = yclientsClients.find(c => c.id === clientId);

    if (!yclientsClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // В текущей реализации данные только читаются из YClients
    // Обновление клиента не поддерживается (read-only sync)
    const client = transformClientWithDetails(yclientsClient);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/clients/[id]
 * Удалить клиента (не поддерживается для синхронизированных данных)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: 'Cannot delete synced clients. Manage clients in YClients.' },
    { status: 405 }
  );
}
