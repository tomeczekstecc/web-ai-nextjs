"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Application } from "@/lib/api/domains/applications/contract";
import { updateApplication } from "@/lib/api/domains/applications/client";

const updateSchema = z.object({
  label: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .max(120, "Nazwa moze miec maksymalnie 120 znakow"),
});

type ApplicationEditFormProps = {
  application: Application;
  onSuccess: () => void;
  onCancel: () => void;
};

function ApplicationEditForm({
  application,
  onSuccess,
  onCancel,
}: ApplicationEditFormProps) {
  const [label, setLabel] = React.useState(application.label);
  const [error, setError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);

  const mutation = useMutation({
    mutationFn: updateApplication,
    onSuccess: () => {
      onSuccess();
    },
    onError: (err) => {
      setError(err.message || "Nie udalo sie zaktualizowac aplikacji");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const result = updateSchema.safeParse({ label });
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Niepoprawne dane");
      return;
    }

    setError(null);
    mutation.mutate({ id: application.id, label: result.data.label });
  };

  const validationResult = updateSchema.safeParse({ label });
  const showError = touched && !validationResult.success;

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edytuj aplikacje</DialogTitle>
        <DialogDescription>
          Zmien nazwe aplikacji &quot;{application.label}&quot;.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-label">Nazwa</Label>
          <Input
            id="edit-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Nazwa aplikacji"
            aria-invalid={showError}
            data-invalid={showError || undefined}
          />
          {showError && (
            <p className="text-sm text-destructive">
              {validationResult.error?.issues[0]?.message}
            </p>
          )}
          {error && mutation.isError && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type ApplicationEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onSuccess: () => void;
};

export function ApplicationEditDialog({
  open,
  onOpenChange,
  application,
  onSuccess,
}: ApplicationEditDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <ApplicationEditForm
            key={application.id}
            application={application}
            onSuccess={onSuccess}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
