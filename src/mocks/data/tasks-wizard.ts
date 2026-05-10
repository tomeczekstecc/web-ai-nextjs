import type { PageMapping, SummaryResult } from '@/lib/wizard/types'

export type TaskListItem = {
  id: number
  title: string
  type: string
  priority: 'low' | 'normal' | 'high'
  deadline: string
}

export type DictOption = {
  value: string
  label: string
}

export const TASK_MAPPING: PageMapping[] = [
  {
    name: 'start',
    label: 'Start',
    fields: [
      { name: 'title',       label: 'Tytuł',       type: 'input',    lp: 1, display: true },
      { name: 'type',        label: 'Typ zadania',  type: 'select',   lp: 2, display: true },
      { name: 'description', label: 'Opis',         type: 'textarea', lp: 3, display: true },
    ],
  },
  {
    name: 'schedule',
    label: 'Harmonogram',
    fields: [
      { name: 'priority',   label: 'Priorytet',  type: 'radio', lp: 1, display: true },
      { name: 'deadline',   label: 'Termin',     type: 'date',  lp: 2, display: true },
      { name: 'start_date', label: 'Data start', type: 'date',  lp: 3, display: true },
    ],
  },
  {
    name: 'assignment',
    label: 'Przypisanie',
    fields: [
      { name: 'assignee_id', label: 'Przypisany do', type: 'select', lp: 1, display: true },
    ],
  },
  {
    name: 'related',
    label: 'Powiązane',
    fields: [
      { name: 'related_ids', label: 'Powiązane zadania', type: 'checkbox', lp: 1, display: true },
    ],
  },
  {
    name: 'summary',
    label: 'Podsumowanie',
    fields: [],
  },
]

export const EMPTY_TASK_FORM: Record<string, unknown> = {
  title: '',
  type: '',
  description: '',
  priority: 'normal',
  deadline: '',
  start_date: '',
  assignee_id: '',
  related_ids: [],
  notes: '',
  deadline_urgency: 'Brak daty',
}

export const TASK_FIXTURES: Record<number, Record<string, unknown>> = {
  1: {
    title: 'Przygotowanie raportu Q2',
    type: 'złożone',
    description: 'Zebranie danych i przygotowanie kwartalnego raportu finansowego.',
    priority: 'high',
    deadline: '2026-05-15',
    start_date: '2026-05-10',
    assignee_id: '1',
    related_ids: [2],
    notes: '',
    deadline_urgency: 'Pilne',
  },
  2: {
    title: 'Spotkanie z klientem',
    type: 'personal',
    description: 'Omówienie wymagań projektu z klientem.',
    priority: 'normal',
    deadline: '2026-05-20',
    start_date: '2026-05-18',
    assignee_id: '',
    related_ids: [],
    notes: 'Przygotować agendę spotkania.',
    deadline_urgency: 'Normalne',
  },
  3: {
    title: 'Aktualizacja dokumentacji',
    type: 'proste',
    description: 'Uzupełnienie dokumentacji technicznej o nowe funkcje.',
    priority: 'low',
    deadline: '2026-06-01',
    start_date: '2026-05-25',
    assignee_id: '3',
    related_ids: [1],
    notes: '',
    deadline_urgency: 'Spokojnie',
  },
}

export const TASK_LIST: TaskListItem[] = [
  { id: 1, title: 'Przygotowanie raportu Q2',    type: 'złożone',  priority: 'high',   deadline: '2026-05-15' },
  { id: 2, title: 'Spotkanie z klientem',         type: 'personal', priority: 'normal', deadline: '2026-05-20' },
  { id: 3, title: 'Aktualizacja dokumentacji',    type: 'proste',   priority: 'low',    deadline: '2026-06-01' },
]

export const TASK_TYPES: DictOption[] = [
  { value: 'złożone',  label: 'Złożone' },
  { value: 'personal', label: 'Osobiste' },
  { value: 'proste',   label: 'Proste' },
]

export const TASK_ASSIGNEES: DictOption[] = [
  { value: '1', label: 'Anna Kowalska' },
  { value: '2', label: 'Jan Nowak' },
  { value: '3', label: 'Maria Wiśniewska' },
]

export const TASK_VALIDATION: SummaryResult = {
  error: {
    title: ['Tytuł jest wymagany i musi mieć co najmniej 3 znaki'],
  },
  warning: {
    deadline: ['Termin jest bardzo bliski — upewnij się, że zadanie jest wykonalne'],
  },
  dicts_msg: {
    error: {},
    warning: {},
  },
}
