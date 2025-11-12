'use client'

import { Button } from '../../../components/button'
import { Link } from '../../../components/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function MonthPagination({ 
  monthName, 
  prevMonthUrl, 
  nextMonthUrl, 
  canGoNext,
  isCurrentMonth 
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Link href={prevMonthUrl}>
        <Button outline>
          <ChevronLeft data-slot="icon" />
          Previous Month
        </Button>
      </Link>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          {monthName}
        </h2>
        {isCurrentMonth && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Current Month
          </p>
        )}
      </div>
      
      {canGoNext ? (
        <Link href={nextMonthUrl}>
          <Button outline>
            Next Month
            <ChevronRight data-slot="icon" />
          </Button>
        </Link>
      ) : (
        <Button outline disabled>
          Next Month
          <ChevronRight data-slot="icon" />
        </Button>
      )}
    </div>
  )
}

