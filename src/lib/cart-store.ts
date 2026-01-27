/**
 * Cart Store - Zustand store for shopping cart
 * Persists to localStorage for session persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { IProduct } from '@/types/products';
import type { CartItem } from '@/types/shop';

// ==========================================
// Types
// ==========================================

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addToCart: (product: IProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Drawer control
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed (as functions for Zustand)
  getTotal: () => number;
  getItemsCount: () => number;
  getItemQuantity: (productId: string) => number;
}

// ==========================================
// Store
// ==========================================

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // ==========================================
      // Cart Actions
      // ==========================================

      addToCart: (product: IProduct) => {
        const { items } = get();
        const existingItem = items.find((item) => item.product.id === product.id);

        if (existingItem) {
          // Увеличиваем количество
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          // Добавляем новый товар
          set({
            items: [...items, { product, quantity: 1 }],
          });
        }
      },

      removeFromCart: (productId: string) => {
        const { items } = get();
        set({
          items: items.filter((item) => item.product.id !== productId),
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { items } = get();

        if (quantity <= 0) {
          // Удаляем если количество <= 0
          set({
            items: items.filter((item) => item.product.id !== productId),
          });
        } else {
          set({
            items: items.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      // ==========================================
      // Drawer Control
      // ==========================================

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // ==========================================
      // Computed Values
      // ==========================================

      getTotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getItemsCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      getItemQuantity: (productId: string) => {
        const { items } = get();
        const item = items.find((i) => i.product.id === productId);
        return item?.quantity || 0;
      },
    }),
    {
      name: 'beauty-slot-cart',
      // Не сохраняем состояние drawer в localStorage
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// ==========================================
// Selectors (для оптимизации ре-рендеров)
// ==========================================

export const selectCartItems = (state: CartStore) => state.items;
export const selectCartIsOpen = (state: CartStore) => state.isOpen;
export const selectCartItemsCount = (state: CartStore) => state.getItemsCount();
export const selectCartTotal = (state: CartStore) => state.getTotal();
