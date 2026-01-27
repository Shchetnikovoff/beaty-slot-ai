/**
 * Telegram Bot API Wrapper
 * Обёртка над Telegram Bot API для отправки сообщений и рассылок
 */

// ==========================================
// Types
// ==========================================

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  contact?: {
    phone_number: string;
    first_name: string;
    last_name?: string;
    user_id?: number;
  };
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface ReplyKeyboardButton {
  text: string;
  request_contact?: boolean;
  request_location?: boolean;
}

export interface SendMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: {
    inline_keyboard?: InlineKeyboardButton[][];
    keyboard?: ReplyKeyboardButton[][];
    one_time_keyboard?: boolean;
    resize_keyboard?: boolean;
    remove_keyboard?: boolean;
  };
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
}

export interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ chatId: number; error: string }>;
}

// ==========================================
// Telegram Bot Class
// ==========================================

class TelegramBot {
  private token: string;
  private baseUrl: string;

  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
  }

  /**
   * Проверка валидности токена
   */
  isConfigured(): boolean {
    return this.token.length > 0;
  }

  /**
   * Выполнить API запрос к Telegram
   */
  private async request<T>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<TelegramApiResponse<T>> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        description: 'Telegram bot token is not configured',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params || {}),
      });

      const data = await response.json();
      return data as TelegramApiResponse<T>;
    } catch (error) {
      console.error(`Telegram API error (${method}):`, error);
      return {
        ok: false,
        description: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Получить информацию о боте
   */
  async getMe(): Promise<TelegramApiResponse<TelegramUser>> {
    return this.request<TelegramUser>('getMe');
  }

  /**
   * Отправить сообщение
   */
  async sendMessage(
    chatId: number | string,
    text: string,
    options: SendMessageOptions = {}
  ): Promise<TelegramApiResponse<TelegramMessage>> {
    return this.request<TelegramMessage>('sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  /**
   * Отправить сообщение с inline-кнопками
   */
  async sendMessageWithButtons(
    chatId: number | string,
    text: string,
    buttons: InlineKeyboardButton[][],
    options: Omit<SendMessageOptions, 'reply_markup'> = {}
  ): Promise<TelegramApiResponse<TelegramMessage>> {
    return this.sendMessage(chatId, text, {
      ...options,
      reply_markup: { inline_keyboard: buttons },
    });
  }

  /**
   * Отправить сообщение с запросом контакта (телефона)
   */
  async sendContactRequest(
    chatId: number | string,
    text: string
  ): Promise<TelegramApiResponse<TelegramMessage>> {
    return this.sendMessage(chatId, text, {
      reply_markup: {
        keyboard: [
          [{ text: '📱 Отправить номер телефона', request_contact: true }],
        ],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  }

  /**
   * Удалить клавиатуру
   */
  async removeKeyboard(
    chatId: number | string,
    text: string
  ): Promise<TelegramApiResponse<TelegramMessage>> {
    return this.sendMessage(chatId, text, {
      reply_markup: { remove_keyboard: true },
    });
  }

  /**
   * Ответить на callback query (нажатие inline-кнопки)
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    options: { text?: string; show_alert?: boolean } = {}
  ): Promise<TelegramApiResponse<boolean>> {
    return this.request<boolean>('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      ...options,
    });
  }

  /**
   * Редактировать сообщение
   */
  async editMessageText(
    chatId: number | string,
    messageId: number,
    text: string,
    options: SendMessageOptions = {}
  ): Promise<TelegramApiResponse<TelegramMessage>> {
    return this.request<TelegramMessage>('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options,
    });
  }

  /**
   * Массовая рассылка сообщений
   * Использует задержку между сообщениями для соблюдения rate limits
   */
  async sendBroadcast(
    chatIds: number[],
    text: string,
    options: SendMessageOptions = {},
    delayMs: number = 35 // Telegram limit: ~30 messages per second
  ): Promise<BroadcastResult> {
    const result: BroadcastResult = {
      total: chatIds.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    for (const chatId of chatIds) {
      try {
        const response = await this.sendMessage(chatId, text, options);

        if (response.ok) {
          result.sent++;
        } else {
          result.failed++;
          result.errors.push({
            chatId,
            error: response.description || 'Unknown error',
          });
        }

        // Задержка между сообщениями
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          chatId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Установить webhook
   */
  async setWebhook(
    url: string,
    options: {
      secret_token?: string;
      max_connections?: number;
      allowed_updates?: string[];
    } = {}
  ): Promise<TelegramApiResponse<boolean>> {
    return this.request<boolean>('setWebhook', {
      url,
      ...options,
    });
  }

  /**
   * Удалить webhook
   */
  async deleteWebhook(): Promise<TelegramApiResponse<boolean>> {
    return this.request<boolean>('deleteWebhook');
  }

  /**
   * Получить информацию о webhook
   */
  async getWebhookInfo(): Promise<
    TelegramApiResponse<{
      url: string;
      has_custom_certificate: boolean;
      pending_update_count: number;
      last_error_date?: number;
      last_error_message?: string;
    }>
  > {
    return this.request('getWebhookInfo');
  }
}

// ==========================================
// Export singleton instance
// ==========================================

export const telegramBot = new TelegramBot();

// ==========================================
// Helper functions for message formatting
// ==========================================

/**
 * Экранирование специальных символов для MarkdownV2
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/**
 * Экранирование специальных символов для HTML
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Создать inline-кнопку с URL
 */
export function urlButton(text: string, url: string): InlineKeyboardButton {
  return { text, url };
}

/**
 * Создать inline-кнопку с callback_data
 */
export function callbackButton(
  text: string,
  callbackData: string
): InlineKeyboardButton {
  return { text, callback_data: callbackData };
}
