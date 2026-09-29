'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

/**
 * `live` is the projected stage: reveals animate between steps.
 * `static` is the print route and the presenter's next-step preview: the same
 * components, same layout, but every transition collapses to zero duration.
 */
export type SlideRenderMode = 'live' | 'static'

export type SlideStepValue = {
  step: number
  mode: SlideRenderMode
}

const SlideStepContext = createContext<SlideStepValue>({ step: 0, mode: 'static' })

export function useSlideStep(): SlideStepValue {
  return useContext(SlideStepContext)
}

export function SlideStepProvider({
  step,
  mode,
  children,
}: SlideStepValue & { children: ReactNode }) {
  const value = useMemo(() => ({ step, mode }), [step, mode])
  return <SlideStepContext.Provider value={value}>{children}</SlideStepContext.Provider>
}
