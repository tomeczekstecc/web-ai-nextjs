'use client'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWizard } from '@/hooks/wizard/useWizard'
import type { QueryParameter, ParameterType } from '@/lib/api/domains/reports/contract'

const TYPE_OPTIONS: { value: ParameterType; label: string }[] = [
  { value: 'numer', label: 'Numer' },
  { value: 'string', label: 'Tekst' },
  { value: 'boolean', label: 'Wartość logiczna' },
  { value: 'data', label: 'Data' },
]

const EMPTY_PARAM: QueryParameter = {
  name: '',
  type: 'string',
  defaultValue: '',
  description: '',
}

export function ParameterTable() {
  const { form, setValue, mode } = useWizard()
  const parameters = (form.parameters as QueryParameter[] | undefined) ?? []
  const isView = mode === 'view'

  function updateParam(index: number, patch: Partial<QueryParameter>) {
    const next = parameters.map((p, i) => (i === index ? { ...p, ...patch } : p))
    setValue('parameters', next)
  }

  function removeParam(index: number) {
    setValue('parameters', parameters.filter((_, i) => i !== index))
  }

  function addParam() {
    setValue('parameters', [...parameters, { ...EMPTY_PARAM }])
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Parametry zapytania</p>
      {parameters.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-muted-foreground px-2 py-2 text-left text-xs font-medium">
                  Nazwa parametru
                </th>
                <th className="text-muted-foreground px-2 py-2 text-left text-xs font-medium">
                  Typ parametru
                </th>
                <th className="text-muted-foreground px-2 py-2 text-left text-xs font-medium">
                  Wartość parametru
                </th>
                <th className="text-muted-foreground px-2 py-2 text-left text-xs font-medium">
                  Opis parametru
                </th>
                <th className="w-[1%] px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {parameters.map((param, i) => (
                <tr key={i} className="border-b last:border-b-0 align-top">
                  <td className="px-2 py-1.5">
                    <Input
                      value={param.name}
                      onChange={e => updateParam(i, { name: e.target.value })}
                      disabled={isView}
                      placeholder="np. rok"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Select
                      value={param.type}
                      onValueChange={v => updateParam(i, { type: v as ParameterType })}
                      disabled={isView}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={param.defaultValue}
                      onChange={e => updateParam(i, { defaultValue: e.target.value })}
                      disabled={isView}
                      placeholder="wartość domyślna"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={param.description}
                      onChange={e => updateParam(i, { description: e.target.value })}
                      disabled={isView}
                      placeholder="opis"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      disabled={isView}
                      onClick={() => removeParam(i)}
                      aria-label={`Usuń parametr ${i + 1}`}
                    >
                      <Trash2Icon />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {parameters.length === 0 && (
        <p className="text-sm text-muted-foreground">Brak zdefiniowanych parametrów.</p>
      )}
      {!isView && (
        <div>
          <Button type="button" variant="default" size="sm" onClick={addParam}>
            <PlusIcon />
            Dodaj parametr
          </Button>
        </div>
      )}
    </div>
  )
}
