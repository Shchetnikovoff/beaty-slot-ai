import { NextRequest, NextResponse } from 'next/server';

import {
  getShopOrderById,
  updateShopOrderStatus,
  updateShopOrderNotes,
} from '@/lib/shop-orders-store';
import type { OrderStatus, UpdateOrderRequest } from '@/types/shop';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/shop/orders/[id]
 * Получить заказ по ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const order = getShopOrderById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('[Shop Orders] GET by ID error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения заказа' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/shop/orders/[id]
 * Обновить заказ (статус, заметки)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateOrderRequest = await request.json();
    const { status, notes } = body;

    // Проверяем существование заказа
    const existingOrder = getShopOrderById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    let updatedOrder = existingOrder;

    // Обновляем статус если передан
    if (status) {
      const validStatuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'processing',
        'completed',
        'cancelled',
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Некорректный статус' },
          { status: 400 }
        );
      }

      updatedOrder = updateShopOrderStatus(id, status) || updatedOrder;
      console.log(`[Shop Orders] Updated status for ${existingOrder.orderNumber}: ${status}`);
    }

    // Обновляем заметки если переданы
    if (typeof notes === 'string') {
      updatedOrder = updateShopOrderNotes(id, notes) || updatedOrder;
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('[Shop Orders] PATCH error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления заказа' },
      { status: 500 }
    );
  }
}
