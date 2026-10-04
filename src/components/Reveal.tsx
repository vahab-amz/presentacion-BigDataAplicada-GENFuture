'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { useSlideStep } from '@/deck/slide-context'
import { ENTER_OFFSET, enterTransition, instantTransition } from '@/deck/motion-presets'

export type RevealProps = {
  /** The step from which this content is on screen. */
  at: number
  /** The step from which it leaves again (exclusive); omit to stay. */
  until?: number
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Stagger position inside a group; multiplied by the stagger interval. */
  index?: number
  /** Extra delay in seconds on top of the stagger. */
  delay?: number
  /** Direction the element travels in from. */
  from?: 'up' | 'down' | 'left' | 'right' | 'none'
}

const OFFSETS: Record<NonNullable<RevealProps['from']>, { x: number; y: number }> = {
  up: { x: 0, y: ENTER_OFFSET },
  down: { x: 0, y: -ENTER_OFFSET },
  left: { x: ENTER_OFFSET, y: 0 },
  right: { x: -ENTER_OFFSET, y: 0 },
  none: { x: 0, y: 0 },
}

const STAGGER_INTERVAL = 0.06

/**
 * Step-gated content.
 *
 * The element is always in the layout — only opacity and a small transform
 * change — so revealing something never shifts anything else, and stepping
 * backwards simply animates to the other state rather than rewinding a
 * timeline. With `until`, content leaves the same way it came: a cover title
 * gives way to the slide's working title without anything moving.
 */
export function Reveal({
  at,
  until,
  children,
  className,
  style,
  index = 0,
  delay = 0,
  from = 'up',
}: RevealProps) {
  const { step, mode } = useSlideStep()
  const reduceMotion = useReducedMotion()
  const visible = step >= at && (until === undefined || step < until)

  const offset = reduceMotion ? OFFSETS.none : OFFSETS[from]
  const transition =
    mode === 'static' ? instantTransition : enterTransition(delay + index * STAGGER_INTERVAL)

  return (
    <motion.div
      className={className}
      style={{ ...style, pointerEvents: visible ? undefined : 'none' }}
      initial={false}
      animate={
        visible
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: offset.x, y: offset.y }
      }
      transition={transition}
      aria-hidden={visible ? undefined : true}
      inert={visible ? undefined : true}
    >
      {children}
    </motion.div>
  )
}
