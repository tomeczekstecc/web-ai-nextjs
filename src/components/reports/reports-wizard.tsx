'use client'

import { useRouter } from 'next/navigation'
import { toast } from '@/components/toast'
import { Wizard } from '@/components/wizard/Wizard'
import type { WizardAction, WizardPage } from '@/lib/wizard/types'
import { DanePodstawoweStep } from './pages/DanePodstawoweStep'
import { ZapytanieStep } from './pages/ZapytanieStep'
import { UprawieniaStep } from './pages/UprawieniaStep'

type Mode = 'create' | 'edit' | 'view'

type Props = {
  id?: number
  mode: Mode
}

type ReportsForm = Record<string, unknown>

export function ReportsWizard({ id, mode }: Props) {
  const router = useRouter()
  const wizardMode = mode === 'view' ? 'view' : 'edit'

  const pages: WizardPage<ReportsForm>[] = [
    { name: 'dane-podstawowe', form: <DanePodstawoweStep /> },
    { name: 'zapytanie', form: <ZapytanieStep /> },
    { name: 'uprawnienia', form: <UprawieniaStep /> },
  ]

  const dataUrl =
    id != null
      ? `/api/reports/wizard/data/${id}`
      : '/api/reports/wizard/data'

  const customActions = mode === 'view'
    ? (): WizardAction[] => [
        {
          label: 'Edytuj',
          variant: 'default',
          onClick: () => router.push(`/reports/${id}`),
        },
      ]
    : undefined

  return (
    <Wizard
      name="reports-wizard"
      mode={wizardMode}
      pages={pages}
      mappingUrl="/api/reports/wizard/mapping"
      dataUrl={dataUrl}
      saveUrl="/api/reports/wizard/save"
      saveOnPageChange={false}
      cancelCallback={() => router.push('/reports')}
      acceptActions={
        mode !== 'view'
          ? (): WizardAction[] => [
              {
                label: 'Zapisz',
                onClick: () => {
                  toast.success('Raport został zapisany.')
                  router.push('/reports')
                },
              },
            ]
          : undefined
      }
      customActions={customActions}
    />
  )
}
