import type { SourceId } from './sources'

/* -------------------------------------------------------------------------- */
/*  Provenance                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every figure in the model carries its origin: either a published `source`
 * or an explicit `illustrative` flag. Components render a small "Ilustrativo"
 * tag whenever the latter is true, so nothing on screen looks more precise
 * than it really is.
 */
export type Assumption = {
  value: number
  /** Spanish label used in the assumptions table and in tooltips. */
  label: string
  unit: string
  note?: string
} & ({ source: SourceId; illustrative?: false } | { illustrative: true; source?: never })

export type Category = 'Hardware' | 'Software' | 'Personal' | 'Otros'

export const CATEGORIES: readonly Category[] = ['Hardware', 'Software', 'Personal', 'Otros']

/* -------------------------------------------------------------------------- */
/*  Shared demand profile                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Twelve monthly multipliers with a mean of exactly 1.0 (they sum to 12).
 * R&D works in projects: two big sequencing campaigns a year, quiet valleys
 * in between. Slides 2, 3 and 4 all read this same array so the story stays
 * consistent across the deck.
 */
export const DEMAND_PROFILE: readonly number[] = [
  0.45, 0.55, 1.75, 2.2, 0.7, 0.45, 0.5, 1.6, 2.0, 0.8, 0.45, 0.55,
]

export const MONTH_LABELS: readonly string[] = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

/* -------------------------------------------------------------------------- */
/*  Assumptions                                                                */
/* -------------------------------------------------------------------------- */

export const ASSUMPTIONS = {
  horizonMonths: {
    value: 36,
    label: 'Horizonte de análisis',
    unit: 'meses',
    illustrative: true,
  },
  gbPerGenome: {
    value: 120,
    label: 'Datos por genoma',
    unit: 'GB',
    illustrative: true,
  },
  fteCostPerMonth: {
    value: 14_000,
    label: 'Coste cargado por persona (FTE)',
    unit: '$/mes',
    illustrative: true,
  },

  /* --- On-premise ------------------------------------------------------- */
  gpusPerServer: {
    value: 8,
    label: 'GPUs por servidor',
    unit: 'GPUs',
    illustrative: true,
  },
  gpuHoursPerGpuPerMonth: {
    value: 730,
    label: 'Horas de GPU disponibles al mes',
    unit: 'h/GPU',
    illustrative: true,
  },
  serverCost: {
    value: 400_000,
    label: 'Servidor de 8 GPUs',
    unit: '$',
    source: 'intuitionLabs',
    note: 'Rango de mercado: 300.000–500.000+ $.',
  },
  storageCostPerTb: {
    value: 300,
    label: 'Almacenamiento propio',
    unit: '$/TB útil',
    illustrative: true,
  },
  datacenterSetup: {
    value: 150_000,
    label: 'Adecuación de CPD / colocation',
    unit: '$ una vez',
    illustrative: true,
  },
  powerCoolingPerServerMonth: {
    value: 2_500,
    label: 'Electricidad y refrigeración',
    unit: '$/servidor y mes',
    illustrative: true,
  },
  maintenanceRateAnnual: {
    value: 0.1,
    label: 'Mantenimiento sobre CAPEX acumulado',
    unit: 'anual',
    illustrative: true,
  },
  onPremStaffFte: {
    value: 2,
    label: 'Personal de infraestructura on-premise',
    unit: 'FTE',
    illustrative: true,
  },
  onPremSoftwareMonthly: {
    value: 5_000,
    label: 'Licencias de software on-premise',
    unit: '$/mes',
    illustrative: true,
  },

  /* --- Cloud (AWS) ------------------------------------------------------ */
  cloudSetup: {
    value: 30_000,
    label: 'Puesta en marcha, migración y formación',
    unit: '$ una vez',
    illustrative: true,
  },
  healthOmicsPerGenome: {
    value: 20,
    label: 'Cómputo genómico (AWS HealthOmics)',
    unit: '$/genoma',
    illustrative: true,
    note: 'Verificar en la página de precios de AWS HealthOmics antes de presentar.',
  },
  s3StandardPerTbMonth: {
    value: 22,
    label: 'Almacenamiento caliente (S3 Standard)',
    unit: '$/TB y mes',
    illustrative: true,
    note: 'Precio de lista aproximado; verificar.',
  },
  glacierPerTbMonth: {
    value: 1,
    label: 'Archivo (S3 Glacier Deep Archive)',
    unit: '$/TB y mes',
    illustrative: true,
    note: 'Precio de lista aproximado; verificar.',
  },
  hotStorageMonths: {
    value: 3,
    label: 'Antigüedad de los datos en almacenamiento caliente',
    unit: 'meses',
    illustrative: true,
  },
  gpuHourPrice: {
    value: 6.88,
    label: 'GPU bajo demanda (AWS p5)',
    unit: '$/GPU-hora',
    source: 'spheron',
    note: 'Tras la bajada de junio de 2025. Cast AI publica 12,29 $/h: supuesto editable.',
  },
  cloudStaffFte: {
    value: 1.5,
    label: 'Personal de plataforma cloud',
    unit: 'FTE',
    illustrative: true,
  },
  cloudSupportRate: {
    value: 0.07,
    label: 'Soporte AWS sobre consumo mensual',
    unit: 'del consumo',
    illustrative: true,
  },
} as const satisfies Record<string, Assumption>

