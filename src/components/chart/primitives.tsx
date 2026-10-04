'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import {
  DURATION,
  EASE_OUT,
  drawTransition,
  enterTransition,
  instantTransition,
} from '@/deck/motion-presets'
import { useSlideStep } from '@/deck/slide-context'

/* -------------------------------------------------------------------------- */
/*  Plot geometry                                                              */
/* -------------------------------------------------------------------------- */

export type Margin = { top: number; right: number; bottom: number; left: number }

export type Plot = {
  width: number
  height: number
  margin: Margin
  innerWidth: number
  innerHeight: number
}

export function createPlot(width: number, height: number, margin: Margin): Plot {
  return {
    width,
    height,
    margin,
    innerWidth: width - margin.left - margin.right,
    innerHeight: height - margin.top - margin.bottom,
  }
}

/**
 * A chart title and its plot, stacked in normal flow.
 *
 * The header occupies a fixed band and the SVG takes what is left, so a title
 * that wraps can never end up drawn on top of the top gridline — which is
 * exactly what happens when the SVG is absolutely positioned behind it.
 */
export function ChartBlock({
  title,
  tag,
  width,
  height,
  headerHeight = 60,
  ariaLabel,
  children,
}: {
  title: string
  tag?: ReactNode
  width: number
  height: number
  headerHeight?: number
  ariaLabel: string
  children: ReactNode
}) {
  const plotHeight = height - headerHeight
  return (
    <div style={{ width, height }}>
      <div
        className="flex items-baseline justify-between gap-6"
        style={{ height: headerHeight }}
      >
        <h3 className="font-serif text-lede font-semibold text-ink">{title}</h3>
        {tag}
      </div>
      <svg
        viewBox={`0 0 ${width} ${plotHeight}`}
        width={width}
        height={plotHeight}
        role="img"
        aria-label={ariaLabel}
      >
        {children}
      </svg>
    </div>
  )
}

/** Positions the inner plot area; everything else is drawn in its coordinates. */
export function PlotArea({ plot, children }: { plot: Plot; children: ReactNode }) {
  return <g transform={`translate(${plot.margin.left}, ${plot.margin.top})`}>{children}</g>
}

/* -------------------------------------------------------------------------- */
/*  Axes and grid — hairlines, one shade off the surface, never dashed         */
/* -------------------------------------------------------------------------- */

export type Tick = { value: number; label: string }

export function GridLinesY({
  plot,
  ticks,
  scale,
}: {
  plot: Plot
  ticks: readonly Tick[]
  scale: (value: number) => number
}) {
  return (
    <g aria-hidden>
      {ticks.map((tick) => (
        <line
          key={tick.value}
          x1={0}
          x2={plot.innerWidth}
          y1={scale(tick.value)}
          y2={scale(tick.value)}
          className="stroke-rule"
          strokeWidth={1}
        />
      ))}
    </g>
  )
}

