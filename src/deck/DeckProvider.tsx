'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { APPENDIX, SLIDES, type SlideMeta } from '@/data/deck'
import { useIsomorphicLayoutEffect } from '@/lib/use-isomorphic-layout-effect'
import {
  START,
  appendixOpenStep,
  clampPosition,
  formatHash,
  lastPosition,
  nextPosition,
  parseHash,
  prevPosition,
  progressRatio,
  paletteFor,
  samePosition,
  stepAppendix,
  stepsOf,
  type AppendixStep,
  type DeckPosition,
  type Palette,
  type Theme,
} from './deck-state'

export type { Theme } from './deck-state'

const CHANNEL_NAME = 'genfuture-deck'
const THEME_STORAGE_KEY = 'genfuture-deck-theme'

/** Shared across windows: what is projected. */
type SharedState = {
  position: DeckPosition
  /** Step inside the hidden appendix, or `null` while it is closed. */
  appendixStep: AppendixStep
  blackout: boolean
  theme: Theme
}

/** Local to this window: overlays the presenter opens for themselves. */
type LocalState = {
  notes: boolean
  help: boolean
  chrome: boolean
}

type ChannelMessage =
  | { kind: 'state'; from: string; state: SharedState }
  | { kind: 'hello'; from: string }

/** What is actually on screen: a numbered slide, or the appendix. */
export type DeckScreen = {
  meta: SlideMeta
  step: number
  isAppendix: boolean
}

export type DeckContextValue = {
  slides: readonly SlideMeta[]
  /** The numbered slide at `position`, even while the appendix covers it. */
  slide: SlideMeta
  position: DeckPosition
  screen: DeckScreen
  /** The palette the on-screen slide is drawn in. */
  palette: Palette
  appendixOpen: boolean
  stepCount: number
  progress: number
  /** True once the hash has been read; the stage is hidden until then. */
  ready: boolean
  theme: Theme
  blackout: boolean
  notesOpen: boolean
  helpOpen: boolean
  chromeVisible: boolean
  go: (position: DeckPosition) => void
  next: () => void
  prev: () => void
  goToSlide: (index: number) => void
  goHome: () => void
  goEnd: () => void
  toggleAppendix: () => void
  closeAppendix: () => void
  toggleBlackout: () => void
  toggleNotes: () => void
  toggleHelp: () => void
  closeOverlays: () => void
  toggleChrome: () => void
  toggleTheme: () => void
  toggleFullscreen: () => void
  openPresenter: () => void
}

const DeckContext = createContext<DeckContextValue | null>(null)

export function useDeck(): DeckContextValue {
  const value = useContext(DeckContext)
  if (!value) throw new Error('useDeck must be used inside <DeckProvider>')
  return value
}

