import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ActionIcon,
  Box,
  Collapse,
  Flex,
  Group,
  ScrollArea,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconChevronDown, IconX } from '@tabler/icons-react';

import { Logo } from '@/components';
import { SidebarCalendar } from '@/components/SidebarCalendar';
import { SIDEBAR_LINKS } from '@/constants/sidebar-links';
import { useSidebarConfig } from '@/contexts/theme-customizer';

import { LinksGroup } from '../NavLinks';
import classes from './Sidebar.module.css';

type NavigationProps = {
  onClose: () => void;
  showCloseButton?: boolean;
};

const SCROLL_STORAGE_KEY = 'sidebar-scroll-position';

const SidebarNav = ({ onClose, showCloseButton = false }: NavigationProps) => {
  const tablet_match = useMediaQuery('(max-width: 768px)');
  const sidebarConfig = useSidebarConfig();
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Восстановить позицию скролла при монтировании
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedPosition && scrollViewportRef.current) {
      // Небольшая задержка чтобы DOM успел отрисоваться
      requestAnimationFrame(() => {
        if (scrollViewportRef.current) {
          scrollViewportRef.current.scrollTop = parseInt(savedPosition, 10);
        }
      });
    }
  }, []);

  // Сохранять позицию скролла при каждом изменении
  const handleScroll = useCallback(() => {
    if (scrollViewportRef.current) {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, String(scrollViewportRef.current.scrollTop));
    }
  }, []);

  // Изначально все группы развёрнуты
  const [openedGroups, setOpenedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    SIDEBAR_LINKS.forEach((group) => {
      initial[group.title] = true;
    });
    return initial;
  });

  const toggleGroup = useCallback((title: string) => {
    setOpenedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }, []);

  const links = SIDEBAR_LINKS.map((m) => (
    <Box key={m.title} pl={0} mb="xs">
      <UnstyledButton
        onClick={() => toggleGroup(m.title)}
        className={classes.groupHeader}
        w="100%"
      >
        <Group justify="space-between" wrap="nowrap" px="md" py="xs">
          <Text
            tt="uppercase"
            size="xs"
            fw={600}
            className={classes.linkHeader}
          >
            {m.title}
          </Text>
          <IconChevronDown
            size={14}
            className={classes.groupChevron}
            style={{
              transform: openedGroups[m.title] ? 'rotate(180deg)' : 'none',
              transition: 'transform 200ms ease',
              flexShrink: 0,
            }}
          />
        </Group>
      </UnstyledButton>
      <Collapse in={openedGroups[m.title]}>
        {m.links.map((item) => (
          <LinksGroup
            key={item.label}
            {...item}
            closeSidebar={() => {
              setTimeout(() => {
                onClose();
              }, 250);
            }}
          />
        ))}
      </Collapse>
    </Box>
  ));

  // Determine close button color based on sidebar variant
  const getCloseButtonColor = () => {
    if (sidebarConfig.variant === 'colored') {
      return 'white';
    }
    return undefined; // Use default color
  };

  return (
    <div
      className={classes.navbar}
      data-variant={sidebarConfig.variant}
      data-position={sidebarConfig.position}
    >
      <div className={classes.header}>
        <Flex justify="space-between" align="center" gap="sm">
          <Group
            justify="space-between"
            style={{ flex: tablet_match ? 'auto' : 1 }}
          >
            <Logo className={classes.logo} showText={true} />
          </Group>
          {showCloseButton && (
            <ActionIcon onClick={onClose} variant="transparent" size="sm">
              <IconX color={getCloseButtonColor()} size={18} />
            </ActionIcon>
          )}
        </Flex>
      </div>

      <SidebarCalendar />

      <ScrollArea
        className={classes.links}
        viewportRef={scrollViewportRef}
        onScrollPositionChange={handleScroll}
      >
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>
    </div>
  );
};

export default SidebarNav;
