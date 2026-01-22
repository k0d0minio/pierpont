'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type BeforeInstallPromptEvent = Event & {
  preventDefault: () => void;
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __promptPWAInstall?: () => Promise<boolean>;
  }
}

export default function PWARegistration() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isIOSStandalone, setIsIOSStandalone] = useState(false)
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pull = useRef<{ startY: number; pulling: boolean; distance: number }>({ startY: 0, pulling: false, distance: 0 })

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
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  // iOS detection for manual install hint
  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as { standalone?: boolean }).standalone === true
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
        const { outcome } = await promptEvent.prompt()
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

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return
      if (!e.touches || e.touches.length !== 1) return
      pull.current.startY = e.touches[0].clientY
      pull.current.pulling = true
      pull.current.distance = 0
    }

    function onTouchMove(e: TouchEvent) {
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
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 text-xs text-white bg-emerald-600 shadow">Actualisation…</div>
      )}

      {canInstall && !isIOSStandalone && (
        <Button
          type="button"
          onClick={() => window.__promptPWAInstall?.()}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-emerald-600 text-white shadow-lg px-4 py-2 text-sm hover:bg-emerald-700"
        >
          Installer l&apos;application
        </Button>
      )}

      {showIOSBanner && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setShowIOSBanner(false); localStorage.setItem('iosInstallBannerDismissed', '1') } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Installer cette application</DialogTitle>
              <DialogDescription>
                Ajoutez à votre écran d&apos;accueil pour une expérience plus rapide et en plein écran.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Sur iPhone/iPad : appuyez sur <span aria-hidden>Partager</span> puis <strong>Ajouter à l&apos;écran d&apos;accueil</strong>.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setShowIOSBanner(false); localStorage.setItem('iosInstallBannerDismissed', '1') }}>Ignorer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
