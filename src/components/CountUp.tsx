'use client'

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import { DURATION, EASE_OUT } from '@/deck/motion-presets'
import { useSlideStep } from '@/deck/slide-context'

export type CountUpProps = {
  value: number
  format: (value: number) => string
  /** Where the count starts the first time it appears. */
  from?: number
  /** Usually `step >= n`: the number counts up when it first shows. */
  active?: boolean
  className?: string
}

/**
 * A figure that counts up the first time it appears and then eases between
 * values when the inputs change (slide 4's sliders).
 *
 * Instant under `prefers-reduced-motion` and in static render mode, so the
 * print route and the presenter preview always show the settled number.
 */
export function CountUp({
  value,
  format,
  from = 0,
  active = true,
  className,
}: CountUpProps) {
  const reduceMotion = useReducedMotion()
  const { mode } = useSlideStep()
  const instant = reduceMotion === true || mode === 'static'

  const current = useMotionValue(active ? value : from)
  const text = useTransform(current, (raw) => format(raw))
  const hasAppeared = useRef(active)

  useEffect(() => {
    if (!active) {
      current.set(from)
      hasAppeared.current = false
      return
    }
    if (instant) {
      current.set(value)
      hasAppeared.current = true
      return
    }
    // Counting up from zero is for the first appearance. Once the figure is on
    // screen, a slider drag must not queue an 800 ms animation per frame, so
    // updates chase the new value quickly instead.
    const firstAppearance = !hasAppeared.current
    if (firstAppearance) current.set(from)
    hasAppeared.current = true
    const controls = animate(current, value, {
      duration: firstAppearance ? DURATION.count : 0.28,
      ease: EASE_OUT,
    })
    return () => controls.stop()
  }, [active, value, from, instant, current])

  return (
    <motion.span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {text}
    </motion.span>
  )
}
