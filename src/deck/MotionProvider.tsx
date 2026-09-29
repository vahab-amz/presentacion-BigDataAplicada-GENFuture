'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * `reducedMotion="user"` makes every motion component drop transform and
 * layout animations when the operating system asks for reduced motion, while
 * keeping opacity — which is exactly the deck's fades-only fallback.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
