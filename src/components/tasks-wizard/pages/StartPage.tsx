'use client'

import { z } from 'zod'
import { InputWiz } from '@/components/wizard/inputs/InputWiz'
import { SelectWiz } from '@/components/wizard/inputs/SelectWiz'
import { TextareaWiz } from '@/components/wizard/inputs/TextareaWiz'
import { TASK_TYPES } from '@/mocks/data/tasks-wizard'

export const startSchema = z.object({
  title: z.string().min(3, 'Tytuł musi mieć co najmniej 3 znaki'),
})

export function StartPage() {
  return (
    <div className="flex flex-col gap-4">
      <InputWiz keyName="title" />
      <SelectWiz keyName="type" options={TASK_TYPES} />
      <TextareaWiz keyName="description" />
    </div>
  )
}
