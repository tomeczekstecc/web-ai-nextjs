"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import {
  CircleCheckIcon,
  EllipsisVerticalIcon,
  LoaderIcon,
  PlusIcon,
  TrendingUpIcon,
} from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"

import {
  DataTable,
  type DataTableColumnMeta,
} from "@/components/data-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  dashboardReviewItemsOptions,
} from "@/lib/api/domains/dashboard/query-options"

export type DashboardTableRow = {
  id: number
  header: string
  type: string
  status: string
  target: string
  limit: string
  reviewer: string
}


const chartData = [
  {
    month: "January",
    desktop: 186,
    mobile: 80,
  },
  {
    month: "February",
    desktop: 305,
    mobile: 200,
  },
  {
    month: "March",
    desktop: 237,
    mobile: 120,
  },
  {
    month: "April",
    desktop: 73,
    mobile: 190,
  },
  {
    month: "May",
    desktop: 209,
    mobile: 130,
  },
  {
    month: "June",
    desktop: 214,
    mobile: 140,
  },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

const dashboardColumns: ColumnDef<DashboardTableRow>[] = [
  {
    accessorKey: "header",
    header: "Konkurs",
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableHiding: false,
    meta: {
      label: "Konkurs",
      required: true,
      searchable: true,
      getSearchValue: (row) => row.header,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "type",
    header: "Kategoria",
    cell: ({ row }) => (
      <div className="w-36">
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.type}
        </Badge>
      </div>
    ),
    meta: {
      label: "Kategoria",
      searchable: true,
      getSearchValue: (row) => row.type,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.status === "Przyznany" ? (
          <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
        ) : (
          <LoaderIcon />
        )}
        {row.original.status}
      </Badge>
    ),
    meta: {
      label: "Status",
      searchable: true,
      getSearchValue: (row) => row.status,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "target",
    header: () => <div className="w-full text-right">Kwota (PLN)</div>,
    cell: ({ row }) => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Zapisywanie ${row.original.header}`,
            success: "Gotowe",
            error: "Błąd",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-target`} className="sr-only">
          Kwota (PLN)
        </Label>
        <Input
          className="h-8 w-28 border-transparent bg-transparent text-right shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
          defaultValue={row.original.target}
          id={`${row.original.id}-target`}
        />
      </form>
    ),
    meta: {
      label: "Kwota (PLN)",
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-right">Termin</div>,
    cell: ({ row }) => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Zapisywanie ${row.original.header}`,
            success: "Gotowe",
            error: "Błąd",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
          Termin
        </Label>
        <Input
          className="h-8 w-28 border-transparent bg-transparent text-right shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
          defaultValue={row.original.limit}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
    meta: {
      label: "Termin",
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "reviewer",
    header: "Opiekun",
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer"

      if (isAssigned) {
        return row.original.reviewer
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Opiekun
          </Label>
          <Select>
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Przypisz opiekuna" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="Anna Kowalska">Anna Kowalska</SelectItem>
                <SelectItem value="Marek Nowak">Marek Nowak</SelectItem>
                <SelectItem value="Katarzyna Wiśniewska">Katarzyna Wiśniewska</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      )
    },
    meta: {
      label: "Opiekun",
      searchable: true,
      getSearchValue: (row) => row.reviewer,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-open:bg-muted"
              size="icon"
            />
          }
        >
          <EllipsisVerticalIcon />
          <span className="sr-only">Otwórz menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem>Edytuj</DropdownMenuItem>
          <DropdownMenuItem>Utwórz kopię</DropdownMenuItem>
          <DropdownMenuItem>Dodaj do ulubionych</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Usuń</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
    enableSorting: false,
    meta: {
      label: "Akcje",
      required: true,
      hideFromVisibilityMenu: true,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
]

export function DashboardDataTable() {
  const { data: reviewItemsData, isLoading, isError, refetch } = useQuery(dashboardReviewItemsOptions())

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6 py-8 text-muted-foreground">Ładowanie...</div>
    )
  }

  if (isError || !reviewItemsData) {
    return (
      <div className="px-4 lg:px-6 py-8 flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">Nie udało się załadować danych.</p>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => refetch()}>
          Spróbuj ponownie
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
      <h2 className="text-xl font-semibold tracking-tight">
        Najważniejsze konkursy
      </h2>
      <DataTable
        data={reviewItemsData?.items ?? []}
        columns={dashboardColumns}
        getRowId={(row) => `${row.id}`}
        search={{
          enabled: true,
          placeholder: "Szukaj projektów...",
        }}
        visibility={{ enabled: true }}
        selection={{ enabled: true }}
        pagination={{
          pageSizeOptions: [10, 20, 30, 40, 50],
          initialPageSize: 10,
        }}
        persistence={false}
        reorder={false}
        toolbar={{
          right: (
            <Button variant="outline" size="sm">
              <PlusIcon />
              <span className="hidden lg:inline">Dodaj projekt</span>
            </Button>
          ),
        }}
        emptyState="Brak projektów."
        noResultsState="Brak projektów pasujących do wyszukiwania."
      />
    </div>
  )
}

function TableCellViewer({ item }: { item: DashboardTableRow }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            Podgląd aktywności projektu z ostatnich 6 miesięcy
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trend rośnie o 5.2% w tym miesiącu{" "}
                  <TrendingUpIcon className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Wykres pokazuje ostatnią aktywność projektu i pomaga szybko sprawdzić
                  kontekst przed edycją danych.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Nazwa konkursu</Label>
              <Input id="header" defaultValue={item.header} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Kategoria</Label>
                <Select
                  defaultValue={item.type}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Społeczne">Społeczne</SelectItem>
                      <SelectItem value="Lokalne">Lokalne</SelectItem>
                      <SelectItem value="Ekologia">Ekologia</SelectItem>
                      <SelectItem value="Młodzież">Młodzież</SelectItem>
                      <SelectItem value="Seniorzy">Seniorzy</SelectItem>
                      <SelectItem value="Kultura">Kultura</SelectItem>
                      <SelectItem value="Sport">Sport</SelectItem>
                      <SelectItem value="Edukacja">Edukacja</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select
                  defaultValue={item.status}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Wybierz status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Przyznany">Przyznany</SelectItem>
                      <SelectItem value="Złożony">Żłożony</SelectItem>
                      <SelectItem value="W trakcie">W trakcie</SelectItem>
                      <SelectItem value="Do poprawy">Do poprawy</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">Kwota (PLN)</Label>
                <Input id="target" defaultValue={item.target} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Termin</Label>
                <Input id="limit" defaultValue={item.limit} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Opiekun</Label>
              <Select
                defaultValue={item.reviewer}
              >
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder="Wybierz opiekuna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Anna Kowalska">Anna Kowalska</SelectItem>
                    <SelectItem value="Marek Nowak">Marek Nowak</SelectItem>
                    <SelectItem value="Katarzyna Wiśniewska">Katarzyna Wiśniewska</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Zapisz</Button>
          <DrawerClose asChild>
            <Button variant="outline">Zamknij</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
