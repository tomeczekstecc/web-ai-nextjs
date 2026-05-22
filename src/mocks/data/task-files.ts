// In-memory store for the task-files mock backend.
// See specs/019-upload-component/contracts/http.md §7.

import type { StoredTaskFile } from '@/lib/api/domains/tasks/files-contract'

const store: Map<number, StoredTaskFile[]> = new Map()

function seedTask1(): StoredTaskFile[] {
  return [
    {
      id: 'f-1',
      name: 'wniosek.pdf',
      size: 180 * 1024,
      uploadedAt: '2026-05-10T09:12:00.000Z',
      metadata: {
        category: 'pdf',
        description: 'Wniosek inicjalny',
        pageCount: 4,
        validFrom: '2026-05-10',
        isConfidential: false,
      },
    },
    {
      id: 'f-2',
      name: 'skan-dowodu.jpg',
      size: 600 * 1024,
      uploadedAt: '2026-05-12T14:30:00.000Z',
      metadata: {
        category: 'scan',
        description: null,
        pageCount: null,
        validFrom: null,
        isConfidential: true,
      },
    },
  ]
}

store.set(1, seedTask1())

export function listTaskFiles(taskId: number): StoredTaskFile[] {
  return store.get(taskId) ?? []
}

export function addTaskFile(taskId: number, file: StoredTaskFile): void {
  const current = store.get(taskId) ?? []
  store.set(taskId, [...current, file])
}

export function updateTaskFileMetadata(
  taskId: number,
  id: string,
  metadata: StoredTaskFile['metadata'],
): StoredTaskFile | null {
  const current = store.get(taskId)
  if (!current) return null
  const idx = current.findIndex((f) => f.id === id)
  if (idx < 0) return null
  const updated: StoredTaskFile = { ...current[idx], metadata }
  const next = [...current]
  next[idx] = updated
  store.set(taskId, next)
  return updated
}

export function deleteTaskFile(taskId: number, id: string): boolean {
  const current = store.get(taskId)
  if (!current) return false
  const next = current.filter((f) => f.id !== id)
  if (next.length === current.length) return false
  store.set(taskId, next)
  return true
}

export function getTaskFile(taskId: number, id: string): StoredTaskFile | null {
  return store.get(taskId)?.find((f) => f.id === id) ?? null
}
