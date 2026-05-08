"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EllipsisVerticalIcon } from "lucide-react";
import { toast } from "sonner";

import { ApplicationEditDialog } from "@/components/applications/application-edit-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  Application,
  ApplicationListResult,
  ApplicationStatus,
} from "@/lib/api/domains/applications/contract";
import {
  deleteApplication,
  updateApplicationStatus,
} from "@/lib/api/domains/applications/client";
import { applicationsKeys } from "@/lib/api/domains/applications/query-keys";

type ApplicationRowActionsProps = {
  application: Application;
};

const nextStatus: Record<ApplicationStatus, ApplicationStatus | null> = {
  draft: "submitted",
  submitted: "archived",
  archived: null,
};

const statusActionLabels: Record<ApplicationStatus, string | null> = {
  draft: "Wyslij",
  submitted: "Archiwizuj",
  archived: null,
};

export function ApplicationRowActions({
  application,
}: ApplicationRowActionsProps) {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteApplication(application.id),
    onSuccess: async () => {
      toast.success("Aplikacja zostala usunieta");
      await queryClient.invalidateQueries({
        queryKey: applicationsKeys.lists(),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Nie udalo sie usunac aplikacji");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: ApplicationStatus) =>
      updateApplicationStatus({ id: application.id, status: newStatus }),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: applicationsKeys.lists() });

      const previousLists = queryClient.getQueriesData<ApplicationListResult>({
        queryKey: applicationsKeys.lists(),
      });

      queryClient.setQueriesData<ApplicationListResult>(
        { queryKey: applicationsKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === application.id ? { ...item, status: newStatus } : item
            ),
          };
        }
      );

      return { previousLists };
    },
    onError: (error, _newStatus, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      toast.error(error.message || "Nie udalo sie zmienic statusu");
    },
    onSuccess: () => {
      toast.success("Status zostal zaktualizowany");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.detail(application.id),
      });
    },
  });

  const handleStatusChange = () => {
    const newStatus = nextStatus[application.status];
    if (newStatus) {
      statusMutation.mutate(newStatus);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setDeleteConfirmOpen(false);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    toast.success("Aplikacja zostala zaktualizowana");
    queryClient.invalidateQueries({ queryKey: applicationsKeys.lists() });
    queryClient.invalidateQueries({
      queryKey: applicationsKeys.detail(application.id),
    });
  };

  const canChangeStatus = nextStatus[application.status] !== null;
  const statusLabel = statusActionLabels[application.status];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
            />
          }
        >
          <EllipsisVerticalIcon className="size-4" />
          <span className="sr-only">Akcje</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            Edytuj
          </DropdownMenuItem>
          {canChangeStatus && statusLabel && (
            <DropdownMenuItem
              onClick={handleStatusChange}
              disabled={statusMutation.isPending}
            >
              {statusLabel}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={deleteMutation.isPending}
          >
            Usun
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ApplicationEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        application={application}
        onSuccess={handleEditSuccess}
      />

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-popover p-4 shadow-lg">
            <h3 className="text-base font-medium">Usunac aplikacje?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ta operacja jest nieodwracalna. Aplikacja &quot;{application.label}&quot;
              zostanie trwale usunieta.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Usuwanie..." : "Usun"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