export function AxisY({
  plot,
  ticks,
  scale,
  label,
}: {
  plot: Plot
  ticks: readonly Tick[]
  scale: (value: number) => number
  label?: string
}) {
  return (
    <g>
      {ticks.map((tick) => (
        <text
          key={tick.value}
          x={-20}
          y={scale(tick.value)}
          dy="0.34em"
          textAnchor="end"
          className="fill-ink-faint text-micro tabular-nums"
        >
          {tick.label}
        </text>
      ))}
      {label ? (
        <text
          transform={`translate(${-plot.margin.left + 30}, ${plot.innerHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-ink-faint text-micro tracking-[0.12em] uppercase"
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}

export function AxisX({
  plot,
  ticks,
  scale,
  label,
}: {
  plot: Plot
  ticks: readonly Tick[]
  scale: (value: number) => number
  label?: string
}) {
  return (
    <g>
      <line
        x1={0}
        x2={plot.innerWidth}
        y1={plot.innerHeight}
        y2={plot.innerHeight}
        className="stroke-rule-strong"
        strokeWidth={1}
      />
      {ticks.map((tick) => (
        <text
          key={tick.value}
          x={scale(tick.value)}
          y={plot.innerHeight + 40}
          textAnchor="middle"
          className="fill-ink-faint text-micro tabular-nums"
        >
          {tick.label}
        </text>
      ))}
      {label ? (
        <text
          x={plot.innerWidth / 2}
          y={plot.innerHeight + 86}
          textAnchor="middle"
          className="fill-ink-faint text-micro tracking-[0.12em] uppercase"
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}

/* -------------------------------------------------------------------------- */
/*  Marks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A line that draws itself left to right via SVG pathLength. Under reduced
 * motion, and in static render mode, it simply appears.
 */
export function DrawPath({
  d,
  visible,
  className,
  strokeWidth = 4,
  delay = 0,
  strokeDasharray,
}: {
  d: string
  visible: boolean
  className: string
  strokeWidth?: number
  delay?: number
  strokeDasharray?: string
}) {
  const reduceMotion = useReducedMotion()
  const { mode } = useSlideStep()
  const instant = reduceMotion === true || mode === 'static'

  return (
    <motion.path
      d={d}
      fill="none"
      className={className}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={strokeDasharray}
      initial={false}
      animate={{
        pathLength: visible ? 1 : 0,
        opacity: visible ? 1 : 0,
      }}
      transition={
        instant
          ? instantTransition
          : {
              pathLength: drawTransition(delay),
              opacity: { duration: DURATION.slide, ease: EASE_OUT, delay },
            }
      }
    />
  )
}

/** A filled region that fades in. Fills never move, so nothing reflows. */
export function FadeShape({
  d,
  visible,
  className,
  delay = 0,
  opacity = 1,
}: {
  d: string
  visible: boolean
  className: string
  delay?: number
  opacity?: number
}) {
  const { mode } = useSlideStep()
  return (
    <motion.path
      d={d}
      className={className}
      initial={false}
      animate={{ opacity: visible ? opacity : 0 }}
      transition={mode === 'static' ? instantTransition : enterTransition(delay)}
    />
  )
}

/** A bar that grows up from its bottom edge, animating scale only. */
export function GrowBar({
  x,
  y,
  width,
  height,
  visible,
  className,
  delay = 0,
  rx = 2,
}: {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  className: string
  delay?: number
  rx?: number
}) {
  const reduceMotion = useReducedMotion()
  const { mode } = useSlideStep()
  const instant = reduceMotion === true || mode === 'static'

  return (
    <motion.rect
      x={x}
      y={y}
      width={Math.max(0, width)}
      height={Math.max(0, height)}
      rx={rx}
      className={className}
      // Motion measures SVG origins against the element's own box
      // (transform-box: fill-box), so "bottom edge" is originY 1, not pixels.
      style={{ originY: 1 }}
      initial={false}
      animate={
        instant
          ? { opacity: visible ? 1 : 0, scaleY: 1 }
          : { opacity: visible ? 1 : 0, scaleY: visible ? 1 : 0 }
      }
      transition={instant ? instantTransition : enterTransition(delay)}
    />
  )
}

/**
 * A direct label on a series. Every series carries one, so identity never
 * depends on colour alone — which matters because on-premise red and cloud
 * green are the classic colour-vision confusion.
 */
export function SeriesLabel({
  x,
  y,
  visible,
  className,
  anchor = 'start',
  delay = 0,
  /** Surface-coloured outline, for labels that sit on top of a tinted area. */
  halo = false,
  children,
}: {
  x: number
  y: number
  visible: boolean
  className: string
  anchor?: 'start' | 'middle' | 'end'
  delay?: number
  halo?: boolean
  children: ReactNode
}) {
  const { mode } = useSlideStep()
  return (
    <motion.text
      x={x}
      y={y}
      textAnchor={anchor}
      className={className}
      style={
        halo
          ? {
              paintOrder: 'stroke',
              stroke: 'var(--color-bg)',
              strokeWidth: 7,
              strokeLinejoin: 'round',
            }
          : undefined
      }
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={mode === 'static' ? instantTransition : enterTransition(delay)}
    >
      {children}
    </motion.text>
  )
}

/** A marker dot with a 2px surface ring, for the end of a line. */
export function EndPoint({
  cx,
  cy,
  visible,
  className,
  r = 7,
  delay = 0,
}: {
  cx: number
  cy: number
  visible: boolean
  className: string
  r?: number
  delay?: number
}) {
  const { mode } = useSlideStep()
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      className={`${className} stroke-bg`}
      strokeWidth={3}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={mode === 'static' ? instantTransition : enterTransition(delay)}
    />
  )
}