export type AssumptionId = keyof typeof ASSUMPTIONS

/* -------------------------------------------------------------------------- */
/*  Inputs                                                                     */
/* -------------------------------------------------------------------------- */

export type CostInputs = {
  genomesPerYear: number
  avgGpuHoursPerMonth: number
}

export const DEFAULT_INPUTS: CostInputs = {
  genomesPerYear: 5_000,
  avgGpuHoursPerMonth: 1_500,
}

export const INPUT_RANGES = {
  genomesPerYear: {
    min: 1_000,
    max: 20_000,
    step: 250,
    label: 'Genomas al año',
    unit: 'genomas/año',
  },
  avgGpuHoursPerMonth: {
    min: 500,
    max: 6_000,
    step: 100,
    label: 'Horas de GPU al mes (media)',
    unit: 'h/mes',
  },
} as const

/* -------------------------------------------------------------------------- */
/*  Params: the plain numbers the maths uses                                   */
/* -------------------------------------------------------------------------- */

export type ModelParams = {
  horizonMonths: number
  demandProfile: readonly number[]
  gbPerGenome: number
  fteCostPerMonth: number
  onPrem: {
    gpuHoursPerServerMonth: number
    serverCost: number
    storageCostPerTb: number
    datacenterSetup: number
    powerCoolingPerServerMonth: number
    maintenanceRateAnnual: number
    staffFte: number
    softwareMonthly: number
  }
  cloud: {
    setup: number
    perGenome: number
    hotPerTbMonth: number
    coldPerTbMonth: number
    hotMonths: number
    gpuHourPrice: number
    staffFte: number
    supportRate: number
  }
}

const A = ASSUMPTIONS

export const DEFAULT_PARAMS: ModelParams = {
  horizonMonths: A.horizonMonths.value,
  demandProfile: DEMAND_PROFILE,
  gbPerGenome: A.gbPerGenome.value,
  fteCostPerMonth: A.fteCostPerMonth.value,
  onPrem: {
    gpuHoursPerServerMonth: A.gpusPerServer.value * A.gpuHoursPerGpuPerMonth.value,
    serverCost: A.serverCost.value,
    storageCostPerTb: A.storageCostPerTb.value,
    datacenterSetup: A.datacenterSetup.value,
    powerCoolingPerServerMonth: A.powerCoolingPerServerMonth.value,
    maintenanceRateAnnual: A.maintenanceRateAnnual.value,
    staffFte: A.onPremStaffFte.value,
    softwareMonthly: A.onPremSoftwareMonthly.value,
  },
  cloud: {
    setup: A.cloudSetup.value,
    perGenome: A.healthOmicsPerGenome.value,
    hotPerTbMonth: A.s3StandardPerTbMonth.value,
    coldPerTbMonth: A.glacierPerTbMonth.value,
    hotMonths: A.hotStorageMonths.value,
    gpuHourPrice: A.gpuHourPrice.value,
    staffFte: A.cloudStaffFte.value,
    supportRate: A.cloudSupportRate.value,
  },
}

