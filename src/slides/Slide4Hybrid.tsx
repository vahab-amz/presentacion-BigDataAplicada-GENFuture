'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Reveal } from '@/components/Reveal'
import { Timeline, type TimelineGeometry } from '@/components/chart/Timeline'
import { IllustrativeTag } from '@/components/ui/Tag'
import { SLIDE_HYBRID } from '@/data/deck'
import { useSlideStep } from '@/deck/slide-context'
import { Place, SlideFrame, SlideTitle } from './SlideFrame'

/*
 * States: 0 title · 1 three pillars · 2 the Zero-Trust flow · 3 time to
 * market (the flow gives way to the timeline in the same area) · 4 the band.
 */

const ZONE = { top: 316, height: 460 } as const

/** The race timeline, tightened to fit nine phases in the middle zone. */
const TIMELINE_GEOMETRY: Partial<TimelineGeometry> = {
  labelRight: 380,
  trackX0: 420,
  trackX1: 1600,
  barHeight: 18,
  rowPitch: 32,
  firstRow: 30,
  bracketGap: 40,
  laneGap: 38,
  axisGap: 34,
}

const LANES = [SLIDE_HYBRID.timeline.hybrid, SLIDE_HYBRID.timeline.onPrem] as const

export function Slide4Hybrid() {
  const { step } = useSlideStep()

  return (
    <SlideFrame>
      <Place top={0} width={1680}>
        <Reveal at={0} from="none">
          <SlideTitle size="h2">{SLIDE_HYBRID.title}</SlideTitle>
        </Reveal>
      </Place>
      <Place top={92} width={1680}>
        <Reveal at={0} from="none">
          <p className="text-label text-ink-muted">{SLIDE_HYBRID.subtitle}</p>
        </Reveal>
      </Place>

      {/* Step 1 — three pillars */}
      <Place top={146} width={1680} height={150}>
        <div className="grid h-full grid-cols-3 gap-12">
          {SLIDE_HYBRID.pillars.map((pillar, index) => (
            <Reveal
              key={pillar.title}
              at={1}
              index={index}
              className="h-full border-t-2 border-accent pt-3"
            >
              <h3 className="text-label font-semibold text-ink">{pillar.title}</h3>
              <p className="mt-1 text-micro text-ink-muted">{pillar.body}</p>
            </Reveal>
          ))}
        </div>
      </Place>

      {/* Step 2 — the flow; it gives way to the timeline at step 3 */}
      <Place top={ZONE.top} width={1680} height={ZONE.height}>
        <Reveal at={2} until={3} from="none" className="h-full">
          <ZeroTrustFlow running={step === 2} />
        </Reveal>
      </Place>

      {/* Step 3 — time to market */}
      <Place top={ZONE.top} width={1680} height={ZONE.height}>
        <Reveal at={3} from="none" className="relative h-full">
          <div className="absolute top-0 right-0">
            <IllustrativeTag label={SLIDE_HYBRID.timeline.tag} />
          </div>
          <Timeline
            lanes={LANES}
            styles={[
              { fill: 'fill-cloud', stroke: 'stroke-cloud' },
              { fill: 'fill-onprem', stroke: 'stroke-onprem' },
            ]}
            months={SLIDE_HYBRID.timeline.months}
            tickEvery={SLIDE_HYBRID.timeline.tickEvery}
            bracket={{ ...SLIDE_HYBRID.timeline.bracket, placement: 'after' }}
            axisLabel={SLIDE_HYBRID.timeline.axisLabel}
            ariaLabel={SLIDE_HYBRID.timeline.ariaLabel}
            visible={step >= 3}
            bracketVisible={step >= 3}
            geometry={TIMELINE_GEOMETRY}
          />
        </Reveal>
      </Place>

      {/* Step 4 — the band */}
      <Place top={784} width={1680} height={80}>
        <Reveal at={4} className="h-full">
          <div className="flex h-full items-center border-l-4 border-accent bg-accent/12 px-10">
            <p className="font-serif text-body-lg font-semibold text-ink">{SLIDE_HYBRID.band}</p>
          </div>
        </Reveal>
      </Place>
    </SlideFrame>
  )
}

/* -------------------------------------------------------------------------- */
/*  Zero-Trust pipeline                                                        */
/* -------------------------------------------------------------------------- */

const FLOW = {
  width: 1680,
  height: 156,
  spacing: 336,
  railY: 94,
  node: 40,
  zoneY: 24,
} as const

const nodeX = (index: number) => FLOW.spacing / 2 + index * FLOW.spacing

const TONE = {
  private: { text: 'fill-accent', stroke: 'stroke-accent', ring: 'fill-accent/15' },
  transit: { text: 'fill-ink-faint', stroke: 'stroke-ink-muted', ring: 'fill-panel' },
  public: { text: 'fill-cloud', stroke: 'stroke-cloud', ring: 'fill-cloud/15' },
} as const

