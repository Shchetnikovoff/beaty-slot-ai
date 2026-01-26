'use client';

import {
  Paper,
  Table,
  Text,
  ActionIcon,
  Tooltip,
  Badge,
  Group,
  Tabs,
} from '@mantine/core';
import { IconCopy, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { NOTIFICATION_VARIABLES, type VariableCategory } from '@/types/notification-settings';

interface VariablesHelpProps {
  onInsert: (variable: string) => void;
}

const CATEGORY_LABELS: Record<VariableCategory, string> = {
  client: 'Клиент',
  visit: 'Запись',
  subscription: 'Подписка',
  salon: 'Салон',
};

const CATEGORY_COLORS: Record<VariableCategory, string> = {
  client: 'blue',
  visit: 'green',
  subscription: 'violet',
  salon: 'orange',
};

export function VariablesHelp({ onInsert }: VariablesHelpProps) {
  const handleCopy = (variable: string) => {
    navigator.clipboard.writeText(`{${variable}}`);
    notifications.show({
      message: `Скопировано: {${variable}}`,
      color: 'green',
    });
  };

  const categories = ['client', 'visit', 'subscription', 'salon'] as VariableCategory[];

  return (
    <Paper withBorder p="sm">
      <Text size="sm" fw={500} mb="sm">
        Доступные переменные
      </Text>

      <Tabs defaultValue="client" variant="pills" radius="md">
        <Tabs.List mb="sm">
          {categories.map(cat => (
            <Tabs.Tab key={cat} value={cat} color={CATEGORY_COLORS[cat]}>
              {CATEGORY_LABELS[cat]}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {categories.map(cat => {
          const variables = NOTIFICATION_VARIABLES.filter(v => v.category === cat);
          return (
            <Tabs.Panel key={cat} value={cat}>
              <Table horizontalSpacing="sm" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Переменная</Table.Th>
                    <Table.Th>Описание</Table.Th>
                    <Table.Th>Пример</Table.Th>
                    <Table.Th w={80}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {variables.map(variable => (
                    <Table.Tr key={variable.name}>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c={CATEGORY_COLORS[cat]}>
                          {'{' + variable.name + '}'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{variable.description}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {variable.example}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Вставить">
                            <ActionIcon
                              variant="subtle"
                              color={CATEGORY_COLORS[cat]}
                              size="sm"
                              onClick={() => onInsert(variable.name)}
                            >
                              <IconPlus size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Копировать">
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={() => handleCopy(variable.name)}
                            >
                              <IconCopy size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Paper>
  );
}
