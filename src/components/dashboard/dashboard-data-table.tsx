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
  type DataTableReorderResult,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  dashboardQueueOptions,
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

type ReviewQueueRow = {
  id: string
  name: string
  owner: string
  priority: string
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
    header: "Sekcja",
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableHiding: false,
    meta: {
      label: "Sekcja",
      required: true,
      searchable: true,
      getSearchValue: (row) => row.header,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "type",
    header: "Typ",
    cell: ({ row }) => (
      <div className="w-36">
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.type}
        </Badge>
      </div>
    ),
    meta: {
      label: "Typ",
      searchable: true,
      getSearchValue: (row) => row.type,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.status === "Done" ? (
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
    header: () => <div className="w-full text-right">Cel</div>,
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
          Cel
        </Label>
        <Input
          className="h-8 w-16 border-transparent bg-transparent text-right shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
          defaultValue={row.original.target}
          id={`${row.original.id}-target`}
        />
      </form>
    ),
    meta: {
      label: "Cel",
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-right">Limit</div>,
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
          Limit
        </Label>
        <Input
          className="h-8 w-16 border-transparent bg-transparent text-right shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
          defaultValue={row.original.limit}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
    meta: {
      label: "Limit",
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "reviewer",
    header: "Recenzent",
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer"

      if (isAssigned) {
        return row.original.reviewer
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Recenzent
          </Label>
          <Select
            items={[
              { label: "Eddie Lake", value: "Eddie Lake" },
              { label: "Jamik Tashpulatov", value: "Jamik Tashpulatov" },
            ]}
          >
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Przypisz recenzenta" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                <SelectItem value="Jamik Tashpulatov">
                  Jamik Tashpulatov
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      )
    },
    meta: {
      label: "Recenzent",
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

const reviewColumns: ColumnDef<ReviewQueueRow>[] = [
  {
    accessorKey: "name",
    header: "Zadanie",
    meta: {
      label: "Zadanie",
      required: true,
      searchable: true,
      getSearchValue: (row) => row.name,
    } satisfies DataTableColumnMeta<ReviewQueueRow>,
  },
  {
    accessorKey: "owner",
    header: "Właściciel",
    meta: {
      label: "Właściciel",
      searchable: true,
      getSearchValue: (row) => row.owner,
    } satisfies DataTableColumnMeta<ReviewQueueRow>,
  },
  {
    accessorKey: "priority",
    header: "Priorytet",
    cell: ({ row }) => (
      <Badge variant="secondary" className="px-1.5">
        {row.original.priority}
      </Badge>
    ),
    meta: {
      label: "Priorytet",
      searchable: true,
      getSearchValue: (row) => row.priority,
    } satisfies DataTableColumnMeta<ReviewQueueRow>,
  },
]

export function DashboardDataTable() {
  const { data: reviewItemsData } = useQuery(dashboardReviewItemsOptions())
  const { data: queueData } = useQuery(dashboardQueueOptions())
  const [reorderedIds, setReorderedIds] = React.useState<string[]>([])

  function handleReorder(result: DataTableReorderResult<DashboardTableRow>) {
    setReorderedIds(result.orderedIds)
  }

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          Widok
        </Label>
        <Select
          defaultValue="outline"
          items={[
            { label: "Konspekt", value: "outline" },
            { label: "Wyniki", value: "past-performance" },
            { label: "Zespół", value: "key-personnel" },
            { label: "Dokumenty", value: "focus-documents" },
          ]}
        >
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Wybierz widok" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="outline">Konspekt</SelectItem>
              <SelectItem value="past-performance">Wyniki</SelectItem>
              <SelectItem value="key-personnel">Zespół</SelectItem>
              <SelectItem value="focus-documents">Dokumenty</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Konspekt</TabsTrigger>
          <TabsTrigger value="past-performance">
            Wyniki <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Zespół <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Dokumenty</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <DataTable
          data={reviewItemsData?.items ?? []}
          columns={dashboardColumns}
          getRowId={(row) => `${row.id}`}
          search={{
            enabled: true,
            placeholder: "Szukaj sekcji...",
          }}
          visibility={{ enabled: true }}
          selection={{ enabled: true }}
          pagination={{
            pageSizeOptions: [10, 20, 30, 40, 50],
            initialPageSize: 10,
          }}
          persistence={{
            key: "dashboard-outline-table",
            search: true,
            columnVisibility: true,
            pageSize: true,
          }}
          reorder={{
            enabled: true,
            mode: "page",
            onReorder: handleReorder,
          }}
          toolbar={{
            left: reorderedIds.length ? (
              <span className="text-sm text-muted-foreground">
                Zmieniono kolejność {reorderedIds.length} sekcji.
              </span>
            ) : null,
            right: (
              <Button variant="outline" size="sm">
                <PlusIcon />
                <span className="hidden lg:inline">Dodaj sekcję</span>
              </Button>
            ),
          }}
          emptyState="Brak sekcji."
          noResultsState="Brak sekcji pasujących do wyszukiwania."
        />
      </TabsContent>
      <TabsContent value="past-performance" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <DataTable
          data={queueData?.items ?? []}
          columns={reviewColumns}
          getRowId={(row) => row.id}
          search={{
            enabled: true,
            placeholder: "Szukaj zadań...",
          }}
          visibility={{ enabled: true }}
          pagination={false}
          persistence={{
            key: "dashboard-review-table",
            search: false,
            columnVisibility: false,
            pageSize: false,
          }}
          emptyState="Brak zadań."
          noResultsState="Brak zadań pasujących do wyszukiwania."
        />
      </TabsContent>
    </Tabs>
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
            Podgląd aktywności sekcji z ostatnich 6 miesięcy
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
                  Sekcja pokazuje ostatnią aktywność i pomaga szybko sprawdzić
                  kontekst przed edycją danych.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Sekcja</Label>
              <Input id="header" defaultValue={item.header} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Typ</Label>
                <Select
                  defaultValue={item.type}
                  items={[
                    { label: "Table of Contents", value: "Table of Contents" },
                    { label: "Executive Summary", value: "Executive Summary" },
                    {
                      label: "Technical Approach",
                      value: "Technical Approach",
                    },
                    { label: "Design", value: "Design" },
                    { label: "Capabilities", value: "Capabilities" },
                    { label: "Focus Documents", value: "Focus Documents" },
                    { label: "Narrative", value: "Narrative" },
                    { label: "Cover Page", value: "Cover Page" },
                  ]}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Table of Contents">
                        Table of Contents
                      </SelectItem>
                      <SelectItem value="Executive Summary">
                        Executive Summary
                      </SelectItem>
                      <SelectItem value="Technical Approach">
                        Technical Approach
                      </SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Capabilities">Capabilities</SelectItem>
                      <SelectItem value="Focus Documents">
                        Focus Documents
                      </SelectItem>
                      <SelectItem value="Narrative">Narrative</SelectItem>
                      <SelectItem value="Cover Page">Cover Page</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select
                  defaultValue={item.status}
                  items={[
                    { label: "Done", value: "Done" },
                    { label: "In Process", value: "In Process" },
                    { label: "Not Started", value: "Not Started" },
                  ]}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Wybierz status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="In Process">In Process</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">Cel</Label>
                <Input id="target" defaultValue={item.target} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Limit</Label>
                <Input id="limit" defaultValue={item.limit} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Recenzent</Label>
              <Select
                defaultValue={item.reviewer}
                items={[
                  { label: "Eddie Lake", value: "Eddie Lake" },
                  { label: "Jamik Tashpulatov", value: "Jamik Tashpulatov" },
                  { label: "Emily Whalen", value: "Emily Whalen" },
                ]}
              >
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder="Wybierz recenzenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                    <SelectItem value="Jamik Tashpulatov">
                      Jamik Tashpulatov
                    </SelectItem>
                    <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
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
