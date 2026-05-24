"use client"

import { useState } from "react"
import type { ReactNode } from "react"
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

export type TableRepeaterColumn = {
  header: ReactNode
  /** Tailwind classes applied to both `<th>` and each `<td>` in the column. */
  className?: string
  align?: "left" | "right" | "center"
}

export type TableRepeaterProps<T> = RepeaterBaseProps<T> & {
  /** Column definitions (header cells). The body cells are rendered by `children`. */
  columns: TableRepeaterColumn[]
  /** Where to render the action column. Default `"right"`. */
  actionsPosition?: "left" | "right"
  /** Header label for the action column. Default `""` (visually empty). */
  actionsHeader?: ReactNode
}

/**
 * Tabular repeater. Renders a single `<table>` with a shared header,
 * one `<tr>` per row, and an actions column for remove / optional reorder.
 *
 * The render-prop `children` must return the row's `<td>` cells in the same
 * order as `columns` — the action `<td>` is rendered by the repeater itself.
 *
 * @example
 * <TableRepeater
 *   form={form}
 *   name="instruments"
 *   newItem={() => ({ name: "", amountPln: "0.00", amountEur: "0.00" })}
 *   label="Instrumenty terytorialne"
 *   addLabel="+ Dodaj instrument terytorialny"
 *   actionsPosition="left"
 *   columns={[
 *     { header: "Nazwa instrumentu" },
 *     { header: "Kwota PLN", align: "right" },
 *     { header: "Kwota €",   align: "right" },
 *   ]}
 * >
 *   {({ name }) => (
 *     <>
 *       <td><form.Field name={`${name}.name`}>{...}</form.Field></td>
 *       <td><form.Field name={`${name}.amountPln`}>{...}</form.Field></td>
 *       <td><form.Field name={`${name}.amountEur`}>{...}</form.Field></td>
 *     </>
 *   )}
 * </TableRepeater>
 */
export function TableRepeater<T>({
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
  columns,
  actionsPosition = "right",
  actionsHeader,
  children,
}: TableRepeaterProps<T>) {
  const alignClass = (a?: TableRepeaterColumn["align"]) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left"

  return (
    <form.Field name={name} mode="array">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(field: any) => {
        const rows = (field.state.value ?? []) as unknown[]
        const count = rows.length
        const canAdd = !disabled && count < max
        const canRemoveAny = !disabled && count > min

        const actionsTh = (
          <th
            scope="col"
            className="text-muted-foreground w-[1%] whitespace-nowrap px-2 py-2 text-xs font-medium"
          >
            {actionsHeader}
          </th>
        )

        return (
          <fieldset className={cn("flex flex-col gap-3", className)} data-slot="table-repeater">
            {label && (
              <legend className="mb-1.5 text-base font-medium">{label}</legend>
            )}

            {count === 0 && emptyState ? (
              <div className="text-muted-foreground text-sm">{emptyState}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      {actionsPosition === "left" && actionsTh}
                      {columns.map((col, i) => (
                        <th
                          key={i}
                          scope="col"
                          className={cn(
                            "text-muted-foreground px-2 py-2 text-xs font-medium",
                            alignClass(col.align),
                            col.className,
                          )}
                        >
                          {col.header}
                        </th>
                      ))}
                      {actionsPosition === "right" && actionsTh}
                    </tr>
                  </thead>
                  <tbody>
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

                      const actionsTd = (
                        <td className="w-[1%] whitespace-nowrap px-2 py-1.5 align-middle">
                          <div className="flex items-center gap-1">
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
                        </td>
                      )

                      return (
                        <tr
                          key={index}
                          data-slot="table-repeater-row"
                          className="border-b last:border-b-0 align-top"
                        >
                          {actionsPosition === "left" && actionsTd}
                          {/*
                            Caller renders <td> cells in `children`. We wrap
                            in a fragment via the render-prop call so columns
                            stay in caller-controlled order.
                          */}
                          {children(args)}
                          {actionsPosition === "right" && actionsTd}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
