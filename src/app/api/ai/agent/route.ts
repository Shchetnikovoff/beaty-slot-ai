import { NextRequest, NextResponse } from 'next/server';

import { AI_MODELS, aiService, type AIModelId } from '@/services/ai.service';
import type { AIMessage, AIChatError } from '@/types/ai';
import type { AIAppContext } from '@/types/ai-tools';

export async function POST(request: NextRequest) {
  try {
    // Проверяем наличие API ключа
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI сервис не настроен. Добавьте OPENROUTER_API_KEY в .env.local',
          code: 'NO_API_KEY',
        } as AIChatError,
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages, model, context, toolResults } = body;

    // Валидация входных данных
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        {
          error: 'Требуется массив сообщений',
          code: 'INVALID_INPUT',
        } as AIChatError,
        { status: 400 }
      );
    }

    // Контекст приложения (по умолчанию)
    const appContext: AIAppContext = context || {
      currentPage: '/dashboard/default',
      userRole: 'admin',
    };

    // Валидация модели
    const validModelIds = AI_MODELS.map((m) => m.id);
    const selectedModel: AIModelId = validModelIds.includes(model)
      ? model
      : validModelIds[0];

    let response;

    // Если есть результаты инструментов — продолжаем после их выполнения
    if (toolResults && Array.isArray(toolResults) && toolResults.length > 0) {
      response = await aiService.continueAfterTools(
        messages as AIMessage[],
        toolResults,
        appContext,
        selectedModel
      );
    } else {
      // Иначе — обычный запрос в agent mode
      response = await aiService.agentChat(
        messages as AIMessage[],
        appContext,
        selectedModel
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Agent error:', error);

    // Обработка различных типов ошибок
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'Превышен лимит запросов. Попробуйте позже.',
            code: 'RATE_LIMIT',
          } as AIChatError,
          { status: 429 }
        );
      }

      if (
        error.message.includes('API key') ||
        error.message.includes('authentication')
      ) {
        return NextResponse.json(
          {
            error: 'Ошибка авторизации AI сервиса',
            code: 'AUTH_ERROR',
          } as AIChatError,
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Не удалось получить ответ от AI агента',
        code: 'INTERNAL_ERROR',
      } as AIChatError,
      { status: 500 }
    );
  }
}
