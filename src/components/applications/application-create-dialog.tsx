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
import { createApplication } from "@/lib/api/domains/applications/client";

const createSchema = z.object({
  label: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .max(120, "Nazwa moze miec maksymalnie 120 znakow"),
});

type ApplicationCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ApplicationCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: ApplicationCreateDialogProps) {
  const [label, setLabel] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);

  const mutation = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      setLabel("");
      setError(null);
      setTouched(false);
      onSuccess();
    },
    onError: (err) => {
      setError(err.message || "Nie udalo sie utworzyc aplikacji");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const result = createSchema.safeParse({ label });
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Niepoprawne dane");
      return;
    }

    setError(null);
    mutation.mutate({ label: result.data.label });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setLabel("");
      setError(null);
      setTouched(false);
    }
    onOpenChange(newOpen);
  };

  const validationResult = createSchema.safeParse({ label });
  const showError = touched && !validationResult.success;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nowa aplikacja</DialogTitle>
            <DialogDescription>
              Wprowadz nazwe nowej aplikacji. Zostanie utworzona ze statusem
              &quot;Szkic&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-label">Nazwa</Label>
              <Input
                id="create-label"
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
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Tworzenie..." : "Utworz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
