'use client'

import { Wizard } from '@/components/wizard/Wizard'
import { useWizard } from '@/hooks/wizard/useWizard'

function Krok1() {
  const { form, setValue } = useWizard()
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Krok 1 — Start</h2>
      <div className="flex flex-col gap-1">
        <label htmlFor="tytul" className="text-sm font-medium">Tytuł</label>
        <input
          id="tytul"
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={(form.tytul as string) ?? ''}
          onChange={e => setValue('tytul', e.target.value)}
          placeholder="Wpisz tytuł…"
        />
        <p className="text-xs text-muted-foreground">Przejdź do Kroku 2 i wróć — tytuł powinien zostać.</p>
      </div>
    </div>
  )
}

function Krok2() {
  const { form } = useWizard()
  return (
    <div className="p-4 border rounded-lg flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Krok 2 — Szczegóły</h2>
      <p className="text-sm text-muted-foreground">
        Tytuł z Kroku 1: <strong>{(form.tytul as string) || '(brak)'}</strong>
      </p>
    </div>
  )
}

function Krok3() {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Krok 3 — Podsumowanie</h2>
      <p className="text-sm text-muted-foreground">Ostatni krok wizarda.</p>
    </div>
  )
}

export default function WizardDemoPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-12">
      <section>
        <h1 className="text-2xl font-bold mb-6">Demo Wizarda — tryb edycji</h1>
        <Wizard
          name="demo-edit"
          mode="edit"
          pages={[
            { name: 'krok-1', form: <Krok1 /> },
            { name: 'krok-2', form: <Krok2 /> },
            { name: 'krok-3', form: <Krok3 /> },
          ]}
          mappingUrl=""
          dataUrl=""
          saveOnPageChange={false}
        />
      </section>

      <section>
        <h1 className="text-2xl font-bold mb-6">Demo Wizarda — tryb podglądu</h1>
        <Wizard
          name="demo-view"
          mode="view"
          pages={[
            { name: 'krok-1', form: <Krok1 /> },
            { name: 'krok-2', form: <Krok2 /> },
            { name: 'krok-3', form: <Krok3 /> },
          ]}
          mappingUrl=""
          dataUrl=""
          saveOnPageChange={false}
        />
      </section>
    </div>
  )
}
