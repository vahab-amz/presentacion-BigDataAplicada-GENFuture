import type { SlideMeta } from '@/data/deck'

/**
 * Where the deck is. `slide` is 0-based internally; the URL hash and the
 * on-screen counter are 1-based. `step` 0 is the slide's initial state.
 *
 * Everything here is pure. A position fully determines what is on screen, so
 * jumping to any slide or step renders the right thing immediately and moving
 * backwards is just another position, not a rewind.
 */
export type DeckPosition = {
  slide: number
  step: number
}

export const START: DeckPosition = { slide: 0, step: 0 }

/* -------------------------------------------------------------------------- */
/*  Colour: the T theme, and the palette a slide is actually drawn in          */
/* -------------------------------------------------------------------------- */

export type Theme = 'dark' | 'light'

/** `paper` is the cool white of slide 5; see globals.css. */
export type Palette = 'dark' | 'light' | 'paper'

/** The palette a slide pins regardless of the theme, if any. */
export function pinnedPalette(slide: SlideMeta): Palette | undefined {
  if (slide.surface === 'light') return 'paper'
  if (slide.surface === 'dark') return 'dark'
  return undefined
}

export function paletteFor(slide: SlideMeta, theme: Theme): Palette {
  return pinnedPalette(slide) ?? theme
}

/* -------------------------------------------------------------------------- */
/*  The hidden appendix                                                        */
/*                                                                             */
/*  It sits outside the numbered flow: opening it never touches the position,  */
/*  so closing it returns exactly where the talk was. `null` means closed.     */
/* -------------------------------------------------------------------------- */

export type AppendixStep = number | null

/** The appendix is a backup for questions, so it opens fully revealed. */
export function appendixOpenStep(appendix: SlideMeta): number {
  return Math.max(0, appendix.steps - 1)
}

/** Moves inside the appendix without ever leaving it. */
export function stepAppendix(step: number, delta: number, appendix: SlideMeta): number {
  return Math.min(Math.max(0, step + delta), Math.max(0, appendix.steps - 1))
}

export function stepsOf(slides: readonly SlideMeta[], slide: number): number {
  return slides[slide]?.steps ?? 1
}

export function clampPosition(
  position: DeckPosition,
  slides: readonly SlideMeta[],
): DeckPosition {
  if (slides.length === 0) return START
  const slide = Math.min(Math.max(0, Math.trunc(position.slide)), slides.length - 1)
  const step = Math.min(Math.max(0, Math.trunc(position.step)), stepsOf(slides, slide) - 1)
  return { slide, step }
}

export function samePosition(a: DeckPosition, b: DeckPosition): boolean {
  return a.slide === b.slide && a.step === b.step
}

/** Next reveal; at the end of a slide, the first state of the next one. */
export function nextPosition(
  position: DeckPosition,
  slides: readonly SlideMeta[],
): DeckPosition {
  const { slide, step } = clampPosition(position, slides)
  if (step < stepsOf(slides, slide) - 1) return { slide, step: step + 1 }
  if (slide < slides.length - 1) return { slide: slide + 1, step: 0 }
  return { slide, step }
}

/** Previous reveal; before step 0, the *last* state of the previous slide. */
export function prevPosition(
  position: DeckPosition,
  slides: readonly SlideMeta[],
): DeckPosition {
  const { slide, step } = clampPosition(position, slides)
  if (step > 0) return { slide, step: step - 1 }
  if (slide > 0) return { slide: slide - 1, step: stepsOf(slides, slide - 1) - 1 }
  return { slide, step }
}

export function lastPosition(slides: readonly SlideMeta[]): DeckPosition {
  const slide = Math.max(0, slides.length - 1)
  return { slide, step: stepsOf(slides, slide) - 1 }
}

/** Total number of reveal states in the whole deck, used by the progress bar. */
export function totalSteps(slides: readonly SlideMeta[]): number {
  return slides.reduce((acc, s) => acc + s.steps, 0)
}

/** How many reveals precede this position, counting from the start of the deck. */
export function globalStepIndex(
  position: DeckPosition,
  slides: readonly SlideMeta[],
): number {
  const { slide, step } = clampPosition(position, slides)
  let index = 0
  for (let i = 0; i < slide; i += 1) index += stepsOf(slides, i)
  return index + step
}

export function progressRatio(
  position: DeckPosition,
  slides: readonly SlideMeta[],
): number {
  const total = totalSteps(slides)
  if (total <= 0) return 0
  return (globalStepIndex(position, slides) + 1) / total
}

/* -------------------------------------------------------------------------- */
/*  URL hash: #/<slide>/<step>, 1-based slide                                  */
/* -------------------------------------------------------------------------- */

export function formatHash(position: DeckPosition): string {
  return `#/${position.slide + 1}/${position.step}`
}

export function parseHash(
  hash: string,
  slides: readonly SlideMeta[],
): DeckPosition | null {
  const match = /^#\/(\d+)(?:\/(\d+))?$/.exec(hash.trim())
  if (!match) return null
  const slide = Number(match[1]) - 1
  const step = match[2] === undefined ? 0 : Number(match[2])
  if (!Number.isFinite(slide) || !Number.isFinite(step)) return null
  return clampPosition({ slide, step }, slides)
}
