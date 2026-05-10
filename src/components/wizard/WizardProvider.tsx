'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { WizardContext } from './WizardContext'
import { useStore } from '@/lib/store'
import type { WizardAPI, WizardConfig, PageMapping, SummaryResult } from '@/lib/wizard/types'
import type { ValidationItem } from '@/lib/store/types'

export function WizardProvider<T extends Record<string, unknown>>({
  name,
  mode,
  pages,
  children,
}: WizardConfig<T> & { children: React.ReactNode }) {
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loading] = useState(false)
  const [mapping] = useState<PageMapping[]>([])
  const [summary] = useState<SummaryResult | null>(null)
  const scrollToRef = useRef<string | null>(null)

  const { wizards, setWizardData, setWizardValidation, clearWizard } = useStore()
  const wizardEntry = wizards[name] ?? { form: {}, meta: { validation: [] } }
  const form = wizardEntry.form as T
  const validation = wizardEntry.meta.validation

  const pageKey = pages[page]?.name ?? ''

  useEffect(() => {
    clearWizard(name)
    return () => { clearWizard(name) }
  }, [name, clearWizard])

  useEffect(() => {
    if (scrollToRef.current) {
      document.getElementById(scrollToRef.current)?.scrollIntoView({ behavior: 'smooth' })
      scrollToRef.current = null
    }
  }, [page])

  const setValue = useCallback((key: keyof T & string, value: unknown) => {
    const updated = { ...form, [key]: value } as T
    const finalForm = pages[page]?.calc ? pages[page].calc!(updated) : updated
    setWizardData(name, finalForm as Record<string, unknown>)
  }, [form, page, pages, name, setWizardData])

  const setForm = useCallback((newForm: T) => {
    const finalForm = pages[page]?.calc ? pages[page].calc!(newForm) : newForm
    setWizardData(name, finalForm as Record<string, unknown>)
  }, [page, pages, name, setWizardData])

  const appendData = useCallback((data: Partial<T>) => {
    setWizardData(name, { ...form, ...data } as Record<string, unknown>)
  }, [form, name, setWizardData])

  const clearFields = useCallback((fields: (keyof T & string)[]) => {
    const updated = { ...form }
    fields.forEach(f => { delete updated[f] })
    setWizardData(name, updated as Record<string, unknown>)
  }, [form, name, setWizardData])

  const setValidation = useCallback((items: ValidationItem[]) => {
    setWizardValidation(name, items)
  }, [name, setWizardValidation])

  const setPageByName = useCallback((pageName: string, scrollTo?: string) => {
    const idx = mapping.findIndex(m => m.name === pageName)
    if (idx !== -1) {
      if (scrollTo) scrollToRef.current = scrollTo
      setWizardValidation(name, [])
      setPage(idx)
    }
  }, [mapping, name, setWizardValidation])

  const nav = useCallback(async (toPage: number) => {
    setBusy(true)
    setWizardValidation(name, [])
    setPage(toPage)
    setBusy(false)
  }, [name, setWizardValidation])

  const api: WizardAPI<T> = {
    form,
    setValue,
    setForm,
    appendData,
    clearFields,
    mapping,
    getLabel: (field) => `[${field}]`,
    getType: () => 'input',
    getDisplay: () => true,
    getMax: () => undefined,
    getDecimal: () => 2,
    page,
    pageKey,
    setPageByName,
    nav,
    save: async () => {},
    saveAndQuit: async () => {},
    validation,
    setValidation,
    summary,
    mode,
    loading,
    busy,
    refetch: () => {},
  }

  return (
    <WizardContext.Provider value={api as unknown as WizardAPI}>
      {children}
    </WizardContext.Provider>
  )
}
