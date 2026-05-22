// Default Polish copy bundle. See specs/019-upload-component/contracts/component.ts §UploaderCopy.

import type { UploaderCopy } from './types'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export const defaultCopy: UploaderCopy = {
  dropzoneDrag: 'Upuść pliki tutaj',
  dropzoneIdle: 'Przeciągnij pliki tutaj lub kliknij, aby wybrać',
  dropzoneButton: 'Wybierz pliki',
  queueTitle: 'Pliki oczekujące na przesłanie',
  repositoryTitle: 'Pliki w repozytorium',
  uploadAll: 'Przekaż wszystkie',
  cancel: 'Anuluj',
  cancelAll: 'Anuluj wszystkie',
  retry: 'Spróbuj ponownie',
  remove: 'Usuń',
  edit: 'Edytuj',
  delete: 'Usuń',
  download: 'Pobierz',
  save: 'Zapisz',
  uploadRow: 'Prześlij',
  deleteConfirmTitle: 'Usuń plik',
  deleteConfirmBody: (filename) =>
    `Czy na pewno chcesz usunąć plik „${filename}”? Tej operacji nie można cofnąć.`,
  emptyRepository: 'Brak plików w repozytorium',
  emptyQueue: 'Brak plików oczekujących',
  errors: {
    network: 'Błąd sieci. Spróbuj ponownie.',
    server: 'Wystąpił błąd serwera. Spróbuj ponownie później.',
    unknown: 'Wystąpił nieoczekiwany błąd.',
    missingRequired: (label) => `Pole „${label}” jest wymagane.`,
    tooLarge: (max, actual) =>
      `Plik jest zbyt duży (${formatBytes(actual)}). Maksymalny rozmiar to ${formatBytes(max)}.`,
    tooMany: (max) => `Można dodać maksymalnie ${max} plików.`,
    badExtension: (allowed) =>
      `Niedozwolony format pliku. Dozwolone: ${allowed.join(', ')}.`,
    emptyFile: 'Plik jest pusty.',
    listFetch: 'Nie udało się pobrać listy plików.',
  },
  notifications: {
    uploadAllDone: (ok, skipped, failed) => {
      const parts: string[] = []
      if (ok) parts.push(`przesłano: ${ok}`)
      if (skipped) parts.push(`pominięto: ${skipped}`)
      if (failed) parts.push(`błędy: ${failed}`)
      return `Zakończono przesyłanie (${parts.join(', ') || 'brak plików'}).`
    },
    listFetchFailed: 'Nie udało się pobrać listy plików.',
    deleted: 'Plik został usunięty.',
  },
}

export function mergeCopy(override?: Partial<UploaderCopy>): UploaderCopy {
  if (!override) return defaultCopy
  return {
    ...defaultCopy,
    ...override,
    errors: { ...defaultCopy.errors, ...(override.errors ?? {}) },
    notifications: { ...defaultCopy.notifications, ...(override.notifications ?? {}) },
  }
}
