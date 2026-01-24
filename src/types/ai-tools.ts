/**
 * AI Tools - функции, которые AI может вызывать
 */

// Определение инструментов для AI
export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

// Результат выполнения инструмента
export interface AIToolResult {
  tool_call_id: string;
  content: string;
}

// Вызов инструмента от AI
export interface AIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// Контекст приложения для AI
export interface AIAppContext {
  currentPage: string;
  selectedClientId?: string;
  selectedData?: unknown;
  userRole: 'admin' | 'superadmin';
}

// Доступные инструменты
export const AI_TOOLS: AITool[] = [
  {
    type: 'function',
    function: {
      name: 'navigate',
      description: 'Перейти на другую страницу приложения',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            description: 'Путь страницы',
            enum: [
              '/dashboard/default',
              '/apps/customers',
              '/apps/orders',
              '/apps/products',
              '/apps/calendar',
              '/apps/notifications',
              '/apps/settings',
            ],
          },
        },
        required: ['page'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getClients',
      description: 'Получить список клиентов салона с фильтрацией',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Фильтр по статусу подписки',
            enum: ['all', 'active', 'expired', 'never'],
          },
          limit: {
            type: 'number',
            description: 'Максимальное количество клиентов (по умолчанию 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getClientDetails',
      description: 'Получить детальную информацию о клиенте',
      parameters: {
        type: 'object',
        properties: {
          clientId: {
            type: 'string',
            description: 'ID клиента',
          },
        },
        required: ['clientId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyzeClients',
      description: 'Проанализировать данные клиентов и дать рекомендации',
      parameters: {
        type: 'object',
        properties: {
          analysisType: {
            type: 'string',
            description: 'Тип анализа',
            enum: ['activity', 'spending', 'churn_risk', 'growth'],
          },
        },
        required: ['analysisType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sendBroadcast',
      description: 'Отправить рассылку клиентам через Telegram',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Текст сообщения для рассылки',
          },
          audience: {
            type: 'string',
            description: 'Целевая аудитория',
            enum: ['all', 'active_subscribers', 'expired_subscribers', 'new_clients'],
          },
        },
        required: ['message', 'audience'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getStatistics',
      description: 'Получить статистику салона',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description: 'Период статистики',
            enum: ['today', 'week', 'month', 'year'],
          },
          metric: {
            type: 'string',
            description: 'Тип метрики',
            enum: ['revenue', 'clients', 'subscriptions', 'visits'],
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'showNotification',
      description: 'Показать уведомление пользователю',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Заголовок уведомления',
          },
          message: {
            type: 'string',
            description: 'Текст уведомления',
          },
          type: {
            type: 'string',
            description: 'Тип уведомления',
            enum: ['success', 'error', 'warning', 'info'],
          },
        },
        required: ['title', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'openModal',
      description: 'Открыть модальное окно',
      parameters: {
        type: 'object',
        properties: {
          modal: {
            type: 'string',
            description: 'Название модального окна',
            enum: ['addClient', 'editClient', 'sendBroadcast', 'settings'],
          },
          data: {
            type: 'string',
            description: 'JSON данные для модального окна',
          },
        },
        required: ['modal'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchWeb',
      description: 'Поиск информации в интернете',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Поисковый запрос',
          },
        },
        required: ['query'],
      },
    },
  },
];

// Названия инструментов для типизации
export type AIToolName = typeof AI_TOOLS[number]['function']['name'];
