'use client';

import '@/lib/amplify-config';
import type { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
