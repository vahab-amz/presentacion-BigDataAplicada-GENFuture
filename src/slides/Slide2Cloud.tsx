'use client'

import { area, curveMonotoneX, line } from 'd3-shape'
import { useId, useMemo } from 'react'
import { Reveal } from '@/components/Reveal'
import {
  AxisX,
  AxisY,
  ChartBlock,
  DrawPath,
  FadeShape,
  GridLinesY,
  PlotArea,
  SeriesLabel,
  createPlot,
} from '@/components/chart/primitives'
import { IllustrativeTag } from '@/components/ui/Tag'
import { DEMAND_PROFILE, MONTH_LABELS } from '@/data/demand-profile'
import { SLIDE_CLOUD } from '@/data/deck'
import { useSlideStep } from '@/deck/slide-context'
import { Place, SlideFrame, SlideTitle } from './SlideFrame'

/* --- Chart geometry ------------------------------------------------------- */

const CHART = { width: 940, height: 536, headerHeight: 60 }
const PLOT = createPlot(CHART.width, CHART.height - CHART.headerHeight, {
  top: 12,
  right: 60,
  bottom: 68,
  left: 130,
})
const Y_MAX = 2.6
const CAPACITY = SLIDE_CLOUD.chart.capacityMultiple
/** The cloud line is nudged up a few pixels so it reads as a second series
 *  riding on demand rather than hiding underneath it. */
const CLOUD_OFFSET = 9

const xScale = (month: number): number =>
  (month / (DEMAND_PROFILE.length - 1)) * PLOT.innerWidth
const yScale = (value: number): number =>
  PLOT.innerHeight - (value / Y_MAX) * PLOT.innerHeight

