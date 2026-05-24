'use client'

import { useCallback, useEffect, useRef } from 'react'
import { toast } from '@/components/toast'
import { saveBlobAsFile } from '@/lib/api/core/download-blob'
import { useStore } from '@/lib/store'
import { submitGenerateReport } from '@/lib/api/domains/reports/commands'
import { checkGenerationStatus, downloadReport } from '@/lib/api/domains/reports/client'
import {
  REPORT_POLL_INTERVAL_MS,
  REPORT_POLL_MAX_ATTEMPTS,
} from '@/lib/api/domains/reports/polling'
import type { GenerateReportInput } from '@/lib/api/domains/reports/contract'

export function useReportGeneration(reportId: number) {
  const setGenerationState = useStore(s => s.setGenerationState)
  const clearGenerationState = useStore(s => s.clearGenerationState)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef = useRef(0)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startPolling = useCallback(
    (jobId: string) => {
      attemptsRef.current = 0

      intervalRef.current = setInterval(() => {
        attemptsRef.current += 1

        if (attemptsRef.current > REPORT_POLL_MAX_ATTEMPTS) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          clearGenerationState(reportId)
          toast.error('Generowanie raportu przekroczyło limit czasu. Spróbuj ponownie.')
          return
        }

        checkGenerationStatus(jobId)
          .then(res => {
            if (res.status === 'done') {
              if (intervalRef.current) clearInterval(intervalRef.current)
              return downloadReport(jobId).then(({ blob, filename }) => {
                saveBlobAsFile(blob, filename)
                setGenerationState(reportId, 'done')
                setTimeout(() => clearGenerationState(reportId), 2000)
              })
            }
            if (res.status === 'failed') {
              if (intervalRef.current) clearInterval(intervalRef.current)
              setGenerationState(reportId, 'failed')
              toast.error(res.message ?? 'Generowanie raportu nie powiodło się.')
              setTimeout(() => clearGenerationState(reportId), 3000)
            }
          })
          .catch(() => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setGenerationState(reportId, 'failed')
            toast.error('Błąd podczas sprawdzania statusu raportu.')
            setTimeout(() => clearGenerationState(reportId), 3000)
          })
      }, REPORT_POLL_INTERVAL_MS)
    },
    [reportId, setGenerationState, clearGenerationState],
  )

  const generate = useCallback(
    async (parameters?: GenerateReportInput['parameters']) => {
      setGenerationState(reportId, 'pending')
      try {
        const { jobId } = await submitGenerateReport({ reportId, parameters })
        startPolling(jobId)
      } catch {
        setGenerationState(reportId, 'failed')
        toast.error('Nie udało się uruchomić generowania raportu.')
        setTimeout(() => clearGenerationState(reportId), 3000)
      }
    },
    [reportId, setGenerationState, clearGenerationState, startPolling],
  )

  return { generate }
}
