// Schema-driven renderer for one metadata field. Maps MetadataFieldKind to
// shadcn primitives, with full per-field render() escape hatch.
// See specs/019-upload-component/research.md R5.

'use client'

import { format, parse, isValid } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { MetadataField } from '../types'

type OneFieldProps<TMeta> = {
  field: MetadataField<TMeta>
  value: TMeta[keyof TMeta]
  onChange: (value: TMeta[keyof TMeta]) => void
  error?: string
  disabled?: boolean
  idPrefix?: string
}

function FieldShell({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-err`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function OneField<TMeta>({
  field,
  value,
  onChange,
  error,
  disabled,
  idPrefix = 'mf',
}: OneFieldProps<TMeta>) {
  const id = `${idPrefix}-${String(field.key)}`

  if (field.render) {
    return (
      <FieldShell id={id} label={field.label} required={field.required} error={error}>
        {field.render({
          value,
          onChange,
          error,
          disabled,
          label: field.label,
        })}
      </FieldShell>
    )
  }

  const v = value as unknown
  const err = !!error

  switch (field.kind) {
    case 'text':
      return (
        <FieldShell id={id} label={field.label} required={field.required} error={error}>
          <Input
            id={id}
            type="text"
            value={(v as string | null) ?? ''}
            disabled={disabled}
            aria-invalid={err}
            aria-describedby={err ? `${id}-err` : undefined}
            onChange={(e) => onChange((e.target.value || null) as TMeta[keyof TMeta])}
          />
        </FieldShell>
      )

    case 'number':
      return (
        <FieldShell id={id} label={field.label} required={field.required} error={error}>
          <Input
            id={id}
            type="number"
            value={v === null || v === undefined ? '' : String(v as number)}
            disabled={disabled}
            aria-invalid={err}
            aria-describedby={err ? `${id}-err` : undefined}
            onChange={(e) => {
              const raw = e.target.value
              onChange((raw === '' ? null : Number(raw)) as TMeta[keyof TMeta])
            }}
          />
        </FieldShell>
      )

    case 'select': {
      const strVal = v == null ? '' : String(v)
      return (
        <FieldShell id={id} label={field.label} required={field.required} error={error}>
          <Select
            value={strVal}
            disabled={disabled}
            onValueChange={(next) => {
              const match = field.options?.find((o) => String(o.value) === next)
              onChange((match ? match.value : (next as unknown)) as TMeta[keyof TMeta])
            }}
          >
            <SelectTrigger id={id} aria-invalid={err} aria-describedby={err ? `${id}-err` : undefined}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
      )
    }

    case 'checkbox':
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={Boolean(v)}
              disabled={disabled}
              aria-invalid={err}
              aria-describedby={err ? `${id}-err` : undefined}
              onCheckedChange={(c) => onChange(Boolean(c) as TMeta[keyof TMeta])}
            />
            <Label htmlFor={id} className="text-xs">
              {field.label}
              {field.required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
          </div>
          {error && (
            <p id={`${id}-err`} className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )

    case 'date': {
      const iso = (v as string | null) ?? null
      const date = iso ? parse(iso, 'yyyy-MM-dd', new Date()) : null
      return (
        <FieldShell id={id} label={field.label} required={field.required} error={error}>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  id={id}
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  aria-invalid={err}
                  aria-describedby={err ? `${id}-err` : undefined}
                  className={cn(
                    'justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {date && isValid(date) ? format(date, 'yyyy-MM-dd') : '—'}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date ?? undefined}
                onSelect={(d) =>
                  onChange((d ? format(d, 'yyyy-MM-dd') : null) as TMeta[keyof TMeta])
                }
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </FieldShell>
      )
    }
  }
}

type Props<TMeta> = {
  fields: ReadonlyArray<MetadataField<TMeta>>
  values: TMeta
  errors?: Partial<Record<keyof TMeta, string>>
  disabled?: boolean
  onChange: (key: keyof TMeta, value: TMeta[keyof TMeta]) => void
  /** Optional id prefix to disambiguate multiple instances on a page. */
  idPrefix?: string
}

export function MetadataFields<TMeta>({
  fields,
  values,
  errors,
  disabled,
  onChange,
  idPrefix,
}: Props<TMeta>) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((field) => (
        <OneField<TMeta>
          key={String(field.key)}
          field={field}
          value={values[field.key]}
          error={errors?.[field.key]}
          disabled={disabled}
          idPrefix={idPrefix}
          onChange={(v) => onChange(field.key, v)}
        />
      ))}
    </div>
  )
}
