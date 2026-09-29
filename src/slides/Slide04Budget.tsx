'use client'

import { scaleLinear } from 'd3-scale'
import { curveMonotoneX, line } from 'd3-shape'
import { useMemo, useState } from 'react'
import { CountUp } from '@/components/CountUp'
import { Reveal } from '@/components/Reveal'
import {
  AxisX,
  AxisY,
  ChartBlock,
  DrawPath,
  EndPoint,
  GridLinesY,
  PlotArea,
  SeriesLabel,
  createPlot,
} from '@/components/chart/primitives'
import {
  CATEGORIES,
  DEFAULT_INPUTS,
  INPUT_RANGES,
  computeCostModel,
  type Category,
  type CostInputs,
} from '@/data/cost-model'
import { SLIDE_4 } from '@/data/deck'
import { useSlideStep } from '@/deck/slide-context'
import {
  formatInteger,
  formatPercent,
  formatUsd,
  formatUsdAxis,
  formatUsdCompact,
} from '@/lib/format'
import { Place, SlideFrame, SlideTitle } from './SlideFrame'

/* --- Geometry, in stage pixels -------------------------------------------- */

const CUM = { width: 1010, height: 396, headerHeight: 56 }
const CUM_PLOT = createPlot(CUM.width, CUM.height - CUM.headerHeight, {
  top: 12,
  // Wide enough for the end-of-line series names and their totals.
  right: 220,
  bottom: 50,
  left: 130,
})

const CAT = {
  width: 1010,
  height: 258,
  headerHeight: 52,
  labelRight: 210,
  trackX0: 230,
  trackX1: 830,
  barHeight: 44,
  rows: { onPrem: 14, cloud: 90 },
  legendY: 176,
} as const
const CAT_TRACK = CAT.trackX1 - CAT.trackX0
/** A fixed ramp position per category, in the same order on both bars. */
const CATEGORY_OPACITY: Record<Category, number> = {
  Hardware: 1,
  Software: 0.74,
  Personal: 0.5,
  Otros: 0.3,
}
/** Below this width a segment cannot hold a legible label with padding. */
const MIN_LABEL_WIDTH = 104

export function Slide04Budget() {
  const [inputs, setInputs] = useState<CostInputs>(DEFAULT_INPUTS)
  const model = useMemo(() => computeCostModel(inputs), [inputs])

  return (
    <SlideFrame>
      <Place top={0} width={1680}>
        <Reveal at={0} from="none">
          <SlideTitle size="h2">{SLIDE_4.title}</SlideTitle>
        </Reveal>
      </Place>

      <Place top={156} width={CUM.width} height={CUM.height}>
        <Reveal at={1} from="none" className="h-full">
          <CumulativeChart model={model} />
        </Reveal>
      </Place>

      <Place top={572} width={CAT.width} height={CAT.height}>
        <CategoryChart model={model} />
      </Place>

      <Place top={150} left={1070} width={610} height={252}>
        <KpiTable model={model} />
      </Place>

      <Place top={414} left={1070} width={610} height={420}>
        <ControlPanel model={model} inputs={inputs} onChange={setInputs} />
      </Place>

      <Place top={834} width={1680}>
        <p className="text-micro text-ink-faint">
          {SLIDE_4.footer} · {SLIDE_4.categoryChart.note}
        </p>
      </Place>
    </SlideFrame>
  )
}

type Model = ReturnType<typeof computeCostModel>

/* -------------------------------------------------------------------------- */
/*  Cumulative cost over 36 months                                             */
/* -------------------------------------------------------------------------- */

const X_TICKS = [0, 6, 12, 18, 24, 30, 35].map((month) => ({
  value: month,
  label: String(month),
}))

