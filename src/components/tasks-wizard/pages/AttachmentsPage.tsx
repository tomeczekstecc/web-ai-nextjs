// Wizard step that mounts <Uploader<TaskFileMeta>> against the task-files backend.
// See specs/019-upload-component/quickstart.md §Step 3.

'use client'

import { Uploader } from '@/components/uploader'
import { taskFilesAdapter } from '@/lib/api/domains/tasks/files-adapter'
import { taskFileConfig, taskFileFields } from './task-file-schema'
import { toast } from '@/components/toast'
import type { TaskFileMeta } from '@/lib/api/domains/tasks/files-contract'

type Props = {
  taskId: number | null
  mode: 'edit' | 'view'
}

export function AttachmentsPage({ taskId, mode }: Props) {
  if (taskId == null) {
    return (
      <p className="text-sm text-muted-foreground">
        Zapisz pierwszy krok, aby dodać załączniki.
      </p>
    )
  }

  return (
    <Uploader<TaskFileMeta>
      adapter={taskFilesAdapter(taskId)}
      queryKey={['tasks', taskId, 'files']}
      fields={taskFileFields}
      config={taskFileConfig}
      constantMetadata={{ taskId }}
      readOnly={mode === 'view'}
      onNotify={(n) =>
        n.level === 'success' ? toast.success(n.message) : toast.error(n.message)
      }
    />
  )
}
