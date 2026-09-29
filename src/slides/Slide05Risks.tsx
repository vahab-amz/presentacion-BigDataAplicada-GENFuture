'use client'

import { motion } from 'motion/react'
import { Reveal } from '@/components/Reveal'
import { SLIDE_5 } from '@/data/deck'
import { DURATION, EASE_OUT, instantTransition } from '@/deck/motion-presets'
import { useSlideStep } from '@/deck/slide-context'
import { Place, SlideFrame, SlideTitle } from './SlideFrame'

const ROW_HEIGHT = 76
/** Riesgo | Respuesta | Dato, sized so only the evidence column ever wraps. */
const COLUMNS = 'grid-cols-[360px_680px_1fr]'
const ROADMAP = {
  width: 1680,
  height: 150,
  /** Matches the three-column grid below: (1680 - 2 x 48) / 3 + 48. */
  column: 576,
  line: 12,
} as const

export function Slide05Risks() {
  const { step, mode } = useSlideStep()

  return (
    <SlideFrame>
      <Place top={0} width={1680}>
        <Reveal at={0} from="none">
          <SlideTitle size="h2">{SLIDE_5.title}</SlideTitle>
        </Reveal>
      </Place>

      {/* Steps 1-2 — the five objections, answered */}
      <Place top={126} width={1680} height={420}>
        <Reveal
          at={1}
          className={`grid ${COLUMNS} items-center gap-x-10 border-b border-rule pb-3`}
        >
          <p className="text-micro tracking-[0.16em] text-ink-faint uppercase">
            {SLIDE_5.tableHeadings.risk}
          </p>
          <p className="text-micro tracking-[0.16em] text-ink-faint uppercase">
            {SLIDE_5.tableHeadings.answer}
          </p>
          <p className="text-micro tracking-[0.16em] text-ink-faint uppercase">
            {SLIDE_5.tableHeadings.evidence}
          </p>
        </Reveal>

        {SLIDE_5.rows.map((row, index) => (
          <Reveal
            key={row.risk}
            at={index < 2 ? 1 : 2}
            index={index < 2 ? index : index - 2}
            className="border-b border-rule"
            style={{ height: ROW_HEIGHT }}
          >
            <div className={`grid h-full ${COLUMNS} items-center gap-x-10`}>
              <p className="font-serif text-label font-semibold text-ink">{row.risk}</p>
              <p className="text-label text-cloud">{row.answer}</p>
              <p className="text-micro text-ink-muted">{row.evidence}</p>
            </div>
          </Reveal>
        ))}
      </Place>

      {/* Step 3 — what the first 90 days look like */}
      <Place top={566} width={ROADMAP.width} height={ROADMAP.height}>
        <Roadmap visible={step >= 3} instant={mode === 'static'} />
      </Place>

      {/* Step 4 — the ask */}
      <Place top={730} width={1680} height={134}>
        <Reveal at={4} className="h-full">
          <div className="flex h-full flex-col justify-center border-t-2 border-accent pt-6">
            <p className="font-serif text-h2 font-semibold text-ink">{SLIDE_5.closing.ask}</p>
            <p className="mt-2 font-serif text-lede text-ink-muted">{SLIDE_5.closing.line}</p>
          </div>
        </Reveal>
      </Place>
    </SlideFrame>
  )
}

function Roadmap({ visible, instant }: { visible: boolean; instant: boolean }) {
  const transition = instant
    ? instantTransition
    : { duration: DURATION.slow, ease: EASE_OUT }

  return (
    <div className="relative h-full">
      <svg
        className="absolute inset-0"
        viewBox={`0 0 ${ROADMAP.width} ${ROADMAP.height}`}
        width={ROADMAP.width}
        height={ROADMAP.height}
        aria-hidden
      >
        {/* The empty track appears with the roadmap, not before it. */}
        <motion.line
          x1={0}
          x2={ROADMAP.width}
          y1={ROADMAP.line}
          y2={ROADMAP.line}
          className="stroke-rule"
          strokeWidth={2}
          initial={false}
          animate={{ opacity: visible ? 1 : 0 }}
          transition={transition}
        />
        <motion.line
          x1={0}
          x2={ROADMAP.width}
          y1={ROADMAP.line}
          y2={ROADMAP.line}
          className="stroke-accent"
          strokeWidth={4}
          style={{ transformOrigin: '0px 0px' }}
          initial={false}
          animate={{ scaleX: visible ? 1 : 0 }}
          transition={transition}
        />
        {SLIDE_5.roadmap.phases.map((phase, index) => (
          <motion.circle
            key={phase.window}
            cx={index * ROADMAP.column + 6}
            cy={ROADMAP.line}
            r={9}
            className="fill-accent stroke-bg"
            strokeWidth={3}
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={
              instant
                ? instantTransition
                : { duration: DURATION.base, ease: EASE_OUT, delay: 0.15 + index * 0.18 }
            }
          />
        ))}
      </svg>

      <div className="absolute inset-x-0 top-[38px] grid grid-cols-3 gap-12">
        {SLIDE_5.roadmap.phases.map((phase, index) => (
          <Reveal key={phase.window} at={3} index={index} delay={0.15}>
            <p className="text-label font-semibold tracking-[0.1em] text-accent uppercase">
              {phase.window}
            </p>
            <p className="mt-2 text-micro text-ink-muted">{phase.body}</p>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