/* -------------------------------------------------------------------------- */
/*  Result types                                                               */
/* -------------------------------------------------------------------------- */

export type MonthCost = {
  month: number
  byCategory: Record<Category, number>
  total: number
}

export type OptionSeries = {
  monthly: MonthCost[]
  /** cumulative[m] = sum of monthly totals up to and including month m. */
  cumulative: number[]
  totalsByCategory: Record<Category, number>
  total: number
  /** Cash that leaves the company in month 0. */
  month0Cash: number
}

export type OnPremSeries = OptionSeries & {
  servers: number
  peakGpuHours: number
  /** Mean GPU hours used divided by GPU hours bought, over the whole horizon. */
  gpuUtilisation: number
}

export type CostModelResult = {
  inputs: CostInputs
  params: ModelParams
  months: number
  demand: number[]
  genomesByMonth: number[]
  gpuHoursByMonth: number[]
  totalGenomes: number
  onPrem: OnPremSeries
  cloud: OptionSeries
  costPerGenome: { onPrem: number; cloud: number }
  /** First month where cumulative cloud is greater than or equal to on-premise. */
  crossoverMonth: number | null
  /** On-premise total minus cloud total: positive means the cloud is cheaper. */
  savings: number
}

/* -------------------------------------------------------------------------- */
/*  Computation                                                                */
/* -------------------------------------------------------------------------- */

function emptyCategories(): Record<Category, number> {
  return { Hardware: 0, Software: 0, Personal: 0, Otros: 0 }
}

function sumCategories(by: Record<Category, number>): number {
  return CATEGORIES.reduce((acc, c) => acc + by[c], 0)
}

function finalise(monthly: MonthCost[]): OptionSeries {
  const cumulative: number[] = []
  const totalsByCategory = emptyCategories()
  let running = 0
  for (const m of monthly) {
    running += m.total
    cumulative.push(running)
    for (const c of CATEGORIES) totalsByCategory[c] += m.byCategory[c]
  }
  return {
    monthly,
    cumulative,
    totalsByCategory,
    total: running,
    month0Cash: monthly[0]?.total ?? 0,
  }
}

export function demandAt(month: number, profile: readonly number[] = DEMAND_PROFILE): number {
  const n = profile.length
  return profile[((month % n) + n) % n] ?? 1
}

/**
 * The whole 36-month comparison. Pure: the same inputs always give the same
 * result, which is what lets slide 4 recompute on every slider frame and what
 * lets the unit tests pin the numbers down.
 */
