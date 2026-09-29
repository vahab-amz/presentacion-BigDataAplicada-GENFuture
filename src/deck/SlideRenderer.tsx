'use client'

import { AnimatePresence, motion } from 'motion/react'
import { SLIDES } from '@/data/deck'
import { SLIDE_COMPONENTS } from '@/slides'
import { DURATION, EASE_OUT } from './motion-presets'
import { SlideStepProvider, type SlideRenderMode } from './slide-context'
import type { DeckPosition } from './deck-state'

/**
 * Renders one slide at one step. Because a slide is a pure function of its
 * step, the same component tree drives the live stage, the presenter's
 * next-step preview and the print route.
 */
export function SlideAt({
  position,
  mode = 'live',
}: {
  position: DeckPosition
  mode?: SlideRenderMode
}) {
  const slide = SLIDES[position.slide]
  const Component = slide ? SLIDE_COMPONENTS[slide.id] : undefined
  if (!slide || !Component) return null

  return (
    <SlideStepProvider step={position.step} mode={mode}>
      <Component />
    </SlideStepProvider>
  )
}

/** The live stage: a short cross-fade with a slight vertical offset. */
export function SlideRenderer({ position }: { position: DeckPosition }) {
  const slide = SLIDES[position.slide]

  return (
    <AnimatePresence initial={false} mode="sync">
      <motion.div
        key={slide?.id ?? position.slide}
        className="absolute inset-0"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: DURATION.slide, ease: EASE_OUT }}
      >
        <SlideAt position={position} mode="live" />
      </motion.div>
    </AnimatePresence>
  )
}
