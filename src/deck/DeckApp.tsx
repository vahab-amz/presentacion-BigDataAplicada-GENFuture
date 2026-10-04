'use client'

import { useState } from 'react'
import { useIsomorphicLayoutEffect } from '@/lib/use-isomorphic-layout-effect'
import { DeckProvider } from './DeckProvider'
import { DeckView } from './DeckView'
import type { HeroSource } from './HeroLayer'
import { PresenterView } from './PresenterView'
import { useDeckKeys } from './useDeckKeys'

export function DeckApp({ heroSources }: { heroSources: readonly HeroSource[] }) {
  return (
    <DeckProvider>
      <DeckRoot heroSources={heroSources} />
    </DeckProvider>
  )
}

/**
 * One route, two views. `?view=presenter` is read from `window.location`
 * rather than `useSearchParams` so the static export does not need a Suspense
 * boundary for a value that only matters in the browser.
 */
function DeckRoot({ heroSources }: { heroSources: readonly HeroSource[] }) {
  const [isPresenter, setIsPresenter] = useState(false)
  useDeckKeys()

  useIsomorphicLayoutEffect(() => {
    const view = new URLSearchParams(window.location.search).get('view')
    setIsPresenter(view === 'presenter')
  }, [])

  return isPresenter ? <PresenterView /> : <DeckView heroSources={heroSources} />
}
