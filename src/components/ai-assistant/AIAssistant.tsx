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
  IconPlayerPlay,
  IconSend,
  IconSparkles,
  IconTool,
  IconUsers,
  IconX,
} from '@tabler/icons-react';

import { useAIToolExecutor } from '@/hooks/useAIToolExecutor';
import { AI_MODELS, AGENT_MODELS, CHAT_MODELS, type AIModelId } from '@/services/ai.service';
import type { AIMessage, AIAgentResponse } from '@/types/ai';
import type { AIAppContext, AIToolCall } from '@/types/ai-tools';

import classes from './AIAssistant.module.css';

interface ChatMessage extends AIMessage {
  id: string;
  timestamp: Date;
  reasoning?: string;
  toolCalls?: AIToolCall[];
  toolResults?: Array<{ tool_call_id: string; content: string; success: boolean }>;
  isToolExecution?: boolean;
}

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

  const [isOpen, { toggle, close }] = useDisclosure(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingTools, setIsExecutingTools] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(
    null
  );
  const [expandedTools, setExpandedTools] = useState<string | null>(null);
  // По умолчанию выбираем первую модель с поддержкой tools для agent mode
  const [selectedModel, setSelectedModel] = useState<AIModelId>(AGENT_MODELS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Контекст приложения для AI агента
  const getAppContext = useCallback((): AIAppContext => ({
    currentPage: pathname || '/dashboard/default',
    userRole: 'admin', // TODO: получать из реального контекста авторизации
  }), [pathname]);

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

  // Функция для продолжения разговора после выполнения инструментов
  const continueAfterToolExecution = useCallback(
    async (
      currentMessages: ChatMessage[],
      toolResults: Array<{ tool_call_id: string; content: string }>
    ) => {
      try {
        const response = await fetch('/api/ai/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: currentMessages.map((m) => ({
              role: m.role,
              content: m.content,
              tool_calls: m.toolCalls,
            })),
            toolResults,
            context: getAppContext(),
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка сервера');
        }

        const data: AIAgentResponse = await response.json();
        return data;
      } catch (err) {
        throw err;
      }
    },
    [getAppContext, selectedModel]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || isExecutingTools) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      setError(null);

      try {
        // Используем agent endpoint вместо простого chat
        const response = await fetch('/api/ai/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
              tool_calls: m.toolCalls,
            })),
            context: getAppContext(),
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка сервера');
        }

        const data: AIAgentResponse = await response.json();

        // Создаём сообщение ассистента
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          reasoning: data.reasoning,
          toolCalls: data.toolCalls,
          timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMessage, assistantMessage];
        setMessages(updatedMessages);

        // Если есть вызовы инструментов - выполняем их
        if (data.requiresAction && data.toolCalls && data.toolCalls.length > 0) {
          setIsExecutingTools(true);
          setIsLoading(false);

          // Выполняем все инструменты
          const toolResults = await executeTools(data.toolCalls);

          // Добавляем сообщение о выполнении инструментов
          const toolExecutionMessage: ChatMessage = {
            id: `tools-${Date.now()}`,
            role: 'assistant',
            content: '🔧 Выполняю действия...',
            toolResults: toolResults,
            isToolExecution: true,
            timestamp: new Date(),
          };

          const messagesWithTools = [...updatedMessages, toolExecutionMessage];
          setMessages(messagesWithTools);

          // Продолжаем разговор с результатами инструментов
          setIsLoading(true);
          const continuationData = await continueAfterToolExecution(
            messagesWithTools,
            toolResults.map((r) => ({ tool_call_id: r.tool_call_id, content: r.content }))
          );

          // Добавляем финальный ответ
          const finalMessage: ChatMessage = {
            id: `assistant-final-${Date.now()}`,
            role: 'assistant',
            content: continuationData.content,
            reasoning: continuationData.reasoning,
            toolCalls: continuationData.toolCalls,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, finalMessage]);

          // Если опять нужны инструменты - можно продолжить рекурсивно
          // (для простоты пока ограничиваем одним уровнем)

          setIsExecutingTools(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setIsLoading(false);
        setIsExecutingTools(false);
      }
    },
    [messages, isLoading, isExecutingTools, selectedModel, getAppContext, executeTools, continueAfterToolExecution]
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

  const toggleTools = (messageId: string) => {
    setExpandedTools((prev) => (prev === messageId ? null : messageId));
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
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={close}
                  size="sm"
                >
                  <IconX size={16} />
                </ActionIcon>
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
                      disabled={isLoading || isExecutingTools}
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

                      {/* Tool calls display */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <>
                          <Divider my="xs" />
                          <Button
                            variant="subtle"
                            size="xs"
                            color="violet"
                            leftSection={<IconTool size={12} />}
                            rightSection={
                              expandedTools === message.id ? (
                                <IconChevronUp size={12} />
                              ) : (
                                <IconChevronDown size={12} />
                              )
                            }
                            onClick={() => toggleTools(message.id)}
                          >
                            Использовано инструментов: {message.toolCalls.length}
                          </Button>
                          <Collapse in={expandedTools === message.id}>
                            <Stack gap="xs" mt="xs">
                              {message.toolCalls.map((tc) => (
                                <Box
                                  key={tc.id}
                                  p="xs"
                                  className={classes.reasoningBox}
                                >
                                  <Group gap="xs">
                                    <IconPlayerPlay size={12} />
                                    <Text size="xs" fw={600}>
                                      {tc.function.name}
                                    </Text>
                                  </Group>
                                  <Text size="xs" c="dimmed" mt={4}>
                                    {tc.function.arguments}
                                  </Text>
                                </Box>
                              ))}
                            </Stack>
                          </Collapse>
                        </>
                      )}

                      {/* Tool results display */}
                      {message.isToolExecution && message.toolResults && (
                        <Stack gap="xs">
                          {message.toolResults.map((result, idx) => (
                            <Box
                              key={result.tool_call_id || idx}
                              p="xs"
                              style={{
                                background: result.success
                                  ? 'var(--mantine-color-green-light)'
                                  : 'var(--mantine-color-red-light)',
                                borderRadius: 'var(--mantine-radius-sm)',
                              }}
                            >
                              <Text
                                size="xs"
                                style={{ whiteSpace: 'pre-wrap' }}
                              >
                                {result.content}
                              </Text>
                            </Box>
                          ))}
                        </Stack>
                      )}

                      {/* Reasoning toggle */}
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

                {(isLoading || isExecutingTools) && (
                  <Box className={classes.assistantMessage}>
                    <Paper p="sm" radius="md" className={classes.assistantBubble}>
                      <Group gap="xs">
                        <Loader size="xs" color={isExecutingTools ? 'orange' : 'violet'} />
                        <Text size="sm">
                          {isExecutingTools ? '🔧 Выполняю действия...' : '🧠 Думаю...'}
                        </Text>
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
                  disabled={isLoading || isExecutingTools}
                />
                <ActionIcon
                  size="lg"
                  variant="filled"
                  color="violet"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading || isExecutingTools}
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
