'use client'

import { useState } from 'react'
import { ChevronRightIcon, ChevronsRightIcon, ChevronLeftIcon, ChevronsLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type DualListItem = {
  id: number
  label: string
}

type Props = {
  available: DualListItem[]
  selected: DualListItem[]
  onChange: (selected: DualListItem[]) => void
  disabled?: boolean
}

export function DualListTransfer({ available, selected, onChange, disabled = false }: Props) {
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')
  const [leftSelected, setLeftSelected] = useState<Set<number>>(new Set())
  const [rightSelected, setRightSelected] = useState<Set<number>>(new Set())

  const filteredAvailable = available.filter(i =>
    i.label.toLowerCase().includes(leftSearch.toLowerCase()),
  )
  const filteredSelected = selected.filter(i =>
    i.label.toLowerCase().includes(rightSearch.toLowerCase()),
  )

  function moveRight() {
    const toMove = available.filter(i => leftSelected.has(i.id))
    onChange([...selected, ...toMove])
    setLeftSelected(new Set())
  }

  function moveAllRight() {
    onChange([...selected, ...available])
    setLeftSelected(new Set())
  }

  function moveLeft() {
    onChange(selected.filter(i => !rightSelected.has(i.id)))
    setRightSelected(new Set())
  }

  function moveAllLeft() {
    onChange([])
    setRightSelected(new Set())
  }

  function toggleLeft(id: number) {
    setLeftSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleRight(id: number) {
    setRightSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start">
      {/* Dostępne */}
      <div className="flex flex-1 flex-col gap-1.5">
        <p className="text-sm font-medium">Dostępne</p>
        <Input
          placeholder="Szukaj…"
          value={leftSearch}
          onChange={e => setLeftSearch(e.target.value)}
          disabled={disabled}
          className="h-8 text-sm"
        />
        <div className="h-48 overflow-y-auto rounded-md border bg-background p-1">
          {filteredAvailable.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">Brak pozycji</p>
          ) : (
            filteredAvailable.map(item => (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleLeft(item.id)}
                className={cn(
                  'w-full rounded px-2 py-1 text-left text-sm transition-colors',
                  leftSelected.has(item.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Transfer buttons */}
      <div className="flex flex-row items-center justify-center gap-1 md:flex-col md:pt-12">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={disabled || available.length === 0}
          onClick={moveAllRight}
          aria-label="Przenieś wszystkie w prawo"
        >
          <ChevronsRightIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={disabled || leftSelected.size === 0}
          onClick={moveRight}
          aria-label="Przenieś wybrane w prawo"
        >
          <ChevronRightIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={disabled || rightSelected.size === 0}
          onClick={moveLeft}
          aria-label="Przenieś wybrane w lewo"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={disabled || selected.length === 0}
          onClick={moveAllLeft}
          aria-label="Przenieś wszystkie w lewo"
        >
          <ChevronsLeftIcon />
        </Button>
      </div>

      {/* Wybrane */}
      <div className="flex flex-1 flex-col gap-1.5">
        <p className="text-sm font-medium">Wybrane</p>
        <Input
          placeholder="Szukaj…"
          value={rightSearch}
          onChange={e => setRightSearch(e.target.value)}
          disabled={disabled}
          className="h-8 text-sm"
        />
        <div className="h-48 overflow-y-auto rounded-md border bg-background p-1">
          {filteredSelected.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">Brak wybranych</p>
          ) : (
            filteredSelected.map(item => (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleRight(item.id)}
                className={cn(
                  'w-full rounded px-2 py-1 text-left text-sm transition-colors',
                  rightSelected.has(item.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
