import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { appConfig } from '@/lib/config/app'
import { requirePermission } from '@/lib/auth/rbac'

export const metadata: Metadata = {
  title: 'Raporty',
  description: `Zarządzanie raportami w systemie ${appConfig.name}`,
  robots: { index: false, follow: false },
}

export default async function ReportsLayout({ children }: { children: ReactNode }) {
  await requirePermission('dashboard:read')
  return children
}
