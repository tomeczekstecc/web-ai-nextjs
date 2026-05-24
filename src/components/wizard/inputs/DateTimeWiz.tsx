'use client'

import { useState } from 'react'
import { parse, isValid } from 'date-fns'
import { pl } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { formatDate, formatDateTime } from '@/lib/format/date'
import { ValidationWrapper } from '../ValidationWrapper'
import { useWizardField } from '@/hooks/wizard/useWizardField'
import { cn } from '@/lib/utils'

type Props = {
  keyName: string
  hideTime?: boolean
  hide?: boolean
  label?: string
}

export function DateTimeWiz({ keyName, hideTime, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  const [open, setOpen] = useState(false)

  if (f.hidden || hide) return null

  const label = labelOverride ?? f.label
  const rawValue = f.value as string | undefined

  const parseDate = (val: string | undefined): Date | undefined => {
    if (!val) return undefined
    const parsed = hideTime
      ? parse(val, 'yyyy-MM-dd', new Date())
      : new Date(val)
    return isValid(parsed) ? parsed : undefined
  }

  const selectedDate = parseDate(rawValue)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      f.onChange('')
      return
    }
    if (hideTime) {
      f.onChange(formatDate(date))
    } else {
      const timeStr = rawValue?.includes('T') ? rawValue.split('T')[1]?.slice(0, 5) : '00:00'
      f.onChange(`${formatDate(date)}T${timeStr}`)
    }
    setOpen(false)
  }

  const handleTimeChange = (time: string) => {
    const datePart = rawValue?.split('T')[0] || formatDate(new Date())
    f.onChange(`${datePart}T${time}`)
  }

  const displayValue = selectedDate
    ? hideTime
      ? formatDate(selectedDate)
      : formatDateTime(selectedDate)
    : 'Wybierz datę'

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={keyName}>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button
                  id={keyName}
                  variant="outline"
                  disabled={f.disabled}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {displayValue}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={pl}
                disabled={f.disabled}
              />
            </PopoverContent>
          </Popover>
          {!hideTime && (
            <Input
              type="time"
              value={rawValue?.split('T')[1]?.slice(0, 5) || ''}
              onChange={e => handleTimeChange(e.target.value)}
              disabled={f.disabled}
              className="w-24"
            />
          )}
        </div>
      </ValidationWrapper>
    </div>
  )
}
