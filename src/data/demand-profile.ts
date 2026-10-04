/**
 * Twelve monthly multipliers with a mean of exactly 1.0 (they sum to 12).
 * R&D works in projects: two big sequencing campaigns a year, quiet valleys
 * in between. Slide 1 (the conceptual OPEX bars) and slide 2 (demand vs.
 * capacity) both read this same array so the story stays consistent.
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

export function demandAt(month: number, profile: readonly number[] = DEMAND_PROFILE): number {
  const n = profile.length
  return profile[((month % n) + n) % n] ?? 1
}
