import { http, HttpResponse } from 'msw'
import {
  createWizardMappingHandler,
  createWizardDataHandler,
  createWizardSaveHandler,
  createWizardValidationHandler,
} from '@/mocks/handlers/wizard'
import {
  TASK_MAPPING,
  EMPTY_TASK_FORM,
  TASK_FIXTURES,
  TASK_LIST,
  TASK_TYPES,
  TASK_ASSIGNEES,
  TASK_VALIDATION,
} from '@/mocks/data/tasks-wizard'

export const taskWizardHandlers = [
  createWizardMappingHandler('/api/tasks/wizard/mapping', TASK_MAPPING),
  createWizardDataHandler('/api/tasks/wizard/data', EMPTY_TASK_FORM),
  createWizardSaveHandler('/api/tasks/wizard/save'),
  createWizardValidationHandler('/api/tasks/wizard/validate', TASK_VALIDATION),

  http.get('/api/tasks/wizard/data/:id', ({ params }) => {
    const id = Number(params.id)
    const fixture = TASK_FIXTURES[id]
    if (!fixture) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(fixture)
  }),

  http.get('/api/tasks/list', () => HttpResponse.json(TASK_LIST)),
  http.get('/api/tasks/dict/types', () => HttpResponse.json(TASK_TYPES)),
  http.get('/api/tasks/dict/assignees', () => HttpResponse.json(TASK_ASSIGNEES)),
]
