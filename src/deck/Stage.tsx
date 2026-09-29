'use client'

import { useRef, useState, type ReactNode } from 'react'
import { useIsomorphicLayoutEffect } from '@/lib/use-isomorphic-layout-effect'

export const STAGE_WIDTH = 1920
export const STAGE_HEIGHT = 1080

/**
 * A fixed 1920x1080 stage, scaled uniformly to fit whatever it is given and
 * centred with letterboxing.
 *
 * Nothing inside the stage may use viewport units: the single transform is the
 * only thing that responds to the window, so a laptop, a 4K panel and a tired
 * classroom projector all render exactly the same composition.
 */
export function Stage({
  children,
  /**
   * Hide the stage until the deck has read the URL hash. Off for the print
   * route and the presenter preview, which know their position up front.
   */
  gate = true,
  /** Fixed scale instead of measuring the container (used by /print). */
  fixedScale,
  className = '',
}: {
  children: ReactNode
  gate?: boolean
  fixedScale?: number
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [measuredScale, setMeasuredScale] = useState(fixedScale ?? 1)

  useIsomorphicLayoutEffect(() => {
    if (fixedScale !== undefined) return
    const element = containerRef.current
    if (!element) return

    const update = () => {
      const { width, height } = element.getBoundingClientRect()
      if (width === 0 || height === 0) return
      setMeasuredScale(Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [fixedScale])

  const scale = fixedScale ?? measuredScale

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-bg-deep ${className}`}
    >
      <div
        {...(gate ? { 'data-deck-stage': '' } : {})}
        className="absolute top-1/2 left-1/2 bg-bg text-ink"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transformOrigin: 'center',
          transform: `translate(-50%, -50%) scale(${scale})`,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}
