"use client"

import { useState } from "react"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { useForm, type StandardSchemaV1 } from "@tanstack/react-form"
import { PlusIcon } from "lucide-react"
import { toast } from "@/components/toast"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { createDashboardReviewItem } from "@/lib/api/domains/dashboard/commands"
import { dashboardKeys } from "@/lib/api/domains/dashboard/query-keys"

const schema = z.object({
  header: z.string().min(1, "Podaj nazwę konkursu."),
  type: z.string().min(1, "Wybierz kategorię."),
  status: z.string().min(1, "Wybierz status."),
  target: z.string().min(1, "Podaj kwotę."),
  limit: z.string().min(1, "Podaj termin."),
  reviewer: z.string().min(1, "Wybierz opiekuna."),
})

type FormValues = z.infer<typeof schema>

const DEFAULTS: FormValues = {
  header: "",
  type: "",
  status: "Złożony",
  target: "",
  limit: "",
  reviewer: "",
}

export function AddProjectDrawer() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createDashboardReviewItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.reviewItems() })
      toast.success("Projekt został dodany.")
      setOpen(false)
    },
    onError: () => {
      toast.error("Nie udało się dodać projektu. Spróbuj ponownie.")
    },
  })

  const form = useForm({
    defaultValues: DEFAULTS,
    validators: {
      onSubmit: schema as unknown as StandardSchemaV1<FormValues>,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate({ ...value, parameters: [], instruments: [] })
    },
  })

  function handleOpenChange(next: boolean) {
    if (!next) form.reset()
    setOpen(next)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        <span className="hidden lg:inline">Dodaj projekt</span>
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" showCloseButton={false} className="data-[side=right]:sm:max-w-2xl flex flex-col gap-0 p-0">
          <SheetHeader className="gap-1 border-b border-border/60 p-4">
            <SheetTitle>Dodaj projekt</SheetTitle>
            <SheetDescription>
              Wypełnij dane nowego projektu. Projekt pojawi się na liście po zapisaniu.
            </SheetDescription>
          </SheetHeader>

          <form
            className="flex flex-col gap-4 overflow-y-auto p-4"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <FieldGroup>
            {mutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Nie udało się dodać projektu. Spróbuj ponownie.
                </AlertDescription>
              </Alert>
            )}

            <form.Field name="header">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Nazwa konkursu</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="np. Konkurs na rzecz edukacji"
                      disabled={mutation.isPending}
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
                        disabled={mutation.isPending}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue placeholder="Wybierz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {["Społeczne", "Lokalne", "Ekologia", "Młodzież", "Seniorzy", "Kultura", "Sport", "Edukacja"].map(
                              (v) => <SelectItem key={v} value={v}>{v}</SelectItem>,
                            )}
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
                        disabled={mutation.isPending}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue placeholder="Wybierz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {["Złożony", "W trakcie", "Do poprawy", "Przyznany"].map(
                              (v) => <SelectItem key={v} value={v}>{v}</SelectItem>,
                            )}
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
                        placeholder="np. 50 000"
                        disabled={mutation.isPending}
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
                        placeholder="np. 30.06.2026"
                        disabled={mutation.isPending}
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
                      disabled={mutation.isPending}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Wybierz opiekuna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {["Anna Kowalska", "Marek Nowak", "Katarzyna Wiśniewska"].map(
                            (v) => <SelectItem key={v} value={v}>{v}</SelectItem>,
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>

          <SheetFooter className="border-t border-border/60 p-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Zapisywanie…" : "Zapisz projekt"}
            </Button>
            <SheetClose
              render={
                <Button variant="outline" type="button" disabled={mutation.isPending} />
              }
            >
              Anuluj
            </SheetClose>
          </SheetFooter>
        </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
