'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { notifications } from '@mantine/notifications';

import type { AIToolCall } from '@/types/ai-tools';

// Мок-данные для демонстрации (замените на реальные API вызовы)
const mockClients = [
  { id: '1', name: 'Анна Иванова', phone: '+7 999 123-45-67', status: 'active', totalSpent: 15000 },
  { id: '2', name: 'Мария Петрова', phone: '+7 999 234-56-78', status: 'active', totalSpent: 28000 },
  { id: '3', name: 'Елена Сидорова', phone: '+7 999 345-67-89', status: 'expired', totalSpent: 8000 },
  { id: '4', name: 'Ольга Козлова', phone: '+7 999 456-78-90', status: 'active', totalSpent: 42000 },
  { id: '5', name: 'Наталья Новикова', phone: '+7 999 567-89-01', status: 'never', totalSpent: 0 },
];

const mockStatistics = {
  today: { revenue: 15000, clients: 8, subscriptions: 3, visits: 12 },
  week: { revenue: 85000, clients: 45, subscriptions: 15, visits: 78 },
  month: { revenue: 320000, clients: 180, subscriptions: 52, visits: 290 },
  year: { revenue: 3800000, clients: 1200, subscriptions: 480, visits: 3200 },
};

export interface ToolExecutionResult {
  tool_call_id: string;
  content: string;
  success: boolean;
}

export function useAIToolExecutor() {
  const router = useRouter();

  const executeTools = useCallback(
    async (toolCalls: AIToolCall[]): Promise<ToolExecutionResult[]> => {
      const results: ToolExecutionResult[] = [];

      for (const toolCall of toolCalls) {
        const { id, function: func } = toolCall;
        const args = JSON.parse(func.arguments || '{}');

        let result: ToolExecutionResult;

        try {
          switch (func.name) {
            case 'navigate': {
              router.push(args.page);
              result = {
                tool_call_id: id,
                content: `✅ Выполнен переход на страницу: ${args.page}`,
                success: true,
              };
              break;
            }

            case 'getClients': {
              let clients = [...mockClients];
              if (args.status && args.status !== 'all') {
                clients = clients.filter((c) => c.status === args.status);
              }
              if (args.limit) {
                clients = clients.slice(0, args.limit);
              }
              result = {
                tool_call_id: id,
                content: `📋 Найдено клиентов: ${clients.length}\n\n${JSON.stringify(clients, null, 2)}`,
                success: true,
              };
              break;
            }

            case 'getClientDetails': {
              const client = mockClients.find((c) => c.id === args.clientId);
              if (client) {
                result = {
                  tool_call_id: id,
                  content: `👤 Информация о клиенте:\n${JSON.stringify(client, null, 2)}`,
                  success: true,
                };
              } else {
                result = {
                  tool_call_id: id,
                  content: `❌ Клиент с ID ${args.clientId} не найден`,
                  success: false,
                };
              }
              break;
            }

            case 'analyzeClients': {
              const analysisTypes: Record<string, string> = {
                activity: `📊 Анализ активности:
- Активных клиентов: ${mockClients.filter((c) => c.status === 'active').length}
- С истёкшей подпиской: ${mockClients.filter((c) => c.status === 'expired').length}
- Без подписки: ${mockClients.filter((c) => c.status === 'never').length}`,
                spending: `💰 Анализ расходов:
- Топ клиент: ${mockClients.sort((a, b) => b.totalSpent - a.totalSpent)[0].name} (${mockClients[0].totalSpent}₽)
- Средний чек: ${Math.round(mockClients.reduce((sum, c) => sum + c.totalSpent, 0) / mockClients.length)}₽`,
                churn_risk: `⚠️ Риск оттока:
- Клиентов в группе риска: ${mockClients.filter((c) => c.status === 'expired').length}
- Рекомендация: отправить персональные предложения`,
                growth: `📈 Потенциал роста:
- Новых клиентов за месяц: 15
- Конверсия в подписку: 35%`,
              };
              result = {
                tool_call_id: id,
                content: analysisTypes[args.analysisType] || 'Неизвестный тип анализа',
                success: true,
              };
              break;
            }

            case 'sendBroadcast': {
              // В реальном приложении здесь будет API вызов
              result = {
                tool_call_id: id,
                content: `📨 Рассылка подготовлена:\n- Аудитория: ${args.audience}\n- Текст: "${args.message}"\n\n⚠️ Для отправки требуется подтверждение`,
                success: true,
              };
              // Показываем уведомление
              notifications.show({
                title: '📨 Рассылка подготовлена',
                message: `Аудитория: ${args.audience}`,
                color: 'blue',
              });
              break;
            }

            case 'getStatistics': {
              const period = args.period as keyof typeof mockStatistics;
              const stats = mockStatistics[period];
              const metric = args.metric;

              if (metric) {
                result = {
                  tool_call_id: id,
                  content: `📊 ${metric} за ${period}: ${stats[metric as keyof typeof stats]}`,
                  success: true,
                };
              } else {
                result = {
                  tool_call_id: id,
                  content: `📊 Статистика за ${period}:\n${JSON.stringify(stats, null, 2)}`,
                  success: true,
                };
              }
              break;
            }

            case 'showNotification': {
              const colorMap: Record<string, string> = {
                success: 'green',
                error: 'red',
                warning: 'yellow',
                info: 'blue',
              };
              notifications.show({
                title: args.title,
                message: args.message,
                color: colorMap[args.type] || 'blue',
              });
              result = {
                tool_call_id: id,
                content: `✅ Уведомление показано: "${args.title}"`,
                success: true,
              };
              break;
            }

            case 'openModal': {
              // В реальном приложении здесь будет вызов модального окна
              result = {
                tool_call_id: id,
                content: `🔲 Модальное окно "${args.modal}" открыто`,
                success: true,
              };
              notifications.show({
                title: '🔲 Модальное окно',
                message: `Открыто: ${args.modal}`,
                color: 'violet',
              });
              break;
            }

            case 'searchWeb': {
              // Веб-поиск обрабатывается через плагин OpenRouter
              result = {
                tool_call_id: id,
                content: `🔍 Выполнен веб-поиск: "${args.query}"`,
                success: true,
              };
              break;
            }

            default: {
              result = {
                tool_call_id: id,
                content: `❌ Неизвестный инструмент: ${func.name}`,
                success: false,
              };
            }
          }
        } catch (error) {
          result = {
            tool_call_id: id,
            content: `❌ Ошибка выполнения ${func.name}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            success: false,
          };
        }

        results.push(result);
      }

      return results;
    },
    [router]
  );

  return { executeTools };
}
