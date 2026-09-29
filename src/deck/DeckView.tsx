'use client'

import { useDeck } from './DeckProvider'
import { DeckChrome, DeckLiveRegion } from './DeckChrome'
import { Blackout, HelpOverlay, NotesOverlay } from './Overlays'
import { SlideRenderer } from './SlideRenderer'
import { Stage } from './Stage'

/** What the projector shows. */
export function DeckView() {
  const { position } = useDeck()

  return (
    <main className="h-screen w-screen">
      <Stage>
        <SlideRenderer position={position} />
        <DeckChrome />
      </Stage>
      <DeckLiveRegion />
      <NotesOverlay />
      <HelpOverlay />
      <Blackout />
    </main>
  )
}
