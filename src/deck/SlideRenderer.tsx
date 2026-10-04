'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { SlideMeta } from '@/data/deck'
import { SLIDE_COMPONENTS } from '@/slides'
import { useDeck } from './DeckProvider'
import { DURATION, EASE_OUT } from './motion-presets'
import { paletteFor } from './deck-state'
import { SlideStepProvider, type SlideRenderMode } from './slide-context'

/**
 * Renders one slide at one step. Because a slide is a pure function of its
 * step, the same component tree drives the live stage, the presenter's
 * previews and the print route.
 */
export function SlideAt({
  slide,
  step,
  mode = 'live',
}: {
  slide: SlideMeta
  step: number
  mode?: SlideRenderMode
}) {
  const Component = SLIDE_COMPONENTS[slide.id]
  return (
    <SlideStepProvider step={step} mode={mode}>
      <Component />
    </SlideStepProvider>
  )
}

/**
 * The live stage: a short cross-fade with a slight vertical offset. Each slide
 * pins its own palette, so a light slide fading out over a dark one keeps its
 * colours until it is gone.
 */
export function SlideRenderer() {
  const { screen, theme } = useDeck()

  return (
    <AnimatePresence initial={false} mode="sync">
      <motion.div
        key={screen.meta.id}
        data-palette={paletteFor(screen.meta, theme)}
        data-slide-id={screen.meta.id}
        className="absolute inset-0 text-ink"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: DURATION.slide, ease: EASE_OUT }}
      >
        <SlideAt slide={screen.meta} step={screen.step} mode="live" />
      </motion.div>
    </AnimatePresence>
  )
}
