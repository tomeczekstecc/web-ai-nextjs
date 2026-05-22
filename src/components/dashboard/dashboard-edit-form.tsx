"use client"

import { useForm, type StandardSchemaV1 } from "@tanstack/react-form"
import { z } from "zod"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormRepeater, TableRepeater } from "@/components/forms"

// Dynamic array-path fields produced inside repeater children cannot keep
// TanStack Form's literal-template name typing, so we widen `field` to `any`
// for those callbacks only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyField = any
import type { DashboardReviewItem, UpdateDashboardReviewItemInput } from "@/lib/api/domains/dashboard/contract"

const parameterSchema = z.object({
  name:        z.string().min(1, "Podaj nazwę."),
  type:        z.string().min(1, "Wybierz typ."),
  value:       z.string().min(1, "Podaj wartość."),
  description: z.string(),
})

const instrumentSchema = z.object({
  name:      z.string().min(1, "Podaj nazwę instrumentu."),
  amountPln: z.string().min(1, "Podaj kwotę PLN."),
  amountEur: z.string().min(1, "Podaj kwotę €."),
})

const schema = z.object({
  header:      z.string().min(1, "Podaj nazwę konkursu."),
  type:        z.string().min(1, "Wybierz kategorię."),
  status:      z.string().min(1, "Wybierz status."),
  target:      z.string().min(1, "Podaj kwotę."),
  limit:       z.string().min(1, "Podaj termin."),
  reviewer:    z.string().min(1, "Wybierz opiekuna."),
  parameters:  z.array(parameterSchema),
  instruments: z.array(instrumentSchema),
})

const CATEGORIES      = ["Społeczne", "Lokalne", "Ekologia", "Młodzież", "Seniorzy", "Kultura", "Sport", "Edukacja"]
const STATUSES        = ["Przyznany", "Złożony", "W trakcie", "Do poprawy"]
const REVIEWERS       = ["Anna Kowalska", "Marek Nowak", "Katarzyna Wiśniewska"]
const PARAMETER_TYPES = ["Tekst", "Liczba", "Data", "Tak/Nie"]

export const EDIT_FORM_ID = "dashboard-edit-form"

type DashboardEditFormProps = {
  item: DashboardReviewItem
  readOnly?: boolean
  onSave?: (data: UpdateDashboardReviewItemInput) => Promise<void>
}