export function computeCostModel(
  inputs: CostInputs = DEFAULT_INPUTS,
  params: ModelParams = DEFAULT_PARAMS,
): CostModelResult {
  const months = params.horizonMonths
  const { onPrem: op, cloud: cl } = params

  const demand: number[] = []
  const genomesByMonth: number[] = []
  const gpuHoursByMonth: number[] = []
  for (let m = 0; m < months; m += 1) {
    const d = demandAt(m, params.demandProfile)
    demand.push(d)
    genomesByMonth.push((inputs.genomesPerYear / 12) * d)
    gpuHoursByMonth.push(inputs.avgGpuHoursPerMonth * d)
  }

  const totalGenomes = genomesByMonth.reduce((a, b) => a + b, 0)
  const tbPerGenome = params.gbPerGenome / 1000

  /* --- On-premise ------------------------------------------------------- */
  // Sized for the peak month so nothing ever queues. That is exactly the
  // decision that leaves capacity idle for the rest of the year.
  const peakGpuHours = gpuHoursByMonth.reduce((a, b) => Math.max(a, b), 0)
  const servers = Math.max(1, Math.ceil(peakGpuHours / op.gpuHoursPerServerMonth))
  const boughtGpuHours = servers * op.gpuHoursPerServerMonth
  const meanGpuHours = gpuHoursByMonth.reduce((a, b) => a + b, 0) / months
  const gpuUtilisation = boughtGpuHours > 0 ? meanGpuHours / boughtGpuHours : 0

  const onPremMonthly: MonthCost[] = []
  let cumulativeHardware = 0
  for (let m = 0; m < months; m += 1) {
    const by = emptyCategories()

    if (m === 0) {
      by.Hardware += servers * op.serverCost
      by.Otros += op.datacenterSetup
    }
    // Storage hardware is bought up front for each coming 12-month block.
    if (m % 12 === 0) {
      const tbForBlock = genomesByMonth
        .slice(m, Math.min(m + 12, months))
        .reduce((acc, g) => acc + g * tbPerGenome, 0)
      by.Hardware += tbForBlock * op.storageCostPerTb
    }

    cumulativeHardware += by.Hardware
    by.Otros += (cumulativeHardware * op.maintenanceRateAnnual) / 12
    by.Otros += servers * op.powerCoolingPerServerMonth
    by.Personal += op.staffFte * params.fteCostPerMonth
    by.Software += op.softwareMonthly

    onPremMonthly.push({ month: m, byCategory: by, total: sumCategories(by) })
  }

  /* --- Cloud ------------------------------------------------------------ */
  const cloudMonthly: MonthCost[] = []
  let cumulativeTb = 0
  for (let m = 0; m < months; m += 1) {
    const by = emptyCategories()

    if (m === 0) by.Otros += cl.setup

    const genomesThisMonth = genomesByMonth[m] ?? 0
    const genomeCost = genomesThisMonth * cl.perGenome
    const gpuCost = (gpuHoursByMonth[m] ?? 0) * cl.gpuHourPrice

    cumulativeTb += genomesThisMonth * tbPerGenome
    const hotTb = genomesByMonth
      .slice(Math.max(0, m - cl.hotMonths + 1), m + 1)
      .reduce((acc, g) => acc + g * tbPerGenome, 0)
    const coldTb = Math.max(0, cumulativeTb - hotTb)
    const storageCost = hotTb * cl.hotPerTbMonth + coldTb * cl.coldPerTbMonth

    const awsUsage = genomeCost + gpuCost + storageCost
    by.Software += awsUsage
    by.Otros += awsUsage * cl.supportRate
    by.Personal += cl.staffFte * params.fteCostPerMonth

    cloudMonthly.push({ month: m, byCategory: by, total: sumCategories(by) })
  }

  const onPrem: OnPremSeries = {
    ...finalise(onPremMonthly),
    servers,
    peakGpuHours,
    gpuUtilisation,
  }
  const cloud = finalise(cloudMonthly)

  let crossoverMonth: number | null = null
  for (let m = 0; m < months; m += 1) {
    if ((cloud.cumulative[m] ?? 0) >= (onPrem.cumulative[m] ?? 0)) {
      crossoverMonth = m
      break
    }
  }

  return {
    inputs,
    params,
    months,
    demand,
    genomesByMonth,
    gpuHoursByMonth,
    totalGenomes,
    onPrem,
    cloud,
    costPerGenome: {
      onPrem: totalGenomes > 0 ? onPrem.total / totalGenomes : 0,
      cloud: totalGenomes > 0 ? cloud.total / totalGenomes : 0,
    },
    crossoverMonth,
    savings: onPrem.total - cloud.total,
  }
}

/* -------------------------------------------------------------------------- */
/*  Category mapping, documented for the README and the slide footnote         */
/* -------------------------------------------------------------------------- */

export const CATEGORY_MAPPING: Record<'onPrem' | 'cloud', Record<Category, string>> = {
  onPrem: {
    Hardware: 'Servidores de GPU y cabinas de almacenamiento',
    Software: 'Licencias de software',
    Personal: '2 FTE de infraestructura',
    Otros: 'Adecuación de CPD, electricidad y refrigeración, mantenimiento',
  },
  cloud: {
    Hardware: 'Ninguno: no se compra equipo',
    Software: 'HealthOmics, almacenamiento S3 y Glacier, y horas de GPU',
    Personal: '1,5 FTE de plataforma',
    Otros: 'Puesta en marcha y soporte de AWS',
  },
}
