import { describe, expect, it } from 'vitest'
import {
  MONTHLY_LINES,
  ONE_OFF,
  SCENARIOS,
  STORAGE_TIERS,
  UNIT_METRICS,
  activeLines,
  archiveSaving,
  dataCostPerTbMonth,
  maxMonthlyTotal,
  monthlyTotal,
  scenarioById,
  tierMonthlyCost,
  type BudgetLine,
  type ScenarioId,
} from './budget-scenarios'

const lineValues = (id: BudgetLine['id']) => {
  const line = MONTHLY_LINES.find((l) => l.id === id)
  if (!line?.values) throw new Error(`line ${id} has no values`)
  return line.values
}

describe('scenarios', () => {
  it('are the three volumes of the team document, in order', () => {
    expect(SCENARIOS.map((s) => [s.name, s.volumeTb])).toEqual([
      ['Conservador', 300],
      ['Base', 1_200],
      ['Expansión', 3_000],
    ])
  })
})

describe('monthly totals', () => {
  it('equal 4.420 / 15.980 / 37.450 $ per month', () => {
    expect(monthlyTotal('conservador')).toBe(4_420)
    expect(monthlyTotal('base')).toBe(15_980)
    expect(monthlyTotal('expansion')).toBe(37_450)
  })

  it('are derived from the lines, so editing a line moves the total', () => {
    const edited = MONTHLY_LINES.map((line) =>
      line.id === 'databases' && line.enabled
        ? { ...line, values: { ...line.values, base: line.values.base + 100 } }
        : line,
    )
    expect(monthlyTotal('base', edited)).toBe(16_080)
    expect(monthlyTotal('conservador', edited)).toBe(4_420)
  })

  it('scale the chart to the largest scenario', () => {
    expect(maxMonthlyTotal()).toBe(37_450)
  })

  it('keep the one-off migration out of the monthly OPEX', () => {
    expect(ONE_OFF.values).toEqual({ conservador: 2_000, base: 5_000, expansion: 12_000 })
    expect(monthlyTotal('base')).toBe(15_980)
  })
})

describe('storage tiers', () => {
  it.each(SCENARIOS.map((s) => [s.id, s.volumeTb] as const))(
    '%s: cold line = 80 %% × volume × 3 $/TB and hot line = 20 %% × volume × 20 $/TB',
    (id, volumeTb) => {
      expect(lineValues('cold')[id]).toBeCloseTo(0.8 * volumeTb * 3, 9)
      expect(lineValues('hot')[id]).toBeCloseTo(0.2 * volumeTb * 20, 9)
      // …and the same numbers fall out of the tier rates the slide quotes.
      expect(tierMonthlyCost('cold', volumeTb)).toBeCloseTo(lineValues('cold')[id], 9)
      expect(tierMonthlyCost('hot', volumeTb)).toBeCloseTo(lineValues('hot')[id], 9)
    },
  )

  it('shares add up to the whole volume', () => {
    expect(STORAGE_TIERS.hot.share + STORAGE_TIERS.cold.share).toBeCloseTo(1, 12)
  })
})

describe('unit metrics', () => {
  it('archiving an unopened file saves 1 − 0,003 / 0,020 = 85 %', () => {
    expect(archiveSaving()).toBeCloseTo(1 - 0.003 / 0.02, 12)
    expect(Math.round(archiveSaving() * 100)).toBe(85)
  })

  it('~8,50 $ per TB and month matches data + databases in the base scenario', () => {
    const derived = dataCostPerTbMonth(UNIT_METRICS.perTbMonth.scenario)
    // (2.880 + 4.800 + 2.500) / 1.200 TB = 8,48 $: the team rounds it to ~8,50.
    expect(derived).toBeCloseTo(10_180 / 1_200, 9)
    expect(Math.abs(derived - UNIT_METRICS.perTbMonth.value)).toBeLessThan(0.05)
  })

  it('compute per sample is a range with a floor above zero', () => {
    expect(UNIT_METRICS.perSample.min).toBeLessThan(UNIT_METRICS.perSample.max)
    expect(UNIT_METRICS.perSample.min).toBeGreaterThan(0)
  })
})

describe('the optional personnel line', () => {
  it('ships disabled and empty, so it changes nothing', () => {
    const personal = MONTHLY_LINES.find((l) => l.id === 'personal')
    expect(personal?.enabled).toBe(false)
    expect(personal?.values).toBeNull()
    expect(activeLines().map((l) => l.id)).toEqual(['cold', 'hot', 'databases', 'compute'])
  })

  it('flows into every total once enabled', () => {
    const withPersonal: BudgetLine[] = MONTHLY_LINES.map((line) =>
      line.id === 'personal'
        ? { ...line, enabled: true, values: { conservador: 1_000, base: 2_000, expansion: 3_000 } }
        : line,
    )
    const expected: Record<ScenarioId, number> = {
      conservador: 5_420,
      base: 17_980,
      expansion: 40_450,
    }
    for (const s of SCENARIOS) expect(monthlyTotal(s.id, withPersonal)).toBe(expected[s.id])
    expect(activeLines(withPersonal).at(-1)?.id).toBe('personal')
    expect(maxMonthlyTotal(withPersonal)).toBe(40_450)
    // Personnel is not data: the per-TB metric ignores it.
    expect(dataCostPerTbMonth('base', withPersonal)).toBeCloseTo(dataCostPerTbMonth('base'), 12)
  })
})

describe('lookup', () => {
  it('finds a scenario by id and rejects unknown ones', () => {
    expect(scenarioById('base').volumeLabel).toBe('1,2 PB')
    expect(() => scenarioById('nope' as ScenarioId)).toThrow()
  })
})
