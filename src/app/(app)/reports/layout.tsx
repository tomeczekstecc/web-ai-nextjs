import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { appConfig } from '@/lib/config/app'

export const metadata: Metadata = {
  title: 'Raporty',
  description: `Zarządzanie raportami w systemie ${appConfig.name}`,
  robots: { index: false, follow: false },
}

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return children
}
