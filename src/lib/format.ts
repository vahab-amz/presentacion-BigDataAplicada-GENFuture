/**
 * Spanish (Spain) number formatting: "." for thousands, "," for decimals, and
 * the currency symbol after the figure with a non-breaking space.
 */

const NBSP = ' '

function formatter(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  return new Intl.NumberFormat('es-ES', options)
}

const integer = formatter({ maximumFractionDigits: 0 })

export function formatInteger(value: number): string {
  return integer.format(Math.round(value))
}

export function formatDecimal(value: number, digits = 1): string {
  return formatter({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}

/** "770.333 $" */
export function formatUsd(value: number, digits = 0): string {
  const body =
    digits === 0
      ? integer.format(Math.round(value))
      : formatter({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
  return `${body}${NBSP}$`
}

/** "2,60 M$" / "770 k$" / "512 $" — for axis ticks and end-of-line labels. */
export function formatUsdCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${formatDecimal(value / 1_000_000, 2)}${NBSP}M$`
  if (abs >= 1_000) return `${formatInteger(value / 1_000)}${NBSP}k$`
  return `${formatInteger(value)}${NBSP}$`
}

/** Shorter still, for dense axes: "2,6 M$". */
export function formatUsdAxis(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${formatDecimal(value / 1_000_000, 1)}${NBSP}M$`
  if (abs >= 1_000) return `${formatInteger(value / 1_000)}${NBSP}k$`
  return `${formatInteger(value)}${NBSP}$`
}

/** Ratio in, percentage out: 0.257 -> "26 %". */
export function formatPercent(ratio: number, digits = 0): string {
  return `${formatDecimal(ratio * 100, digits)}${NBSP}%`
}

export function formatGenomes(value: number): string {
  return formatInteger(value)
}
