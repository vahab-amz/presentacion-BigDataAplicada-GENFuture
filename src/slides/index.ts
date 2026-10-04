import type { ComponentType } from 'react'
import type { SlideId } from '@/data/deck'
import { AppendixRisks } from './AppendixRisks'
import { Slide1Company } from './Slide1Company'
import { Slide2Cloud } from './Slide2Cloud'
import { Slide3Budget } from './Slide3Budget'
import { Slide4Hybrid } from './Slide4Hybrid'
import { Slide5WhyCloud } from './Slide5WhyCloud'

/** Keyed by `SlideMeta.id` in src/data/deck.ts; the type makes a missing slide a compile error. */
export const SLIDE_COMPONENTS: Record<SlideId, ComponentType> = {
  company: Slide1Company,
  cloud: Slide2Cloud,
  budget: Slide3Budget,
  hybrid: Slide4Hybrid,
  'why-cloud': Slide5WhyCloud,
  risks: AppendixRisks,
}
