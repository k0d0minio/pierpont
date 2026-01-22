"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

// Context to share tooltip state for mobile click handling
const TooltipContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  isTouch: boolean
} | null>(null)

// Hook to detect if device supports touch
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false)

  React.useEffect(() => {
    // Check if device supports touch events
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsTouch(hasTouch)
  }, [])

  return isTouch
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const isTouch = useIsTouchDevice()
  const [open, setOpen] = React.useState(false)

  // On mobile, use controlled state for click behavior
  // On desktop, use default hover behavior
  if (isTouch) {
    return (
      <TooltipProvider>
        <TooltipContext.Provider value={{ open, setOpen, isTouch }}>
          <TooltipPrimitive.Root
            data-slot="tooltip"
            open={open}
            onOpenChange={setOpen}
            {...props}
          />
        </TooltipContext.Provider>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <TooltipContext.Provider value={{ open: false, setOpen: () => {}, isTouch: false }}>
        <TooltipPrimitive.Root data-slot="tooltip" {...props} />
      </TooltipContext.Provider>
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const context = React.useContext(TooltipContext)
  const isTouch = context?.isTouch ?? false

  // On mobile, handle click to toggle tooltip
  if (isTouch && context && React.isValidElement(props.children)) {
    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
      // Toggle tooltip state
      context.setOpen(!context.open)
      
      // Preserve original onClick handler if it exists
      const originalOnClick = (props.children as React.ReactElement).props?.onClick
      if (originalOnClick) {
        originalOnClick(e)
      }
    }

    // Clone the child element and add click handler
    return (
      <TooltipPrimitive.Trigger
        data-slot="tooltip-trigger"
        asChild
        {...props}
      >
        {React.cloneElement(props.children as React.ReactElement, {
          onClick: handleClick,
          onTouchEnd: handleClick,
        })}
      </TooltipPrimitive.Trigger>
    )
  }

  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
