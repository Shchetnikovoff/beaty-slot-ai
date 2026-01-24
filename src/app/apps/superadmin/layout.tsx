import { ReactNode } from 'react';

type SuperadminLayoutProps = {
  children: ReactNode;
};

export default function SuperadminLayout({ children }: SuperadminLayoutProps) {
  return <>{children}</>;
}
