'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Reveal } from '@/components/Reveal'
import { IllustrativeTag, Kicker } from '@/components/ui/Tag'
import { SLIDE_1, type TimelineLane } from '@/data/deck'
import { DURATION, EASE_OUT, instantTransition } from '@/deck/motion-presets'
import { useSlideStep } from '@/deck/slide-context'
import { HeroBackdrop } from './HeroBackdrop'
import { Place, SlideFrame, SlideTitle } from './SlideFrame'

/* --- Timeline geometry, in stage pixels ---------------------------------- */

const TL = {
  width: 1680,
  height: 496,
  /** Right edge of the phase-name column. */
  labelRight: 400,
  trackX0: 440,
  trackX1: 1600,
  months: SLIDE_1.timeline.months,
  barHeight: 22,
  onPrem: { header: 22, rows: [62, 108, 154] as const },
  bracket: { line: 232, label: 216 },
  cloud: { header: 278, rows: [318, 364, 410] as const },
  axis: { line: 452, labels: 480 },
} as const

const monthToX = (month: number): number =>
  TL.trackX0 + (month / TL.months) * (TL.trackX1 - TL.trackX0)

const EVEN_MONTHS = Array.from({ length: TL.months / 2 + 1 }, (_, i) => i * 2)

export function Slide01Race() {
  const { step } = useSlideStep()

  return (
    <SlideFrame>
      {/* Full-bleed backdrop: it has to run behind the stage padding too. */}
      <div className="absolute -inset-x-[120px] -top-[84px] -bottom-[132px]">
        <HeroBackdrop dimmed={step >= 1} />
      </div>

      <Place top={0}>
        <Reveal at={0} from="none">
          <Kicker>{SLIDE_1.kicker}</Kicker>
        </Reveal>
      </Place>

      <Place top={46} width={1420}>
        <Reveal at={0} from="none">
          <SlideTitle>{SLIDE_1.title}</SlideTitle>
        </Reveal>
      </Place>

      <Place top={0} width={TL.width}>
        <Reveal at={1} from="none" className="flex justify-end">
          <IllustrativeTag label={SLIDE_1.timeline.tag} />
        </Reveal>
      </Place>

      {/* Step 1 — the whole timeline, frame and all, arrives together. */}
      <Place top={252} width={TL.width} height={TL.height}>
        <Reveal at={1} from="none" className="h-full">
          <Timeline step={step} />
        </Reveal>
      </Place>

      <Place top={764} width={TL.width} height={92}>
        <Reveal at={3} className="h-full">
          <div className="flex h-full items-center gap-10 border-l-4 border-warn bg-panel/75 px-9">
            <p className="flex-1 text-body text-ink">{SLIDE_1.callout.text}</p>
            <p className="shrink-0 text-micro text-ink-faint">{SLIDE_1.callout.attribution}</p>
          </div>
        </Reveal>
      </Place>
    </SlideFrame>
  )
}

/* -------------------------------------------------------------------------- */

function Timeline({ step }: { step: number }) {
  const barsVisible = step >= 1
  const bracketVisible = step >= 2

  return (
    <svg
      viewBox={`0 0 ${TL.width} ${TL.height}`}
      width={TL.width}
      height={TL.height}
      role="img"
      aria-label="Cronograma comparado: on-premise frente a nube, meses 0 a 12"
    >
      <g aria-hidden>
        {EVEN_MONTHS.map((month) => (
          <line
            key={month}
            x1={monthToX(month)}
            x2={monthToX(month)}
            y1={TL.onPrem.header + 18}
            y2={TL.axis.line}
            className="stroke-rule"
            strokeWidth={1}
          />
        ))}
        <line
          x1={TL.trackX0}
          x2={TL.trackX1}
          y1={TL.axis.line}
          y2={TL.axis.line}
          className="stroke-rule-strong"
          strokeWidth={1}
        />
      </g>

      <Lane
        lane={SLIDE_1.timeline.onPrem}
        headerY={TL.onPrem.header}
        rowCenters={TL.onPrem.rows}
        fillClass="fill-onprem"
        strokeClass="stroke-onprem"
        mutedFillClass="fill-onprem/25"
        mutedIndex={1}
        markerFrom={TL.onPrem.header + 18}
        markerTo={TL.bracket.line}
        dotY={TL.onPrem.rows[2]}
        visible={barsVisible}
        resultAnchor="end"
        delayBase={0}
      />

      <Lane
        lane={SLIDE_1.timeline.cloud}
        headerY={TL.cloud.header}
        rowCenters={TL.cloud.rows}
        fillClass="fill-cloud"
        strokeClass="stroke-cloud"
        markerFrom={TL.bracket.line}
        markerTo={TL.cloud.rows[2] + 22}
        dotY={TL.cloud.rows[2]}
        visible={barsVisible}
        resultAnchor="start"
        delayBase={0.18}
      />

      <AdvantageBracket visible={bracketVisible} />

      <g aria-hidden>
        {EVEN_MONTHS.map((month) => (
          <text
            key={month}
            x={monthToX(month)}
            y={TL.axis.labels}
            textAnchor="middle"
            className="fill-ink-faint text-micro tabular-nums"
          >
            {month}
          </text>
        ))}
        <text
          x={0}
          y={TL.axis.labels}
          className="fill-ink-faint text-micro tracking-[0.12em] uppercase"
        >
          {SLIDE_1.timeline.axisLabel}
        </text>
      </g>
    </svg>
  )
}

