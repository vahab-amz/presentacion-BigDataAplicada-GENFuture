'use client'

import { useEffect, useState } from 'react'
import { APPENDIX, DECK_TITLE, SLIDE_COUNT, UI_TEXT, type SlideMeta } from '@/data/deck'
import { useDeck } from './DeckProvider'
import { HeroStill } from './HeroLayer'
import { nextPosition, paletteFor, samePosition, type Theme } from './deck-state'
import { SlideAt } from './SlideRenderer'
import type { SlideRenderMode } from './slide-context'
import { Stage } from './Stage'

/**
 * Seconds since the last time any of `deps` changed. The clock restarts by
 * tearing down its own interval, so nothing has to be reset imperatively.
 */
function useElapsedSeconds(deps: readonly unknown[]): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const startedAt = performance.now()
    const id = window.setInterval(
      () => setSeconds((performance.now() - startedAt) / 1000),
      250,
    )
    return () => {
      window.clearInterval(id)
      setSeconds(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return seconds
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

/**
 * The second screen. It owns nothing: navigation, blackout and theme all live
 * in the shared state, so pressing an arrow here moves the projector and vice
 * versa.
 */
export function PresenterView() {
  const deck = useDeck()
  const { position, slide, slides, screen, theme } = deck

  // Inside the appendix, "next" is its next reveal, then the spot A or Esc
  // returns to. In the numbered flow it is simply the next reveal.
  const upcoming = nextPosition(position, slides)
  const preview: { meta: SlideMeta; step: number; heading: string } | null = screen.isAppendix
    ? screen.step < APPENDIX.steps - 1
      ? { meta: APPENDIX, step: screen.step + 1, heading: UI_TEXT.nextStep }
      : { meta: slide, step: position.step, heading: UI_TEXT.appendixReturn }
    : samePosition(upcoming, position)
      ? null
      : {
          meta: slides[upcoming.slide] ?? slide,
          step: upcoming.step,
          heading: UI_TEXT.nextStep,
        }

  const [resetKey, setResetKey] = useState(0)
  const totalSeconds = useElapsedSeconds([resetKey])
  const slideSeconds = useElapsedSeconds([resetKey, position.slide])
  const resetTimers = () => setResetKey((key) => key + 1)

  const stepNote = screen.meta.notes.byStep?.[screen.step]
  const bullets = screen.meta.notes.bullets ?? []

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-bg-deep text-ink">
      <header className="flex shrink-0 items-baseline gap-8 border-b border-rule px-8 py-4">
        <h1 className="text-base tracking-[0.18em] text-ink-faint uppercase">
          {UI_TEXT.presenterTitle}
        </h1>
        <p className="text-base text-ink-muted">{DECK_TITLE}</p>
        <div className="ml-auto flex items-baseline gap-8 tabular-nums">
          <Timer label={UI_TEXT.slideTimer} value={formatClock(slideSeconds)} />
          <Timer label={UI_TEXT.totalTimer} value={formatClock(totalSeconds)} emphasis />
          <button
            type="button"
            onClick={resetTimers}
            className="border border-rule px-3 py-1 text-sm text-ink-faint hover:border-rule-strong hover:text-ink"
          >
            Reiniciar
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[58fr_42fr]">
        <section className="flex min-h-0 flex-col border-r border-rule p-6">
          {/* A 16:9 box so the mirrored stage fills it instead of sitting in
              a band of empty black. */}
          <div className="flex min-h-0 flex-1 items-center">
            <div className="aspect-video max-h-full w-full border border-rule">
              <StagePreview meta={screen.meta} step={screen.step} mode="live" theme={theme} />
            </div>
          </div>
          <div className="mt-4 flex shrink-0 items-baseline justify-between text-base">
            <p className="text-ink-muted">{screen.meta.name}</p>
            <p className="tabular-nums text-ink">
              {screen.isAppendix ? UI_TEXT.appendix : `${position.slide + 1} / ${SLIDE_COUNT}`}
              <span className="ml-4 text-ink-faint">
                paso {screen.step} / {screen.meta.steps - 1}
              </span>
            </p>
          </div>
        </section>

        <section className="flex min-h-0 flex-col p-6">
          <h2 className="shrink-0 text-sm tracking-[0.18em] text-ink-faint uppercase">
            {preview ? preview.heading : 'Fin de la presentación'}
          </h2>
          <div className="mt-3 aspect-video w-full shrink-0 border border-rule">
            {preview ? (
              <StagePreview meta={preview.meta} step={preview.step} mode="static" theme={theme} />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-faint">—</div>
            )}
          </div>

          <h2 className="mt-6 shrink-0 text-sm tracking-[0.18em] text-ink-faint uppercase">
            {UI_TEXT.notes}
          </h2>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-2">
            {stepNote ? (
              <p className="text-[1.5rem] leading-[1.5] text-ink">{stepNote}</p>
            ) : null}
            {bullets.length > 0 ? (
              <ul className={stepNote ? 'mt-6 space-y-3' : 'space-y-3'}>
                {bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="border-l-2 border-rule-strong pl-4 text-[1.2rem] leading-[1.5] text-ink-muted"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-4 flex shrink-0 gap-3">
            <button
              type="button"
              onClick={deck.prev}
              className="flex-1 border border-rule py-3 text-base text-ink-muted hover:border-rule-strong hover:text-ink"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={deck.next}
              className="flex-1 border border-rule bg-panel py-3 text-base text-ink hover:border-accent"
            >
              Siguiente →
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

/** A slide in a small stage; the cover video appears as its poster still. */
function StagePreview({
  meta,
  step,
  mode,
  theme,
}: {
  meta: SlideMeta
  step: number
  mode: SlideRenderMode
  theme: Theme
}) {
  return (
    <Stage gate={false} palette={paletteFor(meta, theme)}>
      {meta.backdrop === 'hero' ? <HeroStill step={step} /> : null}
      <SlideAt slide={meta} step={step} mode={mode} />
    </Stage>
  )
}

function Timer({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="text-right">
      <p className="text-xs tracking-[0.14em] text-ink-faint uppercase">{label}</p>
      <p className={emphasis ? 'text-3xl text-ink' : 'text-2xl text-ink-muted'}>{value}</p>
    </div>
  )
}
