/**
 * Типы для AI-ассистента (DeepSeek R1 через OpenRouter)
 * С поддержкой Agent Mode
 */

import type { AIToolCall } from './ai-tools';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: AIToolCall[];
}

export interface AIResponse {
  content: string;
  reasoning?: string; // Содержимое <think>...</think>
}

export interface AIAgentResponse extends AIResponse {
  toolCalls?: AIToolCall[];
  requiresAction: boolean;
}

export interface AIChatRequest {
  messages: AIMessage[];
}

export interface AIChatError {
  error: string;
  code?: string;
}

export interface AIQuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export interface AIAssistantState {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  showReasoning: boolean;
  currentReasoning?: string;
}
