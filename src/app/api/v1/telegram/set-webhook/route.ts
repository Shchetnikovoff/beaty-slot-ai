import { NextRequest, NextResponse } from 'next/server';
import { telegramBot } from '@/lib/telegram-bot';

/**
 * POST /api/v1/telegram/set-webhook
 * Установить webhook для Telegram бота
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { url } = body;

    // Если URL не указан, пытаемся определить автоматически
    if (!url) {
      // Для production используем VERCEL_URL или NEXT_PUBLIC_APP_URL
      const baseUrl =
        process.env.VERCEL_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL;

      if (!baseUrl) {
        return NextResponse.json(
          {
            error: 'Cannot determine webhook URL. Please provide it in request body or set NEXT_PUBLIC_APP_URL environment variable.',
          },
          { status: 400 }
        );
      }

      // Добавляем https:// если нет протокола
      const protocol = baseUrl.startsWith('http') ? '' : 'https://';
      url = `${protocol}${baseUrl}/api/v1/telegram/webhook`;
    }

    // Проверяем что бот настроен
    if (!telegramBot.isConfigured()) {
      return NextResponse.json(
        { error: 'Telegram bot token is not configured. Set TELEGRAM_BOT_TOKEN in .env' },
        { status: 500 }
      );
    }

    // Устанавливаем webhook
    const result = await telegramBot.setWebhook(url, {
      allowed_updates: ['message', 'callback_query'],
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Failed to set webhook',
          details: result.description,
        },
        { status: 500 }
      );
    }

    console.log(`[Telegram] Webhook set to: ${url}`);

    return NextResponse.json({
      success: true,
      webhook_url: url,
      message: 'Webhook successfully configured',
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to set webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/telegram/set-webhook
 * Получить информацию о текущем webhook
 */
export async function GET() {
  try {
    if (!telegramBot.isConfigured()) {
      return NextResponse.json(
        { error: 'Telegram bot token is not configured' },
        { status: 500 }
      );
    }

    const result = await telegramBot.getWebhookInfo();

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Failed to get webhook info',
          details: result.description,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result.result);
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook info' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/telegram/set-webhook
 * Удалить webhook
 */
export async function DELETE() {
  try {
    if (!telegramBot.isConfigured()) {
      return NextResponse.json(
        { error: 'Telegram bot token is not configured' },
        { status: 500 }
      );
    }

    const result = await telegramBot.deleteWebhook();

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Failed to delete webhook',
          details: result.description,
        },
        { status: 500 }
      );
    }

    console.log('[Telegram] Webhook deleted');

    return NextResponse.json({
      success: true,
      message: 'Webhook successfully deleted',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
