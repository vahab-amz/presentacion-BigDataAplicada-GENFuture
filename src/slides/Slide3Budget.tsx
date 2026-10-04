'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { CountUp } from '@/components/CountUp'
import { Reveal } from '@/components/Reveal'
import { IllustrativeTag } from '@/components/ui/Tag'
import {
  DEFAULT_SCENARIO,
  ONE_OFF,
  SCENARIOS,
  STORAGE_TIERS,
  UNIT_METRICS,
  activeLines,
  archiveSaving,
  maxMonthlyTotal,
  monthlyTotal,
  scenarioById,
  type BudgetLineId,
  type ScenarioId,
} from '@/data/budget-scenarios'
import { SLIDE_BUDGET } from '@/data/deck'
import { DURATION, EASE_OUT, enterTransition, instantTransition } from '@/deck/motion-presets'
import { useSlideStep } from '@/deck/slide-context'
import { formatDecimal, formatPercent, formatUsd } from '@/lib/format'
import { Place, SlideFrame, SlideTitle } from './SlideFrame'

/*
 * States: 0 title · 1 CAPEX vs. OPEX · 2 stacked bars per scenario ·
 * 3 scenario buttons and the detail panel · 4 unit metrics.
 */

/** One colour per line, the same in the bars and the panel. */
const LINE_COLOUR: Record<BudgetLineId, { fill: string; bg: string }> = {
  cold: { fill: 'fill-tier-cold', bg: 'bg-tier-cold' },
  hot: { fill: 'fill-accent', bg: 'bg-accent' },
  databases: { fill: 'fill-tier-db', bg: 'bg-tier-db' },
  compute: { fill: 'fill-cloud', bg: 'bg-cloud' },
  personal: { fill: 'fill-warn', bg: 'bg-warn' },
}

const perMonth = (value: number) => `${formatUsd(value)}${SLIDE_BUDGET.chart.perMonth}`

