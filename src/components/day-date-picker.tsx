"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { parseYmd, formatYmd, getTodayBrusselsUtc, isPastDate, addDays } from "@/lib/day-utils"
import { ensureDayExists } from "@/app/actions/days"

type DayDatePickerProps = {
  dateParam: string; // YYYY-MM-DD format
}

function formatDateForDisplay(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Brussels",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

function isValidDate(date: Date | undefined): boolean {
  if (!date) {
    return false
  }
  return !Number.isNaN(date.getTime())
}

export function DayDatePicker({ dateParam }: DayDatePickerProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const currentDate = parseYmd(dateParam)
  const [date, setDate] = React.useState<Date | undefined>(currentDate)
  const [month, setMonth] = React.useState<Date | undefined>(currentDate)
  const [value, setValue] = React.useState(formatDateForDisplay(currentDate))
  const todayUtc = getTodayBrusselsUtc()
  const oneYearFromToday = addDays(todayUtc, 365)

  // Update state when dateParam changes
  React.useEffect(() => {
    const newDate = parseYmd(dateParam)
    setDate(newDate)
    setMonth(newDate)
    setValue(formatDateForDisplay(newDate))
  }, [dateParam])

  const handleDateSelect = async (selectedDate: Date | undefined) => {
    if (!selectedDate) return

    // Validate date constraints
    if (isPastDate(selectedDate)) {
      // Don't allow past dates
      return
    }

    if (selectedDate > oneYearFromToday) {
      // Don't allow dates beyond 1 year
      return
    }

    setDate(selectedDate)
    setValue(formatDateForDisplay(selectedDate))
    setOpen(false)

    // Ensure day exists and navigate
    const newDateParam = formatYmd(selectedDate)
    await ensureDayExists(selectedDate.toISOString())
    router.push(`/day/${newDateParam}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setValue(inputValue)
    
    // Try to parse the input as a date
    const parsedDate = new Date(inputValue)
    if (isValidDate(parsedDate)) {
      const utcDate = new Date(Date.UTC(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        0, 0, 0, 0
      ))
      
      // Validate constraints
      if (!isPastDate(utcDate) && utcDate <= oneYearFromToday) {
        setDate(utcDate)
        setMonth(utcDate)
        handleDateSelect(utcDate)
      }
    }
  }

  // Disable past dates and dates beyond 1 year in calendar
  const disabledDates = (date: Date) => {
    return isPastDate(date) || date > oneYearFromToday
  }

  return (
    <div className="w-full sm:w-auto">
      <InputGroup className="w-full sm:w-64">
        <InputGroupInput
          value={value}
          placeholder="Sélectionner une date"
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
          className="min-h-[44px] text-sm sm:text-base"
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                aria-label="Sélectionner une date"
                className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              >
                <CalendarIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Sélectionner une date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] sm:w-auto max-w-[calc(100vw-2rem)] sm:max-w-none overflow-hidden p-0"
              align="start"
              alignOffset={0}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                onSelect={handleDateSelect}
                disabled={disabledDates}
                fromDate={todayUtc}
                toDate={oneYearFromToday}
                className="[--cell-size:--spacing(12)] sm:[--cell-size:--spacing(10)]"
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
