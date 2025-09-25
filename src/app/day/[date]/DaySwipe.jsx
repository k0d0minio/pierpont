'use client'

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

export default function DaySwipe({ dateParam, children }) {
  const router = useRouter()
  const current = useMemo(() => parseYmd(dateParam), [dateParam])
  const prev = useMemo(() => formatYmd(addDays(current, -1)), [current])
  const next = useMemo(() => formatYmd(addDays(current, 1)), [current])

  const containerRef = useRef(null)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const haptic = useCallback((duration = 12) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // very short pulse
      navigator.vibrate(duration)
    }
  }, [])

  const handleNavigate = useCallback((direction) => {
    // direction: -1 for prev, 1 for next
    haptic(15)
    if (direction < 0) router.push(`/day/${prev}`)
    else router.push(`/day/${next}`)
  }, [haptic, router, prev, next])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let startX = 0
    let startY = 0
    let lastX = 0
    let velocity = 0
    let dragging = false
    const threshold = Math.min(window.innerWidth * 0.25, 220) // 25% of width or 220px
    const maxRubber = 60 // rubber banding at extremes
    let lastTs = 0

    function onStart(x, y) {
      dragging = true
      setIsDragging(true)
      startX = x
      startY = y
      lastX = x
      velocity = 0
      lastTs = performance.now()
    }

    function onMove(x, y) {
      if (!dragging) return
      const dx = x - startX
      const dy = y - startY
      // guard for vertical scroll dominance
      if (Math.abs(dy) > Math.abs(dx) * 1.3) return

      // rubber band when over threshold to make it feel restrained
      let applied = dx
      if (Math.abs(dx) > threshold) {
        const excess = Math.abs(dx) - threshold
        const sign = dx > 0 ? 1 : -1
        applied = sign * (threshold + (excess * maxRubber) / (excess + maxRubber))
      }
      setOffsetX(applied)

      const now = performance.now()
      const dt = now - lastTs
      if (dt > 0) {
        velocity = (x - lastX) / dt // px per ms
        lastX = x
        lastTs = now
      }
    }

    function animateTo(target, onDone) {
      const duration = 220
      const start = performance.now()
      const initial = offsetX
      const delta = target - initial
      function frame(now) {
        const t = Math.min(1, (now - start) / duration)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3)
        const value = initial + delta * eased
        setOffsetX(value)
        if (t < 1) requestAnimationFrame(frame)
        else onDone && onDone()
      }
      requestAnimationFrame(frame)
    }

    function onEnd(x, y) {
      if (!dragging) return
      dragging = false
      setIsDragging(false)
      const dx = x - startX
      const dy = y - startY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      const flick = Math.abs(velocity) > 0.7 // px/ms ~ 700px/s
      const commit = absDx > threshold || (absDx > 24 && absDy < 40 && flick)

      if (commit) {
        const dir = dx > 0 ? -1 : 1 // swipe right shows previous day
        const target = dir < 0 ? window.innerWidth : -window.innerWidth
        animateTo(target, () => handleNavigate(dir))
      } else {
        animateTo(0)
      }
    }

    function ts(e) { return e.touches && e.touches[0] }

    function onTouchStart(e) {
      const t = ts(e)
      if (!t) return
      onStart(t.clientX, t.clientY)
    }
    function onTouchMove(e) {
      const t = ts(e)
      if (!t) return
      onMove(t.clientX, t.clientY)
    }
    function onTouchEnd(e) {
      const t = e.changedTouches && e.changedTouches[0]
      if (!t) return
      onEnd(t.clientX, t.clientY)
    }

    function onMouseDown(e) {
      if (e.button !== 0) return
      onStart(e.clientX, e.clientY)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
    function onMouseMove(e) { onMove(e.clientX, e.clientY) }
    function onMouseUp(e) {
      onEnd(e.clientX, e.clientY)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('mousedown', onMouseDown)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [offsetX, handleNavigate])

  // style: apply transform and subtle drop shadow while dragging
  const style = {
    transform: `translate3d(${offsetX}px, 0, 0)`,
    transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
  }

  return (
    <div ref={containerRef} style={style} className="will-change-transform">
      {children}
    </div>
  )
}

