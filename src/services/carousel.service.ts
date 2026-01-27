/**
 * Сервис для работы с каруселью
 */

import { api, isDemoMode } from '@/lib/api';
import type { CarouselItem, CarouselItemCreate, CarouselItemUpdate } from '@/types/carousel';

const CAROUSEL_ENDPOINT = '/v1/admin/carousel';

// Mock данные для демо-режима
const mockCarouselItems: CarouselItem[] = [
  {
    id: 1,
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    pdf_url: '',
    pdf_images_urls: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200'],
    title: 'Акция: Скидка 20% на маникюр',
    description: 'Только до конца месяца! Скидка 20% на все виды маникюра.',
    order: 1,
    is_active: true,
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 2,
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    pdf_url: '',
    pdf_images_urls: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200'],
    title: 'Новинка: SPA-уход для волос',
    description: 'Попробуйте наш новый SPA-уход с аргановым маслом.',
    order: 2,
    is_active: true,
    created_at: '2026-01-18T14:30:00Z',
    updated_at: '2026-01-18T14:30:00Z',
  },
  {
    id: 3,
    image_url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800',
    pdf_url: '',
    pdf_images_urls: ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200'],
    title: 'Комплексный уход за лицом',
    description: 'Полный комплекс процедур для сияющей кожи.',
    order: 3,
    is_active: false,
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-22T16:00:00Z',
  },
];

// Локальное хранилище для демо-режима
let localCarouselItems = [...mockCarouselItems];

export const carouselService = {
  /**
   * Получить все элементы карусели
   */
  async getItems(): Promise<CarouselItem[]> {
    if (isDemoMode()) {
      return [...localCarouselItems].sort((a, b) => a.order - b.order);
    }
    try {
      return await api.get<CarouselItem[]>(CAROUSEL_ENDPOINT);
    } catch {
      return [...localCarouselItems].sort((a, b) => a.order - b.order);
    }
  },

  /**
   * Получить элемент карусели по ID
   */
  async getItem(id: number): Promise<CarouselItem | null> {
    if (isDemoMode()) {
      return localCarouselItems.find(item => item.id === id) || null;
    }
    try {
      return await api.get<CarouselItem>(`${CAROUSEL_ENDPOINT}/${id}`);
    } catch {
      return localCarouselItems.find(item => item.id === id) || null;
    }
  },

  /**
   * Создать новый элемент карусели
   */
  async createItem(data: CarouselItemCreate): Promise<CarouselItem> {
    const createLocal = () => {
      const maxId = Math.max(...localCarouselItems.map(i => i.id), 0);
      const maxOrder = Math.max(...localCarouselItems.map(i => i.order), 0);

      const newItem: CarouselItem = {
        id: maxId + 1,
        image_url: URL.createObjectURL(data.image),
        pdf_url: '',
        pdf_images_urls: [URL.createObjectURL(data.document)],
        title: data.title || null,
        description: data.description || null,
        order: maxOrder + 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localCarouselItems.push(newItem);
      return newItem;
    };

    if (isDemoMode()) {
      return createLocal();
    }

    try {
      const formData = new FormData();
      formData.append('image', data.image);
      formData.append('document', data.document);
      if (data.title) {
        formData.append('title', data.title);
      }
      if (data.description) {
        formData.append('description', data.description);
      }
      return await api.post<CarouselItem>(CAROUSEL_ENDPOINT, formData);
    } catch {
      return createLocal();
    }
  },

  /**
   * Обновить элемент карусели
   */
  async updateItem(id: number, data: CarouselItemUpdate): Promise<CarouselItem> {
    const updateLocal = () => {
      const index = localCarouselItems.findIndex(item => item.id === id);
      if (index === -1) {
        throw new Error('Элемент не найден');
      }

      const updated: CarouselItem = {
        ...localCarouselItems[index],
        ...(data.title !== undefined && { title: data.title || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
        ...(data.image && { image_url: URL.createObjectURL(data.image) }),
        ...(data.document && { pdf_images_urls: [URL.createObjectURL(data.document)] }),
        updated_at: new Date().toISOString(),
      };

      localCarouselItems[index] = updated;
      return updated;
    };

    if (isDemoMode()) {
      return updateLocal();
    }

    try {
      const formData = new FormData();
      if (data.image) {
        formData.append('image', data.image);
      }
      if (data.document) {
        formData.append('document', data.document);
      }
      if (data.title !== undefined) {
        formData.append('title', data.title);
      }
      if (data.description !== undefined) {
        formData.append('description', data.description);
      }
      if (data.order !== undefined) {
        formData.append('order', data.order.toString());
      }
      if (data.is_active !== undefined) {
        formData.append('is_active', data.is_active.toString());
      }
      return await api.put<CarouselItem>(`${CAROUSEL_ENDPOINT}/${id}`, formData);
    } catch {
      return updateLocal();
    }
  },

  /**
   * Удалить элемент карусели
   */
  async deleteItem(id: number): Promise<void> {
    const deleteLocal = () => {
      localCarouselItems = localCarouselItems.filter(item => item.id !== id);
    };

    if (isDemoMode()) {
      deleteLocal();
      return;
    }
    try {
      await api.delete(`${CAROUSEL_ENDPOINT}/${id}`);
    } catch {
      deleteLocal();
    }
  },

  /**
   * Переключить активность элемента
   */
  async toggleActive(id: number): Promise<CarouselItem> {
    const toggleLocal = () => {
      const index = localCarouselItems.findIndex(item => item.id === id);
      if (index === -1) {
        throw new Error('Элемент не найден');
      }

      localCarouselItems[index] = {
        ...localCarouselItems[index],
        is_active: !localCarouselItems[index].is_active,
        updated_at: new Date().toISOString(),
      };

      return localCarouselItems[index];
    };

    if (isDemoMode()) {
      return toggleLocal();
    }
    try {
      return await api.put<CarouselItem>(`${CAROUSEL_ENDPOINT}/${id}/toggle-active`);
    } catch {
      return toggleLocal();
    }
  },

  /**
   * Изменить порядок элемента
   */
  async updateOrder(id: number, newOrder: number): Promise<CarouselItem> {
    const updateOrderLocal = () => {
      const item = localCarouselItems.find(i => i.id === id);
      if (!item) {
        throw new Error('Элемент не найден');
      }

      const oldOrder = item.order;

      // Сдвигаем другие элементы
      if (newOrder > oldOrder) {
        localCarouselItems.forEach(i => {
          if (i.order > oldOrder && i.order <= newOrder && i.id !== id) {
            i.order -= 1;
          }
        });
      } else if (newOrder < oldOrder) {
        localCarouselItems.forEach(i => {
          if (i.order >= newOrder && i.order < oldOrder && i.id !== id) {
            i.order += 1;
          }
        });
      }

      item.order = newOrder;
      item.updated_at = new Date().toISOString();

      return item;
    };

    if (isDemoMode()) {
      return updateOrderLocal();
    }
    try {
      return await api.put<CarouselItem>(`${CAROUSEL_ENDPOINT}/${id}/order`, { new_order: newOrder });
    } catch {
      return updateOrderLocal();
    }
  },

  /**
   * Получить только активные элементы (для публичной страницы)
   */
  async getActiveItems(): Promise<CarouselItem[]> {
    const getActiveLocal = () => localCarouselItems
      .filter(item => item.is_active)
      .sort((a, b) => a.order - b.order);

    if (isDemoMode()) {
      return getActiveLocal();
    }
    try {
      return await api.get<CarouselItem[]>(`${CAROUSEL_ENDPOINT}/active`);
    } catch {
      return getActiveLocal();
    }
  },
};
