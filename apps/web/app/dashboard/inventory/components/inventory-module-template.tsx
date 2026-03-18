"use client"

import * as React from "react"
import { PlusIcon, SearchIcon } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

type ModuleValue = string | number | null | undefined

type ModuleRow = {
  id: string
  [key: string]: ModuleValue
}

type FieldOption = {
  label: string
  value: string
}

type ModuleField = {
  key: string
  label: string
  placeholder?: string
  required?: boolean
  type?: "text" | "number" | "date" | "textarea" | "select"
  options?: FieldOption[]
}

type ModuleColumn = {
  key: string
  label: string
  align?: "left" | "right" | "center"
  badge?: boolean
  mono?: boolean
}

type InventoryModuleTemplateProps = {
  title: string
  description: string
  formTitle: string
  formDescription: string
  submitLabel: string
  searchPlaceholder: string
  emptyMessage: string
  fields: ModuleField[]
  columns: ModuleColumn[]
  initialRows: ModuleRow[]
}

function alignClassName(align?: "left" | "right" | "center") {
  if (align === "right") return "text-right"
  if (align === "center") return "text-center"
  return "text-left"
}

function toDisplayValue(value: ModuleValue) {
  if (value == null || value === "") return "-"
  return String(value)
}

function renderField(field: ModuleField) {
  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.key}
        name={field.key}
        placeholder={field.placeholder}
        required={field.required}
      />
    )
  }

  if (field.type === "select") {
    return (
      <Select name={field.key} required={field.required}>
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder || `Pilih ${field.label}`} />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      id={field.key}
      name={field.key}
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      placeholder={field.placeholder}
      required={field.required}
    />
  )
}

export function InventoryModuleTemplate({
  title,
  description,
  formTitle,
  formDescription,
  submitLabel,
  searchPlaceholder,
  emptyMessage,
  fields,
  columns,
  initialRows,
}: InventoryModuleTemplateProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [rows, setRows] = React.useState<ModuleRow[]>(initialRows)

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword)
      )
    )
  }, [rows, search])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const nextRow: ModuleRow = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`,
    }

    fields.forEach((field) => {
      const raw = formData.get(field.key)
      nextRow[field.key] = typeof raw === "string" ? raw : ""
    })

    setRows((prev) => [nextRow, ...prev])
    event.currentTarget.reset()
    setIsOpen(false)
    toast.success(`${title} berhasil ditambahkan.`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon data-icon="inline-start" />
              {submitLabel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{formTitle}</DialogTitle>
                <DialogDescription>{formDescription}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4 md:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key} className={field.type === "textarea" ? "grid gap-2 md:col-span-2" : "grid gap-2"}>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={alignClassName(column.align)}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((column) => {
                      const value = toDisplayValue(row[column.key])
                      const content = column.badge ? <Badge variant="secondary">{value}</Badge> : value
                      return (
                        <TableCell
                          key={`${row.id}-${column.key}`}
                          className={`${alignClassName(column.align)} ${column.mono ? "font-mono text-xs" : ""}`.trim()}
                        >
                          {content}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
