'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { ensureDayExists } from '../../actions/days'
import { parseYmd, formatYmd, addDays, isPastDate } from '../../../lib/day-utils'
import { useAdminAuth } from '@/lib/AdminAuthProvider'

type DayNavProps = {
  dateParam: string;
}

export default function DayNav({ dateParam }: DayNavProps) {
  const router = useRouter()
  const { isAuthenticated } = useAdminAuth()
  const current = parseYmd(dateParam)
  const prev = formatYmd(addDays(current, -1))
  const next = formatYmd(addDays(current, 1))

  const haptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const goPrev = useCallback(async () => {
    haptic()
    const prevDate = addDays(current, -1)
    // Only ensure day exists if it's not in the past (past dates are handled by redirect)
    if (!isPastDate(prevDate)) {
      await ensureDayExists(prevDate.toISOString())
    }
    router.push(`/day/${prev}`)
  }, [haptic, router, current, prev])

  const goNext = useCallback(async () => {
    haptic()
    const nextDate = addDays(current, 1)
    // Always ensure next day exists (it's in the future)
    await ensureDayExists(nextDate.toISOString())
    router.push(`/day/${next}`)
  }, [haptic, router, current, next])

  useEffect(() => {
    let startX: number | null = null
    let startY: number | null = null
    const threshold = 50 // px

    function onTouchStart(e: TouchEvent) {
      if (e.touches && e.touches.length === 1) {
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (startX == null || startY == null) return
      const touch = e.changedTouches?.[0]
      if (!touch) return
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      // Horizontal swipe with minimal vertical movement
      if (Math.abs(dx) > threshold && Math.abs(dy) < 40) {
        if (dx > 0) {
          goPrev()
        } else {
          goNext()
        }
      }
      startX = null
      startY = null
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [goPrev, goNext])

  return (
    <div className="flex items-center justify-between gap-2">
      {isAuthenticated && (
        <Link href="/">
          <Button variant="ghost" aria-label="Retour à l'emploi du temps" className="text-xs sm:text-sm flex items-center gap-1">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Retour
          </Button>
        </Link>
      )}
      <div className="hidden sm:flex items-center gap-2">
        <Button variant="ghost" aria-label="Jour précédent" onClick={goPrev} className="text-base sm:text-sm">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" aria-label="Jour suivant" onClick={goNext} className="text-base sm:text-sm">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
