"use client"

import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import type { ChangeEvent } from "react"
import { cn } from "@/lib/utils"

type TimePickerProps = {
  value?: string | null
  onChange?: (value: string | null) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function TimePicker({ 
  value, 
  onChange, 
  className,
  placeholder = "HH:MM",
  disabled = false
}: TimePickerProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value || null
    onChange?.(newValue)
  }

  return (
    <InputGroup className={cn("w-full", className)}>
      <InputGroupInput
        type="time"
        value={value || ""}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="cursor-pointer"
      />
    </InputGroup>
  )
}