function CumulativeChart({ model }: { model: Model }) {
  const { step } = useSlideStep()
  const visible = step >= 1

  const xScale = (month: number) => (month / (model.months - 1)) * CUM_PLOT.innerWidth

  const { paths, y, ticks, ends } = useMemo(() => {
    const maxTotal = Math.max(model.onPrem.total, model.cloud.total)
    const yScale = scaleLinear().domain([0, maxTotal]).nice(4).range([CUM_PLOT.innerHeight, 0])
    const x = (month: number) => (month / (model.months - 1)) * CUM_PLOT.innerWidth

    // On-premise steps at months 0, 12 and 24; a monotone curve would round
    // those cliffs off, and the cliffs are the point.
    const straight = line<number>()
      .x((_, i) => x(i))
      .y((value) => yScale(value))
    const smooth = line<number>()
      .x((_, i) => x(i))
      .y((value) => yScale(value))
      .curve(curveMonotoneX)

    return {
      paths: {
        onPrem: straight(model.onPrem.cumulative) ?? '',
        cloud: smooth(model.cloud.cumulative) ?? '',
      },
      y: yScale,
      ticks: yScale.ticks(4).map((value) => ({ value, label: formatUsdAxis(value) })),
      ends: {
        x: x(model.months - 1),
        onPremY: yScale(model.onPrem.total),
        cloudY: yScale(model.cloud.total),
        crossoverX: model.crossoverMonth === null ? null : x(model.crossoverMonth),
      },
    }
  }, [model])

  return (
    <ChartBlock
      title={SLIDE_4.cumulativeChart.title}
      width={CUM.width}
      height={CUM.height}
      headerHeight={CUM.headerHeight}
      ariaLabel="Coste acumulado a 36 meses: on-premise frente a nube"
    >
      <PlotArea plot={CUM_PLOT}>
        <GridLinesY plot={CUM_PLOT} ticks={ticks} scale={y} />
        <AxisY plot={CUM_PLOT} ticks={ticks} scale={y} />
        <AxisX plot={CUM_PLOT} ticks={X_TICKS} scale={xScale} />
        <text
          x={CUM_PLOT.innerWidth + 56}
          y={CUM_PLOT.innerHeight + 40}
          className="fill-ink-faint text-micro tracking-[0.12em] uppercase"
        >
          {SLIDE_4.cumulativeChart.xLabel}
        </text>

        {ends.crossoverX !== null ? (
          <g>
            <line
              x1={ends.crossoverX}
              x2={ends.crossoverX}
              y1={0}
              y2={CUM_PLOT.innerHeight}
              className="stroke-accent"
              strokeWidth={2}
              opacity={visible ? 1 : 0}
            />
            <SeriesLabel
              x={ends.crossoverX + 10}
              y={18}
              visible={visible}
              className="fill-accent text-micro font-medium"
            >
              {SLIDE_4.controls.crossoverFound(model.crossoverMonth ?? 0)}
            </SeriesLabel>
          </g>
        ) : null}

        <DrawPath d={paths.onPrem} visible={visible} className="stroke-onprem" strokeWidth={4} />
        <DrawPath
          d={paths.cloud}
          visible={visible}
          className="stroke-cloud"
          strokeWidth={4}
          delay={0.12}
        />

        <EndPoint cx={ends.x} cy={ends.onPremY} visible={visible} className="fill-onprem" delay={0.5} />
        <EndPoint cx={ends.x} cy={ends.cloudY} visible={visible} className="fill-cloud" delay={0.55} />

        <SeriesLabel
          x={ends.x + 18}
          y={ends.onPremY - 6}
          visible={visible}
          className="fill-onprem text-micro font-semibold tracking-[0.08em] uppercase"
          delay={0.5}
        >
          {SLIDE_4.cumulativeChart.onPremLabel}
        </SeriesLabel>
        <SeriesLabel
          x={ends.x + 18}
          y={ends.onPremY + 30}
          visible={visible}
          className="fill-ink text-label font-semibold tabular-nums"
          delay={0.5}
        >
          {formatUsdCompact(model.onPrem.total)}
        </SeriesLabel>

        <SeriesLabel
          x={ends.x + 18}
          y={ends.cloudY - 6}
          visible={visible}
          className="fill-cloud text-micro font-semibold tracking-[0.08em] uppercase"
          delay={0.55}
        >
          {SLIDE_4.cumulativeChart.cloudLabel}
        </SeriesLabel>
        <SeriesLabel
          x={ends.x + 18}
          y={ends.cloudY + 30}
          visible={visible}
          className="fill-ink text-label font-semibold tabular-nums"
          delay={0.55}
        >
          {formatUsdCompact(model.cloud.total)}
        </SeriesLabel>
      </PlotArea>
    </ChartBlock>
  )
}

/* -------------------------------------------------------------------------- */
/*  36-month totals by category                                                */
/* -------------------------------------------------------------------------- */

