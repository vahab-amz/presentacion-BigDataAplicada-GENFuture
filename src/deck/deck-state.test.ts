import { describe, expect, it } from 'vitest'
import { APPENDIX, SLIDES } from '@/data/deck'
import {
  appendixOpenStep,
  formatHash,
  lastPosition,
  nextPosition,
  paletteFor,
  parseHash,
  prevPosition,
  progressRatio,
  stepAppendix,
  totalSteps,
} from './deck-state'

const bySlideId = (id: string) => {
  const slide = SLIDES.find((s) => s.id === id)
  if (!slide) throw new Error(id)
  return slide
}

describe('navigation', () => {
  it('walks every reveal of the five slides and stops at the end', () => {
    let position = { slide: 0, step: 0 }
    for (let i = 1; i < totalSteps(SLIDES); i += 1) position = nextPosition(position, SLIDES)
    expect(position).toEqual(lastPosition(SLIDES))
    expect(nextPosition(position, SLIDES)).toEqual(position)
  })

  it('steps back from step 0 onto the last state of the previous slide', () => {
    expect(prevPosition({ slide: 1, step: 0 }, SLIDES)).toEqual({
      slide: 0,
      step: bySlideId('company').steps - 1,
    })
  })

  it('round-trips the hash, 1-based', () => {
    expect(formatHash({ slide: 2, step: 3 })).toBe('#/3/3')
    expect(parseHash('#/3/3', SLIDES)).toEqual({ slide: 2, step: 3 })
    expect(parseHash('#/9/9', SLIDES)).toEqual(lastPosition(SLIDES))
  })

  it('fills the progress bar across the five slides only', () => {
    expect(progressRatio(lastPosition(SLIDES), SLIDES)).toBe(1)
    expect(totalSteps(SLIDES)).toBe(SLIDES.reduce((sum, s) => sum + s.steps, 0))
  })
})

describe('appendix', () => {
  it('opens fully revealed', () => {
    expect(appendixOpenStep(APPENDIX)).toBe(APPENDIX.steps - 1)
  })

  it('steps inside itself and never leaves', () => {
    expect(stepAppendix(appendixOpenStep(APPENDIX), 1, APPENDIX)).toBe(APPENDIX.steps - 1)
    expect(stepAppendix(1, -1, APPENDIX)).toBe(0)
    expect(stepAppendix(0, -1, APPENDIX)).toBe(0)
  })
})

describe('palettes', () => {
  it('follows the theme unless the slide pins a surface', () => {
    expect(paletteFor(bySlideId('budget'), 'dark')).toBe('dark')
    expect(paletteFor(bySlideId('budget'), 'light')).toBe('light')
    expect(paletteFor(bySlideId('why-cloud'), 'dark')).toBe('paper')
    expect(paletteFor(bySlideId('company'), 'light')).toBe('dark')
  })
})
