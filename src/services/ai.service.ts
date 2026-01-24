/**
 * AI Service - интеграция с AI моделями через OpenRouter
 * С поддержкой Agent Mode (function calling)
 */

import OpenAI from 'openai';

import type { AIMessage, AIResponse, AIAgentResponse } from '@/types/ai';
import { AI_TOOLS, type AIAppContext, type AIToolCall } from '@/types/ai-tools';

// Создаём клиент только на сервере
const createOpenAIClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('AI service can only be used on the server');
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://beauty-slot.ru',
      'X-Title': 'Beauty Slot Admin',
    },
  });
};

// Модели OpenRouter (24.01.2026)
// Разные модели для разных режимов:
// - Для agent mode (tools) нужны модели с поддержкой function calling
// - Для chat mode можно использовать thinking модели

// Модели с поддержкой tools (для agent mode)
// Проверено 24.01.2026 - эти модели работают с function calling
export const AGENT_MODELS = [
  {
    id: 'mistralai/devstral-2512:free',
    name: 'Mistral Devstral 🔧',
    description: 'Быстрый, кодинг + tools',
    speed: 'fast',
    supportsTools: true,
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air 🔧',
    description: 'Reasoning + tools',
    speed: 'fast',
    supportsTools: true,
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder 🔧',
    description: 'Кодинг + tools (480B)',
    speed: 'slow',
    supportsTools: true,
  },
] as const;

// Модели для простого чата (thinking models)
// Проверено 24.01.2026 - эти модели работают для чата
export const CHAT_MODELS = [
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 🧠',
    description: 'Thinking модель',
    speed: 'slow',
    supportsTools: false,
  },
  {
    id: 'tngtech/deepseek-r1t2-chimera:free',
    name: 'DeepSeek R1T2 🧠',
    description: 'Thinking Chimera',
    speed: 'slow',
    supportsTools: false,
  },
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'NVIDIA Nemotron 🧠',
    description: 'Быстрая reasoning',
    speed: 'fast',
    supportsTools: false,
  },
] as const;

// Все модели для выбора в UI
export const AI_MODELS = [...AGENT_MODELS, ...CHAT_MODELS] as const;

// Включить веб-поиск для всех моделей
export const WEB_SEARCH_ENABLED = true;

export type AIModelId = (typeof AI_MODELS)[number]['id'];
export type AgentModelId = (typeof AGENT_MODELS)[number]['id'];
export type ChatModelId = (typeof CHAT_MODELS)[number]['id'];

const DEFAULT_CHAT_MODEL: ChatModelId = 'deepseek/deepseek-r1-0528:free';
const DEFAULT_AGENT_MODEL: AgentModelId = 'mistralai/devstral-2512:free';

// Проверка поддержки tools моделью
const modelSupportsTools = (modelId: string): boolean => {
  return AGENT_MODELS.some(m => m.id === modelId);
};

// Динамический системный промпт с текущей датой
const getSystemPrompt = (context?: AIAppContext) => {
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const contextInfo = context
    ? `\n\nКонтекст приложения:
- Текущая страница: ${context.currentPage}
- Роль пользователя: ${context.userRole}
${context.selectedClientId ? `- Выбранный клиент: ${context.selectedClientId}` : ''}`
    : '';

  return `Ты — AI-агент салона красоты Beauty Slot. Сегодня ${today}.

ВАЖНО: У тебя есть ИНСТРУМЕНТЫ (tools) для выполнения действий. ВСЕГДА используй их!

Доступные инструменты:
- navigate: переход на страницу (page: /dashboard, /apps/customers, /apps/settings и др.)
- getClients: получение списка клиентов (status: all/active/expired, limit: число)
- getClientDetails: детали клиента (clientId)
- analyzeClients: анализ клиентов (analysisType: activity/spending/churn_risk/growth)
- sendBroadcast: рассылка (audience: all/active/expired, message: текст)
- getStatistics: статистика (period: today/week/month/year, metric: revenue/clients/subscriptions/visits)
- showNotification: показать уведомление (type: success/error/warning/info, title, message)
- openModal: открыть модальное окно (modal: addClient/editClient/broadcast/settings)

Правила:
1. ВСЕГДА вызывай инструменты для действий, не пиши текст вместо действия
2. Отвечай кратко на русском
3. После вызова инструмента дай краткое подтверждение${contextInfo}`;
};

/**
 * Извлекает reasoning из ответа модели
 */
const parseReasoningFromContent = (
  content: string
): { cleanContent: string; reasoning?: string } => {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  const reasoning = thinkMatch ? thinkMatch[1].trim() : undefined;
  const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  return { cleanContent, reasoning };
};

