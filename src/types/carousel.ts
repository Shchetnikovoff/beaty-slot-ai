/**
 * Типы для функционала карусели
 */

export interface CarouselItem {
  id: number;
  image_url: string;
  pdf_url: string;
  pdf_images_urls: string[];
  title: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarouselItemCreate {
  image: File;
  document: File;
  title?: string;
}

export interface CarouselItemUpdate {
  image?: File;
  document?: File;
  title?: string;
  order?: number;
  is_active?: boolean;
}

export interface CarouselListResponse {
  items: CarouselItem[];
  total: number;
}
