import { Button, Menu } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';

const FilterDateMenu = () => {
  return (
    <Menu shadow="md" width={120}>
      <Menu.Target>
        <Button variant="subtle" rightSection={<IconChevronDown size={14} />}>
          Сегодня: 25 июля
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item>Сегодня</Menu.Item>
        <Menu.Item>Вчера</Menu.Item>
        <Menu.Item>Последние 7 дней</Menu.Item>
        <Menu.Item>Последние 30 дней</Menu.Item>
        <Menu.Item>Этот месяц</Menu.Item>
        <Menu.Item>Прошлый месяц</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default FilterDateMenu;