export function Slide3Budget() {
  const { step } = useSlideStep()
  const [selected, setSelected] = useState<ScenarioId>(DEFAULT_SCENARIO)

  return (
    <SlideFrame>
      <Place top={0} width={1680}>
        <Reveal at={0} from="none">
          <SlideTitle size="h2">{SLIDE_BUDGET.title}</SlideTitle>
        </Reveal>
      </Place>
      <Place top={92} width={1680}>
        <Reveal at={0} from="none">
          <p className="text-label text-ink-muted">{SLIDE_BUDGET.subtitle}</p>
        </Reveal>
      </Place>

      <Place top={176} width={540} height={520}>
        <Contrast />
      </Place>

      <Place top={176} left={580} width={CHART.width} height={CHART.height}>
        <Reveal at={2} from="none" className="h-full">
          <ScenarioChart selected={step >= 3 ? selected : null} visible={step >= 2} />
        </Reveal>
      </Place>

      <Place top={176} left={1200} width={480} height={530}>
        <DetailPanel selected={selected} onSelect={setSelected} step={step} />
      </Place>

      <Place top={734} width={1680} height={130}>
        <UnitMetrics visible={step >= 4} />
      </Place>
    </SlideFrame>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — physical model vs. cloud                                          */
/* -------------------------------------------------------------------------- */

function Contrast() {
  const { capex, opex, footer } = SLIDE_BUDGET.contrast
  const columns = [
    { ...capex, tone: 'onprem' as const },
    { ...opex, tone: 'cloud' as const },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-2 gap-8">
        {columns.map((column, index) => (
          <Reveal
            key={column.title}
            at={1}
            index={index * 3}
            className={`border-t-4 pt-4 ${column.tone === 'onprem' ? 'border-onprem' : 'border-cloud'}`}
          >
            <h3
              className={`text-label font-semibold ${column.tone === 'onprem' ? 'text-onprem' : 'text-cloud'}`}
            >
              {column.title}
            </h3>
            <ul className="mt-4 space-y-4">
              {column.points.map((point) => (
                <li key={point} className="flex gap-3 text-micro text-ink">
                  <Marker tone={column.tone} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
      <Reveal at={1} index={6} className="mt-8 flex items-center gap-4 border-l-2 border-rule-strong pl-5">
        <ShieldGlyph />
        <p className="text-micro text-ink-muted">{footer}</p>
      </Reveal>
    </div>
  )
}

function Marker({ tone }: { tone: 'onprem' | 'cloud' }) {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" aria-hidden className="mt-[6px] shrink-0">
      {tone === 'onprem' ? (
        <path d="M6 6l10 10M16 6 6 16" className="stroke-onprem" strokeWidth={2.6} strokeLinecap="round" />
      ) : (
        <path
          d="M4.5 11.5 9 16l8.5-9.5"
          fill="none"
          className="stroke-cloud"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function ShieldGlyph() {
  return (
    <svg width={30} height={34} viewBox="0 0 30 34" aria-hidden className="shrink-0">
      <path
        d="M15 2.5 3.5 7v8.5c0 7.6 4.9 13.2 11.5 16 6.6-2.8 11.5-8.4 11.5-16V7L15 2.5z"
        fill="none"
        className="stroke-accent"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <path
        d="m9.5 17 4 4 7-8"
        fill="none"
        className="stroke-accent"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — stacked monthly cost per scenario                                 */
/* -------------------------------------------------------------------------- */

const CHART = {
  width: 580,
  height: 530,
  slot: 580 / 3,
  bar: 112,
  baseline: 388,
  /** Pixel height of the tallest possible stack. */
  plotHeight: 300,
  gap: 2,
  radius: 4,
} as const

/** A rect with only its top corners rounded: the data end of a stack. */
function topRounded(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, h / 2, w / 2)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

function ScenarioChart({ selected, visible }: { selected: ScenarioId | null; visible: boolean }) {
  const reduceMotion = useReducedMotion()
  const { mode } = useSlideStep()
  const instant = reduceMotion === true || mode === 'static'
  const lines = activeLines()
  const scale = CHART.plotHeight / maxMonthlyTotal()

  return (
    <div className="relative h-full">
      <div className="absolute top-0 left-0">
        <IllustrativeTag label={SLIDE_BUDGET.chart.tag} />
      </div>
      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        width={CHART.width}
        height={CHART.height}
        role="img"
        aria-label={SLIDE_BUDGET.chart.ariaLabel}
      >
        <line
          x1={0}
          x2={CHART.width}
          y1={CHART.baseline}
          y2={CHART.baseline}
          className="stroke-rule-strong"
          strokeWidth={1}
        />

        {SCENARIOS.map((scenario, index) => {
          const x = index * CHART.slot + (CHART.slot - CHART.bar) / 2
          const cx = index * CHART.slot + CHART.slot / 2
          const total = monthlyTotal(scenario.id)
          const top = CHART.baseline - total * scale
          const dimmed = selected !== null && selected !== scenario.id

          // Stacked in list order from the top down, so the stack reads in
          // the same order as the panel beside it.
          let cursor = top
          const segments = lines.map((line, lineIndex) => {
            const height = line.values[scenario.id] * scale
            const segment = { line, y: cursor, height, isTop: lineIndex === 0 }
            cursor += height
            return segment
          })

          return (
            <motion.g
              key={scenario.id}
              initial={false}
              animate={{ opacity: dimmed ? 0.3 : 1 }}
              transition={instant ? instantTransition : { duration: DURATION.base, ease: EASE_OUT }}
            >
              <motion.g
                // Grows from the baseline: the stack's own bottom edge.
                style={{ originY: 1 }}
                initial={false}
                animate={instant ? { scaleY: 1 } : { scaleY: visible ? 1 : 0 }}
                transition={instant ? instantTransition : enterTransition(0.1 + index * 0.12)}
              >
                {segments.map(({ line, y, height, isTop }) => {
                  // A 2 px surface gap under every segment but the last.
                  const h = Math.max(0, height - (y + height < CHART.baseline - 0.5 ? CHART.gap : 0))
                  return isTop ? (
                    <path
                      key={line.id}
                      d={topRounded(x, y, CHART.bar, h, CHART.radius)}
                      className={LINE_COLOUR[line.id].fill}
                    />
                  ) : (
                    <rect
                      key={line.id}
                      x={x}
                      y={y}
                      width={CHART.bar}
                      height={h}
                      className={LINE_COLOUR[line.id].fill}
                    />
                  )
                })}
              </motion.g>

              <text
                x={cx}
                y={top - 16}
                textAnchor="middle"
                className="fill-ink text-label font-semibold tabular-nums"
              >
                {perMonth(total)}
              </text>
              <text
                x={cx}
                y={CHART.baseline + 42}
                textAnchor="middle"
                className={`text-label font-semibold ${selected === scenario.id ? 'fill-accent' : 'fill-ink'}`}
              >
                {scenario.name}
              </text>
              <text
                x={cx}
                y={CHART.baseline + 74}
                textAnchor="middle"
                className="fill-ink-muted text-micro tabular-nums"
              >
                {scenario.volumeLabel}
              </text>
              <text
                x={cx}
                y={CHART.baseline + 110}
                textAnchor="middle"
                className="fill-ink-faint text-micro tabular-nums"
              >
                {SLIDE_BUDGET.chart.oneOff(formatUsd(ONE_OFF.values[scenario.id]))
                  .split(/ (?=una)/)
                  .map((part, line) => (
                    <tspan key={part} x={cx} dy={line === 0 ? 0 : 30}>
                      {part}
                    </tspan>
                  ))}
              </text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Steps 2–3 — legend, then the interactive detail panel                      */
/* -------------------------------------------------------------------------- */

function DetailPanel({
  selected,
  onSelect,
  step,
}: {
  selected: ScenarioId
  onSelect: (id: ScenarioId) => void
  step: number
}) {
  const scenario = scenarioById(selected)
  const showValues = step >= 3

  return (
    <div className="flex h-full flex-col">
      {/* Mouse-only: out of the tab order, and blurred as soon as the click
          ends, so Space and the arrows always reach the deck. */}
      <Reveal at={3} className="grid grid-cols-3 gap-2" from="none">
        {SCENARIOS.map((option) => {
          const active = option.id === selected
          return (
            <button
              key={option.id}
              type="button"
              tabIndex={-1}
              aria-pressed={active}
              data-scenario={option.id}
              onClick={() => onSelect(option.id)}
              onPointerUp={(event) => event.currentTarget.blur()}
              className={`h-[56px] border-2 text-[22px] font-semibold transition-colors ${
                active
                  ? 'border-accent bg-accent text-bg'
                  : 'border-rule-strong bg-panel text-ink-muted hover:border-accent hover:text-ink'
              }`}
            >
              {option.name}
            </button>
          )
        })}
      </Reveal>

      <Reveal at={3} from="none" className="mt-4 flex items-baseline justify-between">
        <p className="font-serif text-body-lg font-semibold text-ink">
          {SLIDE_BUDGET.detail.heading(scenario.name)}
        </p>
        <p className="text-micro text-ink-muted tabular-nums">{scenario.volumeLabel}</p>
      </Reveal>

      <div className="mt-3 border-t border-rule">
        {activeLines().map((line, index) => (
          <Reveal
            key={line.id}
            at={2}
            index={index}
            className="flex min-h-[62px] items-center gap-4 border-b border-rule py-[6px]"
          >
            <span className={`h-[34px] w-[14px] shrink-0 ${LINE_COLOUR[line.id].bg}`} aria-hidden />
            <p className="min-w-0 flex-1 text-micro leading-[1.2] text-ink">
              {line.label}
              {line.detail ? <span className="block text-ink-faint">{line.detail}</span> : null}
            </p>
            {/* Step 2 is the legend; the amounts arrive with the panel. */}
            <Reveal
              at={3}
              from="none"
              className="w-[120px] shrink-0 text-right font-serif text-label font-semibold text-ink"
            >
              <CountUp value={line.values[selected]} format={formatUsd} active={showValues} />
            </Reveal>
          </Reveal>
        ))}
      </div>

      <Reveal at={3} from="none" className="flex items-center justify-between gap-4 pt-3">
        <p className="text-micro leading-[1.2] font-semibold text-ink">{SLIDE_BUDGET.detail.total}</p>
        <p className="font-serif text-lede leading-none font-semibold whitespace-nowrap text-accent">
          <CountUp value={monthlyTotal(selected)} format={perMonth} active={showValues} />
        </p>
      </Reveal>
      <Reveal at={3} from="none" className="mt-2 flex items-baseline justify-between gap-4">
        <p className="text-micro text-ink-muted">{SLIDE_BUDGET.detail.oneOff}</p>
        <p className="font-serif text-label font-semibold text-ink-muted">
          <CountUp value={ONE_OFF.values[selected]} format={formatUsd} active={showValues} />
        </p>
      </Reveal>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step 4 — unit metrics                                                      */
/* -------------------------------------------------------------------------- */

function UnitMetrics({ visible }: { visible: boolean }) {
  const { kpis } = SLIDE_BUDGET
  const saving = archiveSaving()

  return (
    <div className="grid h-full grid-cols-3 gap-12">
      <Reveal at={4} index={0} className="h-full border-t-2 border-rule-strong pt-4">
        <p className="font-serif text-h3 leading-none font-semibold text-cloud tabular-nums">
          ~{formatUsd(UNIT_METRICS.perTbMonth.value, 2)}
        </p>
        <p className="mt-3 text-micro text-ink-muted">{kpis.perTb.label}</p>
      </Reveal>
      <Reveal at={4} index={1} className="h-full border-t-2 border-rule-strong pt-4">
        <p className="font-serif text-h3 leading-none font-semibold text-cloud tabular-nums">
          {UNIT_METRICS.perSample.min}–{formatUsd(UNIT_METRICS.perSample.max)}
        </p>
        <p className="mt-3 text-micro text-ink-muted">{kpis.perSample.label}</p>
      </Reveal>
      <Reveal at={4} index={2} className="h-full border-t-2 border-rule-strong pt-4">
        <div className="flex items-end gap-6">
          <p className="font-serif text-h3 leading-none font-semibold text-cloud tabular-nums">
            −{formatPercent(saving)}
          </p>
          <ArchiveBar visible={visible} />
        </div>
        <p className="mt-3 text-micro text-ink-muted">{kpis.archive.label}</p>
      </Reveal>
    </div>
  )
}

const ARCHIVE = { width: 300, height: 52, track: 250, barY: 34, barHeight: 14 } as const

/** A bar that shrinks from the hot rate to the cold rate once it is on screen. */
function ArchiveBar({ visible }: { visible: boolean }) {
  const reduceMotion = useReducedMotion()
  const { mode } = useSlideStep()
  const instant = reduceMotion === true || mode === 'static'
  const hot = STORAGE_TIERS.hot.usdPerGbMonth
  const cold = STORAGE_TIERS.cold.usdPerGbMonth
  const ratio = cold / hot
  const rate = (value: number) => formatDecimal(value, 3)

  return (
    <svg
      width={ARCHIVE.width}
      height={ARCHIVE.height}
      viewBox={`0 0 ${ARCHIVE.width} ${ARCHIVE.height}`}
      aria-hidden
      className="shrink-0"
    >
      <rect
        x={0}
        y={ARCHIVE.barY}
        width={ARCHIVE.track}
        height={ARCHIVE.barHeight}
        rx={3}
        className="fill-rule"
      />
      <text
        x={ARCHIVE.track}
        y={ARCHIVE.barY - 10}
        textAnchor="end"
        className="fill-ink-faint text-micro tabular-nums"
      >
        {rate(hot)}
      </text>
      <motion.rect
        x={0}
        y={ARCHIVE.barY}
        height={ARCHIVE.barHeight}
        rx={3}
        className="fill-cloud"
        initial={false}
        animate={{ width: ARCHIVE.track * (visible ? ratio : 1) }}
        transition={
          instant
            ? instantTransition
            : visible
              ? { duration: 1.1, ease: EASE_OUT, delay: 0.5 }
              : instantTransition
        }
      />
      <motion.text
        x={0}
        y={ARCHIVE.barY - 10}
        className="fill-cloud text-micro font-semibold tabular-nums"
        initial={false}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={instant ? instantTransition : { duration: DURATION.base, delay: visible ? 1.3 : 0 }}
      >
        {rate(cold)}
      </motion.text>
    </svg>
  )
}
