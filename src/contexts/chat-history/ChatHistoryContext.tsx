'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

import type { AIToolCall } from '@/types/ai-tools';

/**
 * Сообщение в истории чата
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  reasoning?: string;
  toolCalls?: AIToolCall[];
  toolResults?: Array<{ tool_call_id: string; content: string; success: boolean }>;
  isToolExecution?: boolean;
}

/**
 * Контекст истории чата
 */
interface ChatHistoryContextType {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearHistory: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | null>(null);

const STORAGE_KEY = 'beauty-slot-ai-chat-history';
const MAX_MESSAGES = 100; // Лимит сообщений для хранения

/**
 * Сериализация сообщений для localStorage
 */
function serializeMessages(messages: ChatMessage[]): string {
  return JSON.stringify(
    messages.slice(-MAX_MESSAGES).map((m) => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    }))
  );
}

/**
 * Десериализация сообщений из localStorage
 */
function deserializeMessages(data: string): ChatMessage[] {
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

/**
 * Provider для истории чата с персистентностью в localStorage
 */
export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Загрузка из localStorage при инициализации
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loadedMessages = deserializeMessages(stored);
        setMessages(loadedMessages);
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }

    setIsInitialized(true);
  }, []);

  // Сохранение в localStorage при изменении
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, serializeMessages(messages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [messages, isInitialized]);

  // Добавление сообщения
  const addMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
      const newMessage: ChatMessage = {
        ...message,
        id: `${message.role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  // Обновление сообщения по id
  const updateMessage = useCallback(
    (id: string, updates: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
    },
    []
  );

  // Очистка истории
  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear chat history:', e);
      }
    }
  }, []);

  return (
    <ChatHistoryContext.Provider
      value={{
        messages,
        addMessage,
        updateMessage,
        clearHistory,
        isLoading,
        setIsLoading,
        error,
        setError,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
}

/**
 * Hook для использования истории чата
 */
export function useChatHistory() {
  const context = useContext(ChatHistoryContext);

  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }

  return context;
}

export { ChatHistoryContext };
