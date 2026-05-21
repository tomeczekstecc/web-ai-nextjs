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
import type { DashboardReviewItem, UpdateDashboardReviewItemInput } from "@/lib/api/domains/dashboard/contract"

const schema = z.object({
  header:   z.string().min(1, "Podaj nazwę konkursu."),
  type:     z.string().min(1, "Wybierz kategorię."),
  status:   z.string().min(1, "Wybierz status."),
  target:   z.string().min(1, "Podaj kwotę."),
  limit:    z.string().min(1, "Podaj termin."),
  reviewer: z.string().min(1, "Wybierz opiekuna."),
})

const CATEGORIES = ["Społeczne", "Lokalne", "Ekologia", "Młodzież", "Seniorzy", "Kultura", "Sport", "Edukacja"]
const STATUSES   = ["Przyznany", "Złożony", "W trakcie", "Do poprawy"]
const REVIEWERS  = ["Anna Kowalska", "Marek Nowak", "Katarzyna Wiśniewska"]

export const EDIT_FORM_ID = "dashboard-edit-form"

type DashboardEditFormProps = {
  item: DashboardReviewItem
  readOnly?: boolean
  onSave?: (data: UpdateDashboardReviewItemInput) => Promise<void>
}

export function DashboardEditForm({ item, readOnly = false, onSave }: DashboardEditFormProps) {
  const form = useForm({
    defaultValues: {
      header:   item.header,
      type:     item.type,
      status:   item.status,
      target:   item.target,
      limit:    item.limit,
      reviewer: item.reviewer,
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
      </FieldGroup>
    </form>
  )
}
