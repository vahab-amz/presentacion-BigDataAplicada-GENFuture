'use client'

import { Reveal } from '@/components/Reveal'
import { GrowBar } from '@/components/chart/primitives'
import { IllustrativeTag } from '@/components/ui/Tag'
import { DEMAND_PROFILE } from '@/data/demand-profile'
import { SLIDE_COMPANY, type BenefitIcon } from '@/data/deck'
import { useSlideStep } from '@/deck/slide-context'
import { Place, SlideFrame, SlideTitle } from './SlideFrame'

/*
 * Slide 1 runs over the full-viewport cover video (DeckView's hero layer).
 * Step 0 is the cover; from step 1 the video steps back and the slide becomes
 * the company brief: facts, where the costs are, and the proposal.
 */

const COLUMN = { width: 820, gap: 40, top: 300, height: 440 } as const
const RIGHT_X = COLUMN.width + COLUMN.gap

export function Slide1Company() {
  const { step } = useSlideStep()

  return (
    <SlideFrame>
      {/* Step 0 — the cover */}
      <Place top={306} width={1560}>
        <Reveal at={0} until={1} from="none">
          {/* Over the video the usual faint kicker is too weak: muted ink plus
              the title's soft shadow. */}
          <p className="text-micro font-medium tracking-[0.22em] text-ink-muted uppercase [text-shadow:0_1px_16px_rgb(0_0_0/0.6)]">
            {SLIDE_COMPANY.cover.kicker}
          </p>
          <h1 className="mt-6 font-serif text-hero font-semibold text-balance text-ink [text-shadow:0_2px_28px_rgb(0_0_0/0.45)]">
            {SLIDE_COMPANY.cover.title}
          </h1>
        </Reveal>
      </Place>

      {/* Step 1 — who we are */}
      <Place top={0} width={1680}>
        <Reveal at={1} from="none">
          <SlideTitle size="h2">{SLIDE_COMPANY.title}</SlideTitle>
        </Reveal>
      </Place>

      <Place top={120} width={1680} height={132}>
        <div className="grid h-full grid-cols-4 gap-10">
          {SLIDE_COMPANY.facts.map((fact, index) => (
            <Reveal
              key={fact.value}
              at={1}
              index={index}
              className="h-full border-t-2 border-rule-strong pt-4"
            >
              <p className="font-serif text-h3 font-semibold whitespace-nowrap text-ink">
                {fact.value}
              </p>
              <p className="mt-1 text-micro text-ink-muted">{fact.label}</p>
            </Reveal>
          ))}
        </div>
      </Place>

      {/* Step 2 — where the money goes */}
      <Place top={COLUMN.top} width={COLUMN.width} height={COLUMN.height}>
        <Reveal at={2} from="none">
          <h3 className="font-serif text-body-lg font-semibold text-ink">
            {SLIDE_COMPANY.costs.title}
          </h3>
        </Reveal>
        <div className="mt-6 flex flex-col gap-2">
          {SLIDE_COMPANY.costs.tiles.map((tile, index) => (
            <Reveal key={tile.label} at={2} index={index}>
              {tile.highlight ? (
                <div className="flex h-[108px] flex-col justify-center border-2 border-accent bg-accent/15 px-7">
                  <p className="text-micro font-semibold tracking-[0.12em] text-accent uppercase">
                    {tile.highlight}
                  </p>
                  <p className="mt-1 text-label font-semibold text-ink">{tile.label}</p>
                </div>
              ) : (
                <div className="flex h-[68px] items-center border-l-2 border-rule-strong bg-panel/85 px-7">
                  <p className="text-label text-ink">{tile.label}</p>
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </Place>

      {/* Step 3 — the proposal */}
      <Place top={COLUMN.top} left={RIGHT_X} width={COLUMN.width} height={COLUMN.height}>
        <Reveal at={3} from="none">
          <h3 className="font-serif text-body-lg font-semibold text-ink">
            {SLIDE_COMPANY.proposal.title}
          </h3>
        </Reveal>
        <div className="mt-6 flex gap-8">
          <div className="flex w-[468px] flex-col gap-6">
            {SLIDE_COMPANY.proposal.benefits.map((benefit, index) => (
              <Reveal key={benefit.text} at={3} index={index} className="flex items-center gap-5">
                <span className="flex size-[68px] shrink-0 items-center justify-center rounded-full border-2 border-cloud">
                  <BenefitGlyph icon={benefit.icon} />
                </span>
                <span className="text-label text-ink">{benefit.text}</span>
              </Reveal>
            ))}
          </div>
          <Reveal at={3} index={3} className="w-[320px] shrink-0">
            <ConceptualCashGraphic visible={step >= 3} />
          </Reveal>
        </div>
      </Place>

      {/* Step 4 — the takeaway */}
      <Place top={776} width={1680} height={88}>
        <Reveal at={4} className="h-full">
          <div className="flex h-full items-center border-l-4 border-accent bg-accent/15 px-10">
            <p className="font-serif text-lede font-semibold text-ink">{SLIDE_COMPANY.takeaway}</p>
          </div>
        </Reveal>
      </Place>
    </SlideFrame>
  )
}

/* -------------------------------------------------------------------------- */
/*  One tall bar at month 0 vs. small bars that follow the demand              */
/* -------------------------------------------------------------------------- */

const G = {
  width: 320,
  height: 338,
  slot: 26,
  bar: 18,
  capex: { label: 80, base: 206, height: 104 },
  opex: { label: 256, base: 332, unit: 26 },
} as const

function ConceptualCashGraphic({ visible }: { visible: boolean }) {
  const { graphic } = SLIDE_COMPANY.proposal
  const barX = (slot: number) => slot * G.slot + (G.slot - G.bar) / 2

  return (
    <div className="relative" style={{ width: G.width, height: G.height }}>
      <div className="absolute top-0 right-0">
        <IllustrativeTag label={graphic.tag} />
      </div>
      <svg
        viewBox={`0 0 ${G.width} ${G.height}`}
        width={G.width}
        height={G.height}
        role="img"
        aria-label={graphic.ariaLabel}
      >
        <text x={0} y={G.capex.label} className="fill-onprem text-micro font-semibold tracking-[0.12em]">
          {graphic.capex.name}
          <tspan className="fill-ink-faint font-normal tracking-normal"> · {graphic.capex.note}</tspan>
        </text>
        <line x1={0} x2={G.width} y1={G.capex.base} y2={G.capex.base} className="stroke-rule-strong" />
        <GrowBar
          x={barX(0)}
          y={G.capex.base - G.capex.height}
          width={G.bar}
          height={G.capex.height}
          visible={visible}
          className="fill-onprem"
          delay={0.2}
        />

        <text x={0} y={G.opex.label} className="fill-cloud text-micro font-semibold tracking-[0.12em]">
          {graphic.opex.name}
          <tspan className="fill-ink-faint font-normal tracking-normal"> · {graphic.opex.note}</tspan>
        </text>
        <line x1={0} x2={G.width} y1={G.opex.base} y2={G.opex.base} className="stroke-rule-strong" />
        {DEMAND_PROFILE.map((demand, month) => (
          <GrowBar
            key={month}
            x={barX(month)}
            y={G.opex.base - demand * G.opex.unit}
            width={G.bar}
            height={demand * G.opex.unit}
            visible={visible}
            className="fill-cloud"
            delay={0.3 + month * 0.03}
          />
        ))}
      </svg>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Line icons                                                                 */
/* -------------------------------------------------------------------------- */

function BenefitGlyph({ icon }: { icon: BenefitIcon }) {
  const common = {
    fill: 'none',
    className: 'stroke-cloud',
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
      {icon === 'cloud' ? (
        <path
          {...common}
          d="M10 27h16.5a6 6 0 0 0 .6-11.97A8.5 8.5 0 0 0 10.6 13.2 7 7 0 0 0 10 27z"
        />
      ) : null}
      {icon === 'shift' ? (
        <>
          <path {...common} d="M5 12h22m-5-5 5 5-5 5" />
          <path {...common} d="M31 24H9m5-5-5 5 5 5" />
        </>
      ) : null}
      {icon === 'scale' ? (
        <>
          <path {...common} d="M5 30h26" />
          <path {...common} d="M9 30v-6m7 6V17m7 13v-9m7 9V9" />
          <path {...common} d="M24 6h6v6" />
        </>
      ) : null}
    </svg>
  )
}
