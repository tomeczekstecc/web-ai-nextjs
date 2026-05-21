import { http, HttpResponse } from 'msw'
import {
  createWizardMappingHandler,
  createWizardDataHandler,
  createWizardSaveHandler,
  createWizardValidationHandler,
  setMockWizardForm,
} from '@/mocks/handlers/wizard'
import {
  TASK_MAPPING,
  EMPTY_TASK_FORM,
  TASK_FIXTURES,
  TASK_LIST,
  TASK_TYPES,
  TASK_ASSIGNEES,
} from '@/mocks/data/tasks-wizard'
import type { SummaryResult } from '@/lib/wizard/types'

const WIZARD_KEY = 'tasks-wizard'

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function validateTaskForm(form: Record<string, unknown>): SummaryResult {
  const error: Record<string, string[]> = {}
  const warning: Record<string, string[]> = {}

  const title = asString(form.title).trim()
  if (title.length < 3) {
    error.title = ['Tytuł jest wymagany i musi mieć co najmniej 3 znaki']
  }

  const deadline = asString(form.deadline)
  if (deadline) {
    const ts = Date.parse(deadline)
    if (!Number.isNaN(ts)) {
      const hoursLeft = (ts - Date.now()) / 36e5
      if (hoursLeft < 0) {
        error.deadline = ['Termin jest w przeszłości']
      } else if (hoursLeft < 24) {
        warning.deadline = [
          'Termin jest bardzo bliski — upewnij się, że zadanie jest wykonalne',
        ]
      }
    }
  }

  return {
    error,
    warning,
    dicts_msg: { error: {}, warning: {} },
  }
}

export const taskWizardHandlers = [
  createWizardMappingHandler('/api/tasks/wizard/mapping', TASK_MAPPING),
  createWizardDataHandler('/api/tasks/wizard/data', EMPTY_TASK_FORM, WIZARD_KEY),
  createWizardSaveHandler('/api/tasks/wizard/save', WIZARD_KEY),
  createWizardValidationHandler('/api/tasks/wizard/validate', validateTaskForm, WIZARD_KEY),

  http.get('/api/tasks/wizard/data/:id', ({ params }) => {
    const id = Number(params.id)
    const fixture = TASK_FIXTURES[id]
    if (!fixture) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    setMockWizardForm(WIZARD_KEY, fixture)
    return HttpResponse.json(fixture)
  }),

  http.get('/api/tasks/list', () => HttpResponse.json(TASK_LIST)),
  http.get('/api/tasks/dict/types', () => HttpResponse.json(TASK_TYPES)),
  http.get('/api/tasks/dict/assignees', () => HttpResponse.json(TASK_ASSIGNEES)),
]