function sameShared(a: SharedState, b: SharedState): boolean {
  return (
    samePosition(a.position, b.position) &&
    a.appendixStep === b.appendixStep &&
    a.blackout === b.blackout &&
    a.theme === b.theme
  )
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function DeckProvider({
  children,
  /** The presenter window mirrors the deck but never owns the URL hash. */
  syncHash = true,
}: {
  children: ReactNode
  syncHash?: boolean
}) {
  const slides = SLIDES
  const [shared, setShared] = useState<SharedState>({
    position: START,
    appendixStep: null,
    blackout: false,
    theme: 'dark',
  })
  const [local, setLocal] = useState<LocalState>({
    notes: false,
    help: false,
    chrome: true,
  })
  const [ready, setReady] = useState(false)

  const channelRef = useRef<BroadcastChannel | null>(null)
  /** Identifies this window on the channel; created in an effect, never render. */
  const windowId = useRef<string>('')
  /**
   * The last state this window put on, or took off, the channel.
   *
   * Comparing against it — rather than setting a "I am applying a remote
   * update" flag — is what makes the echo suppression correct: a remote update
   * that matches our state leaves `setShared` returning the previous object, so
   * a flag would never be cleared and the next real local change would be
   * silently swallowed.
   */
  const lastSynced = useRef<SharedState | null>(null)
  const sharedRef = useRef(shared)

  useEffect(() => {
    sharedRef.current = shared
  }, [shared])

  /* --- Boot: adopt the hash and the stored theme before the first paint --- */
  useIsomorphicLayoutEffect(() => {
    const fromHash = parseHash(window.location.hash, slides)
    const theme = readStoredTheme()
    setShared((prev) => ({ ...prev, position: fromHash ?? prev.position, theme }))
    applyTheme(theme)
    document.documentElement.dataset.deckReady = ''
    setReady(true)
  }, [slides])

  /* --- Hash follows the deck, and the deck follows the hash -------------- */
  useEffect(() => {
    if (!ready || !syncHash) return
    const hash = formatHash(shared.position)
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    }
  }, [ready, syncHash, shared.position])

  useEffect(() => {
    if (!syncHash) return
    const onHashChange = () => {
      const parsed = parseHash(window.location.hash, slides)
      if (!parsed) return
      setShared((prev) => (samePosition(prev.position, parsed) ? prev : { ...prev, position: parsed }))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [syncHash, slides])

  /* --- Cross-window sync -------------------------------------------------- */
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    if (windowId.current === '') {
      windowId.current = Math.random().toString(36).slice(2, 10)
    }
    const id = windowId.current
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
      const message = event.data
      if (!message || message.from === id) return
      if (message.kind === 'hello') {
        channel.postMessage({
          kind: 'state',
          from: id,
          state: sharedRef.current,
        } satisfies ChannelMessage)
        return
      }
      const remoteAppendix = message.state.appendixStep
      const nextState: SharedState = {
        ...message.state,
        position: clampPosition(message.state.position, slides),
        appendixStep:
          typeof remoteAppendix === 'number' ? stepAppendix(remoteAppendix, 0, APPENDIX) : null,
      }
      lastSynced.current = nextState
      setShared((prev) => (sameShared(prev, nextState) ? prev : nextState))
    }

    // Ask whoever is already open where we are.
    channel.postMessage({ kind: 'hello', from: id } satisfies ChannelMessage)

    return () => {
      channel.onmessage = null
      channel.close()
      channelRef.current = null
    }
  }, [slides])

  // Broadcast our state whenever it changes locally.
  useEffect(() => {
    if (!ready) return
    // The state we booted with is adopted silently: a window that has just
    // opened asks (`hello`) rather than tells.
    if (lastSynced.current === null) {
      lastSynced.current = shared
      return
    }
    if (sameShared(lastSynced.current, shared)) return
    lastSynced.current = shared
    channelRef.current?.postMessage({
      kind: 'state',
      from: windowId.current,
      state: shared,
    } satisfies ChannelMessage)
  }, [ready, shared])

  // Theme is a document-level attribute, so it has to be pushed out.
  useEffect(() => {
    if (!ready) return
    applyTheme(shared.theme)
  }, [ready, shared.theme])

  /* --- Actions ------------------------------------------------------------ */
  // Jumping anywhere in the numbered flow closes the appendix.
  const go = useCallback(
    (position: DeckPosition) => {
      setShared((prev) => {
        const target = clampPosition(position, slides)
        return samePosition(prev.position, target) && prev.appendixStep === null
          ? prev
          : { ...prev, position: target, appendixStep: null }
      })
    },
    [slides],
  )

  // Inside the appendix the arrows step through it and never leave it.
  const next = useCallback(
    () =>
      setShared((p) =>
        p.appendixStep !== null
          ? { ...p, appendixStep: stepAppendix(p.appendixStep, 1, APPENDIX) }
          : { ...p, position: nextPosition(p.position, slides) },
      ),
    [slides],
  )
  const prev = useCallback(
    () =>
      setShared((p) =>
        p.appendixStep !== null
          ? { ...p, appendixStep: stepAppendix(p.appendixStep, -1, APPENDIX) }
          : { ...p, position: prevPosition(p.position, slides) },
      ),
    [slides],
  )
  const goToSlide = useCallback((index: number) => go({ slide: index, step: 0 }), [go])
  const goHome = useCallback(() => go(START), [go])
  const goEnd = useCallback(() => go(lastPosition(slides)), [go, slides])

  const toggleAppendix = useCallback(
    () =>
      setShared((p) => ({
        ...p,
        appendixStep: p.appendixStep === null ? appendixOpenStep(APPENDIX) : null,
      })),
    [],
  )
  const closeAppendix = useCallback(
    () => setShared((p) => (p.appendixStep === null ? p : { ...p, appendixStep: null })),
    [],
  )

  const toggleBlackout = useCallback(
    () => setShared((p) => ({ ...p, blackout: !p.blackout })),
    [],
  )
  const toggleTheme = useCallback(
    () => setShared((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' })),
    [],
  )
  const toggleNotes = useCallback(
    () => setLocal((p) => ({ ...p, notes: !p.notes, help: false })),
    [],
  )
  const toggleHelp = useCallback(
    () => setLocal((p) => ({ ...p, help: !p.help, notes: false })),
    [],
  )
  const closeOverlays = useCallback(
    () => setLocal((p) => ({ ...p, notes: false, help: false })),
    [],
  )
  const toggleChrome = useCallback(() => setLocal((p) => ({ ...p, chrome: !p.chrome })), [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen().catch(() => {
        /* Browsers reject this outside a user gesture; ignore. */
      })
    }
  }, [])

  const openPresenter = useCallback(() => {
    const url = `${window.location.pathname}?view=presenter${formatHash(sharedRef.current.position)}`
    window.open(url, 'genfuture-presenter', 'width=1280,height=820,noopener=no')
  }, [])

  const slide = slides[shared.position.slide] ?? slides[0]!
  const appendixStep = shared.appendixStep

  const screen = useMemo<DeckScreen>(
    () =>
      appendixStep === null
        ? { meta: slide, step: shared.position.step, isAppendix: false }
        : { meta: APPENDIX, step: appendixStep, isAppendix: true },
    [appendixStep, slide, shared.position.step],
  )

  const value = useMemo<DeckContextValue>(
    () => ({
      slides,
      slide,
      position: shared.position,
      screen,
      palette: paletteFor(screen.meta, shared.theme),
      appendixOpen: appendixStep !== null,
      stepCount: stepsOf(slides, shared.position.slide),
      progress: progressRatio(shared.position, slides),
      ready,
      theme: shared.theme,
      blackout: shared.blackout,
      notesOpen: local.notes,
      helpOpen: local.help,
      chromeVisible: local.chrome,
      go,
      next,
      prev,
      goToSlide,
      goHome,
      goEnd,
      toggleAppendix,
      closeAppendix,
      toggleBlackout,
      toggleNotes,
      toggleHelp,
      closeOverlays,
      toggleChrome,
      toggleTheme,
      toggleFullscreen,
      openPresenter,
    }),
    [
      slides,
      slide,
      screen,
      appendixStep,
      shared.position,
      shared.theme,
      shared.blackout,
      local.notes,
      local.help,
      local.chrome,
      ready,
      go,
      next,
      prev,
      goToSlide,
      goHome,
      goEnd,
      toggleAppendix,
      closeAppendix,
      toggleBlackout,
      toggleNotes,
      toggleHelp,
      closeOverlays,
      toggleChrome,
      toggleTheme,
      toggleFullscreen,
      openPresenter,
    ],
  )

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>
}
