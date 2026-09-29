import { describe, expect, it } from 'vitest'
import {
  CATEGORIES,
  DEFAULT_INPUTS,
  DEFAULT_PARAMS,
  DEMAND_PROFILE,
  INPUT_RANGES,
  computeCostModel,
  demandAt,
  type ModelParams,
} from './cost-model'

const model = computeCostModel()

describe('demand profile', () => {
  it('has twelve months', () => {
    expect(DEMAND_PROFILE).toHaveLength(12)
  })

  it('has a mean of exactly 1.0', () => {
    const sum = DEMAND_PROFILE.reduce((a, b) => a + b, 0)
    // 12 multipliers summing to 12 means an average month is exactly 1.0x.
    expect(sum).toBeCloseTo(12, 10)
    expect(sum / DEMAND_PROFILE.length).toBeCloseTo(1, 12)
  })

  it('repeats every twelve months and handles negative indexes', () => {
    expect(demandAt(0)).toBe(DEMAND_PROFILE[0])
    expect(demandAt(12)).toBe(DEMAND_PROFILE[0])
    expect(demandAt(35)).toBe(DEMAND_PROFILE[11])
    expect(demandAt(-1)).toBe(DEMAND_PROFILE[11])
  })

  it('drives the model over the full horizon', () => {
    expect(model.demand).toHaveLength(36)
    expect(model.demand.slice(0, 12)).toEqual([...DEMAND_PROFILE])
    expect(model.demand.slice(12, 24)).toEqual([...DEMAND_PROFILE])
  })
})

describe('demand-derived series', () => {
  it('scales genomes and GPU hours by the profile', () => {
    const monthly = DEFAULT_INPUTS.genomesPerYear / 12
    expect(model.genomesByMonth[0]).toBeCloseTo(monthly * 0.45, 8)
    expect(model.gpuHoursByMonth[3]).toBeCloseTo(DEFAULT_INPUTS.avgGpuHoursPerMonth * 2.2, 8)
  })

  it('totals three years of genomes at the annual rate', () => {
    expect(model.totalGenomes).toBeCloseTo(DEFAULT_INPUTS.genomesPerYear * 3, 6)
  })
})

describe('on-premise server sizing', () => {
  const capacity = DEFAULT_PARAMS.onPrem.gpuHoursPerServerMonth

  it('uses 8 GPUs x 730 h = 5,840 GPU-hours per server per month', () => {
    expect(capacity).toBe(5840)
  })

  it('sizes for the peak month, not the average', () => {
    // Peak multiplier is 2.2, so 1,500 h/month average peaks at 3,300 h.
    expect(model.onPrem.peakGpuHours).toBeCloseTo(3300, 6)
    expect(model.onPrem.servers).toBe(1)
  })

  it('rounds up to whole servers', () => {
    const big = computeCostModel({ ...DEFAULT_INPUTS, avgGpuHoursPerMonth: 6000 })
    // 6,000 x 2.2 = 13,200 GPU-h peak -> ceil(13200 / 5840) = 3 servers.
    expect(big.onPrem.servers).toBe(3)
  })

  it('never buys fewer than one server', () => {
    const tiny = computeCostModel({ genomesPerYear: 1000, avgGpuHoursPerMonth: 1 })
    expect(tiny.onPrem.servers).toBe(1)
  })

  it('reports utilisation as mean usage over bought capacity', () => {
    const expected = DEFAULT_INPUTS.avgGpuHoursPerMonth / (model.onPrem.servers * capacity)
    expect(model.onPrem.gpuUtilisation).toBeCloseTo(expected, 8)
    // Peak sizing plus a spiky profile means most of the iron sits idle.
    expect(model.onPrem.gpuUtilisation).toBeLessThan(0.3)
  })
})

