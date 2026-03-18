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
      <Badge variant="outline" className={cn("text-orange-600 border-orange-600 bg-orange-50 font-bold", className)}>
        Menipis
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={cn("text-emerald-600 border-emerald-600 bg-emerald-50 font-bold", className)}>
      Normal
    </Badge>
  )
}
