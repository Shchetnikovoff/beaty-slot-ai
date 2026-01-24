import { ReactNode } from 'react';

type DocumentsLayoutProps = {
  children: ReactNode;
};

export default function DocumentsLayout({ children }: DocumentsLayoutProps) {
  return <>{children}</>;
}
