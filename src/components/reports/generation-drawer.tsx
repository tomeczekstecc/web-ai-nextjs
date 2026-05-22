'use client'

import { useForm } from '@tanstack/react-form'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useReportGeneration } from '@/hooks/reports/use-report-generation'
import type { ReportListItem, QueryParameter } from '@/lib/api/domains/reports/contract'

type RuntimeParam = {
  name: string
  value: string
}

type Props = {
  report: ReportListItem | null
  onClose: () => void
}

function ParamInput({
  param,
  value,
  onChange,
}: {
  param: QueryParameter
  value: string
  onChange: (v: string) => void
}) {
  if (param.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={param.name}
          checked={value === 'true'}
          onCheckedChange={checked => onChange(checked ? 'true' : 'false')}
        />
        <Label htmlFor={param.name}>{param.name}</Label>
      </div>
    )
  }

  return (
    <Input
      id={param.name}
      type={param.type === 'numer' ? 'number' : param.type === 'data' ? 'date' : 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={param.defaultValue || param.name}
    />
  )
}

function DrawerContent({ report, onClose }: { report: ReportListItem; onClose: () => void }) {
  const { generate } = useReportGeneration(report.id)

  const form = useForm({
    defaultValues: {
      params: report.parameters.map(p => ({
        name: p.name,
        value: p.defaultValue,
      })) as RuntimeParam[],
    },
    onSubmit: async ({ value }) => {
      const parameters = value.params.map(p => ({
        name: p.name,
        value: p.value,
      }))
      onClose()
      await generate(parameters)
    },
  })

  return (
    <>
      <SheetHeader className="border-b border-border/60 p-4">
        <SheetTitle>Generuj: {report.name}</SheetTitle>
      </SheetHeader>

      <form
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        onSubmit={e => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        {report.parameters.map((param, i) => (
          <div key={param.name} className="flex flex-col gap-1.5">
            <Label htmlFor={param.name} className="text-sm font-medium">
              {param.name}
            </Label>
            <form.Field name={`params[${i}].value`}>
              {field => (
                <ParamInput
                  param={param}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
            {param.description && (
              <p className="text-xs text-muted-foreground">{param.description}</p>
            )}
          </div>
        ))}

        <SheetFooter className="mt-auto border-t border-border/60 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button type="submit">Generuj</Button>
        </SheetFooter>
      </form>
    </>
  )
}

export function GenerationDrawer({ report, onClose }: Props) {
  return (
    <Sheet open={report !== null} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-md">
        {report && <DrawerContent report={report} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}
