'use client'

import { useEffect } from 'react'
import { APPENDIX, SLIDES, UI_TEXT, type SlideMeta } from '@/data/deck'
import { sourceLabels } from '@/data/sources'
import { HeroStill } from '@/deck/HeroLayer'
import { SlideAt } from '@/deck/SlideRenderer'
import { STAGE_HEIGHT, STAGE_WIDTH, Stage } from '@/deck/Stage'
import { pinnedPalette } from '@/deck/deck-state'

/**
 * PDF backup: every slide at its final step, one per landscape A4 page, and
 * the risks appendix as a last page for questions.
 *
 * A4 landscape at 96 dpi is 1123 x 794 CSS pixels, so the stage is scaled to
 * the page width and centred. Everything renders in static mode, which means
 * no animation is mid-flight when the browser snapshots the page. The cover
 * video appears as its poster still.
 */
const PAGE_WIDTH = 1123
const PAGE_HEIGHT = 794
const SCALE = PAGE_WIDTH / STAGE_WIDTH

const PAGES: readonly { slide: SlideMeta; counter: string }[] = [
  ...SLIDES.map((slide, index) => ({
    slide,
    counter: UI_TEXT.slideOf(index + 1, SLIDES.length),
  })),
  { slide: APPENDIX, counter: UI_TEXT.appendix },
]

export default function PrintPage() {
  // The deck locks body scrolling; the print preview needs it back.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'auto'
    document.documentElement.dataset.deckReady = ''
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <main className="bg-bg-deep">
      {PAGES.map(({ slide, counter }) => (
        <div
          key={slide.id}
          className="print-page relative mx-auto flex items-center justify-center overflow-hidden"
          style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
        >
          <div style={{ width: PAGE_WIDTH, height: STAGE_HEIGHT * SCALE }}>
            <Stage gate={false} fixedScale={SCALE} palette={pinnedPalette(slide)}>
              {slide.backdrop === 'hero' ? <HeroStill step={slide.steps - 1} /> : null}
              <SlideAt slide={slide} step={slide.steps - 1} mode="static" />
              <div className="absolute inset-x-0 bottom-0">
                <div className="flex items-baseline gap-10 px-[120px] pb-[34px] text-micro text-ink-faint">
                  <p className="shrink-0 text-ink-muted">{slide.name}</p>
                  <p className="flex-1 truncate text-center">{sourceLabels(slide.sources)}</p>
                  <p className="shrink-0 tabular-nums">{counter}</p>
                </div>
              </div>
            </Stage>
          </div>
        </div>
      ))}
    </main>
  )
}
