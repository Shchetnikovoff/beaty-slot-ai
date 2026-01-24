import { ReactNode } from 'react';

type BroadcastsLayoutProps = {
  children: ReactNode;
};

export default function BroadcastsLayout({ children }: BroadcastsLayoutProps) {
  return <>{children}</>;
}
