"use client"

import { Button } from '../../../../components/button.jsx'
import { Link } from '../../../../components/link.jsx'

export default function DayNav() {
  return (
    <div className="flex items-center justify-between gap-2">
      <Link href="/">
        <Button plain aria-label="Back to week" className="text-xs sm:text-sm">← Week</Button>
      </Link>
    </div>
  )
}


