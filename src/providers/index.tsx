import React from 'react';
import { ThemeCustomizerProvider } from '@/contexts/theme-customizer';
import { SystemNotificationsProvider } from '@/contexts/system-notifications';
import { AuthProvider } from '@/contexts/auth-context';
import { PageDataProvider } from '@/contexts/page-data';
import { ChatHistoryProvider } from '@/contexts/chat-history';
import { DashboardDateProvider } from '@/contexts/dashboard-date';
import { ThemeProvider } from '@/providers/theme';
import { DirectionProvider } from '@mantine/core';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <DirectionProvider>
      <SystemNotificationsProvider>
        <ThemeCustomizerProvider>
          <ThemeProvider>
            <AuthProvider>
              <DashboardDateProvider>
                <ChatHistoryProvider>
                  <PageDataProvider>{children}</PageDataProvider>
                </ChatHistoryProvider>
              </DashboardDateProvider>
            </AuthProvider>
          </ThemeProvider>
        </ThemeCustomizerProvider>
      </SystemNotificationsProvider>
    </DirectionProvider>
  );
};
