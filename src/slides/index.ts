import type { ComponentType } from 'react'
import { Slide01Race } from './Slide01Race'
import { Slide02Company } from './Slide02Company'
import { Slide03Cloud } from './Slide03Cloud'
import { Slide04Budget } from './Slide04Budget'
import { Slide05Risks } from './Slide05Risks'

/** Keyed by `SlideMeta.id` in src/data/deck.ts. */
export const SLIDE_COMPONENTS: Record<string, ComponentType> = {
  race: Slide01Race,
  company: Slide02Company,
  cloud: Slide03Cloud,
  budget: Slide04Budget,
  risks: Slide05Risks,
}
