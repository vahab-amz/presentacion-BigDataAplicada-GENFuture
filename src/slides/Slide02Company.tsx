'use client'

import { useMemo } from 'react'
import { Reveal } from '@/components/Reveal'
import { ChartBlock, GrowBar } from '@/components/chart/primitives'
import { IllustrativeTag } from '@/components/ui/Tag'
import { SLIDE_2, UI_TEXT } from '@/data/deck'
import { MONTH_LABELS, computeCostModel } from '@/data/cost-model'
import { formatUsdAxis, formatUsdCompact } from '@/lib/format'
import { Place, SlideFrame, SlideTitle } from './SlideFrame'

/* --- Cash-profile chart geometry, inside the ChartBlock plot -------------- */

const CP = {
  width: 920,
  blockHeight: 400,
  headerHeight: 60,
  axisRight: 100,
  plotX0: 110,
  /**
   * Anything above this is drawn to the ceiling, visibly cut, and labelled with
   * its real value. A shared scale is the only honest way to compare the two
   * profiles, and month 0 on-premise is eight times the next largest month.
   */
  scaleMax: 90_000,
  stripHeight: 102,
  onPrem: { label: 20, top: 30 },
  cloud: { label: 178, top: 188 },
  monthLabels: 320,
  months: 12,
} as const

const CP_PLOT_WIDTH = CP.width - CP.plotX0
const SLOT = CP_PLOT_WIDTH / CP.months
const BAR_WIDTH = SLOT - 22
/** 90k would sit on the lane label; the ceiling is implied by the cut bar. */
const Y_TICKS = [0, 30_000, 60_000]

export function Slide02Company() {
  const model = useMemo(() => computeCostModel(), [])

  return (
    <SlideFrame>
      <Place top={0} width={1560}>
        <Reveal at={0} from="none">
          <SlideTitle size="h2">{SLIDE_2.title}</SlideTitle>
        </Reveal>
      </Place>

      {/* Step 1 — what kind of company this is */}
      <Place top={156} width={1680} height={180}>
        <div className="grid h-full grid-cols-3 gap-12">
          {SLIDE_2.cards.map((card, index) => (
            <Reveal
              key={card.heading}
              at={1}
              index={index}
              className="h-full border-t-2 border-rule-strong pt-6"
            >
              <h3 className="font-serif text-h3 font-semibold text-ink">{card.heading}</h3>
              <p className="mt-3 text-label text-ink-muted">{card.body}</p>
            </Reveal>
          ))}
        </div>
      </Place>

      {/* Step 2 — the size of the pot everyone is drawing from */}
      <Place top={356} width={700} height={400}>
        <Reveal at={2} className="h-full">
          <p className="font-serif text-hero font-semibold text-accent tabular-nums">
            {SLIDE_2.bigNumber.value}
          </p>
          <p className="mt-5 max-w-[660px] text-label text-ink">{SLIDE_2.bigNumber.lede}</p>
          <p className="mt-6 max-w-[660px] border-l-2 border-rule pl-5 text-micro text-ink-muted">
            {SLIDE_2.bigNumber.footnote}
          </p>
          <p className="mt-4 text-micro text-ink-faint">{SLIDE_2.bigNumber.attribution}</p>
        </Reveal>
      </Place>

      {/* Step 3 — the same two options seen as cash out of the door */}
      <Place top={356} left={760} width={CP.width} height={CP.blockHeight}>
        <Reveal at={3} className="h-full">
          <CashProfile model={model} />
        </Reveal>
      </Place>

      {/* Step 4 */}
      <Place top={776} width={1680} height={88}>
        <Reveal at={4} className="h-full">
          <div className="flex h-full items-center border-l-4 border-accent bg-accent/10 px-10">
            <p className="font-serif text-lede font-semibold text-ink">{SLIDE_2.takeaway}</p>
          </div>
        </Reveal>
      </Place>
    </SlideFrame>
  )
}

/* -------------------------------------------------------------------------- */

type Model = ReturnType<typeof computeCostModel>

