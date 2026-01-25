'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Статистика для отображения на странице
 */
export interface PageStat {
  title: string;
  value: string | number;
  diff?: number;
  period?: string;
  icon?: string;
}

/**
 * Данные таблицы на странице
 */
export interface PageTableData {
  columns?: string[];
  rows: any[];
  total?: number;
  selectedIds?: string[];
  filters?: Record<string, any>;
}

/**
 * Данные текущей страницы для AI-агента
 */
export interface PageData {
  pageType: 'dashboard' | 'clients' | 'orders' | 'products' | 'calendar' | 'notifications' | 'settings' | string;
  stats?: PageStat[];
  tableData?: PageTableData;
  metadata?: Record<string, any>;
}

interface PageDataContextType {
  pageData: PageData | null;
  setPageData: (data: PageData | null) => void;
  updateStats: (stats: PageStat[]) => void;
  updateTableData: (tableData: PageTableData) => void;
  clearPageData: () => void;
}

const PageDataContext = createContext<PageDataContextType | undefined>(undefined);

export function PageDataProvider({ children }: { children: ReactNode }) {
  const [pageData, setPageDataState] = useState<PageData | null>(null);

  const setPageData = useCallback((data: PageData | null) => {
    setPageDataState(data);
  }, []);

  const updateStats = useCallback((stats: PageStat[]) => {
    setPageDataState((prev) => {
      if (!prev) return { pageType: 'unknown', stats };
      return { ...prev, stats };
    });
  }, []);

  const updateTableData = useCallback((tableData: PageTableData) => {
    setPageDataState((prev) => {
      if (!prev) return { pageType: 'unknown', tableData };
      return { ...prev, tableData };
    });
  }, []);

  const clearPageData = useCallback(() => {
    setPageDataState(null);
  }, []);

  return (
    <PageDataContext.Provider
      value={{
        pageData,
        setPageData,
        updateStats,
        updateTableData,
        clearPageData,
      }}
    >
      {children}
    </PageDataContext.Provider>
  );
}

export function usePageData() {
  const context = useContext(PageDataContext);
  if (!context) {
    throw new Error('usePageData must be used within a PageDataProvider');
  }
  return context;
}

export { PageDataContext };
