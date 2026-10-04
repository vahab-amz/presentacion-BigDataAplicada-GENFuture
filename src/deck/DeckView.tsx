'use client'

import { useDeck } from './DeckProvider'
import { DeckChrome, DeckLiveRegion } from './DeckChrome'
import { HeroLayer, type HeroSource } from './HeroLayer'
import { Blackout, HelpOverlay, NotesOverlay } from './Overlays'
import { SlideRenderer } from './SlideRenderer'
import { Stage } from './Stage'
import { paletteFor } from './deck-state'

/**
 * What the projector shows. The cover video lives here, at viewport level and
 * behind the stage, so it can run edge to edge; on that slide the stage and
 * its letterbox go transparent.
 */
export function DeckView({ heroSources }: { heroSources: readonly HeroSource[] }) {
  const { screen, palette, theme, ready, slides } = useDeck()
  const heroVisible = ready && screen.meta.backdrop === 'hero'
  const heroSlide = slides.find((slide) => slide.backdrop === 'hero')

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {heroSlide ? (
        <HeroLayer
          sources={heroSources}
          visible={heroVisible}
          ready={ready}
          // Off its slide the layer keeps the dimmed scrim, so it never
          // brightens while it fades out.
          step={heroVisible ? screen.step : 1}
          palette={paletteFor(heroSlide, theme)}
        />
      ) : null}
      <Stage palette={palette} transparent={heroVisible}>
        <SlideRenderer />
        <DeckChrome />
      </Stage>
      <DeckLiveRegion />
      <NotesOverlay />
      <HelpOverlay />
      <Blackout />
    </main>
  )
}
