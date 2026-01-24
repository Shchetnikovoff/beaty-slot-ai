import { NextRequest, NextResponse } from 'next/server';

import { AI_MODELS, aiService, type AIModelId } from '@/services/ai.service';
import type { AIMessage, AIChatError } from '@/types/ai';

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
    const { messages, model } = body;

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

    // Валидация каждого сообщения
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          {
            error: 'Каждое сообщение должно содержать role и content',
            code: 'INVALID_MESSAGE',
          } as AIChatError,
          { status: 400 }
        );
      }
    }

    // Валидация модели (если передана)
    const validModelIds = AI_MODELS.map((m) => m.id);
    const selectedModel: AIModelId = validModelIds.includes(model)
      ? model
      : validModelIds[0];

    // Вызов AI сервиса
    const response = await aiService.chat(
      messages as AIMessage[],
      selectedModel
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Chat error:', error);

    // Обработка различных типов ошибок
    if (error instanceof Error) {
      // Rate limiting
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'Превышен лимит запросов. Попробуйте позже.',
            code: 'RATE_LIMIT',
          } as AIChatError,
          { status: 429 }
        );
      }

      // API key issues
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
        error: 'Не удалось получить ответ от AI',
        code: 'INTERNAL_ERROR',
      } as AIChatError,
      { status: 500 }
    );
  }
}
