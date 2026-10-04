/**
 * The team's budget (slide 3), exactly as it appears in the team document.
 *
 * There was no audit of the New York systems, so instead of one estimate the
 * budget is modelled as three volumes. Every monthly figure is a line value;
 * totals are always *derived* from the lines, never typed a second time, so an
 * edit to one line flows straight into the totals, the chart and the panel.
 *
 * All amounts in US dollars.
 */

/* -------------------------------------------------------------------------- */
/*  Scenarios                                                                  */
/* -------------------------------------------------------------------------- */

export type ScenarioId = 'conservador' | 'base' | 'expansion'

export type Scenario = {
  id: ScenarioId
  name: string
  /** Stored research data, in terabytes. */
  volumeTb: number
  /** How the volume is written on screen. */
  volumeLabel: string
}

export const SCENARIOS: readonly Scenario[] = [
  { id: 'conservador', name: 'Conservador', volumeTb: 300, volumeLabel: '300 TB' },
  { id: 'base', name: 'Base', volumeTb: 1_200, volumeLabel: '1,2 PB' },
  { id: 'expansion', name: 'Expansión', volumeTb: 3_000, volumeLabel: '3 PB' },
]

/** The scenario selected when the interactive step first appears. */
export const DEFAULT_SCENARIO: ScenarioId = 'base'

export type ScenarioValues = Readonly<Record<ScenarioId, number>>

export function scenarioById(id: ScenarioId): Scenario {
  const scenario = SCENARIOS.find((s) => s.id === id)
  if (!scenario) throw new Error(`Unknown scenario: ${id}`)
  return scenario
}

/* -------------------------------------------------------------------------- */
/*  Monthly lines (OPEX)                                                       */
/* -------------------------------------------------------------------------- */

export type BudgetLineId = 'cold' | 'hot' | 'databases' | 'compute' | 'personal'

type BudgetLineBase = {
  id: BudgetLineId
  label: string
  /** Secondary text, e.g. the share of the volume a storage tier holds. */
  detail?: string
}

/**
 * A line only counts once it is enabled, and an enabled line must carry a
 * value for every scenario — the type makes a half-filled line impossible.
 */
export type BudgetLine = BudgetLineBase &
  (
    | { enabled: true; values: ScenarioValues }
    | { enabled: false; values: ScenarioValues | null }
  )

export type ActiveBudgetLine = BudgetLineBase & { enabled: true; values: ScenarioValues }

/** In the order they are stacked on the chart, bottom to top. */
export const MONTHLY_LINES: readonly BudgetLine[] = [
  {
    id: 'cold',
    label: 'Histórico frío',
    detail: '80 % del volumen',
    enabled: true,
    values: { conservador: 720, base: 2_880, expansion: 7_200 },
  },
  {
    id: 'hot',
    label: 'I+D y terapias activas',
    detail: '20 % del volumen',
    enabled: true,
    values: { conservador: 1_200, base: 4_800, expansion: 12_000 },
  },
  {
    id: 'databases',
    label: 'Bases de datos estructuradas',
    enabled: true,
    values: { conservador: 500, base: 2_500, expansion: 6_250 },
  },
  {
    id: 'compute',
    label: 'Cómputo IA bajo demanda y seguridad',
    enabled: true,
    values: { conservador: 2_000, base: 5_800, expansion: 12_000 },
  },
  {
    // TODO(equipo): coste de personal por escenario, en $/mes. Cuando esté,
    // poned `enabled: true` y rellenad `values`: entra solo en los totales,
    // en la gráfica y en el panel de detalle.
    id: 'personal',
    label: 'Personal',
    enabled: false,
    values: null,
  },
]

/** Paid once, before the first month. Kept apart from the monthly OPEX. */
export const ONE_OFF = {
  label: 'Migración inicial (dispositivos físicos)',
  values: { conservador: 2_000, base: 5_000, expansion: 12_000 } satisfies ScenarioValues,
}

/* -------------------------------------------------------------------------- */
/*  Storage tiers and unit metrics                                             */
/* -------------------------------------------------------------------------- */

/**
 * The two storage tiers behind the "cold" and "hot" lines. 0,020 $/GB·mes is
 * 20 $/TB·mes and 0,003 $/GB·mes is 3 $/TB·mes; the unit tests check the two
 * lines above against these rates, so the table and the tiers cannot drift.
 */
export const STORAGE_TIERS = {
  hot: { share: 0.2, usdPerGbMonth: 0.02 },
  cold: { share: 0.8, usdPerGbMonth: 0.003 },
  /** Files unopened this long move automatically from hot to cold. */
  archiveAfterMonths: 6,
} as const

export const GB_PER_TB = 1_000

export const UNIT_METRICS = {
  /** Data + databases, per TB and month, in the base scenario (team figure). */
  perTbMonth: { value: 8.5, scenario: 'base' as ScenarioId },
  /** AI compute per processed sample; 0 $ in a month with no trials. */
  perSample: { min: 15, max: 30 },
} as const

/* -------------------------------------------------------------------------- */
/*  Derivations                                                                */
/* -------------------------------------------------------------------------- */

export function isActive(line: BudgetLine): line is ActiveBudgetLine {
  return line.enabled && line.values !== null
}

export function activeLines(lines: readonly BudgetLine[] = MONTHLY_LINES): ActiveBudgetLine[] {
  return lines.filter(isActive)
}

/** Total monthly OPEX for one scenario: the sum of every enabled line. */
export function monthlyTotal(
  scenario: ScenarioId,
  lines: readonly BudgetLine[] = MONTHLY_LINES,
): number {
  return activeLines(lines).reduce((sum, line) => sum + line.values[scenario], 0)
}

/** The largest monthly total across scenarios; the chart's scale. */
export function maxMonthlyTotal(lines: readonly BudgetLine[] = MONTHLY_LINES): number {
  return SCENARIOS.reduce((max, s) => Math.max(max, monthlyTotal(s.id, lines)), 0)
}

/** Monthly cost of one storage tier for a volume, from its share and rate. */
export function tierMonthlyCost(tier: 'hot' | 'cold', volumeTb: number): number {
  const { share, usdPerGbMonth } = STORAGE_TIERS[tier]
  return share * volumeTb * GB_PER_TB * usdPerGbMonth
}

/** How much an unopened file saves when it moves to the cold tier: 0.85. */
export function archiveSaving(): number {
  return 1 - STORAGE_TIERS.cold.usdPerGbMonth / STORAGE_TIERS.hot.usdPerGbMonth
}

/** Data and database lines divided by the stored volume, in $/TB·mes. */
export function dataCostPerTbMonth(
  scenario: ScenarioId,
  lines: readonly BudgetLine[] = MONTHLY_LINES,
): number {
  const dataIds: readonly BudgetLineId[] = ['cold', 'hot', 'databases']
  const data = activeLines(lines)
    .filter((line) => dataIds.includes(line.id))
    .reduce((sum, line) => sum + line.values[scenario], 0)
  return data / scenarioById(scenario).volumeTb
}
