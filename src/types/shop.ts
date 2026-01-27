/**
 * Типы для онлайн-магазина
 */

import { IProduct } from './products';

// ==========================================
// Cart Types
// ==========================================

export interface CartItem {
  product: IProduct;
  quantity: number;
}

// ==========================================
// Customer Types
// ==========================================

export interface ShopCustomer {
  name: string;
  phone: string;
  email?: string;
  telegramId?: string;
  notes?: string;
}

// ==========================================
// Order Types
// ==========================================

export type OrderStatus =
  | 'pending'      // Ожидает обработки
  | 'confirmed'    // Подтверждён
  | 'processing'   // В работе
  | 'completed'    // Выполнен
  | 'cancelled';   // Отменён

export interface ShopOrder {
  id: string;
  orderNumber: string;        // "ORD-0001"
  items: CartItem[];
  customer: ShopCustomer;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// API Types
// ==========================================

export interface CreateOrderRequest {
  items: CartItem[];
  customer: ShopCustomer;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  notes?: string;
}

// ==========================================
// UI Labels
// ==========================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ожидает обработки',
  confirmed: 'Подтверждён',
  processing: 'В работе',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'yellow',
  confirmed: 'blue',
  processing: 'cyan',
  completed: 'green',
  cancelled: 'red',
};