function Lane({
  lane,
  headerY,
  rowCenters,
  fillClass,
  strokeClass,
  mutedFillClass,
  mutedIndex,
  markerFrom,
  markerTo,
  dotY,
  visible,
  resultAnchor,
  delayBase,
}: {
  lane: TimelineLane
  headerY: number
  rowCenters: readonly number[]
  fillClass: string
  strokeClass: string
  mutedFillClass?: string
  mutedIndex?: number
  markerFrom: number
  markerTo: number
  dotY: number
  visible: boolean
  resultAnchor: 'start' | 'end'
  delayBase: number
}) {
  const reduceMotion = useReducedMotion()
  const { mode } = useSlideStep()
  const instant = reduceMotion === true || mode === 'static'
  const resultX = monthToX(lane.resultAt)

  return (
    <g>
      <text x={0} y={headerY} className={`${fillClass} text-label tracking-[0.18em] uppercase`}>
        {lane.name}
      </text>

      {lane.bars.map((bar, index) => {
        const x = monthToX(bar.from)
        const width = monthToX(bar.to) - x
        const center = rowCenters[index] ?? 0
        const muted = index === mutedIndex && mutedFillClass !== undefined

        return (
          <g key={bar.label}>
            <text
              x={TL.labelRight}
              y={center}
              dy="0.34em"
              textAnchor="end"
              className="fill-ink-muted text-label"
            >
              {bar.label}
            </text>
            <motion.rect
              x={x}
              y={center - TL.barHeight / 2}
              width={width}
              height={TL.barHeight}
              rx={3}
              className={muted ? `${mutedFillClass} ${strokeClass}` : fillClass}
              strokeWidth={muted ? 2 : 0}
              style={{ transformOrigin: `${x}px ${center}px` }}
              initial={false}
              animate={{ scaleX: visible ? 1 : 0, opacity: visible ? 1 : 0 }}
              transition={
                instant
                  ? instantTransition
                  : { duration: DURATION.slow, ease: EASE_OUT, delay: delayBase + index * 0.12 }
              }
            />
          </g>
        )
      })}

      {/* The moment a usable result actually lands. */}
      <motion.g
        initial={false}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={
          instant
            ? instantTransition
            : { duration: DURATION.base, ease: EASE_OUT, delay: delayBase + 0.5 }
        }
      >
        <line
          x1={resultX}
          x2={resultX}
          y1={markerFrom}
          y2={markerTo}
          className={strokeClass}
          strokeWidth={2}
        />
        <circle
          cx={resultX}
          cy={dotY}
          r={9}
          className={`${fillClass} stroke-bg`}
          strokeWidth={3}
        />
        <text
          x={resultAnchor === 'end' ? resultX - 16 : resultX + 16}
          y={headerY}
          textAnchor={resultAnchor}
          className="fill-ink text-label font-medium"
        >
          {lane.resultLabel}
          <tspan className="fill-ink-faint"> · mes {lane.resultAt}</tspan>
        </text>
      </motion.g>
    </g>
  )
}

function AdvantageBracket({ visible }: { visible: boolean }) {
  const { mode } = useSlideStep()
  const x0 = monthToX(SLIDE_1.timeline.cloud.resultAt)
  const x1 = monthToX(SLIDE_1.timeline.onPrem.resultAt)
  const y = TL.bracket.line

  return (
    <motion.g
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={
        mode === 'static' ? instantTransition : { duration: DURATION.base, ease: EASE_OUT }
      }
    >
      <line x1={x0} x2={x1} y1={y} y2={y} className="stroke-accent" strokeWidth={3} />
      <line x1={x0} x2={x0} y1={y - 12} y2={y + 12} className="stroke-accent" strokeWidth={3} />
      <line x1={x1} x2={x1} y1={y - 12} y2={y + 12} className="stroke-accent" strokeWidth={3} />
      <text
        x={(x0 + x1) / 2}
        y={TL.bracket.label}
        textAnchor="middle"
        className="fill-accent font-serif text-lede font-semibold"
      >
        {SLIDE_1.bracket}
      </text>
    </motion.g>
  )
}
