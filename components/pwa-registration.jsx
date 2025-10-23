'use client'

import { useEffect, useRef, useState } from 'react'
import { Alert, AlertActions, AlertBody, AlertDescription, AlertTitle } from './alert'
import { Button } from './button'

export default function PWARegistration() {
  const deferredPromptRef = useRef(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isIOSStandalone, setIsIOSStandalone] = useState(false)
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pull = useRef({ startY: 0, pulling: false, distance: 0 })

  // Register SW and enable instant updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          // Listen for new SW and activate immediately
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
              }
            })
          })
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Reload to get the fresh SW-controlled page
            window.location.reload()
          })
        } catch (err) {
          console.warn('SW registration failed', err)
        }
      }
      // Register ASAP; Next already waits for hydration
      register()
    }
  }, [])

  // Android install prompt handling
  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  // iOS detection for manual install hint
  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator).standalone === true
    setIsIOSStandalone(isIOS && standalone)
    if (isIOS && !standalone) {
      const dismissed = localStorage.getItem('iosInstallBannerDismissed') === '1'
      if (!dismissed) setShowIOSBanner(true)
    }
  }, [])

  // Expose a global hook to trigger install from Navbar or elsewhere
  useEffect(() => {
    window.__promptPWAInstall = async () => {
      if (deferredPromptRef.current) {
        const promptEvent = deferredPromptRef.current
        promptEvent.prompt()
        const { outcome } = await promptEvent.userChoice
        if (outcome !== 'accepted') {
          // user dismissed; keep the prompt available
          return false
        }
        deferredPromptRef.current = null
        setCanInstall(false)
        return true
      }
      return false
    }
  }, [])

  // Global pull-to-refresh: drag down from top -> reload (network-first)
  useEffect(() => {
    const threshold = 70
    const maxPull = 140

    function onTouchStart(e) {
      if (window.scrollY > 0) return
      if (!e.touches || e.touches.length !== 1) return
      pull.current.startY = e.touches[0].clientY
      pull.current.pulling = true
      pull.current.distance = 0
    }

    function onTouchMove(e) {
      if (!pull.current.pulling) return
      const dy = e.touches[0].clientY - pull.current.startY
      if (dy > 0 && window.scrollY <= 0) {
        pull.current.distance = Math.min(dy, maxPull)
        document.body.style.transform = `translateY(${pull.current.distance}px)`
      }
    }

    function onTouchEnd() {
      if (!pull.current.pulling) return
      const shouldRefresh = pull.current.distance >= threshold
      document.body.style.transform = ''
      pull.current.pulling = false
      pull.current.distance = 0
      if (shouldRefresh) {
        setIsRefreshing(true)
        if ('vibrate' in navigator) navigator.vibrate(10)
        // Reload current route; SW is network-first for navigations
        location.reload()
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  // Render a small floating install button on Android; for iOS we rely on a separate banner (added in layout)
  return (
    <>
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 text-xs text-white bg-emerald-600 shadow">Refreshing…</div>
      )}

      {canInstall && !isIOSStandalone && (
        <button
          onClick={() => window.__promptPWAInstall?.()}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-emerald-600 text-white shadow-lg px-4 py-2 text-sm"
        >
          Install App
        </button>
      )}

      {showIOSBanner && (
        <Alert open={true} onClose={() => { setShowIOSBanner(false); localStorage.setItem('iosInstallBannerDismissed', '1') }} size="sm">
          <AlertTitle>Install this app</AlertTitle>
          <AlertDescription>
            Add to your Home Screen for a faster, fullscreen experience.
          </AlertDescription>
          <AlertBody>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              On iPhone/iPad: tap <span aria-hidden>Share</span> and then <strong>Add to Home Screen</strong>.
            </p>
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => { setShowIOSBanner(false); localStorage.setItem('iosInstallBannerDismissed', '1') }}>Dismiss</Button>
          </AlertActions>
        </Alert>
      )}
    </>
  )
}
