'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WizardContext } from './WizardContext'
import { useStore } from '@/lib/store'
import { useWizardMapping } from '@/hooks/wizard/useWizardMapping'
import { useWizardData } from '@/hooks/wizard/useWizardData'
import { useWizardSave } from '@/hooks/wizard/useWizardSave'
import type { WizardAPI, WizardConfig, PageMapping, SummaryResult } from '@/lib/wizard/types'
import type { ValidationItem } from '@/lib/store/types'
import { runPageSchema, parseSummaryResult } from '@/lib/wizard/validation'

function findField(mapping: PageMapping[], field: string, pg?: string) {
  const pages = pg ? mapping.filter(m => m.name === pg) : mapping
  return pages.flatMap(m => m.fields).find(f => f.name === field)
}

export function WizardProvider<T extends Record<string, unknown>>({
  name,
  mode,
  pages,
  mappingUrl,
  dataUrl,
  saveUrl,
  validationUrl,
  saveOnPageChange,
  saveAndQuitCallback,
  children,
}: WizardConfig<T> & { children: React.ReactNode }) {
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState<SummaryResult | null>(null)
  const scrollToRef = useRef<string | null>(null)

  const { wizards, setWizardData, setWizardValidation, clearWizard } = useStore()
  const wizardEntry = wizards[name] ?? { form: {}, meta: { validation: [] } }
  const form = wizardEntry.form as T
  const validation = wizardEntry.meta.validation

  const { data: mappingData, isLoading: mappingLoading } = useWizardMapping(mappingUrl)
  const mapping = useMemo(() => mappingData ?? [], [mappingData])

  const { data: fetchedData, isLoading: dataLoading, refetch } = useWizardData(dataUrl)

  const saveMutation = useWizardSave(saveUrl)

  const loading = mappingLoading || dataLoading

  const pageKey = pages[page]?.name ?? ''

  useEffect(() => {
    clearWizard(name)
    return () => { clearWizard(name) }
  }, [name, clearWizard])

  useEffect(() => {
    if (fetchedData) setWizardData(name, fetchedData)
  }, [fetchedData, name, setWizardData])

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
      setPage(idx)
    }
  }, [mapping])

  const nav = useCallback(async (toPage: number) => {
    const currentPage = pages[page]
    if (currentPage?.schema) {
      const errors = runPageSchema(currentPage.schema, form)
      if (errors.length > 0) {
        setWizardValidation(name, errors)
        return
      }
    }

    setBusy(true)
    if (saveOnPageChange && mode === 'edit' && saveUrl) {
      await saveMutation.mutateAsync(form as Record<string, unknown>).catch(() => {})
    }
    setWizardValidation(name, [])
    setPage(toPage)

    const targetPage = pages[toPage]
    if (targetPage?.isSummaryPage && validationUrl) {
      try {
        const res = await fetch(validationUrl)
        const result = await res.json() as SummaryResult
        setSummary(result)
        setWizardValidation(name, parseSummaryResult(result))
      } catch {
        // non-blocking
      }
    }

    setBusy(false)
  }, [saveOnPageChange, mode, saveUrl, saveMutation, form, name, setWizardValidation, pages, page, validationUrl])

  const save = useCallback(async () => {
    await saveMutation.mutateAsync(form as Record<string, unknown>)
  }, [saveMutation, form])

  const saveAndQuit = useCallback(async () => {
    await saveMutation.mutateAsync(form as Record<string, unknown>)
    saveAndQuitCallback?.()
  }, [saveMutation, form, saveAndQuitCallback])

  const api: WizardAPI<T> = {
    form,
    setValue,
    setForm,
    appendData,
    clearFields,
    mapping,
    getLabel: (field, pg) => findField(mapping, field, pg)?.label ?? field,
    getType: (field, pg) => findField(mapping, field, pg)?.type ?? 'input',
    getDisplay: (field, pg) => findField(mapping, field, pg)?.display ?? true,
    getMax: (field, pg) => findField(mapping, field, pg)?.max,
    getDecimal: (field, pg) => findField(mapping, field, pg)?.decimal ?? 2,
    page,
    pageKey,
    setPageByName,
    nav,
    save,
    saveAndQuit,
    validation,
    setValidation,
    summary,
    mode,
    loading,
    busy,
    refetch: () => { void refetch() },
  }

  return (
    <WizardContext.Provider value={api as unknown as WizardAPI}>
      {children}
    </WizardContext.Provider>
  )
}
