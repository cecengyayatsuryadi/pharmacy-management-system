"use client"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

interface MedicineStockBadgeProps {
  stock: number | string
  minStock: number | string
  className?: string
}

export function MedicineStockBadge({ stock, minStock, className }: MedicineStockBadgeProps) {
  const s = Number(stock)
  const m = Number(minStock)

  if (s <= 0) {
    return (
      <Badge variant="destructive" className={cn("font-bold", className)}>
        Habis
      </Badge>
    )
  }

  if (s <= m) {
    return (
      <Badge variant="warning" className={cn("font-bold", className)}>
        Menipis
      </Badge>
    )
  }

  return (
    <Badge variant="success" className={cn("font-bold", className)}>
      Normal
    </Badge>
  )
}