export function DashboardEditForm({ item, readOnly = false, onSave }: DashboardEditFormProps) {
  const form = useForm({
    defaultValues: {
      header:      item.header,
      type:        item.type,
      status:      item.status,
      target:      item.target,
      limit:       item.limit,
      reviewer:    item.reviewer,
      parameters:  item.parameters,
      instruments: item.instruments,
    },
    validators: {
      onSubmit: schema as unknown as StandardSchemaV1<UpdateDashboardReviewItemInput>,
    },
    onSubmit: async ({ value }) => {
      await onSave?.(value)
    },
  })

  return (
    <form
      id={EDIT_FORM_ID}
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field name="header">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Nazwa konkursu</FieldLabel>
                <Input
                  id={field.name}
                  disabled={readOnly}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="type">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Kategoria</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v ?? "")}
                    disabled={readOnly}
                  >
                    <SelectTrigger id={field.name} className="w-full" aria-invalid={isInvalid}>
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CATEGORIES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="status">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v ?? "")}
                    disabled={readOnly}
                  >
                    <SelectTrigger id={field.name} className="w-full" aria-invalid={isInvalid}>
                      <SelectValue placeholder="Wybierz status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="target">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Kwota (PLN)</FieldLabel>
                  <Input
                    id={field.name}
                    disabled={readOnly}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="limit">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Termin</FieldLabel>
                  <Input
                    id={field.name}
                    disabled={readOnly}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        </div>

        <form.Field name="reviewer">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Opiekun</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v ?? "")}
                  disabled={readOnly}
                >
                  <SelectTrigger id={field.name} className="w-full" aria-invalid={isInvalid}>
                    <SelectValue placeholder="Wybierz opiekuna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {REVIEWERS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        <FormRepeater
          form={form}
          name="parameters"
          newItem={() => ({ name: "", type: "", value: "", description: "" })}
          label="Parametry"
          addLabel="Dodaj parametr"
          emptyState="Brak parametrów. Dodaj pierwszy wiersz, aby zacząć."
          max={20}
          reorderable
          disabled={readOnly}
        >
          {({ name }) => {
            // Dynamic array paths: TanStack Form requires literal-typed names,
            // so we widen to `any` inside the repeater body. Outer fields stay typed.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const f = form as any
            return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <f.Field name={`${name}.name`}>
                {(field: AnyField) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Nazwa parametru</FieldLabel>
                      <Input
                        id={field.name}
                        disabled={readOnly}
                        value={field.state.value as string}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              </f.Field>
              <f.Field name={`${name}.type`}>
                {(field: AnyField) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Typ</FieldLabel>
                      <Select
                        value={field.state.value as string}
                        onValueChange={(v) => field.handleChange(v ?? "")}
                        disabled={readOnly}
                      >
                        <SelectTrigger id={field.name} className="w-full" aria-invalid={isInvalid}>
                          <SelectValue placeholder="Wybierz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {PARAMETER_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              </f.Field>
              <f.Field name={`${name}.value`}>
                {(field: AnyField) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Wartość</FieldLabel>
                      <Input
                        id={field.name}
                        disabled={readOnly}
                        value={field.state.value as string}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              </f.Field>
              <f.Field name={`${name}.description`}>
                {(field: AnyField) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Opis</FieldLabel>
                    <Input
                      id={field.name}
                      disabled={readOnly}
                      value={field.state.value as string}
                      onBlur={field.handleBlur}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </f.Field>
            </div>
          )
          }}
        </FormRepeater>

        <TableRepeater
          form={form}
          name="instruments"
          newItem={() => ({ name: "", amountPln: "0.00", amountEur: "0.00" })}
          label="Instrumenty terytorialne"
          addLabel="Dodaj instrument terytorialny"
          emptyState="Brak instrumentów. Dodaj pierwszy wiersz, aby zacząć."
          actionsPosition="left"
          max={10}
          disabled={readOnly}
          columns={[
            { header: "Nazwa instrumentu" },
            { header: "Kwota PLN", align: "right", className: "w-40" },
            { header: "Kwota €",   align: "right", className: "w-40" },
          ]}
        >
          {({ name }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const f = form as any
            return (
            <>
              <td className="px-2 py-1.5 align-middle">
                <f.Field name={`${name}.name`}>
                  {(field: AnyField) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Input
                        id={field.name}
                        disabled={readOnly}
                        value={field.state.value as string}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        aria-label="Nazwa instrumentu"
                      />
                    )
                  }}
                </f.Field>
              </td>
              <td className="px-2 py-1.5 align-middle">
                <f.Field name={`${name}.amountPln`}>
                  {(field: AnyField) => (
                    <Input
                      id={field.name}
                      disabled={readOnly}
                      className="text-right"
                      inputMode="decimal"
                      value={field.state.value as string}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-label="Kwota PLN"
                    />
                  )}
                </f.Field>
              </td>
              <td className="px-2 py-1.5 align-middle">
                <f.Field name={`${name}.amountEur`}>
                  {(field: AnyField) => (
                    <Input
                      id={field.name}
                      disabled={readOnly}
                      className="text-right"
                      inputMode="decimal"
                      value={field.state.value as string}
                      onBlur={field.handleBlur}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                      aria-label="Kwota €"
                    />
                  )}
                </f.Field>
              </td>
            </>
          )
          }}
        </TableRepeater>
      </FieldGroup>
    </form>
  )
}
