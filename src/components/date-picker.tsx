"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
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
import { getTodayBrusselsUtc, isPastDate, normalizeToUtcMidnight } from "@/lib/day-utils"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

export function DatePickerInput() {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(
    new Date("2025-06-01")
  )
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [value, setValue] = React.useState(formatDate(date))

  return (
    <Field className="mx-auto w-48">
      <FieldLabel htmlFor="date-required">{"Date d'abonnement"}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="date-required"
          value={value}
          placeholder="01 juin 2025"
          onChange={(e) => {
            const next = new Date(e.target.value)
            setValue(e.target.value)
            if (isValidDate(next) && !isPastDate(normalizeToUtcMidnight(next))) {
              setDate(next)
              setMonth(next)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                id="date-picker"
                variant="ghost"
                size="icon-xs"
                aria-label="Sélectionner une date"
              >
                <CalendarIcon />
                <span className="sr-only">Sélectionner une date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={(m) => {
                  const today = getTodayBrusselsUtc()
                  const startOfThisMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
                  setMonth(m >= startOfThisMonth ? m : startOfThisMonth)
                }}
                onSelect={(d) => {
                  if (d && isPastDate(normalizeToUtcMidnight(d))) return
                  setDate(d)
                  setValue(formatDate(d))
                  setOpen(false)
                }}
                fromDate={getTodayBrusselsUtc()}
                disabled={(d) => isPastDate(normalizeToUtcMidnight(d))}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