function CategoryChart({ model }: { model: Model }) {
  const max = Math.max(model.onPrem.total, model.cloud.total)
  const scale = (value: number) => (value / max) * CAT_TRACK

  return (
    <Reveal at={2} className="h-full">
      <ChartBlock
        title={SLIDE_4.categoryChart.title}
        width={CAT.width}
        height={CAT.height}
        headerHeight={CAT.headerHeight}
        ariaLabel="Reparto del total a 36 meses por categoría de coste"
      >
        <StackedBar
          y={CAT.rows.onPrem}
          name={SLIDE_4.kpis.onPremColumn}
          totals={model.onPrem.totalsByCategory}
          total={model.onPrem.total}
          scale={scale}
          baseClass="fill-onprem"
          textClass="fill-onprem"
        />
        <StackedBar
          y={CAT.rows.cloud}
          name={SLIDE_4.kpis.cloudColumn}
          totals={model.cloud.totalsByCategory}
          total={model.cloud.total}
          scale={scale}
          baseClass="fill-cloud"
          textClass="fill-cloud"
        />

        {/* Split swatches: the same ramp position means the same category in
            both bars, so identity never rests on hue alone. */}
        <g transform={`translate(${CAT.trackX0}, ${CAT.legendY})`}>
          {CATEGORIES.map((category, index) => (
            <g key={category} transform={`translate(${index * 168}, 0)`}>
              <rect
                x={0}
                y={-16}
                width={10}
                height={20}
                className="fill-onprem"
                opacity={CATEGORY_OPACITY[category]}
              />
              <rect
                x={12}
                y={-16}
                width={10}
                height={20}
                className="fill-cloud"
                opacity={CATEGORY_OPACITY[category]}
              />
              <text x={32} y={0} className="fill-ink-muted text-micro">
                {category}
              </text>
            </g>
          ))}
        </g>
      </ChartBlock>
    </Reveal>
  )
}

function StackedBar({
  y,
  name,
  totals,
  total,
  scale,
  baseClass,
  textClass,
}: {
  y: number
  name: string
  totals: Record<Category, number>
  total: number
  scale: (value: number) => number
  baseClass: string
  textClass: string
}) {
  const widths = CATEGORIES.map((category) => scale(totals[category]))
  const segments = CATEGORIES.map((category, index) => ({
    category,
    x: CAT.trackX0 + widths.slice(0, index).reduce((acc, w) => acc + w, 0),
    width: widths[index] ?? 0,
  }))

  return (
    <g>
      <text
        x={CAT.labelRight}
        y={y + CAT.barHeight / 2}
        dy="0.34em"
        textAnchor="end"
        className={`${textClass} text-micro tracking-[0.12em] uppercase`}
      >
        {name}
      </text>

      {segments.map((segment) => (
        <g key={segment.category}>
          {/* A 2px surface gap separates segments; no borders are drawn. */}
          <rect
            x={segment.x}
            y={y}
            width={Math.max(0, segment.width - 2)}
            height={CAT.barHeight}
            className={baseClass}
            opacity={CATEGORY_OPACITY[segment.category]}
          />
          {segment.width >= MIN_LABEL_WIDTH ? (
            // Only the fully saturated step is dark enough to carry surface-
            // coloured text; the paler steps take ink, which reads in both themes.
            <text
              x={segment.x + 12}
              y={y + CAT.barHeight / 2}
              dy="0.34em"
              className={
                CATEGORY_OPACITY[segment.category] >= 0.9
                  ? 'fill-bg text-micro font-semibold tabular-nums'
                  : 'fill-ink text-micro font-semibold tabular-nums'
              }
            >
              {formatUsdCompact(totals[segment.category])}
            </text>
          ) : null}
        </g>
      ))}

      <text
        x={CAT.trackX1 + 18}
        y={y + CAT.barHeight / 2}
        dy="0.34em"
        className="fill-ink text-label font-semibold tabular-nums"
      >
        {formatUsdCompact(total)}
      </text>
    </g>
  )
}

/* -------------------------------------------------------------------------- */
/*  Headline figures, as a comparison table                                    */
/* -------------------------------------------------------------------------- */

