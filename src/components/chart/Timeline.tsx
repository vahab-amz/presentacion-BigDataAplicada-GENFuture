'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { TimelineLane } from '@/data/deck'
import { DURATION, EASE_OUT, instantTransition } from '@/deck/motion-presets'
import { useSlideStep } from '@/deck/slide-context'

/**
 * Two lanes of phases on a shared month axis, with a bracket between them.
 * Each phase gets its own row (name on the left, bar on the track), so labels
 * never collide however short a phase is.
 */

export type TimelineGeometry = {
  width: number
  /** Right edge of the phase-name column. */
  labelRight: number
  trackX0: number
  trackX1: number
  barHeight: number
  rowPitch: number
  /** Lane header baseline to the first row's centre. */
  firstRow: number
  /** Last row of lane A to the bracket line. */
  bracketGap: number
  /** Bracket line to lane B's header baseline. */
  laneGap: number
  /** Last row of lane B to the axis line. */
  axisGap: number
}

const DEFAULT_GEOMETRY: TimelineGeometry = {
  width: 1680,
  labelRight: 400,
  trackX0: 440,
  trackX1: 1600,
  barHeight: 22,
  rowPitch: 46,
  firstRow: 40,
  bracketGap: 78,
  laneGap: 46,
  axisGap: 42,
}

export type LaneStyle = {
  /** Tailwind fill class for bars, dot and lane name. */
  fill: string
  stroke: string
  /** Fill for `muted` bars (waiting rather than working). */
  mutedFill?: string
  /** Fill for the result's uncertainty band. */
  bandFill?: string
}

type Layout = {
  headerA: number
  rowsA: number[]
  bracketLine: number
  headerB: number
  rowsB: number[]
  axisLine: number
  axisLabels: number
  height: number
}

function layoutFor(geometry: TimelineGeometry, rowsA: number, rowsB: number): Layout {
  const g = geometry
  const headerA = 22
  const a = Array.from({ length: rowsA }, (_, i) => headerA + g.firstRow + i * g.rowPitch)
  const bracketLine = (a.at(-1) ?? headerA) + g.bracketGap
  const headerB = bracketLine + g.laneGap
  const b = Array.from({ length: rowsB }, (_, i) => headerB + g.firstRow + i * g.rowPitch)
  const axisLine = (b.at(-1) ?? headerB) + g.axisGap
  const axisLabels = axisLine + 28
  return {
    headerA,
    rowsA: a,
    bracketLine,
    headerB,
    rowsB: b,
    axisLine,
    axisLabels,
    height: axisLabels + 12,
  }
}

export function Timeline({
  lanes,
  styles,
  months,
  tickEvery,
  bracket,
  axisLabel,
  ariaLabel,
  visible,
  bracketVisible,
  geometry: geometryOverrides = {},
}: {
  lanes: readonly [TimelineLane, TimelineLane]
  styles: readonly [LaneStyle, LaneStyle]
  months: number
  tickEvery: number
  bracket: {
    from: number
    to: number
    label: string
    /** `above`: centred over the bracket. `after`: to its right, on its line. */
    placement?: 'above' | 'after'
  }
  axisLabel: string
  ariaLabel: string
  visible: boolean
  bracketVisible: boolean
  geometry?: Partial<TimelineGeometry>
}) {
  const g = { ...DEFAULT_GEOMETRY, ...geometryOverrides }
  const layout = layoutFor(g, lanes[0].bars.length, lanes[1].bars.length)
  const monthToX = (month: number): number =>
    g.trackX0 + (month / months) * (g.trackX1 - g.trackX0)
  const ticks = Array.from({ length: Math.floor(months / tickEvery) + 1 }, (_, i) => i * tickEvery)
  const rowText = g.rowPitch < 44 ? 'text-micro' : 'text-label'

  return (
    <svg
      viewBox={`0 0 ${g.width} ${layout.height}`}
      width={g.width}
      height={layout.height}
      role="img"
      aria-label={ariaLabel}
      // Accents on capitals (HÍBRIDO) rise above the first baseline.
      overflow="visible"
    >
      <g aria-hidden>
        {ticks.map((month) => (
          <line
            key={month}
            x1={monthToX(month)}
            x2={monthToX(month)}
            y1={layout.headerA + 18}
            y2={layout.axisLine}
            className="stroke-rule"
            strokeWidth={1}
          />
        ))}
        <line
          x1={g.trackX0}
          x2={g.trackX1}
          y1={layout.axisLine}
          y2={layout.axisLine}
          className="stroke-rule-strong"
          strokeWidth={1}
        />
      </g>

      <Lane
        lane={lanes[0]}
        style={styles[0]}
        headerY={layout.headerA}
        rowCenters={layout.rowsA}
        monthToX={monthToX}
        geometry={g}
        rowText={rowText}
        visible={visible}
        delayBase={0}
      />
      <Lane
        lane={lanes[1]}
        style={styles[1]}
        headerY={layout.headerB}
        rowCenters={layout.rowsB}
        monthToX={monthToX}
        geometry={g}
        rowText={rowText}
        visible={visible}
        delayBase={0.18}
      />

      <Bracket
        x0={monthToX(bracket.from)}
        x1={monthToX(bracket.to)}
        y={layout.bracketLine}
        label={bracket.label}
        placement={bracket.placement ?? 'above'}
        visible={bracketVisible}
      />

      <g aria-hidden>
        {ticks.map((month) => (
          <text
            key={month}
            x={monthToX(month)}
            y={layout.axisLabels}
            textAnchor="middle"
            className="fill-ink-faint text-micro tabular-nums"
          >
            {month}
          </text>
        ))}
        <text
          x={0}
          y={layout.axisLabels}
          className="fill-ink-faint text-micro tracking-[0.12em] uppercase"
        >
          {axisLabel}
        </text>
      </g>
    </svg>
  )
}

