'use client'

import { motion } from 'motion/react'
import { SLIDE_COUNT, UI_TEXT } from '@/data/deck'
import { SOURCES } from '@/data/sources'
import { DURATION, EASE_OUT } from './motion-presets'
import { useDeck } from './DeckProvider'

/**
 * The standing furniture at the foot of every slide: who is speaking, where we
 * are, what the numbers came from, and a hairline that fills across the whole
 * deck rather than the current slide.
 */
export function DeckChrome() {
  const { slide, position, progress, chromeVisible } = useDeck()

  const sources = slide.sources.map((id) => SOURCES[id].label).join(' · ')

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-0"
      initial={false}
      animate={{ opacity: chromeVisible ? 1 : 0 }}
      transition={{ duration: DURATION.slide, ease: EASE_OUT }}
      aria-hidden={chromeVisible ? undefined : true}
    >
      <div className="flex items-baseline gap-10 px-[120px] pb-[34px] text-micro text-ink-faint">
        <p className="shrink-0">
          <span className="tracking-[0.16em] uppercase">{UI_TEXT.presents}</span>{' '}
          <span className="text-ink-muted">{slide.presenter}</span>
        </p>
        <p className="flex-1 truncate text-center">{sources}</p>
        <p className="shrink-0 tabular-nums">
          {UI_TEXT.slideOf(position.slide + 1, SLIDE_COUNT)}
        </p>
      </div>

      <div className="h-[4px] w-full bg-rule">
        <motion.div
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
  const { position } = useDeck()
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {UI_TEXT.liveRegion(position.slide + 1, SLIDE_COUNT, position.step)}
    </div>
  )
}
