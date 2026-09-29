'use client'

import { useEffect } from 'react'
import { SLIDES } from '@/data/deck'
import { SlideAt } from '@/deck/SlideRenderer'
import { STAGE_HEIGHT, STAGE_WIDTH, Stage } from '@/deck/Stage'

/**
 * PDF backup: every slide at its final step, one per landscape A4 page.
 *
 * A4 landscape at 96 dpi is 1123 x 794 CSS pixels, so the stage is scaled to
 * the page width and centred. Everything renders in static mode, which means
 * no animation is mid-flight when the browser snapshots the page.
 */
const PAGE_WIDTH = 1123
const PAGE_HEIGHT = 794
const SCALE = PAGE_WIDTH / STAGE_WIDTH

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
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className="print-page relative mx-auto flex items-center justify-center overflow-hidden"
          style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
        >
          <div style={{ width: PAGE_WIDTH, height: STAGE_HEIGHT * SCALE }}>
            <Stage gate={false} fixedScale={SCALE}>
              <SlideAt
                position={{ slide: index, step: slide.steps - 1 }}
                mode="static"
              />
              <div className="absolute inset-x-0 bottom-0">
                <div className="flex items-baseline gap-10 px-[120px] pb-[34px] text-micro text-ink-faint">
                  <p className="shrink-0">
                    <span className="tracking-[0.16em] uppercase">Presenta</span>{' '}
                    <span className="text-ink-muted">{slide.presenter}</span>
                  </p>
                  <p className="flex-1 truncate text-center">{slide.name}</p>
                  <p className="shrink-0 tabular-nums">
                    {index + 1} / {SLIDES.length}
                  </p>
                </div>
              </div>
            </Stage>
          </div>
        </div>
      ))}
    </main>
  )
}
