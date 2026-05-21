'use client'

import { useRouter } from 'next/navigation'
import { toast } from '@/components/toast'
import { Wizard } from '@/components/wizard/Wizard'
import type { WizardAction, WizardPage } from '@/lib/wizard/types'
import { StartPage, startSchema } from './pages/StartPage'
import { SchedulePage, scheduleCalc } from './pages/SchedulePage'
import { AssignmentPage } from './pages/AssignmentPage'
import { RelatedPage } from './pages/RelatedPage'
import { SummaryPage } from './pages/SummaryPage'

type Props = {
  id?: number
  mode: 'edit' | 'view'
}

type TaskForm = Record<string, unknown>

const pages: WizardPage<TaskForm>[] = [
  { name: 'start',      form: <StartPage />,      schema: startSchema },
  { name: 'schedule',   form: <SchedulePage />,   calc: scheduleCalc },
  { name: 'assignment', form: <AssignmentPage /> },
  { name: 'related',    form: <RelatedPage /> },
  { name: 'summary',    form: <SummaryPage />,    isSummaryPage: true },
]

export function TasksWizard({ id, mode }: Props) {
  const router = useRouter()
  const dataUrl = id != null
    ? `/api/tasks/wizard/data/${id}`
    : '/api/tasks/wizard/data'

  return (
    <Wizard
      name="tasks-wizard"
      mode={mode}
      pages={pages}
      mappingUrl="/api/tasks/wizard/mapping"
      dataUrl={dataUrl}
      saveUrl="/api/tasks/wizard/save"
      validationUrl="/api/tasks/wizard/validate"
      saveOnPageChange={true}
      cancelCallback={() => router.push('/wizard-demo')}
      saveAndQuitCallback={() => router.push('/wizard-demo')}
      acceptActions={(summary): WizardAction[] => {
        const hasErrors = !!summary && (
          Object.keys(summary.error ?? {}).length > 0 ||
          Object.keys(summary.dicts_msg?.error ?? {}).length > 0
        )
        return [
          {
            label: 'Wyślij zadanie',
            disabled: hasErrors,
            onClick: () => {
              toast.success('Zadanie zostało wysłane!')
              router.push('/wizard-demo')
            },
          },
        ]
      }}
    />
  )
}
