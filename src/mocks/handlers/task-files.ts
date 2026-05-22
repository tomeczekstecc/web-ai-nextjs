// MSW handlers for the task-files mock backend.
// See specs/019-upload-component/contracts/http.md.

import { http, HttpResponse, delay } from 'msw'
import {
  listTaskFiles,
  addTaskFile,
  updateTaskFileMetadata,
  deleteTaskFile,
  getTaskFile,
} from '@/mocks/data/task-files'
import type {
  StoredTaskFile,
  TaskFileMeta,
} from '@/lib/api/domains/tasks/files-contract'

let uploadCounter = 0

function newId(): string {
  return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function failModeActive(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('fail') === 'true'
}

function parseMetadata(raw: unknown): TaskFileMeta | null {
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as TaskFileMeta
  } catch {
    return null
  }
}

export const taskFilesHandlers = [
  // List
  http.get('/api/tasks/:taskId/files', async ({ params }) => {
    await delay(150)
    const taskId = Number(params.taskId)
    return HttpResponse.json(listTaskFiles(taskId))
  }),

  // Upload (multipart: file + metadata)
  http.post('/api/tasks/:taskId/files', async ({ request, params }) => {
    const taskId = Number(params.taskId)
    const fd = await request.formData()
    const file = fd.get('file')
    const metaPart = fd.get('metadata')

    if (!(file instanceof File)) {
      return HttpResponse.json(
        { message: 'Brak pliku w żądaniu.' },
        { status: 400 },
      )
    }
    const metadata =
      metaPart instanceof Blob
        ? parseMetadata(await metaPart.text())
        : parseMetadata(metaPart)
    if (!metadata) {
      return HttpResponse.json(
        { message: 'Nieprawidłowe metadane.' },
        { status: 400 },
      )
    }

    const sizeKb = file.size / 1024
    const ms = Math.min(2000, 300 + sizeKb)
    await delay(ms)

    uploadCounter += 1
    if (failModeActive() && uploadCounter % 3 === 0) {
      return HttpResponse.json(
        {
          message: 'Plik odrzucony',
          errors: {
            'metadata.category': 'Nieobsługiwana kategoria',
          },
        },
        { status: 422 },
      )
    }

    const stored: StoredTaskFile = {
      id: newId(),
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      metadata,
    }
    addTaskFile(taskId, stored)
    return HttpResponse.json(stored, { status: 201 })
  }),

  // Edit metadata
  http.put('/api/tasks/:taskId/files/:fileId', async ({ request, params }) => {
    await delay(150)
    const taskId = Number(params.taskId)
    const fileId = String(params.fileId)
    const body = (await request.json()) as TaskFileMeta
    const updated = updateTaskFileMetadata(taskId, fileId, body)
    if (!updated) {
      return HttpResponse.json(
        { message: 'Plik nie został znaleziony.' },
        { status: 404 },
      )
    }
    return HttpResponse.json(updated)
  }),

  // Delete
  http.delete('/api/tasks/:taskId/files/:fileId', async ({ params }) => {
    await delay(150)
    const taskId = Number(params.taskId)
    const fileId = String(params.fileId)
    deleteTaskFile(taskId, fileId) // idempotent — always 204
    return new HttpResponse(null, { status: 204 })
  }),

  // Download
  http.get('/api/tasks/:taskId/files/:fileId/download', async ({ params }) => {
    await delay(100)
    const taskId = Number(params.taskId)
    const fileId = String(params.fileId)
    const file = getTaskFile(taskId, fileId)
    if (!file) {
      return HttpResponse.json(
        { message: 'Plik nie został znaleziony.' },
        { status: 404 },
      )
    }
    const body = `mock content for ${file.name}`
    return new HttpResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
    })
  }),
]
