'use client'

import { Badge } from '@/components/ui/badge'
import { RadioWiz } from '@/components/wizard/inputs/RadioWiz'
import { DateTimeWiz } from '@/components/wizard/inputs/DateTimeWiz'
import { useWizard } from '@/hooks/wizard/useWizard'

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Niski' },
  { value: 'normal', label: 'Normalny' },
  { value: 'high',   label: 'Wysoki' },
]

function calcUrgency(deadline: string): string {
  if (!deadline) return 'Brak daty'
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (days < 3)  return 'Pilne'
  if (days <= 14) return 'Normalne'
  return 'Spokojnie'
}

export function scheduleCalc(form: Record<string, unknown>): Record<string, unknown> {
  return { ...form, deadline_urgency: calcUrgency(form.deadline as string) }
}

export function SchedulePage() {
  const { form } = useWizard()
  return (
    <div className="flex flex-col gap-4">
      <RadioWiz keyName="priority" options={PRIORITY_OPTIONS} />
      <DateTimeWiz keyName="deadline" hideTime />
      <DateTimeWiz keyName="start_date" hideTime />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">Pilność terminu</p>
        <Badge variant="outline" className="w-fit">
          {(form.deadline_urgency as string) || 'Brak daty'}
        </Badge>
      </div>
    </div>
  )
}
