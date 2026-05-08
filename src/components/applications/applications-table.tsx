"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { ApplicationCreateDialog } from "@/components/applications/application-create-dialog";
import { ApplicationRowActions } from "@/components/applications/application-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Application,
  ApplicationListParams,
  ApplicationStatus,
} from "@/lib/api/domains/applications/contract";
import { applicationsListOptions } from "@/lib/api/domains/applications/query-options";

const PAGE_SIZES = [10, 20, 50];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function parseSearchParams(searchParams: URLSearchParams): ApplicationListParams {
  return {
    page: Math.max(1, parseInt(searchParams.get("page") || "1", 10)),
    pageSize: PAGE_SIZES.includes(parseInt(searchParams.get("pageSize") || "10", 10))
      ? parseInt(searchParams.get("pageSize") || "10", 10)
      : 10,
    search: searchParams.get("search") || undefined,
    status: (searchParams.get("status") as ApplicationStatus) || undefined,
    sort: (searchParams.get("sort") as ApplicationListParams["sort"]) || undefined,
  };
}

function buildSearchParams(params: ApplicationListParams): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.sort) sp.set("sort", params.sort);
  return sp;
}

const statusLabels: Record<ApplicationStatus, string> = {
  draft: "Szkic",
  submitted: "Wyslana",
  archived: "Zarchiwizowana",
};

const statusVariant: Record<ApplicationStatus, "default" | "secondary" | "outline"> = {
  draft: "outline",
  submitted: "default",
  archived: "secondary",
};

const columns: ColumnDef<Application>[] = [
  {
    accessorKey: "label",
    header: "Nazwa",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.label}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {statusLabels[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Utworzono",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.createdAt.toLocaleDateString("pl-PL")}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Zaktualizowano",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.updatedAt.toLocaleDateString("pl-PL")}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Akcje</span>,
    cell: ({ row }) => <ApplicationRowActions application={row.original} />,
  },
];

export function ApplicationsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(
    searchParams.get("search") || ""
  );

  const params = React.useMemo(
    () => parseSearchParams(searchParams),
    [searchParams]
  );

  const debouncedSearch = useDebounce(searchInput, 300);

  React.useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (debouncedSearch !== currentSearch) {
      const newParams = buildSearchParams({
        ...params,
        page: 1,
        search: debouncedSearch || undefined,
      });
      router.push(`/applications?${newParams.toString()}`);
    }
  }, [debouncedSearch, searchParams, params, router]);

  const { data, isLoading, isError, error, refetch } = useQuery(
    applicationsListOptions(params)
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
  });

  const updateParams = React.useCallback(
    (updates: Partial<ApplicationListParams>) => {
      const newParams = buildSearchParams({ ...params, ...updates });
      router.push(`/applications?${newParams.toString()}`);
    },
    [params, router]
  );

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
  };

  const handlePageSizeChange = (newSize: string | null) => {
    if (newSize) {
      updateParams({ page: 1, pageSize: parseInt(newSize, 10) });
    }
  };

  const handleStatusChange = (status: string | null) => {
    if (status !== null) {
      updateParams({
        page: 1,
        status: status === "all" ? undefined : (status as ApplicationStatus),
      });
    }
  };

  const handleSortChange = (sort: string | null) => {
    if (sort !== null) {
      updateParams({
        sort: sort === "default" ? undefined : (sort as ApplicationListParams["sort"]),
      });
    }
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    toast.success("Aplikacja zostala utworzona");
    queryClient.invalidateQueries({ queryKey: ["applications", "list"] });
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-muted-foreground">
          {error?.message || "Nie udalo sie zaladowac aplikacji"}
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Sprobuj ponownie
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Aplikacje</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon />
          Nowa aplikacja
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj aplikacji..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="sr-only">
            Filtruj wg statusu
          </Label>
          <Select
            value={params.status || "all"}
            onValueChange={handleStatusChange}
            items={[
              { label: "Wszystkie statusy", value: "all" },
              { label: "Szkic", value: "draft" },
              { label: "Wyslana", value: "submitted" },
              { label: "Zarchiwizowana", value: "archived" },
            ]}
          >
            <SelectTrigger id="status-filter" className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="draft">Szkic</SelectItem>
                <SelectItem value="submitted">Wyslana</SelectItem>
                <SelectItem value="archived">Zarchiwizowana</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Label htmlFor="sort-select" className="sr-only">
            Sortuj
          </Label>
          <Select
            value={params.sort || "default"}
            onValueChange={handleSortChange}
            items={[
              { label: "Domyslnie", value: "default" },
              { label: "Nazwa A-Z", value: "label:asc" },
              { label: "Nazwa Z-A", value: "label:desc" },
              { label: "Najnowsze", value: "createdAt:desc" },
              { label: "Najstarsze", value: "createdAt:asc" },
            ]}
          >
            <SelectTrigger id="sort-select" className="w-36">
              <SelectValue placeholder="Sortuj" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="default">Domyslnie</SelectItem>
                <SelectItem value="label:asc">Nazwa A-Z</SelectItem>
                <SelectItem value="label:desc">Nazwa Z-A</SelectItem>
                <SelectItem value="createdAt:desc">Najnowsze</SelectItem>
                <SelectItem value="createdAt:asc">Najstarsze</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: params.pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Brak aplikacji do wyswietlenia.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {data && (
            <>
              Wyswietlanie {(params.page - 1) * params.pageSize + 1}-
              {Math.min(params.page * params.pageSize, data.totalItems)} z{" "}
              {data.totalItems}
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="text-sm">
              Wierszy
            </Label>
            <Select
              value={String(params.pageSize)}
              onValueChange={handlePageSizeChange}
              items={PAGE_SIZES.map((size) => ({
                label: String(size),
                value: String(size),
              }))}
            >
              <SelectTrigger id="page-size" className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={params.page <= 1}
            >
              <span className="sr-only">Pierwsza strona</span>
              &laquo;
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(params.page - 1)}
              disabled={params.page <= 1}
            >
              <span className="sr-only">Poprzednia strona</span>
              &lsaquo;
            </Button>
            <span className="px-2 text-sm">
              Strona {params.page} z {data?.totalPages ?? 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(params.page + 1)}
              disabled={!data || params.page >= data.totalPages}
            >
              <span className="sr-only">Nastepna strona</span>
              &rsaquo;
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(data?.totalPages ?? 1)}
              disabled={!data || params.page >= data.totalPages}
            >
              <span className="sr-only">Ostatnia strona</span>
              &raquo;
            </Button>
          </div>
        </div>
      </div>

      <ApplicationCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