function KpiTable({ model }: { model: Model }) {
  const usd = (value: number) => formatUsdCompact(value)
  const rows = [
    { label: SLIDE_4.kpis.month0, onPrem: model.onPrem.month0Cash, cloud: model.cloud.month0Cash, format: usd },
    { label: SLIDE_4.kpis.total, onPrem: model.onPrem.total, cloud: model.cloud.total, format: usd },
    {
      label: SLIDE_4.kpis.perGenome,
      onPrem: model.costPerGenome.onPrem,
      cloud: model.costPerGenome.cloud,
      format: (value: number) => formatUsd(value, 0),
    },
  ]

  return (
    <div className="h-full">
      <Reveal
        at={4}
        className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-7 border-b border-rule pb-2"
      >
        <span />
        <span className="w-[172px] text-right text-micro font-semibold text-onprem">
          {SLIDE_4.kpis.onPremColumn}
        </span>
        <span className="w-[172px] text-right text-micro font-semibold text-cloud">
          {SLIDE_4.kpis.cloudColumn}
        </span>
      </Reveal>

      {rows.map((row, index) => (
        <Reveal
          key={row.label}
          at={4}
          index={index}
          className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-7 border-b border-rule py-[6px]"
        >
          <span className="text-micro text-ink-muted">{row.label}</span>
          <span className="w-[172px] text-right font-serif text-lede leading-none font-semibold text-onprem">
            <CountUp value={row.onPrem} format={row.format} />
          </span>
          <span className="w-[172px] text-right font-serif text-lede leading-none font-semibold text-cloud">
            <CountUp value={row.cloud} format={row.format} />
          </span>
        </Reveal>
      ))}

      <Reveal at={4} index={3} className="pt-3">
        <p className="text-micro text-ink-muted">
          {SLIDE_4.kpis.savingsLabel}:{' '}
          <span className="font-semibold text-ink tabular-nums">
            {formatUsdCompact(model.savings)}
          </span>
        </p>
      </Reveal>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Controls                                                                   */
/* -------------------------------------------------------------------------- */

function ControlPanel({
  model,
  inputs,
  onChange,
}: {
  model: Model
  inputs: CostInputs
  onChange: (inputs: CostInputs) => void
}) {
  return (
    <Reveal at={3} className="h-full">
      <div className="flex h-full flex-col border border-rule bg-panel px-8 py-3">
        <h3 className="text-micro font-semibold tracking-[0.18em] text-ink-faint uppercase">
          {SLIDE_4.controls.title}
        </h3>

        <Slider
          id="genomes-per-year"
          label={INPUT_RANGES.genomesPerYear.label}
          value={inputs.genomesPerYear}
          min={INPUT_RANGES.genomesPerYear.min}
          max={INPUT_RANGES.genomesPerYear.max}
          stepSize={INPUT_RANGES.genomesPerYear.step}
          format={formatInteger}
          onChange={(genomesPerYear) => onChange({ ...inputs, genomesPerYear })}
        />

        <Slider
          id="gpu-hours"
          label={INPUT_RANGES.avgGpuHoursPerMonth.label}
          value={inputs.avgGpuHoursPerMonth}
          min={INPUT_RANGES.avgGpuHoursPerMonth.min}
          max={INPUT_RANGES.avgGpuHoursPerMonth.max}
          stepSize={INPUT_RANGES.avgGpuHoursPerMonth.step}
          format={formatInteger}
          onChange={(avgGpuHoursPerMonth) => onChange({ ...inputs, avgGpuHoursPerMonth })}
        />

        <dl className="mt-4 grid grid-cols-2 gap-x-6 border-t border-rule pt-3">
          <div>
            <dt className="text-micro text-ink-muted">{SLIDE_4.controls.serversLabel}</dt>
            <dd className="font-serif text-lede leading-none font-semibold text-onprem tabular-nums">
              {model.onPrem.servers}
            </dd>
          </div>
          <div>
            <dt className="text-micro text-ink-muted">{SLIDE_4.controls.utilisationLabel}</dt>
            <dd className="font-serif text-lede leading-none font-semibold text-onprem tabular-nums">
              {formatPercent(model.onPrem.gpuUtilisation)}
            </dd>
          </div>
        </dl>

        <div className="mt-auto border-t border-rule pt-3">
          <p className="text-micro font-semibold text-accent">
            {model.crossoverMonth === null
              ? SLIDE_4.controls.crossoverNone
              : SLIDE_4.controls.crossoverFound(model.crossoverMonth)}
          </p>
          <p className="mt-1 text-micro text-ink-faint">
            {model.crossoverMonth === null
              ? SLIDE_4.controls.crossoverNoneNote
              : SLIDE_4.controls.crossoverNote}
          </p>
        </div>
      </div>
    </Reveal>
  )
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  stepSize,
  format,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  stepSize: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-micro text-ink-muted">
          {label}
        </label>
        <output htmlFor={id} className="text-label font-semibold text-ink tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="deck-range"
        min={min}
        max={max}
        step={stepSize}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        // Give the keyboard back to the deck as soon as the drag ends.
        onPointerUp={(event) => event.currentTarget.blur()}
      />
    </div>
  )
}
