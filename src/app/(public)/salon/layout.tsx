'use client';

import { useEffect, useState } from 'react';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ColorSchemeScript />
      <MantineProvider>
        {children}
      </MantineProvider>
    </>
  );
}