describe('cumulative series', () => {
  for (const option of ['onPrem', 'cloud'] as const) {
    it(`is monotonically non-decreasing for ${option}`, () => {
      const series = model[option].cumulative
      expect(series).toHaveLength(36)
      for (let m = 1; m < series.length; m += 1) {
        expect(series[m]!).toBeGreaterThanOrEqual(series[m - 1]!)
      }
    })

    it(`ends at the reported total for ${option}`, () => {
      expect(model[option].cumulative.at(-1)).toBeCloseTo(model[option].total, 6)
    })

    it(`splits the total across the four categories for ${option}`, () => {
      const byCategory = CATEGORIES.reduce(
        (acc, c) => acc + model[option].totalsByCategory[c],
        0,
      )
      expect(byCategory).toBeCloseTo(model[option].total, 6)
    })

    it(`reports month-0 cash as the first monthly total for ${option}`, () => {
      expect(model[option].month0Cash).toBeCloseTo(model[option].monthly[0]!.total, 8)
    })
  }

  it('shows the on-premise month-0 CAPEX spike and the storage steps', () => {
    const jumps = model.onPrem.monthly.map((m) => m.byCategory.Hardware)
    expect(jumps[0]!).toBeGreaterThan(0)
    expect(jumps[12]!).toBeGreaterThan(0)
    expect(jumps[24]!).toBeGreaterThan(0)
    expect(jumps[1]).toBe(0)
    expect(jumps[13]).toBe(0)
  })

  it('never books hardware for the cloud option', () => {
    expect(model.cloud.totalsByCategory.Hardware).toBe(0)
  })
})

describe('crossover detection', () => {
  it('finds no break-even inside 36 months with the default assumptions', () => {
    expect(model.crossoverMonth).toBeNull()
    expect(model.savings).toBeGreaterThan(0)
  })

  it('finds no break-even anywhere in the slider range', () => {
    const { genomesPerYear: g, avgGpuHoursPerMonth: h } = INPUT_RANGES
    for (const genomesPerYear of [g.min, DEFAULT_INPUTS.genomesPerYear, g.max]) {
      for (const avgGpuHoursPerMonth of [h.min, DEFAULT_INPUTS.avgGpuHoursPerMonth, h.max]) {
        const r = computeCostModel({ genomesPerYear, avgGpuHoursPerMonth })
        expect(r.crossoverMonth).toBeNull()
      }
    }
  })

  it('reports the first month the cloud catches up when the cloud is dearer', () => {
    // Make cloud GPU-hours absurdly expensive so it must cross on-premise.
    const dearCloud: ModelParams = {
      ...DEFAULT_PARAMS,
      cloud: { ...DEFAULT_PARAMS.cloud, gpuHourPrice: 60 },
    }
    const r = computeCostModel(DEFAULT_INPUTS, dearCloud)
    expect(r.crossoverMonth).not.toBeNull()
    const m = r.crossoverMonth!
    expect(r.cloud.cumulative[m]!).toBeGreaterThanOrEqual(r.onPrem.cumulative[m]!)
    if (m > 0) {
      expect(r.cloud.cumulative[m - 1]!).toBeLessThan(r.onPrem.cumulative[m - 1]!)
    }
  })

  it('reports month 0 when the cloud starts out more expensive', () => {
    const dearSetup: ModelParams = {
      ...DEFAULT_PARAMS,
      cloud: { ...DEFAULT_PARAMS.cloud, setup: 5_000_000 },
    }
    expect(computeCostModel(DEFAULT_INPUTS, dearSetup).crossoverMonth).toBe(0)
  })
})

describe('headline outputs', () => {
  it('keeps month-0 cash an order of magnitude apart', () => {
    expect(model.onPrem.month0Cash).toBeGreaterThan(700_000)
    expect(model.cloud.month0Cash).toBeLessThan(100_000)
  })

  it('derives cost per genome from the 36-month total', () => {
    expect(model.costPerGenome.cloud).toBeCloseTo(model.cloud.total / model.totalGenomes, 8)
    expect(model.costPerGenome.onPrem).toBeCloseTo(model.onPrem.total / model.totalGenomes, 8)
  })

  it('is pure: the same inputs give the same totals', () => {
    const a = computeCostModel({ genomesPerYear: 7500, avgGpuHoursPerMonth: 2200 })
    const b = computeCostModel({ genomesPerYear: 7500, avgGpuHoursPerMonth: 2200 })
    expect(a.cloud.total).toBe(b.cloud.total)
    expect(a.onPrem.total).toBe(b.onPrem.total)
  })

  it('grows both options monotonically with usage', () => {
    const low = computeCostModel({ genomesPerYear: 2000, avgGpuHoursPerMonth: 1000 })
    const high = computeCostModel({ genomesPerYear: 12000, avgGpuHoursPerMonth: 4000 })
    expect(high.cloud.total).toBeGreaterThan(low.cloud.total)
    expect(high.onPrem.total).toBeGreaterThan(low.onPrem.total)
  })
})
