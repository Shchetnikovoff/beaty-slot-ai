/**
 * Shop Orders Store
 * In-memory storage with hot-reload persistence
 */

import type {
  ShopOrder,
  OrderStatus,
  CartItem,
  ShopCustomer,
} from '@/types/shop';

// ==========================================
// Global State
// ==========================================

declare global {
  // eslint-disable-next-line no-var
  var __shopOrders: ShopOrder[] | undefined;
  // eslint-disable-next-line no-var
  var __shopOrderCounter: number | undefined;
}

function getOrdersStore(): ShopOrder[] {
  if (!global.__shopOrders) {
    global.__shopOrders = [];
  }
  return global.__shopOrders;
}

function getNextOrderNumber(): string {
  const counter = (global.__shopOrderCounter || 0) + 1;
  global.__shopOrderCounter = counter;
  return `ORD-${counter.toString().padStart(4, '0')}`;
}

// ==========================================
// CRUD Operations
// ==========================================

/**
 * Получить все заказы
 */
export function getShopOrders(): ShopOrder[] {
  return getOrdersStore();
}

/**
 * Получить заказ по ID
 */
export function getShopOrderById(id: string): ShopOrder | undefined {
  return getOrdersStore().find((order) => order.id === id);
}

/**
 * Получить заказ по номеру
 */
export function getShopOrderByNumber(orderNumber: string): ShopOrder | undefined {
  return getOrdersStore().find((order) => order.orderNumber === orderNumber);
}

/**
 * Получить заказы по статусу
 */
export function getShopOrdersByStatus(status: OrderStatus): ShopOrder[] {
  return getOrdersStore().filter((order) => order.status === status);
}

/**
 * Получить заказы клиента по телефону
 */
export function getShopOrdersByPhone(phone: string): ShopOrder[] {
  const normalizedPhone = phone.replace(/\D/g, '');
  return getOrdersStore().filter(
    (order) => order.customer.phone.replace(/\D/g, '') === normalizedPhone
  );
}

/**
 * Создать новый заказ
 */
export function createShopOrder(data: {
  items: CartItem[];
  customer: ShopCustomer;
  notes?: string;
}): ShopOrder {
  const orders = getOrdersStore();
  const now = new Date().toISOString();

  const order: ShopOrder = {
    id: crypto.randomUUID(),
    orderNumber: getNextOrderNumber(),
    items: data.items,
    customer: data.customer,
    total: data.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    ),
    status: 'pending',
    notes: data.notes,
    createdAt: now,
    updatedAt: now,
  };

  orders.push(order);
  return order;
}

/**
 * Обновить статус заказа
 */
export function updateShopOrderStatus(
  id: string,
  status: OrderStatus
): ShopOrder | null {
  const orders = getOrdersStore();
  const index = orders.findIndex((order) => order.id === id);

  if (index === -1) return null;

  orders[index] = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  return orders[index];
}

/**
 * Обновить заметки к заказу
 */
export function updateShopOrderNotes(
  id: string,
  notes: string
): ShopOrder | null {
  const orders = getOrdersStore();
  const index = orders.findIndex((order) => order.id === id);

  if (index === -1) return null;

  orders[index] = {
    ...orders[index],
    notes,
    updatedAt: new Date().toISOString(),
  };

  return orders[index];
}

/**
 * Удалить заказ (soft delete - меняем статус на cancelled)
 */
export function cancelShopOrder(id: string): ShopOrder | null {
  return updateShopOrderStatus(id, 'cancelled');
}

// ==========================================
// Statistics
// ==========================================

/**
 * Получить статистику заказов
 */
export function getShopOrdersStats(): {
  total: number;
  byStatus: Record<OrderStatus, number>;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
} {
  const orders = getOrdersStore();
  const today = new Date().toISOString().split('T')[0];

  const byStatus: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  };

  let totalRevenue = 0;
  let todayOrders = 0;
  let todayRevenue = 0;

  for (const order of orders) {
    byStatus[order.status]++;

    // Считаем выручку только для выполненных заказов
    if (order.status === 'completed') {
      totalRevenue += order.total;
    }

    // Статистика за сегодня
    if (order.createdAt.startsWith(today)) {
      todayOrders++;
      if (order.status === 'completed') {
        todayRevenue += order.total;
      }
    }
  }

  return {
    total: orders.length,
    byStatus,
    totalRevenue,
    todayOrders,
    todayRevenue,
  };
}

// ==========================================
// Reset (for testing)
// ==========================================

export function resetShopOrdersStore(): void {
  global.__shopOrders = [];
  global.__shopOrderCounter = 0;
}