function useInstant(): boolean {
  const reduceMotion = useReducedMotion()
  const { mode } = useSlideStep()
  return reduceMotion === true || mode === 'static'
}

function Lane({
  lane,
  style,
  headerY,
  rowCenters,
  monthToX,
  geometry,
  rowText,
  visible,
  delayBase,
}: {
  lane: TimelineLane
  style: LaneStyle
  headerY: number
  rowCenters: readonly number[]
  monthToX: (month: number) => number
  geometry: TimelineGeometry
  rowText: string
  visible: boolean
  delayBase: number
}) {
  const instant = useInstant()
  const g = geometry
  const lastRow = rowCenters.at(-1) ?? headerY
  const result = lane.result
  const fade = (delay: number) =>
    instant ? instantTransition : { duration: DURATION.base, ease: EASE_OUT, delay }

  return (
    <g>
      <text x={0} y={headerY} className={`${style.fill} text-label tracking-[0.18em] uppercase`}>
        {lane.name}
      </text>

      {/* The uncertainty band sits under the bars. */}
      {result?.range ? (
        <motion.rect
          x={monthToX(result.range[0])}
          y={headerY + 18}
          width={monthToX(result.range[1]) - monthToX(result.range[0])}
          height={lastRow + g.barHeight - headerY - 18}
          className={style.bandFill ?? style.fill}
          initial={false}
          animate={{ opacity: visible ? (style.bandFill ? 1 : 0.14) : 0 }}
          transition={fade(delayBase + 0.5)}
        />
      ) : null}

      {lane.bars.map((bar, index) => {
        const x = monthToX(bar.from)
        const width = monthToX(bar.to) - x
        const center = rowCenters[index] ?? 0
        const muted = bar.muted === true && style.mutedFill !== undefined

        return (
          <g key={bar.label}>
            <text
              x={g.labelRight}
              y={center}
              dy="0.34em"
              textAnchor="end"
              className={`fill-ink-muted ${rowText}`}
            >
              {bar.label}
            </text>
            <motion.rect
              x={x}
              y={center - g.barHeight / 2}
              width={width}
              height={g.barHeight}
              rx={3}
              className={muted ? `${style.mutedFill} ${style.stroke}` : style.fill}
              strokeWidth={muted ? 2 : 0}
              // Grow from the bar's own left edge (Motion: fill-box origin).
              style={{ originX: 0 }}
              initial={false}
              animate={{ scaleX: visible ? 1 : 0, opacity: visible ? 1 : 0 }}
              transition={
                instant
                  ? instantTransition
                  : { duration: DURATION.slow, ease: EASE_OUT, delay: delayBase + index * 0.12 }
              }
            />
            {bar.endLabel ? (
              <motion.text
                x={x + width + 14}
                y={center}
                dy="0.34em"
                className="fill-ink-faint text-micro tabular-nums"
                initial={false}
                animate={{ opacity: visible ? 1 : 0 }}
                transition={fade(delayBase + index * 0.12 + 0.3)}
              >
                {bar.endLabel}
              </motion.text>
            ) : null}
          </g>
        )
      })}

      {/* The moment the lane is actually usable. */}
      {result ? (
        <motion.g initial={false} animate={{ opacity: visible ? 1 : 0 }} transition={fade(delayBase + 0.5)}>
          <line
            x1={monthToX(result.at)}
            x2={monthToX(result.at)}
            y1={headerY + 18}
            y2={lastRow + g.barHeight}
            className={style.stroke}
            strokeWidth={2}
          />
          <circle
            cx={monthToX(result.at)}
            cy={lastRow}
            r={9}
            className={`${style.fill} stroke-bg`}
            strokeWidth={3}
          />
          <text
            x={
              result.range
                ? (monthToX(result.range[0]) + monthToX(result.range[1])) / 2
                : monthToX(result.at) - 16
            }
            y={headerY}
            textAnchor={result.range ? 'middle' : 'end'}
            className="fill-ink text-label font-medium"
          >
            {result.label}
          </text>
        </motion.g>
      ) : null}
    </g>
  )
}

function Bracket({
  x0,
  x1,
  y,
  label,
  placement,
  visible,
}: {
  x0: number
  x1: number
  y: number
  label: string
  placement: 'above' | 'after'
  visible: boolean
}) {
  const instant = useInstant()
  return (
    <motion.g
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={instant ? instantTransition : { duration: DURATION.base, ease: EASE_OUT, delay: 0.4 }}
    >
      <line x1={x0} x2={x1} y1={y} y2={y} className="stroke-accent" strokeWidth={3} />
      <line x1={x0} x2={x0} y1={y - 12} y2={y + 12} className="stroke-accent" strokeWidth={3} />
      <line x1={x1} x2={x1} y1={y - 12} y2={y + 12} className="stroke-accent" strokeWidth={3} />
      <text
        x={placement === 'above' ? (x0 + x1) / 2 : x1 + 24}
        y={placement === 'above' ? y - 16 : y}
        dy={placement === 'above' ? undefined : '0.34em'}
        textAnchor={placement === 'above' ? 'middle' : 'start'}
        className="fill-accent font-serif text-lede font-semibold"
      >
        {label}
      </text>
    </motion.g>
  )
}
