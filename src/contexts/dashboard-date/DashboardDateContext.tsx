'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface DashboardDateContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isToday: boolean;
  resetToToday: () => void;
  dateParam: string;
}

const DashboardDateContext = createContext<DashboardDateContextType | undefined>(undefined);

export function DashboardDateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDateState] = useState<Date>(new Date());

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateState(date);
  }, []);

  const resetToToday = useCallback(() => {
    setSelectedDateState(new Date());
  }, []);

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  }, [selectedDate]);

  const dateParam = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const value = useMemo(
    () => ({
      selectedDate,
      setSelectedDate,
      isToday,
      resetToToday,
      dateParam,
    }),
    [selectedDate, setSelectedDate, isToday, resetToToday, dateParam]
  );

  return (
    <DashboardDateContext.Provider value={value}>
      {children}
    </DashboardDateContext.Provider>
  );
}

export function useDashboardDate() {
  const context = useContext(DashboardDateContext);
  if (!context) {
    throw new Error('useDashboardDate must be used within DashboardDateProvider');
  }
  return context;
}

export { DashboardDateContext };
