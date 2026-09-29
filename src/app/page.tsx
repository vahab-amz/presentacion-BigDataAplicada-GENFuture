'use client'

import { useState } from 'react'
import { DeckProvider } from '@/deck/DeckProvider'
import { DeckView } from '@/deck/DeckView'
import { PresenterView } from '@/deck/PresenterView'
import { useDeckKeys } from '@/deck/useDeckKeys'
import { useIsomorphicLayoutEffect } from '@/lib/use-isomorphic-layout-effect'

export default function DeckPage() {
  return (
    <DeckProvider>
      <DeckRoot />
    </DeckProvider>
  )
}

/**
 * One route, two views. `?view=presenter` is read from `window.location`
 * rather than `useSearchParams` so the static export does not need a Suspense
 * boundary for a value that only matters in the browser.
 */
function DeckRoot() {
  const [isPresenter, setIsPresenter] = useState(false)
  useDeckKeys()

  useIsomorphicLayoutEffect(() => {
    const view = new URLSearchParams(window.location.search).get('view')
    setIsPresenter(view === 'presenter')
  }, [])

  return isPresenter ? <PresenterView /> : <DeckView />
}
