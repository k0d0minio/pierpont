"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { formatYmd, normalizeToUtcMidnight, getTodayBrusselsUtc, isPastDate } from "@/lib/day-utils"

// Note: parseYmd is not needed here as we receive Date objects from the calendar

interface DateRangePickerProps {
  value?: DateRange | undefined
  onChange?: (date: DateRange | undefined) => void
  minDate?: Date
  maxDate?: Date
  label?: string
  id?: string
  name?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export function DateRangePicker({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  id,
  name,
  required = false,
  className,
  disabled = false,
}: DateRangePickerProps) {
  const effectiveMinDate = minDate ?? getTodayBrusselsUtc()
  const [date, setDate] = React.useState<DateRange | undefined>(value)

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handleSelect = (selectedDate: DateRange | undefined) => {
    if (!selectedDate) {
      setDate(undefined)
      onChange?.(undefined)
      return
    }
    const from = selectedDate.from ? normalizeToUtcMidnight(selectedDate.from) : undefined
    const to = selectedDate.to ? normalizeToUtcMidnight(selectedDate.to) : undefined
    if (from && from < effectiveMinDate) return
    const normalizedDate: DateRange = { from, to }
    setDate(normalizedDate)
    onChange?.(normalizedDate)
  }

  // Format dates for form submission (YYYY-MM-DD)
  const formatForForm = (date: Date | undefined): string => {
    if (!date) return ""
    return formatYmd(date)
  }

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={id}
            disabled={disabled}
            className="w-full justify-start px-2.5 font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={disabled ? true : (d) => isPastDate(normalizeToUtcMidnight(d))}
            fromDate={effectiveMinDate}
            {...(maxDate && { toDate: maxDate })}
          />
        </PopoverContent>
      </Popover>
      {/* Hidden inputs for form submission */}
      {name && (
        <>
          <input
            type="hidden"
            name={`${name}From`}
            value={formatForForm(date?.from)}
          />
          <input
            type="hidden"
            name={`${name}To`}
            value={formatForForm(date?.to)}
          />
        </>
      )}
    </div>
  )
}
