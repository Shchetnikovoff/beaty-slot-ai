import { Box, Button, Container, Group, useMantineTheme } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import Link from 'next/link';

import { Logo } from '@/components';
import { PATH_AUTH } from '@/routes';

import classes from './HeaderNav.module.css';

const HeaderNav = () => {
  const theme = useMantineTheme();

  return (
    <Box>
      <header className={classes.header}>
        <Container className={classes.inner} fluid>
          <Logo style={{ color: theme.white }} />
          <Group gap="xs">
            <Button
              component={Link}
              href={PATH_AUTH.signin}
              leftSection={<IconPlayerPlay size={16} />}
            >
              Войти
            </Button>
          </Group>
        </Container>
      </header>
    </Box>
  );
};

export default HeaderNav;
