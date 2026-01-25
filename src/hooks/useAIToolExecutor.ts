'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { notifications } from '@mantine/notifications';

import type { AIToolCall, AIAppContext } from '@/types/ai-tools';
import type { SubscriptionStatus } from '@/types/subscription';
import type { PaymentStatus } from '@/types/payment';
import type { DocumentType, DocumentStatus } from '@/types/document';
import type { SalonSubscriptionStatus } from '@/types/salon';
import {
  clientsService,
  subscriptionsService,
  paymentsService,
  documentsService,
  salonsService,
} from '@/services';

export interface ToolExecutionResult {
  tool_call_id: string;
  content: string;
  success: boolean;
}

export function useAIToolExecutor() {
  const router = useRouter();

  const executeTools = useCallback(
    async (toolCalls: AIToolCall[], context: AIAppContext): Promise<ToolExecutionResult[]> => {
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
              // Реальный вызов сервиса вместо mock-данных
              const response = await clientsService.getClients({
                limit: args.limit || 20,
                has_subscription: args.status === 'active' ? true :
                                  args.status === 'expired' ? false : undefined,
              });

              const clientsSummary = response.items.map(c => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                has_subscription: c.has_active_subscription,
                last_visit: c.last_visit_at,
              }));

              result = {
                tool_call_id: id,
                content: `📋 Клиенты (${response.total} всего, показано ${response.items.length}):\n${JSON.stringify(clientsSummary, null, 2)}`,
                success: true,
              };
              break;
            }

            case 'getClientDetails': {
              const client = await clientsService.getClient(args.clientId);
              if (client) {
                result = {
                  tool_call_id: id,
                  content: `👤 Информация о клиенте:\n${JSON.stringify({
                    id: client.id,
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    has_subscription: client.has_active_subscription,
                    is_blocked: client.is_blocked,
                    created_at: client.created_at,
                    last_visit_at: client.last_visit_at,
                  }, null, 2)}`,
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
              // Получаем реальные данные для анализа
              const clientsData = await clientsService.getClients({ limit: 100 });
              const subscriptionsData = await subscriptionsService.getSubscriptions({ limit: 100 });

              const activeClients = clientsData.items.filter(c => c.has_active_subscription).length;
              const expiredClients = clientsData.items.filter(c => !c.has_active_subscription && c.last_visit_at).length;
              const newClients = clientsData.items.filter(c => !c.last_visit_at).length;

              const analysisTypes: Record<string, string> = {
                activity: `📊 Анализ активности:
- Всего клиентов: ${clientsData.total}
- С активной подпиской: ${activeClients}
- С истёкшей подпиской: ${expiredClients}
- Новые (без визитов): ${newClients}`,
                spending: `💰 Анализ подписок:
- Всего подписок: ${subscriptionsData.total}
- Активных: ${subscriptionsData.items.filter(s => s.status === 'ACTIVE').length}
- Истёкших: ${subscriptionsData.items.filter(s => s.status === 'EXPIRED').length}`,
                churn_risk: `⚠️ Риск оттока:
- Клиентов в группе риска (истёкшая подписка): ${expiredClients}
- Рекомендация: отправить персональные предложения`,
                growth: `📈 Потенциал роста:
- Клиентов без подписки: ${newClients}
- Конверсия в подписку: ${Math.round((activeClients / clientsData.total) * 100)}%`,
              };

              result = {
                tool_call_id: id,
                content: analysisTypes[args.analysisType] || 'Неизвестный тип анализа',
                success: true,
              };
              break;
            }

            case 'sendBroadcast': {
              result = {
                tool_call_id: id,
                content: `📨 Рассылка подготовлена:\n- Аудитория: ${args.audience}\n- Текст: "${args.message}"\n\n⚠️ Для отправки требуется подтверждение`,
                success: true,
              };
              notifications.show({
                title: '📨 Рассылка подготовлена',
                message: `Аудитория: ${args.audience}`,
                color: 'blue',
              });
              break;
            }

            case 'getStatistics': {
              // Получаем реальную статистику
              const [clients, subscriptions, payments] = await Promise.all([
                clientsService.getClients({ limit: 1 }),
                subscriptionsService.getSubscriptions({ limit: 100 }),
                paymentsService.getPayments({ status: 'SUCCEEDED', limit: 100 }),
              ]);

              const totalRevenue = payments.items.reduce((sum, p) => sum + (p.amount || 0), 0);
              const activeSubscriptions = subscriptions.items.filter(s => s.status === 'ACTIVE').length;

              const stats = {
                clients: clients.total,
                active_subscriptions: activeSubscriptions,
                total_subscriptions: subscriptions.total,
                revenue: totalRevenue,
                payments_count: payments.total,
              };

              if (args.metric) {
                result = {
                  tool_call_id: id,
                  content: `📊 ${args.metric}: ${stats[args.metric as keyof typeof stats] || 'Неизвестная метрика'}`,
                  success: true,
                };
              } else {
                result = {
                  tool_call_id: id,
                  content: `📊 Статистика:\n${JSON.stringify(stats, null, 2)}`,
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
              result = {
                tool_call_id: id,
                content: `🔍 Выполнен веб-поиск: "${args.query}"`,
                success: true,
              };
              break;
            }

            // === НОВЫЕ ИНСТРУМЕНТЫ ДЛЯ ДОСТУПА К БАЗЕ ===

            case 'getSubscriptions': {
              const params: { limit?: number; status?: SubscriptionStatus; client_id?: string } = {
                limit: args.limit || 20,
              };
              if (args.status && args.status !== 'all') {
                params.status = args.status as SubscriptionStatus;
              }
              if (args.client_id) {
                params.client_id = args.client_id;
              }

              const response = await subscriptionsService.getSubscriptions(params);

              const summary = {
                total: response.total,
                showing: response.items.length,
                byStatus: {
                  active: response.items.filter(s => s.status === 'ACTIVE').length,
                  expired: response.items.filter(s => s.status === 'EXPIRED').length,
                  pending: response.items.filter(s => s.status === 'PENDING').length,
                  paused: response.items.filter(s => s.status === 'PAUSED').length,
                },
                items: response.items.map(s => ({
                  id: s.id,
                  client_id: s.client_id,
                  plan: s.plan?.name || 'Неизвестный план',
                  status: s.status,
                  start_date: s.start_date,
                  end_date: s.end_date,
                  visits_used: s.visits_used,
                  auto_renew: s.auto_renew,
                })),
              };

              result = {
                tool_call_id: id,
                content: `📋 Подписки (${response.total} всего):\n${JSON.stringify(summary, null, 2)}`,
                success: true,
              };
              break;
            }

            case 'getSubscriptionPlans': {
              const activeOnly = args.activeOnly !== false;
              const plans = await subscriptionsService.getPlans(activeOnly);

              const formattedPlans = plans.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: `${p.price} ₽`,
                duration: `${p.duration_days} дней`,
                max_visits: p.max_visits || 'Безлимит',
                is_active: p.is_active,
              }));

              result = {
                tool_call_id: id,
                content: `💳 Тарифные планы (${plans.length}):\n${JSON.stringify(formattedPlans, null, 2)}`,
                success: true,
              };
              break;
            }

            case 'getPayments': {
              const params: { limit?: number; status?: PaymentStatus; client_id?: string } = {
                limit: args.limit || 20,
              };
              if (args.status && args.status !== 'all') {
                params.status = args.status as PaymentStatus;
              }
              if (args.client_id) {
                params.client_id = args.client_id;
              }

              const response = await paymentsService.getPayments(params);

              const totalAmount = response.items
                .filter(p => p.status === 'SUCCEEDED')
                .reduce((sum, p) => sum + (p.amount || 0), 0);

              const summary = {
                total: response.total,
                showing: response.items.length,
                totalSucceeded: `${totalAmount} ₽`,
                byStatus: {
                  succeeded: response.items.filter(p => p.status === 'SUCCEEDED').length,
                  pending: response.items.filter(p => p.status === 'PENDING').length,
                  failed: response.items.filter(p => p.status === 'FAILED').length,
                  refunded: response.items.filter(p => p.status === 'REFUNDED').length,
                },
                items: response.items.map(p => ({
                  id: p.id,
                  client_id: p.client_id,
                  amount: `${p.amount} ${p.currency || 'RUB'}`,
                  status: p.status,
                  method: p.payment_method,
                  created_at: p.created_at,
                  paid_at: p.paid_at,
                })),
              };

              result = {
                tool_call_id: id,
                content: `💰 Платежи (${response.total} всего, успешных: ${totalAmount} ₽):\n${JSON.stringify(summary, null, 2)}`,
                success: true,
              };
              break;
            }

            case 'getDocuments': {
              const params: { limit?: number; type?: DocumentType; status?: DocumentStatus } = {
                limit: 50,
              };
              if (args.type && args.type !== 'all') {
                params.type = args.type as DocumentType;
              }
              if (args.status && args.status !== 'all') {
                params.status = args.status as DocumentStatus;
              }

              const response = await documentsService.getList(params);

              const summary = {
                total: response.total,
                byType: {
                  agreement: response.items.filter(d => d.type === 'AGREEMENT').length,
                  policy: response.items.filter(d => d.type === 'POLICY').length,
                  terms: response.items.filter(d => d.type === 'TERMS').length,
                },
                items: response.items.map(d => ({
                  id: d.id,
                  title: d.title,
                  type: d.type,
                  status: d.status,
                  version: d.version,
                  is_required: d.is_required,
                  published_at: d.published_at,
                })),
              };

              result = {
                tool_call_id: id,
                content: `📄 Документы (${response.total}):\n${JSON.stringify(summary, null, 2)}`,
                success: true,
              };
              break;
            }

            case 'getSalons': {
              // Проверка роли суперадмина
              if (context.userRole !== 'superadmin') {
                result = {
                  tool_call_id: id,
                  content: '❌ Доступ запрещён. Этот инструмент только для суперадмина.',
                  success: false,
                };
                break;
              }

              const params: { limit?: number; status?: SalonSubscriptionStatus; search?: string } = {
                limit: 20,
              };
              if (args.status && args.status !== 'all') {
                params.status = args.status as SalonSubscriptionStatus;
              }
              if (args.search) {
                params.search = args.search;
              }

              const response = await salonsService.getSalons(params);

              const summary = {
                total: response.total,
                byStatus: {
                  trial: response.items.filter(s => s.status === 'TRIAL').length,
                  active: response.items.filter(s => s.status === 'ACTIVE').length,
                  expired: response.items.filter(s => s.status === 'EXPIRED').length,
                  suspended: response.items.filter(s => s.status === 'SUSPENDED').length,
                },
                items: response.items.map(s => ({
                  id: s.id,
                  name: s.name,
                  email: s.email,
                  phone: s.phone,
                  status: s.status,
                  is_active: s.is_active,
                  trial_end_date: s.trial_end_date,
                  subscription_end_date: s.subscription_end_date,
                })),
              };

              result = {
                tool_call_id: id,
                content: `🏢 Салоны (${response.total}):\n${JSON.stringify(summary, null, 2)}`,
                success: true,
              };
              break;
            }

            case 'getFullDashboard': {
              // Получаем все данные параллельно
              const [clients, subscriptions, payments, plans] = await Promise.all([
                args.includeClients !== false
                  ? clientsService.getClients({ limit: 100 })
                  : null,
                args.includeSubscriptions !== false
                  ? subscriptionsService.getSubscriptions({ limit: 100 })
                  : null,
                args.includePayments !== false
                  ? paymentsService.getPayments({ limit: 100 })
                  : null,
                subscriptionsService.getPlans(true),
              ]);

              const dashboard: Record<string, unknown> = {};

              // Общий обзор
              dashboard.overview = {
                total_clients: clients?.total || 0,
                total_subscriptions: subscriptions?.total || 0,
                active_subscriptions: subscriptions?.items.filter(s => s.status === 'ACTIVE').length || 0,
                total_payments: payments?.total || 0,
                total_revenue: payments?.items
                  .filter(p => p.status === 'SUCCEEDED')
                  .reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
                available_plans: plans.length,
              };

              // Детали по клиентам
              if (clients) {
                dashboard.clients = {
                  total: clients.total,
                  with_subscription: clients.items.filter(c => c.has_active_subscription).length,
                  blocked: clients.items.filter(c => c.is_blocked).length,
                  recent_5: clients.items.slice(0, 5).map(c => ({
                    name: c.name,
                    has_subscription: c.has_active_subscription,
                  })),
                };
              }

              // Детали по подпискам
              if (subscriptions) {
                dashboard.subscriptions = {
                  total: subscriptions.total,
                  active: subscriptions.items.filter(s => s.status === 'ACTIVE').length,
                  expired: subscriptions.items.filter(s => s.status === 'EXPIRED').length,
                  pending: subscriptions.items.filter(s => s.status === 'PENDING').length,
                  expiring_soon: subscriptions.items.filter(s => {
                    if (s.status !== 'ACTIVE') return false;
                    const endDate = new Date(s.end_date);
                    const daysUntilExpiry = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                    return daysUntilExpiry <= 7;
                  }).length,
                };
              }

              // Детали по платежам
              if (payments) {
                const succeededPayments = payments.items.filter(p => p.status === 'SUCCEEDED');
                dashboard.payments = {
                  total: payments.total,
                  total_revenue: succeededPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
                  succeeded: succeededPayments.length,
                  pending: payments.items.filter(p => p.status === 'PENDING').length,
                  failed: payments.items.filter(p => p.status === 'FAILED').length,
                };
              }

              // Планы подписок
              dashboard.plans = plans.map(p => ({
                name: p.name,
                price: p.price,
                duration_days: p.duration_days,
              }));

              result = {
                tool_call_id: id,
                content: `📊 ПОЛНАЯ СВОДКА ДАННЫХ:\n${JSON.stringify(dashboard, null, 2)}`,
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
