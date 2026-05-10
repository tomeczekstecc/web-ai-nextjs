'use client'

import { z } from 'zod'
import { toast } from 'sonner'
import { Wizard } from '@/components/wizard/Wizard'
import { WizardSummary } from '@/components/wizard/WizardSummary'
import { useWizard } from '@/hooks/wizard/useWizard'
import { useWizardField } from '@/hooks/wizard/useWizardField'
import { InputWiz } from '@/components/wizard/inputs/InputWiz'
import { SelectWiz } from '@/components/wizard/inputs/SelectWiz'
import { Button } from '@/components/ui/button'

const MAPPING_URL = '/api/wizard-demo/mapping'
const DATA_URL = '/api/wizard-demo/data'
const SAVE_URL = '/api/wizard-demo/save'
const VALIDATION_URL = '/api/wizard-demo/validate'

const TYP_OPTIONS = [
  { value: 'prosty', label: 'Prosty' },
  { value: 'złożony', label: 'Złożony' },
]

function Krok1() {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Krok 1 — Start</h2>
      <InputWiz keyName="tytul" />
      <p className="text-xs text-muted-foreground">Przejdź do Kroku 2 i wróć — tytuł powinien zostać.</p>
    </div>
  )
}

function CustomWizField({ keyName }: { keyName: string }) {
  const f = useWizardField(keyName)
  if (f.hidden) return null
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{f.label}</label>
      <textarea
        className="border rounded-md px-3 py-2 text-sm bg-background resize-none min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
        value={f.value as string}
        onChange={e => f.onChange(e.target.value)}
        disabled={f.disabled}
        placeholder="Wpisz opis…"
      />
      {f.error && <p className="text-sm text-destructive">{f.error}</p>}
    </div>
  )
}

function Krok2() {
  const { form } = useWizard()
  return (
    <div className="p-4 border rounded-lg flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Krok 2 — Szczegóły</h2>
      <p className="text-sm text-muted-foreground">
        Tytuł z Kroku 1: <strong>{(form.tytul as string) || '(brak)'}</strong>
      </p>
      <CustomWizField keyName="opis" />
      <SelectWiz keyName="typ" options={TYP_OPTIONS} label="Typ zadania" />
      {form.typ !== 'prosty' && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">Tytuł (wersaliki) — pole obliczane</p>
          <p className="px-3 py-2 text-sm border rounded-md bg-muted text-muted-foreground">
            {(form.tytul_upr as string) || '(brak tytułu)'}
          </p>
        </div>
      )}
    </div>
  )
}

function Krok3() {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Krok 3 — Szczegóły końcowe</h2>
      <p className="text-sm text-muted-foreground">Sprawdź dane i przejdź do podsumowania.</p>
    </div>
  )
}

const krok1Schema = z.object({
  tytul: z.string().min(3, 'Tytuł musi mieć co najmniej 3 znaki'),
})

const demoPages = [
  { name: 'krok-1', form: <Krok1 />, schema: krok1Schema },
  {
    name: 'krok-2',
    form: <Krok2 />,
    calc: (form: Record<string, unknown>) => ({
      ...form,
      tytul_upr: ((form.tytul as string) ?? '').toUpperCase(),
    }),
  },
  { name: 'krok-3', form: <Krok3 /> },
  { name: 'krok-4', form: <WizardSummary />, isSummaryPage: true },
]

export default function WizardDemoPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-12">
      <section>
        <h1 className="text-2xl font-bold mb-6">Demo Wizarda — tryb edycji</h1>
        <Wizard
          name="demo-edit"
          mode="edit"
          pages={demoPages}
          mappingUrl={MAPPING_URL}
          dataUrl={DATA_URL}
          saveUrl={SAVE_URL}
          validationUrl={VALIDATION_URL}
          saveOnPageChange={true}
          cancelCallback={() => toast.info('Anulowano — w produkcji nastąpi przekierowanie')}
          acceptButtons={(summary) => {
            const hasErrors = summary && Object.keys(summary.error ?? {}).length > 0
            return (
              <Button
                variant="default"
                disabled={!!hasErrors}
                onClick={() => toast.success('Formularz wysłany!')}
              >
                Wyślij formularz
              </Button>
            )
          }}
          customButtons={() => (
            <Button variant="outline" onClick={() => toast.info('Zapisano jako szkic')}>
              Zapisz jako szkic
            </Button>
          )}
        />
      </section>

      <section>
        <h1 className="text-2xl font-bold mb-6">Demo Wizarda — tryb podglądu</h1>
        <Wizard
          name="demo-view"
          mode="view"
          pages={demoPages}
          mappingUrl={MAPPING_URL}
          dataUrl={DATA_URL}
          validationUrl={VALIDATION_URL}
          saveOnPageChange={false}
        />
      </section>
    </div>
  )
}
