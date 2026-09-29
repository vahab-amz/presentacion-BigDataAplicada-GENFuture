import type { Transition } from 'motion/react'

/** Ease-out only: things arrive and settle, nothing overshoots. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const DURATION = {
  /** Slide cross-fade. */
  slide: 0.35,
  /** Standard entrance. */
  base: 0.45,
  /** Larger elements and areas. */
  slow: 0.6,
  /** SVG line draw. */
  draw: 0.7,
  /** Count-up. */
  count: 0.8,
} as const

/** Group stagger, inside the 40-80 ms window. */
export const STAGGER = 0.06

export const ENTER_OFFSET = 16

export const enterTransition = (delay = 0): Transition => ({
  duration: DURATION.base,
  ease: EASE_OUT,
  delay,
})

export const drawTransition = (delay = 0): Transition => ({
  duration: DURATION.draw,
  ease: EASE_OUT,
  delay,
})

export const instantTransition: Transition = { duration: 0 }
