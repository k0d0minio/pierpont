'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../../../components/button.jsx'
import { Link } from '../../../../components/link.jsx'

function parseYmd(ymd) {
  const [y, m, d] = ymd.split('-').map((n) => Number(n))
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
}

function formatYmd(date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

export default function DayNav({ dateParam }) {
  const router = useRouter()
  const current = parseYmd(dateParam)
  const prev = formatYmd(addDays(current, -1))
  const next = formatYmd(addDays(current, 1))

  const haptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const goPrev = useCallback(() => {
    haptic()
    router.push(`/day/${prev}`)
  }, [haptic, router, prev])

  const goNext = useCallback(() => {
    haptic()
    router.push(`/day/${next}`)
  }, [haptic, router, next])

  useEffect(() => {
    let startX = null
    let startY = null
    const threshold = 50 // px

    function onTouchStart(e) {
      if (e.touches && e.touches.length === 1) {
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
      }
    }

    function onTouchEnd(e) {
      if (startX == null || startY == null) return
      const touch = e.changedTouches && e.changedTouches[0]
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
    <>
      <div className="flex items-center justify-between gap-2">
        <Link href="/">
          <Button plain aria-label="Back to week" className="text-xs sm:text-sm">← Week</Button>
        </Link>
        <div className="hidden sm:flex items-center gap-2">
          <Button plain aria-label="Previous day" onClick={goPrev} className="text-base sm:text-sm">←</Button>
          <Button plain aria-label="Next day" onClick={goNext} className="text-base sm:text-sm">→</Button>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-2 z-10 flex justify-center sm:hidden">
        <div className="rounded-full bg-zinc-900/90 text-white shadow-lg backdrop-blur px-3 py-1.5 flex items-center gap-6">
          <button onClick={goPrev} aria-label="Previous day" className="text-lg">←</button>
          <button onClick={goNext} aria-label="Next day" className="text-lg">→</button>
        </div>
      </div>
    </>
  )
}


