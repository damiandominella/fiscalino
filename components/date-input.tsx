"use client"

import { useState } from "react"
import { format, parse, isValid } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateInputProps {
  label?: string
  value: string // "YYYY-MM-DD" or ""
  onChange: (value: string) => void
  className?: string
  id?: string
}

/** shadcn date picker backed by react-day-picker v9 + date-fns. Emits/accepts "YYYY-MM-DD". */
export function DateInput({ label, value, onChange, className, id }: DateInputProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined
  const validSelected = selected && isValid(selected) ? selected : undefined

  return (
    <div className={className}>
      {label && <Label htmlFor={id} className="mb-1 block">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          render={
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !validSelected && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {validSelected ? format(validSelected, "dd/MM/yyyy") : "Seleziona una data"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={validSelected}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "")
              setOpen(false)
            }}
            defaultMonth={validSelected ?? new Date(1990, 0, 1)}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date(2025, 11)}
            locale={it}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/** Parse a "YYYY-MM-DD" string into {day, month, year}, or null if empty/invalid. */
export function parseDateValue(value: string): { day: number; month: number; year: number } | null {
  if (!value) return null
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return null
  return { year: y, month: m, day: d }
}
