'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTodayBrusselsUtc, dateFromYmdUtc, getBrusselsYmd } from '@/lib/day-utils'

type MonthPaginationProps = {
  monthName: string;
  currentMonthValue?: string; // YYYY-MM format
  isCurrentMonth?: boolean;
}

export default function MonthPagination({ 
  monthName, 
  currentMonthValue
}: MonthPaginationProps) {
  const router = useRouter()
  const todayUtc = getTodayBrusselsUtc()
  const todayYmd = getBrusselsYmd(todayUtc)
  const todayMonthValue = `${todayYmd.year}-${String(todayYmd.month).padStart(2, '0')}`

  // Generate list of available months: current month + next 12 months (13 total)
  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = []
    
    // Always start from today's month
    let year = todayYmd.year
    let month = todayYmd.month
    
    // Generate exactly 13 months: current month + next 12 months
    for (let i = 0; i < 13; i++) {
      const monthDate = dateFromYmdUtc({ year, month, day: 1 })
      
      // Format month name
      const monthLabel = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Brussels',
        month: 'long',
        year: 'numeric'
      }).format(monthDate)
      
      const monthValue = `${year}-${String(month).padStart(2, '0')}`
      options.push({ value: monthValue, label: monthLabel })
      
      // Move to next month
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
    }
    
    return options
  }

  const monthOptions = generateMonthOptions()

  const handleMonthChange = (value: string) => {
    router.push(`/?month=${value}`)
  }

  // Use currentMonthValue if provided and valid, otherwise use today's month
  // Also ensure the value exists in the options list
  const safeMonthValue = (() => {
    if (currentMonthValue && monthOptions.some(opt => opt.value === currentMonthValue)) {
      return currentMonthValue
    }
    return todayMonthValue
  })()

  return (
    <div className="flex items-center justify-center mb-6">
      <Select value={safeMonthValue} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder={monthName} />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