function ZeroTrustFlow({ running }: { running: boolean }) {
  const { flow } = SLIDE_HYBRID
  const { mode } = useSlideStep()
  const reduceMotion = useReducedMotion()
  const travel = running && mode === 'live' && reduceMotion !== true
  const first = nodeX(0)
  const last = nodeX(flow.stages.length - 1)

  return (
    <div className="flex h-full flex-col">
      <svg
        viewBox={`0 0 ${FLOW.width} ${FLOW.height}`}
        width={FLOW.width}
        height={FLOW.height}
        role="img"
        aria-label={flow.ariaLabel}
      >
        {/* The rail, with an arrowhead into every stage after the first. */}
        <line x1={first} x2={last} y1={FLOW.railY} y2={FLOW.railY} className="stroke-rule-strong" strokeWidth={3} />
        {flow.stages.slice(1).map((stage, index) => {
          const tip = nodeX(index + 1) - FLOW.node - 10
          return (
            <path
              key={stage.title}
              d={`M${tip - 14},${FLOW.railY - 9} L${tip},${FLOW.railY} L${tip - 14},${FLOW.railY + 9}`}
              fill="none"
              className="stroke-rule-strong"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        {flow.stages.map((stage, index) => {
          const x = nodeX(index)
          const tone = TONE[stage.tone]
          return (
            <g key={stage.title}>
              <text
                x={x}
                y={FLOW.zoneY}
                textAnchor="middle"
                className={`${tone.text} text-micro font-semibold tracking-[0.12em] uppercase`}
              >
                {stage.zone}
              </text>
              <circle cx={x} cy={FLOW.railY} r={FLOW.node} className={`${tone.ring} ${tone.stroke}`} strokeWidth={3} />
              <g transform={`translate(${x - 18}, ${FLOW.railY - 18})`}>
                <StageGlyph index={index} lock={index === flow.lockStage} stroke={tone.stroke} />
              </g>
            </g>
          )
        })}

        {/* One data packet per reveal, from the vault to local storage. */}
        {travel ? (
          <motion.circle
            key="packet"
            cy={FLOW.railY}
            r={11}
            className="fill-warn stroke-bg"
            strokeWidth={4}
            initial={{ cx: first, opacity: 0 }}
            animate={{ cx: [first, last], opacity: [0, 1, 1, 0] }}
            transition={{
              cx: { duration: 3.2, ease: 'easeInOut', delay: 0.6 },
              opacity: { duration: 3.6, times: [0, 0.12, 0.9, 1], delay: 0.4 },
            }}
          />
        ) : null}
      </svg>

      {/* Five equal columns: each centre sits exactly under its node. */}
      <div className="grid grid-cols-5">
        {flow.stages.map((stage, index) => (
          <p key={stage.title} className="px-6 text-center text-label leading-[1.2] font-semibold text-ink">
            <span className="text-ink-faint">{index + 1} </span>
            {stage.title}
          </p>
        ))}
      </div>

      <div className="mt-10 border-l-4 border-accent pl-8">
        <p className="font-serif text-lede font-semibold text-ink">“{flow.quote}”</p>
        <p className="mt-2 text-micro text-ink-muted">{flow.subline}</p>
      </div>
    </div>
  )
}

function StageGlyph({ index, lock, stroke }: { index: number; lock: boolean; stroke: string }) {
  const common = {
    fill: 'none',
    className: stroke,
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (lock) {
    return (
      <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
        <path {...common} d="M11 16v-4.5a7 7 0 0 1 14 0V16" />
        <rect {...common} x={7} y={16} width={22} height={15} rx={2.5} />
        <path {...common} d="M18 22v3.5" />
      </svg>
    )
  }
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
      {index === 0 ? (
        // A short stretch of double helix: the raw genetic data.
        <>
          <path {...common} d="M11 4c0 9 14 9 14 14s-14 5-14 14" />
          <path {...common} d="M25 4c0 9-14 9-14 14s14 5 14 14" />
          <path {...common} d="M13 9h10M13 27h10" />
        </>
      ) : null}
      {index === 2 ? (
        <>
          <path {...common} d="M10 27h16.5a6 6 0 0 0 .6-11.97A8.5 8.5 0 0 0 10.6 13.2 7 7 0 0 0 10 27z" />
          <path {...common} d="M15 21l3-3 3 3" />
        </>
      ) : null}
      {index === 3 ? (
        <>
          <path {...common} d="M18 4 7 8.5v8c0 7 4.6 12.2 11 15 6.4-2.8 11-8 11-15v-8L18 4z" />
          <path {...common} d="m13 18 3.5 3.5L23 15" />
        </>
      ) : null}
      {index === 4 ? (
        <>
          <rect {...common} x={7} y={6} width={22} height={8} rx={2} />
          <rect {...common} x={7} y={16} width={22} height={8} rx={2} />
          <path {...common} d="M11 10h.01M11 20h.01M18 30h0M7 30h22" />
        </>
      ) : null}
    </svg>
  )
}