export const aiService = {
  /**
   * Основной метод чата с AI (простой режим без tools)
   */
  async chat(
    messages: AIMessage[],
    modelId: AIModelId = DEFAULT_CHAT_MODEL
  ): Promise<AIResponse> {
    const openai = createOpenAIClient();

    // Приводим сообщения к формату OpenAI
    const formattedMessages = messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    // OpenRouter поддерживает plugins для веб-поиска (не в типах OpenAI SDK)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestParams: any = {
      model: modelId,
      messages: [
        {
          role: 'system' as const,
          content: getSystemPrompt(),
        },
        ...formattedMessages,
      ],
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.95,
    };

    if (WEB_SEARCH_ENABLED) {
      requestParams.plugins = [{ id: 'web', max_results: 3 }];
    }

    const completion = await openai.chat.completions.create(requestParams);

    const rawContent = completion.choices[0]?.message?.content || '';
    const { cleanContent, reasoning } = parseReasoningFromContent(rawContent);

    return {
      content: cleanContent,
      reasoning,
    };
  },

  /**
   * Agent Mode - чат с поддержкой инструментов (function calling)
   * ВАЖНО: Требует модель с поддержкой tools!
   */
  async agentChat(
    messages: AIMessage[],
    context: AIAppContext,
    modelId: AIModelId = DEFAULT_AGENT_MODEL
  ): Promise<AIAgentResponse> {
    const openai = createOpenAIClient();

    // Если переданная модель не поддерживает tools - используем дефолтную agent-модель
    const effectiveModelId = modelSupportsTools(modelId) ? modelId : DEFAULT_AGENT_MODEL;

    // Приводим сообщения к формату OpenAI
    const formattedMessages = messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    // OpenRouter поддерживает tools и plugins (не все в типах OpenAI SDK)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestParams: any = {
      model: effectiveModelId,
      messages: [
        {
          role: 'system' as const,
          content: getSystemPrompt(context),
        },
        ...formattedMessages,
      ],
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.95,
      tools: AI_TOOLS,
      tool_choice: 'auto',
    };

    // НЕ включаем web search для agent mode - чтобы модель использовала наши tools
    // if (WEB_SEARCH_ENABLED) {
    //   requestParams.plugins = [{ id: 'web', max_results: 3 }];
    // }

    const completion = await openai.chat.completions.create(requestParams);

    const message = completion.choices[0]?.message;
    const rawContent = message?.content || '';
    const { cleanContent, reasoning } = parseReasoningFromContent(rawContent);

    // Извлекаем вызовы инструментов
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCalls: AIToolCall[] = (message?.tool_calls as any[])?.map((tc) => ({
      id: tc.id,
      type: 'function' as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    })) || [];

    return {
      content: cleanContent,
      reasoning,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      requiresAction: toolCalls.length > 0,
    };
  },

  /**
   * Продолжение диалога после выполнения инструментов
   * ВАЖНО: Требует модель с поддержкой tools!
   */
  async continueAfterTools(
    messages: AIMessage[],
    toolResults: Array<{ tool_call_id: string; content: string }>,
    context: AIAppContext,
    modelId: AIModelId = DEFAULT_AGENT_MODEL
  ): Promise<AIAgentResponse> {
    const openai = createOpenAIClient();

    // Если переданная модель не поддерживает tools - используем дефолтную agent-модель
    const effectiveModelId = modelSupportsTools(modelId) ? modelId : DEFAULT_AGENT_MODEL;

    // Приводим базовые сообщения к формату OpenAI
    const formattedMessages = messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
    }));

    // Добавляем результаты инструментов
    const toolResultMessages = toolResults.map((result) => ({
      role: 'tool' as const,
      tool_call_id: result.tool_call_id,
      content: result.content,
    }));

    // @ts-ignore - OpenRouter tools не в типах OpenAI SDK
    const completion = await openai.chat.completions.create({
      model: effectiveModelId,
      messages: [
        {
          role: 'system' as const,
          content: getSystemPrompt(context),
        },
        ...formattedMessages,
        ...toolResultMessages,
      ],
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.95,
      tools: AI_TOOLS,
      tool_choice: 'auto',
    });

    const message = completion.choices[0]?.message;
    const rawContent = message?.content || '';
    const { cleanContent, reasoning } = parseReasoningFromContent(rawContent);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCalls: AIToolCall[] = (message?.tool_calls as any[])?.map((tc) => ({
      id: tc.id,
      type: 'function' as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    })) || [];

    return {
      content: cleanContent,
      reasoning,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      requiresAction: toolCalls.length > 0,
    };
  },

  /**
   * Анализ данных клиентов
   */
  async analyzeClients(clientsData: unknown[]): Promise<AIResponse> {
    return this.chat([
      {
        role: 'user',
        content: `Проанализируй данные клиентов салона и дай рекомендации:

${JSON.stringify(clientsData.slice(0, 10), null, 2)}

Дай краткий анализ:
1. 📊 Общая картина активности
2. 💰 Топ клиенты по тратам
3. 💡 Рекомендации по удержанию
4. ⚠️ Клиенты в группе риска (если есть)`,
      },
    ]);
  },

  /**
   * Генерация текста рассылки для Telegram
   */
  async generateBroadcast(
    topic: string,
    audience: string
  ): Promise<AIResponse> {
    return this.chat([
      {
        role: 'user',
        content: `Напиши текст рассылки для Telegram:
Тема: ${topic}
Аудитория: ${audience}

Требования:
- Краткий и привлекательный текст (до 500 символов)
- Эмодзи для визуального оформления
- Призыв к действию в конце
- Учитывай, что это салон красоты Beauty Slot`,
      },
    ]);
  },

  /**
   * Генерация идей для акций
   */
  async generatePromoIdeas(context?: string): Promise<AIResponse> {
    return this.chat([
      {
        role: 'user',
        content: `Предложи 3-5 идей для акций в салоне красоты:
${context ? `Контекст: ${context}` : ''}

Для каждой идеи укажи:
- 🎯 Название акции
- 📝 Краткое описание
- 👥 Целевая аудитория
- 📅 Рекомендуемый период`,
      },
    ]);
  },

  /**
   * Помощь с интерфейсом
   */
  async getUIHelp(question: string): Promise<AIResponse> {
    return this.chat([
      {
        role: 'user',
        content: `Вопрос по интерфейсу Beauty Slot Admin: ${question}

Дай понятную пошаговую инструкцию.`,
      },
    ]);
  },
};

export type AIService = typeof aiService;