function CashProfile({ model }: { model: Model }) {
  const onPrem = model.onPrem.monthly.slice(0, CP.months).map((m) => m.total)
  const cloud = model.cloud.monthly.slice(0, CP.months).map((m) => m.total)

  return (
    <ChartBlock
      title={SLIDE_2.cashProfile.title}
      tag={<IllustrativeTag />}
      width={CP.width}
      height={CP.blockHeight}
      headerHeight={CP.headerHeight}
      ariaLabel="Salida de caja mensual de los primeros doce meses: on-premise frente a nube"
    >
      <Strip
        values={onPrem}
        top={CP.onPrem.top}
        labelY={CP.onPrem.label}
        name={UI_TEXT.onPrem}
        fillClass="fill-onprem"
        textClass="fill-onprem"
      />
      <Strip
        values={cloud}
        top={CP.cloud.top}
        labelY={CP.cloud.label}
        name={UI_TEXT.cloud}
        fillClass="fill-cloud"
        textClass="fill-cloud"
      />

      <g aria-hidden>
        {[0, 11].map((month) => (
          <text
            key={month}
            x={CP.plotX0 + month * SLOT + SLOT / 2}
            y={CP.monthLabels}
            textAnchor="middle"
            className="fill-ink-faint text-micro"
          >
            {MONTH_LABELS[month]}
          </text>
        ))}
      </g>
    </ChartBlock>
  )
}

function Strip({
  values,
  top,
  labelY,
  name,
  fillClass,
  textClass,
}: {
  values: readonly number[]
  top: number
  labelY: number
  name: string
  fillClass: string
  textClass: string
}) {
  const baseline = top + CP.stripHeight
  const toHeight = (value: number) => Math.min(1, value / CP.scaleMax) * CP.stripHeight

  const peak = values.reduce((a, b) => Math.max(a, b), 0)
  const rest = values.slice(1)
  const restMin = rest.reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)
  const restMax = rest.reduce((a, b) => Math.max(a, b), 0)
  const flat = Math.abs(restMax - restMin) / Math.max(1, restMax) < 0.02
  const restLabel = flat
    ? `Resto del año: ${formatUsdCompact(restMax)} al mes`
    : `Resto del año: ${formatUsdCompact(restMin)} – ${formatUsdCompact(restMax)} al mes`

  const barX = (month: number) => CP.plotX0 + month * SLOT + (SLOT - BAR_WIDTH) / 2

  return (
    <g>
      <text x={0} y={labelY} className={`${textClass} text-label tracking-[0.18em] uppercase`}>
        {name}
      </text>
      {peak > CP.scaleMax ? (
        <text x={250} y={labelY} className={`${textClass} text-micro font-semibold tabular-nums`}>
          {`${formatUsdCompact(peak)} · escala cortada`}
        </text>
      ) : null}
      <text
        x={CP.width}
        y={labelY}
        textAnchor="end"
        className="fill-ink-muted text-micro tabular-nums"
      >
        {restLabel}
      </text>

      <g aria-hidden>
        {Y_TICKS.map((tick) => {
          const y = baseline - toHeight(tick)
          return (
            <g key={tick}>
              <line
                x1={CP.plotX0}
                x2={CP.width}
                y1={y}
                y2={y}
                className={tick === 0 ? 'stroke-rule-strong' : 'stroke-rule'}
                strokeWidth={1}
              />
              <text
                x={CP.axisRight}
                y={y}
                dy="0.34em"
                textAnchor="end"
                className="fill-ink-faint text-micro tabular-nums"
              >
                {formatUsdAxis(tick)}
              </text>
            </g>
          )
        })}
      </g>

      {values.map((value, month) => {
        const height = toHeight(value)
        return (
          <GrowBar
            key={month}
            x={barX(month)}
            y={baseline - height}
            width={BAR_WIDTH}
            height={height}
            baseline={baseline}
            visible
            className={fillClass}
            delay={month * 0.03}
          />
        )
      })}

      {/* A bar that runs off the top is cut, never silently clipped. */}
      {peak > CP.scaleMax ? (
        <g aria-hidden>
          {[10, 20].map((offset) => (
            <line
              key={offset}
              x1={barX(0) - 5}
              x2={barX(0) + BAR_WIDTH + 5}
              y1={top + offset + 6}
              y2={top + offset - 2}
              className="stroke-bg"
              strokeWidth={5}
            />
          ))}
        </g>
      ) : null}
    </g>
  )
}