const Y_TICKS = [
  { value: 0, label: '0' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
]
const X_TICKS = MONTH_LABELS.map((label, month) => ({ value: month, label }))

/*
 * States: 0 title and empty axes · 1 demand, then the bought capacity ·
 * 2 idle money and queued work · 3 the cloud follows demand · 4 three AWS
 * blocks · 5 the key frame · 6 KPIs.
 */
export function Slide2Cloud() {
  const { step } = useSlideStep()

  return (
    <SlideFrame>
      <Place top={0} width={1680}>
        <Reveal at={0} from="none">
          <SlideTitle size="h2">{SLIDE_CLOUD.title}</SlideTitle>
        </Reveal>
      </Place>

      <Place top={84} width={1680}>
        <Reveal at={0} from="none">
          <p className="text-label text-ink-muted">{SLIDE_CLOUD.subtitle}</p>
        </Reveal>
      </Place>

      <Place top={176} width={CHART.width} height={CHART.height}>
        <DemandChart step={step} />
      </Place>

      <Place top={176} left={1000} width={680} height={580}>
        <PlatformStack />
      </Place>

      <Place top={772} width={1680} height={100}>
        <div className="grid h-full grid-cols-3 gap-12">
          {SLIDE_CLOUD.kpis.map((kpi, index) => (
            <Reveal
              key={kpi.label}
              at={6}
              index={index}
              className="h-full border-t-2 border-rule-strong pt-5"
            >
              <p className="font-serif text-h3 font-semibold text-cloud tabular-nums">
                {kpi.value}
              </p>
              <p className="mt-1 text-micro text-ink-muted">{kpi.label}</p>
            </Reveal>
          ))}
        </div>
      </Place>
    </SlideFrame>
  )
}

/* -------------------------------------------------------------------------- */
/*  Demand vs capacity                                                         */
/* -------------------------------------------------------------------------- */

function DemandChart({ step }: { step: number }) {
  const clipId = useId()
  const aboveClip = `${clipId}-above`
  const belowClip = `${clipId}-below`

  const paths = useMemo(() => {
    const demandLine = line<number>()
      .x((_, i) => xScale(i))
      .y((value) => yScale(value))
      .curve(curveMonotoneX)

    const cloudLine = line<number>()
      .x((_, i) => xScale(i))
      .y((value) => yScale(value) - CLOUD_OFFSET)
      .curve(curveMonotoneX)

    // One shape for the whole gap between demand and the bought capacity;
    // clipping it above and below the capacity line splits it into the two
    // stories without ever having to solve for the crossing points.
    const gap = area<number>()
      .x((_, i) => xScale(i))
      .y0(yScale(CAPACITY))
      .y1((value) => yScale(value))
      .curve(curveMonotoneX)

    return {
      demand: demandLine([...DEMAND_PROFILE]) ?? '',
      cloud: cloudLine([...DEMAND_PROFILE]) ?? '',
      gap: gap([...DEMAND_PROFILE]) ?? '',
      capacity: `M 0 ${yScale(CAPACITY)} L ${PLOT.innerWidth} ${yScale(CAPACITY)}`,
    }
  }, [])

  const capacityY = yScale(CAPACITY)

  return (
    <ChartBlock
      title={SLIDE_CLOUD.chart.title}
      tag={<IllustrativeTag />}
      width={CHART.width}
      height={CHART.height}
      headerHeight={CHART.headerHeight}
      ariaLabel="Demanda mensual de I+D frente a la capacidad fija comprada on-premise"
    >
      <defs>
          <clipPath id={aboveClip}>
            <rect x={0} y={0} width={PLOT.innerWidth} height={capacityY} />
          </clipPath>
          <clipPath id={belowClip}>
            <rect
              x={0}
              y={capacityY}
              width={PLOT.innerWidth}
              height={PLOT.innerHeight - capacityY}
            />
          </clipPath>
        </defs>

        <PlotArea plot={PLOT}>
          <GridLinesY plot={PLOT} ticks={Y_TICKS} scale={yScale} />
          <AxisY plot={PLOT} ticks={Y_TICKS} scale={yScale} label={SLIDE_CLOUD.chart.yLabel} />
          <AxisX plot={PLOT} ticks={X_TICKS} scale={xScale} />

          {/* Step 2 — idle money below the line, queued work above it */}
          <g clipPath={`url(#${belowClip})`}>
            <FadeShape d={paths.gap} visible={step >= 2} className="fill-onprem/20" />
          </g>
          <g clipPath={`url(#${aboveClip})`}>
            <FadeShape d={paths.gap} visible={step >= 2} className="fill-warn/30" delay={0.08} />
          </g>

          {/* Step 1 — what R&D actually asks for, then what on-premise buys */}
          <DrawPath d={paths.demand} visible={step >= 1} className="stroke-demand" strokeWidth={4} />
          <DrawPath
            d={paths.capacity}
            visible={step >= 1}
            className="stroke-onprem"
            strokeWidth={4}
            // Only on the way in: stepping back hides both lines together.
            delay={step >= 1 ? SLIDE_CLOUD.chart.capacityDelay : 0}
          />

          {/* Step 3 — the cloud follows the demand line */}
          <DrawPath d={paths.cloud} visible={step >= 3} className="stroke-cloud" strokeWidth={5} />

          {/* Direct labels: identity never depends on colour alone. */}
          <SeriesLabel
            x={8}
            y={yScale(0.45) + 48}
            visible={step >= 1}
            className="fill-demand text-micro font-medium"
          >
            {SLIDE_CLOUD.chart.demandLabel}
          </SeriesLabel>

          <SeriesLabel
            x={PLOT.innerWidth - 4}
            y={capacityY - 24}
            anchor="end"
            visible={step >= 1}
            className="fill-onprem text-micro font-medium"
            delay={step >= 1 ? SLIDE_CLOUD.chart.capacityDelay + 0.3 : 0}
            halo
          >
            {SLIDE_CLOUD.chart.capacityLabel}
          </SeriesLabel>

          <SeriesLabel
            x={xScale(5)}
            y={(capacityY + yScale(0.45)) / 2 + 8}
            anchor="middle"
            visible={step >= 2}
            className="fill-onprem text-label font-semibold"
            halo
          >
            {SLIDE_CLOUD.chart.idleLabel}
          </SeriesLabel>

          <SeriesLabel
            x={xScale(3)}
            y={yScale(2.2) - 22}
            anchor="middle"
            visible={step >= 2}
            className="fill-warn text-label font-semibold"
            delay={0.08}
            halo
          >
            {SLIDE_CLOUD.chart.queueLabel}
          </SeriesLabel>

          <SeriesLabel
            x={PLOT.innerWidth - 4}
            y={yScale(0.55) + 52}
            anchor="end"
            visible={step >= 3}
            className="fill-cloud text-micro font-medium"
          >
            {SLIDE_CLOUD.chart.cloudLabel}
          </SeriesLabel>
      </PlotArea>
    </ChartBlock>
  )
}

/* -------------------------------------------------------------------------- */
/*  Platform stack                                                             */
/* -------------------------------------------------------------------------- */

/** Height of the encryption caption row that sits above the frame. */
const LOCK_ROW = 44

function PlatformStack() {
  return (
    <div className="relative h-full">
      {/* Step 5 — the lock caption and the frame that wraps all three blocks.
          Both live outside the card flow, so nothing moves when they appear. */}
      <Reveal at={5} from="none" className="absolute inset-x-0 top-0">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <LockGlyph />
          <span className="text-micro font-medium tracking-[0.06em] text-accent uppercase">
            {SLIDE_CLOUD.encryption}
          </span>
        </div>
      </Reveal>

      <Reveal
        at={5}
        from="none"
        className="absolute inset-x-0 bottom-0"
        style={{ top: LOCK_ROW }}
      >
        <div className="h-full w-full border-2 border-accent" />
      </Reveal>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4"
        style={{ top: LOCK_ROW }}
      >
        {SLIDE_CLOUD.platformCards.map((card, index) => (
          <Reveal key={card.kicker} at={4} index={index} className="flex-1">
            <article className="flex h-full flex-col justify-center border-l-2 border-rule-strong bg-panel px-6 py-4">
              <p className="text-micro font-semibold tracking-[0.14em] text-cloud uppercase">
                {card.kicker}
              </p>
              <h3 className="mt-1 text-label font-semibold text-ink">{card.services}</h3>
              <p className="mt-1 text-micro leading-[1.3] text-ink-muted">{card.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

function LockGlyph() {
  return (
    <svg width={22} height={26} viewBox="0 0 22 26" aria-hidden className="shrink-0">
      <path
        d="M6 11V7.5a5 5 0 0 1 10 0V11"
        fill="none"
        className="stroke-accent"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <rect
        x={2.5}
        y={11}
        width={17}
        height={13}
        rx={2}
        fill="none"
        className="stroke-accent"
        strokeWidth={2.2}
      />
      <circle cx={11} cy={17.5} r={1.9} className="fill-accent" />
    </svg>
  )
}
