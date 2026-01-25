'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { usePathname } from 'next/navigation';

import {
  ActionIcon,
  Affix,
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  Group,
  Loader,
  Menu,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Tooltip,
  Transition,
  TypographyStylesProvider,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import {
  IconBrain,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconMessageCircle,
  IconSend,
  IconSparkles,
  IconTool,
  IconTrash,
  IconUsers,
  IconX,
} from '@tabler/icons-react';

import { useChatHistory, type ChatMessage } from '@/contexts/chat-history';
import { usePageData } from '@/contexts/page-data';
import { useAIToolExecutor } from '@/hooks/useAIToolExecutor';
import { AI_MODELS, AGENT_MODELS, CHAT_MODELS, type AIModelId } from '@/services/ai.service';
import type { AIAgentResponse } from '@/types/ai';
import type { AIAppContext } from '@/types/ai-tools';

import classes from './AIAssistant.module.css';

const QUICK_ACTIONS = [
  {
    id: 'analyze',
    label: 'Анализ клиентов',
    icon: IconUsers,
    prompt: 'Проанализируй активность клиентов салона за последний месяц',
  },
  {
    id: 'broadcast',
    label: 'Текст рассылки',
    icon: IconMessageCircle,
    prompt: 'Напиши текст рассылки о новой акции в салоне красоты',
  },
];

/**
 * Простой парсер markdown в HTML
 */
function parseMarkdown(text: string): string {
  return (
    text
      // Заголовки ### -> <strong>
      .replace(/^### (.+)$/gm, '<strong>$1</strong>')
      // Жирный текст **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Курсив *text*
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Списки - и •
      .replace(/^[-•] (.+)$/gm, '• $1')
      // Переносы строк
      .replace(/\n/g, '<br />')
  );
}

export function AIAssistant() {
  const colorScheme = useComputedColorScheme('light');
  const isDark = colorScheme === 'dark';
  const pathname = usePathname();
  const { executeTools } = useAIToolExecutor();
  const { pageData } = usePageData();

  // Глобальное состояние истории чата (сохраняется между переходами и в localStorage)
  const {
    messages,
    addMessage,
    clearHistory,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useChatHistory();

  const [isOpen, { toggle, close }] = useDisclosure(false);
  const [input, setInput] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(
    null
  );
  // По умолчанию выбираем первую модель с поддержкой tools для agent mode
  const [selectedModel, setSelectedModel] = useState<AIModelId>(AGENT_MODELS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Контекст приложения для AI агента (теперь включает данные страницы)
  const getAppContext = useCallback((): AIAppContext => ({
    currentPage: pathname || '/dashboard/default',
    userRole: 'admin', // TODO: получать из реального контекста авторизации
    pageData: pageData ? {
      pageType: pageData.pageType,
      stats: pageData.stats,
      tableData: pageData.tableData ? {
        rows: pageData.tableData.rows,
        total: pageData.tableData.total,
        selectedIds: pageData.tableData.selectedIds,
        filters: pageData.tableData.filters,
      } : undefined,
      metadata: pageData.metadata,
    } : undefined,
  }), [pathname, pageData]);

  // Горячие клавиши
  useHotkeys([
    ['mod+shift+a', () => toggle()],
    ['escape', () => close()],
  ]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Silent Mode: Отправка сообщения с тихим выполнением инструментов
   * Пользователь видит только финальный ответ, без промежуточных шагов
   * История сохраняется глобально и персистентно
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Добавляем сообщение пользователя через контекст
      const userMessage = addMessage({
        role: 'user',
        content: content.trim(),
      });

      setInput('');
      setIsLoading(true);
      setError(null);

      try {
        // Внутренняя история для multi-turn tool execution
        let internalMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
          tool_calls: m.toolCalls,
        }));

        // Функция запроса с таймаутом (30 секунд)
        const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 30000) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          try {
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Превышено время ожидания ответа от AI. Попробуйте ещё раз.');
            }
            throw error;
          }
        };

        // Первый запрос к AI
        const initialContext = getAppContext();
        console.log(`[AI Assistant] Initial request, page: ${initialContext.currentPage}, pageData stats:`, initialContext.pageData?.stats?.slice(0, 2));
        let response = await fetchWithTimeout('/api/ai/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: internalMessages,
            context: getAppContext(),
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка сервера');
        }

        let data: AIAgentResponse = await response.json();

        // SILENT MODE: Выполняем инструменты в цикле, пока они есть
        // Пользователь не видит промежуточные шаги
        const MAX_TOOL_ITERATIONS = 5; // Защита от бесконечного цикла
        let iterations = 0;

        while (data.requiresAction && data.toolCalls && data.toolCalls.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
          iterations++;
          console.log(`[AI Assistant] Tool iteration ${iterations}, tools:`, data.toolCalls.map(t => t.function.name));

          // Тихо выполняем инструменты с контекстом приложения
          const appContext = getAppContext();
          console.log(`[AI Assistant] PageData for iteration ${iterations}:`, appContext.pageData?.stats?.slice(0, 2));
          const toolResults = await executeTools(data.toolCalls, appContext);
          console.log(`[AI Assistant] Tool results:`, toolResults.map(r => ({ id: r.tool_call_id, success: r.success })));

          // ВАЖНО: Добавляем assistant message С tool_calls И результаты инструментов во внутреннюю историю
          // Это необходимо для корректного порядка сообщений OpenAI API:
          // [user] -> [assistant с tool_calls] -> [tool результаты] -> [assistant ответ]
          internalMessages = [
            ...internalMessages,
            {
              role: 'assistant' as const,
              content: data.content || '',
              tool_calls: data.toolCalls,
            },
            // Добавляем tool results как отдельные сообщения с role: 'tool'
            ...toolResults.map((r) => ({
              role: 'tool' as const,
              tool_call_id: r.tool_call_id,
              content: r.content,
            })),
          ];

          // Продолжаем разговор БЕЗ отдельных toolResults - они уже в internalMessages
          response = await fetchWithTimeout('/api/ai/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: internalMessages,
              context: getAppContext(),
              model: selectedModel,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка сервера');
          }

          data = await response.json();
        }

        // Показываем ТОЛЬКО финальный ответ пользователю через контекст
        // БЕЗ промежуточных сообщений и tool calls
        addMessage({
          role: 'assistant',
          content: data.content,
          reasoning: data.reasoning,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, selectedModel, getAppContext, executeTools, addMessage, setIsLoading, setError]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning((prev) => (prev === messageId ? null : messageId));
  };

  return (
    <>
      {/* Плавающая кнопка */}
      <Affix position={{ bottom: 20, right: 20 }} zIndex={200}>
        <Transition transition="slide-up" mounted={!isOpen}>
          {(styles) => (
            <Tooltip
              label="AI Ассистент (Ctrl+Shift+A)"
              position="left"
              withArrow
            >
              <ActionIcon
                style={styles}
                size={56}
                radius="xl"
                variant="gradient"
                gradient={{ from: 'violet', to: 'indigo', deg: 45 }}
                onClick={toggle}
                className={classes.floatingButton}
              >
                <IconSparkles size={28} />
              </ActionIcon>
            </Tooltip>
          )}
        </Transition>
      </Affix>

      {/* Панель чата */}
      <Transition transition="slide-left" mounted={isOpen}>
        {(styles) => (
          <Paper
            style={styles}
            className={classes.chatPanel}
            shadow="xl"
            radius="md"
            withBorder
          >
            {/* Заголовок */}
            <Box className={classes.header}>
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'indigo' }}
                    size="md"
                    radius="xl"
                  >
                    <IconSparkles size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={600} size="sm">
                      AI Ассистент
                    </Text>
                    <Menu shadow="md" width={260}>
                      <Menu.Target>
                        <Button
                          variant="subtle"
                          size="compact-xs"
                          color="gray"
                          rightSection={<IconChevronDown size={12} />}
                          leftSection={<IconTool size={12} />}
                        >
                          {AI_MODELS.find((m) => m.id === selectedModel)?.name || 'Выбрать модель'}
                        </Button>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>🔧 Agent Mode (с actions)</Menu.Label>
                        {AGENT_MODELS.map((model) => (
                          <Menu.Item
                            key={model.id}
                            leftSection={<IconTool size={14} />}
                            rightSection={
                              selectedModel === model.id ? (
                                <IconCheck size={14} color="var(--mantine-color-green-6)" />
                              ) : null
                            }
                            onClick={() => setSelectedModel(model.id)}
                          >
                            <Box>
                              <Text size="sm">{model.name}</Text>
                              <Text size="xs" c="dimmed">
                                {model.description}
                              </Text>
                            </Box>
                          </Menu.Item>
                        ))}
                        <Menu.Divider />
                        <Menu.Label>🧠 Thinking (без actions)</Menu.Label>
                        {CHAT_MODELS.map((model) => (
                          <Menu.Item
                            key={model.id}
                            leftSection={<IconBrain size={14} />}
                            rightSection={
                              selectedModel === model.id ? (
                                <IconCheck size={14} color="var(--mantine-color-green-6)" />
                              ) : null
                            }
                            onClick={() => setSelectedModel(model.id)}
                          >
                            <Box>
                              <Text size="sm">{model.name}</Text>
                              <Text size="xs" c="dimmed">
                                {model.description}
                              </Text>
                            </Box>
                          </Menu.Item>
                        ))}
                      </Menu.Dropdown>
                    </Menu>
                  </Box>
                </Group>
                <Group gap={4}>
                  {messages.length > 0 && (
                    <Tooltip label="Очистить историю" position="bottom">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={clearHistory}
                        size="sm"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={close}
                    size="sm"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Box>

            <Divider />

            {/* Быстрые действия */}
            {messages.length === 0 && (
              <Box p="sm">
                <Text size="xs" c="dimmed" mb="xs">
                  Быстрые действия:
                </Text>
                <Group gap="xs">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.id}
                      variant="light"
                      size="xs"
                      leftSection={<action.icon size={14} />}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isLoading}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Group>
              </Box>
            )}

            {/* Сообщения */}
            <ScrollArea
              className={classes.messages}
              viewportRef={scrollRef}
              type="auto"
            >
              <Stack gap="md" p="sm">
                {messages.length === 0 && (
                  <Box ta="center" py="xl">
                    <ThemeIcon
                      size={60}
                      radius="xl"
                      variant="light"
                      color="violet"
                      mb="md"
                    >
                      <IconBrain size={32} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed">
                      Привет! Я AI-ассистент Beauty Slot.
                    </Text>
                    <Text size="sm" c="dimmed">
                      Задайте вопрос или выберите действие выше.
                    </Text>
                  </Box>
                )}

                {messages.map((message) => (
                  <Box
                    key={message.id}
                    className={
                      message.role === 'user'
                        ? classes.userMessage
                        : classes.assistantMessage
                    }
                  >
                    <Paper
                      p="sm"
                      radius="md"
                      className={
                        message.role === 'user'
                          ? classes.userBubble
                          : classes.assistantBubble
                      }
                    >
                      {message.role === 'user' ? (
                        <Text size="sm" c="white" style={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Text>
                      ) : (
                        <TypographyStylesProvider>
                          <div
                            className={classes.messageContent}
                            dangerouslySetInnerHTML={{
                              __html: parseMarkdown(message.content),
                            }}
                          />
                        </TypographyStylesProvider>
                      )}

                      {/* Reasoning toggle - показываем только если есть */}
                      {message.reasoning && (
                        <>
                          <Divider my="xs" />
                          <Button
                            variant="subtle"
                            size="xs"
                            color="gray"
                            leftSection={<IconBrain size={12} />}
                            rightSection={
                              expandedReasoning === message.id ? (
                                <IconChevronUp size={12} />
                              ) : (
                                <IconChevronDown size={12} />
                              )
                            }
                            onClick={() => toggleReasoning(message.id)}
                          >
                            Размышления AI
                          </Button>
                          <Collapse in={expandedReasoning === message.id}>
                            <Box mt="xs" p="xs" className={classes.reasoningBox}>
                              <Text
                                size="xs"
                                c="dimmed"
                                style={{ whiteSpace: 'pre-wrap' }}
                              >
                                {message.reasoning}
                              </Text>
                            </Box>
                          </Collapse>
                        </>
                      )}
                    </Paper>
                    <Text size="xs" c="dimmed" mt={4}>
                      {message.timestamp.toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </Box>
                ))}

                {isLoading && (
                  <Box className={classes.assistantMessage}>
                    <Paper p="sm" radius="md" className={classes.assistantBubble}>
                      <Group gap="xs">
                        <Loader size="xs" color="violet" />
                        <Text size="sm">🧠 Думаю...</Text>
                      </Group>
                    </Paper>
                  </Box>
                )}

                {error && (
                  <Box ta="center">
                    <Badge color="red" variant="light">
                      {error}
                    </Badge>
                  </Box>
                )}
              </Stack>
            </ScrollArea>

            <Divider />

            {/* Поле ввода */}
            <Box className={classes.inputArea}>
              <Group gap="xs" align="flex-end">
                <Textarea
                  ref={inputRef}
                  placeholder="Напишите сообщение или команду..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  minRows={1}
                  maxRows={4}
                  autosize
                  style={{ flex: 1 }}
                  disabled={isLoading}
                />
                <ActionIcon
                  size="lg"
                  variant="filled"
                  color="violet"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                >
                  <IconSend size={18} />
                </ActionIcon>
              </Group>
              <Text size="xs" c="dimmed" mt={4} ta="center">
                Shift+Enter для новой строки
              </Text>
            </Box>
          </Paper>
        )}
      </Transition>
    </>
  );
}

export default AIAssistant;
