import type { PageMapping, SummaryResult } from '@/lib/wizard/types'

export type TaskListItem = {
  id: number
  title: string
  type: string
  priority: 'low' | 'normal' | 'high'
  deadline: string
  updatedAt: string
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

export const TASK_FIXTURES: Record<number, Record<string, unknown>> = (() => {
  const day = 86_400_000
  const now = Date.now()
  const isoDate = (offsetDays: number) =>
    new Date(now + offsetDays * day).toISOString().slice(0, 10)

  return {
    1: {
      title: 'Przygotowanie raportu Q2',
      type: 'złożone',
      description: 'Zebranie danych i przygotowanie kwartalnego raportu finansowego.',
      priority: 'high',
      deadline: isoDate(14),
      start_date: isoDate(7),
      assignee_id: '1',
      related_ids: [2],
      notes: '',
      deadline_urgency: 'Normalne',
    },
    2: {
      title: 'Spotkanie z klientem',
      type: 'personal',
      description: 'Omówienie wymagań projektu z klientem.',
      priority: 'normal',
      deadline: isoDate(20),
      start_date: isoDate(18),
      assignee_id: '',
      related_ids: [],
      notes: 'Przygotować agendę spotkania.',
      deadline_urgency: 'Spokojnie',
    },
    3: {
      title: 'Aktualizacja dokumentacji',
      type: 'proste',
      description: 'Uzupełnienie dokumentacji technicznej o nowe funkcje.',
      priority: 'low',
      deadline: isoDate(30),
      start_date: isoDate(25),
      assignee_id: '3',
      related_ids: [1],
      notes: '',
      deadline_urgency: 'Spokojnie',
    },

    // --- Scenario fixtures (cover validator branches) ---

    // 4: Overdue deadline (past) → error.deadline
    4: {
      title: 'Zaległa migracja bazy',
      type: 'złożone',
      description: 'Migracja schematu, która miała się zakończyć wczoraj.',
      priority: 'high',
      deadline: isoDate(-3),
      start_date: isoDate(-10),
      assignee_id: '2',
      related_ids: [],
      notes: 'Wymaga eskalacji.',
      deadline_urgency: 'Pilne',
    },

    // 5: Urgent (<24h) → warning.deadline
    5: {
      title: 'Pilna poprawka produkcyjna',
      type: 'złożone',
      description: 'Hotfix dla zgłoszonego incydentu klasy P1.',
      priority: 'high',
      deadline: new Date(now + 6 * 3600_000).toISOString().slice(0, 10),
      start_date: isoDate(0),
      assignee_id: '1',
      related_ids: [4],
      notes: 'Po wdrożeniu poinformować stakeholderów.',
      deadline_urgency: 'Pilne',
    },

    // 6: Missing title (empty) → error.title
    6: {
      title: '',
      type: 'proste',
      description: 'Szkic zadania bez tytułu — do uzupełnienia.',
      priority: 'normal',
      deadline: isoDate(10),
      start_date: isoDate(2),
      assignee_id: '3',
      related_ids: [],
      notes: '',
      deadline_urgency: 'Normalne',
    },

    // 7: Too-short title (2 chars) → error.title (min 3)
    7: {
      title: 'OK',
      type: 'proste',
      description: 'Tytuł za krótki, walidator powinien to wyłapać.',
      priority: 'low',
      deadline: isoDate(45),
      start_date: isoDate(40),
      assignee_id: '2',
      related_ids: [],
      notes: '',
      deadline_urgency: 'Spokojnie',
    },

    // 8: Past deadline + missing title — multi-error
    8: {
      title: '',
      type: 'złożone',
      description: 'Szkic, który miał deadline tydzień temu i nigdy nie został dokończony.',
      priority: 'high',
      deadline: isoDate(-7),
      start_date: isoDate(-14),
      assignee_id: '',
      related_ids: [4, 6],
      notes: 'Czy nadal aktualne?',
      deadline_urgency: 'Pilne',
    },

    // 9: Personal task — clean, no assignee expected
    9: {
      title: 'Przegląd osobistych celi kwartalnych',
      type: 'personal',
      description: 'Refleksja nad celami i planowanie kolejnego sprintu personalnego.',
      priority: 'low',
      deadline: isoDate(60),
      start_date: isoDate(55),
      assignee_id: '',
      related_ids: [],
      notes: 'Zaplanować 90 min w kalendarzu.',
      deadline_urgency: 'Spokojnie',
    },

    // 10: Complex with many related tasks — stress test RelatedPage
    10: {
      title: 'Konsolidacja modułu rozliczeń',
      type: 'złożone',
      description:
        'Połączenie kilku wątków refaktoryzacyjnych w jeden release. Wymaga koordynacji.',
      priority: 'high',
      deadline: isoDate(21),
      start_date: isoDate(3),
      assignee_id: '1',
      related_ids: [1, 2, 3, 4],
      notes:
        'Zsynchronizować z zespołem billingu. Sprawdzić zależności od migracji (4).',
      deadline_urgency: 'Normalne',
    },

    // 11: Clean low-priority — happy path, brak błędów i warningów
    11: {
      title: 'Porządkowanie zalegających zgłoszeń',
      type: 'proste',
      description: 'Triage starych ticketów w backlogu wsparcia.',
      priority: 'low',
      deadline: isoDate(40),
      start_date: isoDate(30),
      assignee_id: '3',
      related_ids: [],
      notes: '',
      deadline_urgency: 'Spokojnie',
    },

    // 12: Długi opis — sanity check dla textarea i layoutu summary
    12: {
      title: 'Audyt dostępów i upraw‐nień produkcyjnych',
      type: 'złożone',
      description: [
        'Pełny przegląd ról, grup oraz przypisanych uprawnień w systemach produkcyjnych.',
        'Skupić się na kontach serwisowych, dostępach do bazy oraz wygaśniętych tokenach.',
        'Wynik audytu zaraportować w formie tabelarycznej w wiki zespołu.',
        'Zaplanować follow-up call z bezpieczeństwem po dostarczeniu wyników.',
      ].join(' '),
      priority: 'normal',
      deadline: isoDate(28),
      start_date: isoDate(14),
      assignee_id: '2',
      related_ids: [1, 11],
      notes: 'Pamiętać o RODO i logach dostępowych.',
      deadline_urgency: 'Normalne',
    },
  }
})()

export const TASK_LIST: TaskListItem[] = (() => {
  // Spread "last updated" across a believable window so the relative-time
  // column shows a mix of „minutę temu”, „godzinę temu”, „3 dni temu”, etc.
  // Offsets are in minutes back from `now`.
  const now = Date.now()
  const minute = 60_000
  const updatedOffsetsMin: Record<number, number> = {
    1:  2,           // 2 min temu
    2:  37,          // ~37 min temu
    3:  3 * 60,      // ~3 godz. temu
    4:  9 * 60,      // ~9 godz. temu
    5:  24 * 60,     // 1 dzień temu
    6:  2 * 24 * 60, // 2 dni temu
    7:  4 * 24 * 60,
    8:  7 * 24 * 60,
    9:  10 * 24 * 60,
    10: 14 * 24 * 60,
    11: 21 * 24 * 60,
    12: 30 * 24 * 60,
  }
  return Object.entries(TASK_FIXTURES).map(([rawId, f]) => {
    const id = Number(rawId)
    const offset = updatedOffsetsMin[id] ?? 60
    return {
      id,
      title: (f.title as string) || '(bez tytułu)',
      type: f.type as string,
      priority: f.priority as TaskListItem['priority'],
      deadline: (f.deadline as string) || '',
      updatedAt: new Date(now - offset * minute).toISOString(),
    }
  })
})()

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
