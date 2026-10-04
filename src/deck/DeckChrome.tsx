'use client'

import { motion } from 'motion/react'
import { SLIDE_COUNT, UI_TEXT } from '@/data/deck'
import { sourceLabels } from '@/data/sources'
import { DURATION, EASE_OUT } from './motion-presets'
import { useDeck } from './DeckProvider'

/**
 * The standing furniture at the foot of every slide: what the numbers came
 * from, where we are, and a hairline that fills across the whole deck rather
 * than the current slide. It takes the on-screen slide's palette from the
 * stage, so it stays legible on the light slide in the dark theme too.
 *
 * The appendix is outside the numbered flow: it reads "Anexo" and the
 * progress bar stays where the talk was.
 */
export function DeckChrome() {
  const { screen, position, progress, chromeVisible } = useDeck()

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-0"
      initial={false}
      animate={{ opacity: chromeVisible ? 1 : 0 }}
      transition={{ duration: DURATION.slide, ease: EASE_OUT }}
      aria-hidden={chromeVisible ? undefined : true}
    >
      <div className="flex items-baseline gap-10 px-[120px] pb-[34px] text-micro text-ink-faint">
        <p className="flex-1 truncate">{sourceLabels(screen.meta.sources)}</p>
        <p className="shrink-0 tabular-nums" data-deck-counter="">
          {screen.isAppendix
            ? UI_TEXT.appendix
            : UI_TEXT.slideOf(position.slide + 1, SLIDE_COUNT)}
        </p>
      </div>

      <div className="h-[4px] w-full bg-rule">
        <motion.div
          data-deck-progress={progress.toFixed(4)}
          className="h-full origin-left bg-accent"
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ duration: DURATION.slide, ease: EASE_OUT }}
          style={{ width: '100%' }}
        />
      </div>
    </motion.div>
  )
}

/** Screen-reader announcement of the current position. */
export function DeckLiveRegion() {
  const { screen, position } = useDeck()
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {screen.isAppendix
        ? UI_TEXT.liveRegionAppendix(screen.meta.name, screen.step)
        : UI_TEXT.liveRegion(position.slide + 1, SLIDE_COUNT, position.step)}
    </div>
  )
}
