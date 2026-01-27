'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ActionIcon,
  Box,
  Drawer,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Tooltip,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconDeviceMobile,
  IconDeviceDesktop,
  IconExternalLink,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';

type DeviceType = 'mobile' | 'desktop';

interface SalonPreviewDrawerProps {
  opened: boolean;
  onClose: () => void;
}

const DEVICE_WIDTHS: Record<DeviceType, number> = {
  mobile: 375,
  desktop: 1024,
};

export function SalonPreviewDrawer({ opened, onClose }: SalonPreviewDrawerProps) {
  const [device, setDevice] = useState<DeviceType>('mobile');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleOpenExternal = useCallback(() => {
    window.open('/salon', '_blank');
  }, []);

  const iframeWidth = DEVICE_WIDTHS[device];

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={device === 'mobile' ? 450 : 1100}
      padding={0}
      withCloseButton={false}
      styles={{
        body: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        p="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-body)',
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Title order={5}>Предпросмотр страницы</Title>
          </Group>

          <Group gap="xs">
            {/* Device Toggle */}
            <SegmentedControl
              size="xs"
              value={device}
              onChange={(value) => setDevice(value as DeviceType)}
              data={[
                {
                  value: 'mobile',
                  label: (
                    <Tooltip label="Мобильная версия">
                      <Group gap={6} wrap="nowrap" justify="center" style={{ minWidth: 90 }}>
                        <IconDeviceMobile size={16} />
                        <Text size="xs">Мобильный</Text>
                      </Group>
                    </Tooltip>
                  ),
                },
                {
                  value: 'desktop',
                  label: (
                    <Tooltip label="Десктоп версия">
                      <Group gap={6} wrap="nowrap" justify="center" style={{ minWidth: 90 }}>
                        <IconDeviceDesktop size={16} />
                        <Text size="xs">Десктоп</Text>
                      </Group>
                    </Tooltip>
                  ),
                },
              ]}
            />

            {/* Refresh Button */}
            <Tooltip label="Обновить">
              <ActionIcon variant="light" onClick={handleRefresh}>
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>

            {/* Open External */}
            <Tooltip label="Открыть в новой вкладке">
              <ActionIcon variant="light" onClick={handleOpenExternal}>
                <IconExternalLink size={18} />
              </ActionIcon>
            </Tooltip>

            {/* Close Button */}
            <Tooltip label="Закрыть">
              <ActionIcon variant="subtle" onClick={onClose}>
                <IconX size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* Preview Container */}
      <Box
        style={{
          flex: 1,
          backgroundColor: '#e9ecef',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'auto',
          padding: device === 'mobile' ? '16px' : '16px 8px',
        }}
      >
        <Box
          pos="relative"
          style={{
            width: device === 'mobile' ? iframeWidth + 20 : '100%',
            maxWidth: device === 'desktop' ? iframeWidth : undefined,
            height: device === 'mobile' ? 'calc(100vh - 100px)' : 'calc(100vh - 100px)',
            backgroundColor: 'white',
            borderRadius: device === 'mobile' ? 32 : 8,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            border: device === 'mobile' ? '8px solid #1a1a1a' : '1px solid #ddd',
          }}
        >
          <LoadingOverlay visible={loading} />

          {/* Device Frame Notch (mobile only) */}
          {device === 'mobile' && (
            <Box
              style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 80,
                height: 24,
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                zIndex: 10,
              }}
            />
          )}

          {/* iframe */}
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src="/salon"
            title="Предпросмотр страницы салона"
            onLoad={handleIframeLoad}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white',
            }}
          />
        </Box>
      </Box>

      {/* Footer Info */}
      <Box
        p="xs"
        style={{
          borderTop: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-body)',
        }}
      >
        <Text size="xs" c="dimmed" ta="center">
          {device === 'mobile' ? `${iframeWidth}px` : `${iframeWidth}px`} •{' '}
          {device === 'mobile' ? 'Мобильный вид' : 'Десктоп вид'}
        </Text>
      </Box>
    </Drawer>
  );
}

export default SalonPreviewDrawer;
