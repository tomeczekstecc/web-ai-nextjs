'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TaskListItem } from '@/mocks/data/tasks-wizard'

const PRIORITY_LABELS: Record<string, string> = {
  low:    'Niski',
  normal: 'Normalny',
  high:   'Wysoki',
}

export default function WizardDemoPage() {
  const { data: tasks = [], isLoading } = useQuery<TaskListItem[]>({
    queryKey: ['tasks-list'],
    queryFn: () => fetch('/api/tasks/list').then(r => r.json()),
  })

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zadania</h1>
        <Button render={<Link href="/wizard-demo/new" />}>Nowe zadanie</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tytuł</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Priorytet</TableHead>
            <TableHead>Termin</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Ładowanie…
              </TableCell>
            </TableRow>
          )}
          {tasks.map(task => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{task.type}</TableCell>
              <TableCell>{PRIORITY_LABELS[task.priority] ?? task.priority}</TableCell>
              <TableCell>{task.deadline}</TableCell>
              <TableCell className="text-right flex justify-end gap-2">
                <Button variant="outline" size="sm" render={<Link href={`/wizard-demo/${task.id}`} />}>
                  Edytuj
                </Button>
                <Button variant="ghost" size="sm" render={<Link href={`/wizard-demo/${task.id}/view`} />}>
                  Podgląd
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
