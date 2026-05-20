"use client"

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
import type { DashboardTableRow } from "./dashboard-columns"

interface DashboardEditFormProps {
  item: DashboardTableRow
}

export function DashboardEditForm({ item }: DashboardEditFormProps) {
  return (
    <form className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="header">Nazwa konkursu</Label>
        <Input id="header" defaultValue={item.header} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="type">Kategoria</Label>
          <Select defaultValue={item.type}>
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
          <Select defaultValue={item.status}>
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
        <Select defaultValue={item.reviewer}>
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
  )
}
