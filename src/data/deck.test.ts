import { describe, expect, it } from 'vitest'
import { APPENDIX, SLIDES, SLIDE_CLOUD, SLIDE_COUNT } from './deck'
import { SOURCES } from './sources'

describe('deck manifest', () => {
  it('runs the five slides in the agreed order', () => {
    expect(SLIDES.map((s) => s.id)).toEqual(['company', 'cloud', 'budget', 'hybrid', 'why-cloud'])
    expect(SLIDE_COUNT).toBe(5)
  })

  it('declares the agreed number of states per slide', () => {
    expect(SLIDES.map((s) => s.steps)).toEqual([5, 7, 5, 5, 4])
  })

  it('pins the cover video to slide 1 and the light surface to slide 5', () => {
    expect(SLIDES.filter((s) => s.backdrop === 'hero').map((s) => s.id)).toEqual(['company'])
    expect(SLIDES.find((s) => s.id === 'why-cloud')?.surface).toBe('light')
  })

  it('has one verbatim note per step on slide 2', () => {
    const cloud = SLIDES.find((s) => s.id === 'cloud')
    expect(cloud?.notes.byStep).toBe(SLIDE_CLOUD.notesByStep)
    expect(SLIDE_CLOUD.notesByStep).toHaveLength(cloud?.steps ?? 0)
  })

  it('gives every other slide short bullet notes', () => {
    for (const slide of SLIDES.filter((s) => s.id !== 'cloud')) {
      expect(slide.notes.bullets?.length ?? 0, slide.id).toBeGreaterThan(0)
    }
  })

  it('keeps the appendix out of the numbered flow', () => {
    expect(SLIDES.some((s) => s.id === APPENDIX.id)).toBe(false)
    expect(APPENDIX.steps).toBeGreaterThan(0)
  })

  it('only cites sources that exist', () => {
    for (const slide of [...SLIDES, APPENDIX]) {
      for (const id of slide.sources) expect(SOURCES[id], `${slide.id} → ${id}`).toBeDefined()
    }
  })
})
