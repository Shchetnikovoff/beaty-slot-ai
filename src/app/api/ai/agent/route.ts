import { NextRequest, NextResponse } from 'next/server';

import { AGENT_MODELS, AI_MODELS, aiService, type AIModelId } from '@/services/ai.service';
import type { AIMessage, AIChatError } from '@/types/ai';
import type { AIAppContext } from '@/types/ai-tools';

// Проверка, является ли ошибка recoverable (можно попробовать другую модель)
const isRecoverableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('402') ||
      msg.includes('400') ||
      msg.includes('provider') ||
      msg.includes('spend limit') ||
      msg.includes('tool call id')
    );
  }
  return false;
};

// Попытка запроса с fallback на другие модели
async function tryWithFallback(
  fn: (modelId: AIModelId) => Promise<unknown>,
  primaryModel: AIModelId,
  maxRetries: number = 3
) {
  // Собираем список моделей для попыток (начиная с выбранной)
  const modelsToTry = [
    primaryModel,
    ...AGENT_MODELS.map((m) => m.id).filter((id) => id !== primaryModel),
  ].slice(0, maxRetries);

  let lastError: unknown = null;

  for (const modelId of modelsToTry) {
    try {
      console.log(`[AI Agent] Trying model: ${modelId}`);
      return await fn(modelId as AIModelId);
    } catch (error) {
      console.error(`[AI Agent] Model ${modelId} failed:`, error instanceof Error ? error.message : error);
      lastError = error;

      // Если ошибка не recoverable - сразу выбрасываем
      if (!isRecoverableError(error)) {
        throw error;
      }

      // Иначе пробуем следующую модель
      console.log(`[AI Agent] Falling back to next model...`);
    }
  }

  // Все модели упали - выбрасываем последнюю ошибку
  throw lastError;
}

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
      : AGENT_MODELS[0].id;

    let response;

    // Если есть результаты инструментов — продолжаем после их выполнения
    if (toolResults && Array.isArray(toolResults) && toolResults.length > 0) {
      response = await tryWithFallback(
        (modelId) =>
          aiService.continueAfterTools(
            messages as AIMessage[],
            toolResults,
            appContext,
            modelId
          ),
        selectedModel
      );
    } else {
      // Иначе — обычный запрос в agent mode с fallback
      response = await tryWithFallback(
        (modelId) =>
          aiService.agentChat(messages as AIMessage[], appContext, modelId),
        selectedModel
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[AI Agent] Final error after all retries:', error);

    // Обработка различных типов ошибок
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return NextResponse.json(
          {
            error: 'Все AI модели временно недоступны (лимит запросов). Попробуйте через минуту.',
            code: 'RATE_LIMIT',
          } as AIChatError,
          { status: 429 }
        );
      }

      if (errorMessage.includes('spend limit') || errorMessage.includes('402')) {
        return NextResponse.json(
          {
            error: 'AI сервис временно недоступен (лимит расходов). Попробуйте позже.',
            code: 'SPEND_LIMIT',
          } as AIChatError,
          { status: 402 }
        );
      }

      if (
        errorMessage.includes('api key') ||
        errorMessage.includes('authentication')
      ) {
        return NextResponse.json(
          {
            error: 'Ошибка авторизации AI сервиса',
            code: 'AUTH_ERROR',
          } as AIChatError,
          { status: 401 }
        );
      }

      // Ошибка провайдера (400 от OpenRouter)
      if (errorMessage.includes('provider') || errorMessage.includes('400')) {
        console.error('[AI Agent] Provider error details:', {
          message: error.message,
          // @ts-ignore - для отладки
          status: error.status,
          // @ts-ignore
          error: error.error,
        });
        return NextResponse.json(
          {
            error: 'Все AI модели вернули ошибки. Попробуйте упростить запрос.',
            code: 'PROVIDER_ERROR',
          } as AIChatError,
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Не удалось получить ответ от AI агента. Попробуйте позже.',
        code: 'INTERNAL_ERROR',
      } as AIChatError,
      { status: 500 }
    );
  }
}
