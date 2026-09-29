'use client'

import { AnimatePresence, motion } from 'motion/react'
import { SHORTCUTS, UI_TEXT } from '@/data/deck'
import { DURATION, EASE_OUT } from './motion-presets'
import { useDeck } from './DeckProvider'

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.slide, ease: EASE_OUT },
}

/** B or "." — a true black screen so the room can look at the speaker. */
export function Blackout() {
  const { blackout, toggleBlackout } = useDeck()
  return (
    <AnimatePresence>
      {blackout ? (
        <motion.button
          type="button"
          onClick={toggleBlackout}
          className="fixed inset-0 z-50 flex cursor-default items-end justify-center bg-black pb-10 text-sm text-white/25"
          aria-label={UI_TEXT.blackout}
          {...fade}
        >
          {UI_TEXT.blackout}
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}

/**
 * N — speaker notes over the stage, for when there is no second screen.
 * Sized in rem rather than stage pixels: it is an aid for the presenter, not
 * part of the composition.
 */
export function NotesOverlay() {
  const { notesOpen, closeOverlays, slide, position } = useDeck()
  const stepNote = slide.notes.byStep?.[position.step]
  const bullets = slide.notes.bullets ?? []

  return (
    <AnimatePresence>
      {notesOpen ? (
        <motion.aside
          className="fixed inset-x-0 bottom-0 z-40 max-h-[62vh] overflow-y-auto border-t-2 border-accent bg-bg-deep/97 px-14 py-10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: DURATION.slide, ease: EASE_OUT }}
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-sans text-sm tracking-[0.2em] text-ink-faint uppercase">
                {UI_TEXT.notes} — {slide.name}
              </h2>
              <button
                type="button"
                onClick={closeOverlays}
                className="text-sm text-ink-faint hover:text-ink"
              >
                Esc
              </button>
            </div>
            {stepNote ? (
              <p className="mb-6 text-[1.6rem] leading-[1.5] text-ink">{stepNote}</p>
            ) : null}
            {bullets.length > 0 ? (
              <ul className="space-y-3">
                {bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="border-l-2 border-rule-strong pl-5 text-[1.25rem] leading-[1.5] text-ink-muted"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}

/** ? — the shortcut sheet. */
export function HelpOverlay() {
  const { helpOpen, closeOverlays } = useDeck()
  return (
    <AnimatePresence>
      {helpOpen ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-bg-deep/90 p-10 backdrop-blur-sm"
          {...fade}
        >
          <div className="w-full max-w-[880px] border border-rule bg-panel p-12">
            <div className="mb-8 flex items-baseline justify-between">
              <h2 className="font-serif text-4xl text-ink">{UI_TEXT.helpTitle}</h2>
              <button
                type="button"
                onClick={closeOverlays}
                className="text-sm text-ink-faint hover:text-ink"
              >
                Esc
              </button>
            </div>
            <dl className="grid grid-cols-[minmax(0,20rem)_1fr] gap-x-10 gap-y-4">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys} className="contents">
                  <dt className="border-b border-rule pb-3 font-sans text-base text-ink tabular-nums">
                    {shortcut.keys}
                  </dt>
                  <dd className="border-b border-rule pb-3 text-base text-ink-muted">
                    {shortcut.action}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
