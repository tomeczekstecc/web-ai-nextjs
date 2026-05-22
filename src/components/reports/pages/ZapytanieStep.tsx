'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useWizard } from '@/hooks/wizard/useWizard'
import { submitTestQuery } from '@/lib/api/domains/reports/commands'
import type { QueryParameter, TestQueryResponse } from '@/lib/api/domains/reports/contract'
import { ParameterTable } from './ParameterTable'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

type TestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: TestQueryResponse }
  | { status: 'error'; message: string }

export function ZapytanieStep() {
  const { form, setValue, mode } = useWizard()
  const { resolvedTheme } = useTheme()
  const [testState, setTestState] = useState<TestState>({ status: 'idle' })
  const isView = mode === 'view'
  const sqlQuery = (form.sqlQuery as string | undefined) ?? ''
  const parameters = (form.parameters as QueryParameter[] | undefined) ?? []

  async function handleTestQuery() {
    setTestState({ status: 'loading' })
    try {
      const runtimeParams = parameters.map(p => ({
        name: p.name,
        value: p.defaultValue,
      }))
      const result = await submitTestQuery({
        sql: sqlQuery,
        parameters: runtimeParams,
      })
      setTestState({ status: 'success', result })
    } catch (err) {
      setTestState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Błąd wykonania zapytania',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Zapytanie SQL</p>
        <div className="overflow-hidden rounded-md border">
          <MonacoEditor
            height="300px"
            language="sql"
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
            value={sqlQuery}
            onChange={v => !isView && setValue('sqlQuery', v ?? '')}
            options={{
              readOnly: isView,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
            }}
          />
        </div>
        {!isView && (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleTestQuery()}
              disabled={testState.status === 'loading' || !sqlQuery.trim()}
            >
              {testState.status === 'loading' ? 'Testowanie…' : 'Testuj zapytanie'}
            </Button>
          </div>
        )}

        {testState.status === 'error' && (
          <p className="text-sm text-destructive">{testState.message}</p>
        )}

        {testState.status === 'success' && (
          <div className="rounded-md border p-3">
            {testState.result.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak danych</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      {testState.result.columns.map(col => (
                        <th
                          key={col}
                          className="text-muted-foreground px-2 py-1 text-left text-xs font-medium"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testState.result.rows.map((row, i) => (
                      <tr key={i}>
                        {testState.result.columns.map(col => (
                          <td key={col} className="px-2 py-1 text-xs">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <ParameterTable />
    </div>
  )
}
