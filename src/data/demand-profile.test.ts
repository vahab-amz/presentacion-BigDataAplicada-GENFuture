import { describe, expect, it } from 'vitest'
import { DEMAND_PROFILE, MONTH_LABELS, demandAt } from './demand-profile'

describe('demand profile', () => {
  it('has twelve months, one label each', () => {
    expect(DEMAND_PROFILE).toHaveLength(12)
    expect(MONTH_LABELS).toHaveLength(12)
  })

  it('has a mean of exactly 1.0', () => {
    const sum = DEMAND_PROFILE.reduce((a, b) => a + b, 0)
    // 12 multipliers summing to 12 means an average month is exactly 1.0x.
    expect(sum).toBeCloseTo(12, 10)
  })

  it('has peaks and valleys, not a flat line', () => {
    expect(Math.max(...DEMAND_PROFILE)).toBeGreaterThan(2)
    expect(Math.min(...DEMAND_PROFILE)).toBeLessThan(0.5)
  })

  it('repeats every twelve months and handles negative indexes', () => {
    expect(demandAt(0)).toBe(DEMAND_PROFILE[0])
    expect(demandAt(12)).toBe(DEMAND_PROFILE[0])
    expect(demandAt(35)).toBe(DEMAND_PROFILE[11])
    expect(demandAt(-1)).toBe(DEMAND_PROFILE[11])
  })
})
