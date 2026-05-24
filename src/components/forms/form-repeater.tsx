"use client"

import { useState } from "react"
import { resolveIcon } from "@/lib/icons"

const ChevronDownIcon = resolveIcon("ChevronDown");
const ChevronUpIcon = resolveIcon("ChevronUp");
const PlusIcon = resolveIcon("Plus");
const Trash2Icon = resolveIcon("Trash2");

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { RepeaterBaseProps, RepeaterRowArgs } from "./repeater-types"

type DeleteRowButtonProps = {
  index: number
  canRemove: boolean
  disabled?: boolean
  onRemove: () => void
}

function DeleteRowButton({ index, canRemove, disabled, onRemove }: DeleteRowButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canRemove || disabled}
            aria-label={`Usuń wiersz ${index + 1}`}
          />
        }
      >
        <Trash2Icon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usunąć wiersz?</DialogTitle>
          <DialogDescription>
            Wiersz zostanie usunięty z formularza. Tej operacji nie można cofnąć.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Anuluj
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => { onRemove(); setOpen(false) }}
          >
            Usuń
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Stacked / card-style repeater. Each row is rendered as its own block,
 * with row actions (remove + optional reorder) on the right.
 *
 * Rendering and validation of inner fields are the caller's responsibility
 * via the `children` render-prop.
 *
 * @example
 * <FormRepeater
 *   form={form}
 *   name="parameters"
 *   newItem={() => ({ name: "", type: "", value: "", description: "" })}
 *   label="Parametry"
 *   addLabel="+ Dodaj parametr"
 *   min={0}
 *   max={10}
 * >
 *   {({ name }) => (
 *     <div className="grid grid-cols-4 gap-3">
 *       <form.Field name={`${name}.name`}>{...}</form.Field>
 *       ...
 *     </div>
 *   )}
 * </FormRepeater>
 */
export function FormRepeater<T>({
  form,
  name,
  newItem,
  min = 0,
  max = Infinity,
  reorderable = false,
  label,
  addLabel = "+ Dodaj",
  emptyState = null,
  className,
  disabled = false,
  children,
}: RepeaterBaseProps<T>) {
  return (
    <form.Field name={name} mode="array">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(field: any) => {
        const rows = (field.state.value ?? []) as unknown[]
        const count = rows.length
        const canAdd = !disabled && count < max
        const canRemoveAny = !disabled && count > min

        return (
          <fieldset className={cn("flex flex-col gap-3", className)} data-slot="form-repeater">
            {label && (
              <legend className="mb-1.5 text-base font-medium">{label}</legend>
            )}

            {count === 0 && emptyState ? (
              <div className="text-muted-foreground text-sm">{emptyState}</div>
            ) : (
              <div className="flex flex-col gap-3">
                {rows.map((_, index) => {
                  const args: RepeaterRowArgs = {
                    name: `${name}[${index}]`,
                    index,
                    remove: () => field.removeValue(index),
                    moveUp: () =>
                      index > 0 && field.moveValue(index, index - 1),
                    moveDown: () =>
                      index < count - 1 && field.moveValue(index, index + 1),
                    isFirst: index === 0,
                    isLast: index === count - 1,
                    canRemove: canRemoveAny,
                  }

                  return (
                    <div
                      key={index}
                      data-slot="form-repeater-row"
                      className="flex items-start gap-2"
                    >
                      <div className="flex-1 min-w-0">{children(args)}</div>

                      <div className="flex items-center gap-1 pt-6">
                        {reorderable && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={disabled || args.isFirst}
                              onClick={args.moveUp}
                              aria-label={`Przesuń wiersz ${index + 1} w górę`}
                            >
                              <ChevronUpIcon />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={disabled || args.isLast}
                              onClick={args.moveDown}
                              aria-label={`Przesuń wiersz ${index + 1} w dół`}
                            >
                              <ChevronDownIcon />
                            </Button>
                          </>
                        )}
                        <DeleteRowButton
                          index={index}
                          canRemove={args.canRemove}
                          disabled={disabled}
                          onRemove={args.remove}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={!canAdd}
                onClick={() => field.pushValue(newItem())}
              >
                <PlusIcon />
                {addLabel}
              </Button>
            </div>
          </fieldset>
        )
      }}
    </form.Field>
  )
}
