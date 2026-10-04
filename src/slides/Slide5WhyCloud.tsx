'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { CountUp } from '@/components/CountUp'
import { Reveal } from '@/components/Reveal'
import {
  SLIDE_WHY_CLOUD,
  type WhyCloudCardIcon,
  type WhyCloudColumnIcon,
} from '@/data/deck'
import { DURATION, EASE_OUT, instantTransition } from '@/deck/motion-presets'
import { useSlideStep } from '@/deck/slide-context'

/*
 * Alex's infographic, rebuilt in real text and SVG on the 16:9 stage and
 * always drawn on the paper surface. The 3:2 original is widened rather than
 * squeezed: same hierarchy, colours, icons and copy, with more air between the
 * cards and columns. The navy banner stops above the chrome band, so the
 * letterbox around the stage always meets paper white.
 *
 * States: 0 header, title and subtitle · 1 three cards, bars grow and count ·
 * 2 four columns · 3 the banner rises and the pill glints once.
 */

const MARGIN = 96
const INNER = 1920 - MARGIN * 2

const Y = {
  title: 134,
  subtitle: 280,
  cards: 346,
  cardHeight: 236,
  caption: 588,
  columns: 620,
  banner: 872,
  bannerHeight: 128,
} as const

const TINT = {
  blue: { bg: 'bg-ig-tint-blue', sub: 'text-ig-sub-blue' },
  green: { bg: 'bg-ig-tint-green', sub: 'text-ig-sub-green' },
  peach: { bg: 'bg-ig-tint-peach', sub: 'text-ig-sub-warm' },
} as const

function Box({
  left = 0,
  top,
  width,
  height,
  className = '',
  style,
  children,
}: {
  left?: number
  top: number
  width?: number
  height?: number
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div className={`absolute ${className}`} style={{ left, top, width, height, ...style }}>
      {children}
    </div>
  )
}

export function Slide5WhyCloud() {
  const { step } = useSlideStep()
  const data = SLIDE_WHY_CLOUD

  return (
    // Not clipped: the banner's navy bleeds past the stage into the letterbox.
    <section className="absolute inset-0 font-sans text-ig-navy">
      {/* ------------------------------------------------------------ header */}
      <Reveal at={0} from="none">
        <Header />
      </Reveal>

      <Box top={Y.title} width={1920}>
        <Reveal at={0} from="none">
          <h2
            className="text-center text-[64px] leading-[1.08] font-extrabold tracking-[-0.01em] text-ig-navy"
            aria-label={data.title.plain}
          >
            {data.title.lines.map((line, index) => (
              <span key={index} className="block">
                {line.map((part) => (
                  <span key={part.text} className={part.highlight ? 'text-ig-blue' : undefined}>
                    {part.text}
                  </span>
                ))}
              </span>
            ))}
          </h2>
        </Reveal>
      </Box>

      <Box top={Y.subtitle} width={1920}>
        <Reveal at={0} from="none">
          <p className="text-center text-[38px] leading-[1.2] text-ig-body">{data.subtitle}</p>
        </Reveal>
      </Box>

      {/* ------------------------------------------------------------- cards */}
      <Box left={MARGIN} top={Y.cards} width={INNER} height={Y.cardHeight}>
        <div className="grid h-full grid-cols-3 gap-6">
          {data.cards.map((card, index) => (
            <Reveal key={card.id} at={1} index={index} className="h-full">
              <ComparisonCard card={card} index={index} visible={step >= 1} />
            </Reveal>
          ))}
        </div>
      </Box>

      <Box left={MARGIN} top={Y.caption} width={INNER}>
        <Reveal at={1} index={3} from="none">
          <p className="text-right text-[18px] tracking-[0.04em] text-[#66768b]">{data.indexCaption}</p>
        </Reveal>
      </Box>

      {/* ----------------------------------------------------------- columns */}
      <Box left={MARGIN} top={Y.columns} width={INNER} height={Y.banner - Y.columns - 8}>
        <div className="grid h-full grid-cols-4">
          {data.columns.map((column, index) => (
            <Reveal
              key={column.title}
              at={2}
              index={index}
              className={`flex flex-col items-center px-5 text-center ${
                index > 0 ? 'border-l border-ig-rule' : ''
              }`}
            >
              <span
                className={`flex size-[84px] items-center justify-center rounded-full ${
                  column.tone === 'navy' ? 'bg-ig-steel' : 'bg-ig-green'
                }`}
              >
                <ColumnGlyph icon={column.icon} />
              </span>
              <h3 className="mt-2 text-[26px] leading-[1.2] font-extrabold text-ig-navy">
                {column.title}
              </h3>
              <p className="mt-[6px] max-w-[392px] text-[20px] leading-[1.3] text-ig-body">
                {column.body}
              </p>
            </Reveal>
          ))}
        </div>
      </Box>

      {/* ------------------------------------------------------------ banner */}
      <Banner visible={step >= 3} />
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Header: wordmark and the swoosh panel                                      */
/* -------------------------------------------------------------------------- */

/** Soft top and right edges, so a letterboxed window never shows a cut. */
const EDGE_FADE: CSSProperties = {
  maskImage:
    'linear-gradient(to bottom, transparent 0, #000 22px), linear-gradient(to left, transparent 0, #000 22px)',
  WebkitMaskImage:
    'linear-gradient(to bottom, transparent 0, #000 22px), linear-gradient(to left, transparent 0, #000 22px)',
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
}

const SWOOSH = { left: 1160, width: 760, height: 138, textX: 184 } as const

function Header() {
  const { brand, swoosh, images } = SLIDE_WHY_CLOUD

  return (
    <>
      <Box left={MARGIN} top={22} className="flex items-start gap-4">
        <DnaMark width={50} height={108} turns={1.35} strandA="#0b2a4a" strandB="#1f7fc1" rung="#5f8fb8" />
        <div className="flex flex-col items-center pt-[2px]">
          <p className="text-[64px] leading-none tracking-[-0.01em]" aria-label={`${brand.strong}${brand.light}`}>
            <span className="font-extrabold text-ig-navy">{brand.strong}</span>
            <span className="font-medium text-ig-blue">{brand.light}</span>
          </p>
          {brand.tagline.map((line) => (
            <p
              key={line}
              className="mt-[6px] text-[16px] leading-none font-medium tracking-[0.26em] whitespace-nowrap text-ig-navy"
            >
              {line}
            </p>
          ))}
        </div>
      </Box>

      <Box left={SWOOSH.left} top={0} width={SWOOSH.width} height={SWOOSH.height} style={EDGE_FADE}>
        <svg
          className="absolute inset-0"
          width={SWOOSH.width}
          height={SWOOSH.height}
          viewBox={`0 0 ${SWOOSH.width} ${SWOOSH.height}`}
          aria-hidden
        >
          <defs>
            <linearGradient id="why-cloud-swoosh" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#eef4fb" />
              <stop offset="0.55" stopColor="#dde9f6" />
              <stop offset="1" stopColor="#d2e3f3" />
            </linearGradient>
          </defs>
          <path
            d={`M0,0 H${SWOOSH.width} V${SWOOSH.height} H200 C128,${SWOOSH.height} 74,44 0,0 Z`}
            fill="url(#why-cloud-swoosh)"
          />
        </svg>
        <div
          className="absolute top-0 right-0 h-full w-[250px]"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0, #000 45%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 45%)',
          }}
        >
          <Image
            src={images.lab.src}
            alt=""
            fill
            loading="eager"
            sizes="250px"
            className="object-cover object-left"
          />
        </div>
        <div className="absolute top-[28px]" style={{ left: SWOOSH.textX }}>
          {swoosh.map((line) => (
            <p
              key={line}
              className="text-[20px] leading-[1.6] font-semibold tracking-[0.16em] whitespace-nowrap text-ig-navy"
            >
              {line}
            </p>
          ))}
        </div>
      </Box>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Comparison cards                                                           */
/* -------------------------------------------------------------------------- */

type Card = (typeof SLIDE_WHY_CLOUD.cards)[number]

function ComparisonCard({ card, index, visible }: { card: Card; index: number; visible: boolean }) {
  const tint = TINT[card.tint]
  const { seriesLabels } = SLIDE_WHY_CLOUD
  const rows = [
    { key: 'own', label: seriesLabels.own, value: card.own, fill: 'bg-ig-steel', strong: false },
    { key: 'cloud', label: seriesLabels.cloud, value: card.cloud, fill: 'bg-ig-green', strong: true },
  ]

  return (
    <article className={`relative h-full rounded-[16px] px-[26px] pt-[24px] ${tint.bg}`}>
      <div className="flex items-start gap-5">
        <span className="flex size-[76px] shrink-0 items-center justify-center">
          <CardGlyph icon={card.icon} />
        </span>
        <div className="pt-[4px]">
          <h3 className="text-[32px] leading-[1.1] font-extrabold whitespace-nowrap text-ig-navy">
            {card.title}
          </h3>
          <p className={`mt-[6px] text-[21px] leading-[1.25] ${tint.sub}`}>{card.subtitle}</p>
        </div>
      </div>

      <div className="mt-[18px] space-y-[12px]">
        {rows.map((row, rowIndex) => (
          <div key={row.key} className="grid h-[48px] grid-cols-[150px_1fr_78px] items-center gap-4">
            <p
              className={`text-[20px] leading-[1.2] text-ig-navy ${row.strong ? 'font-bold' : 'font-medium'}`}
            >
              {row.label}
            </p>
            <GrowTrack
              value={row.value}
              fill={row.fill}
              visible={visible}
              delay={0.25 + index * 0.1 + rowIndex * 0.08}
            />
            <p className="text-right text-[24px] font-extrabold text-ig-navy tabular-nums">
              <CountUp value={row.value} format={(v) => `${Math.round(v)}%`} active={visible} />
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}

/** A grey track with a coloured fill that grows to its percentage. */
function GrowTrack({
  value,
  fill,
  visible,
  delay,
}: {
  value: number
  fill: string
  visible: boolean
  delay: number
}) {
  const reduceMotion = useReducedMotion()
  const { mode } = useSlideStep()
  const instant = reduceMotion === true || mode === 'static'

  return (
    <div className="relative h-[26px] overflow-hidden rounded-[3px] bg-ig-track">
      <motion.div
        className={`absolute inset-y-0 left-0 w-full origin-left rounded-[3px] ${fill}`}
        initial={false}
        animate={{ scaleX: visible ? value / 100 : 0 }}
        transition={
          instant ? instantTransition : { duration: DURATION.count, ease: EASE_OUT, delay: visible ? delay : 0 }
        }
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Bottom banner                                                              */
/* -------------------------------------------------------------------------- */

function Banner({ visible }: { visible: boolean }) {
  const { banner, images } = SLIDE_WHY_CLOUD
  const reduceMotion = useReducedMotion()
  const { mode } = useSlideStep()
  const instant = reduceMotion === true || mode === 'static'

  return (
    <motion.div
      className="absolute inset-x-0 text-white"
      style={{
        top: Y.banner,
        height: Y.bannerHeight,
        pointerEvents: visible ? undefined : 'none',
      }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible || reduceMotion ? 0 : 48 }}
      transition={instant ? instantTransition : { duration: DURATION.slow, ease: EASE_OUT }}
      aria-hidden={visible ? undefined : true}
      inert={visible ? undefined : true}
    >
      {/* Full-bleed: the band runs on past the stage, so a window wider than
          16:9 shows one continuous navy band instead of a box. */}
      <div aria-hidden className="absolute inset-y-0 bg-ig-banner" style={{ left: -1920, right: -1920 }} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, #012a4e 0%, #03305a 50%, #012a4e 100%)' }}
      />
      <div
        className="absolute top-0 left-0 h-full"
        style={{
          width: Math.round((Y.bannerHeight * images.mountain.width) / images.mountain.height),
          maskImage: 'linear-gradient(to right, transparent 0, #000 12%, #000 50%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 12%, #000 50%, transparent)',
        }}
      >
        <Image src={images.mountain.src} alt="" fill loading="eager" sizes="160px" className="object-cover" />
      </div>

      <div className="absolute top-1/2 left-[196px] -translate-y-1/2">
        {banner.lines.map((line) => (
          <p key={line} className="text-[26px] leading-[1.25] font-bold">
            {line}
          </p>
        ))}
        <p className="mt-[4px] text-[24px] leading-[1.25] font-semibold text-ig-green-bright">
          {banner.accent}
        </p>
      </div>

      <div className="absolute top-[26px] bottom-[26px] left-[640px] w-[2px] bg-ig-green/70" />

      <div
        className="absolute top-1/2 left-1/2 flex h-[108px] w-[640px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center overflow-hidden rounded-full text-center"
        style={{ background: 'linear-gradient(90deg, #3d8f4e 0%, #1d767a 48%, #045f93 100%)' }}
      >
        {banner.pillLead.map((line) => (
          <p key={line} className="text-[23px] leading-[1.25]">
            {line}
          </p>
        ))}
        <p className="mt-[4px] text-[29px] leading-[1.2] font-bold">{banner.pillStrong}</p>
        {visible && !instant ? (
          // One soft glint across the pill once the banner has settled.
          <motion.span
            className="pointer-events-none absolute inset-y-0 w-[180px] -skew-x-12"
            style={{
              left: 0,
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
            }}
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 700, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.3, ease: 'easeInOut', delay: 0.7 }}
          />
        ) : null}
      </div>

      <div className="absolute top-1/2 left-[1478px] flex -translate-y-1/2 items-center gap-7">
        <DnaMark width={44} height={106} turns={1.3} strandA="#e9f2fb" strandB="#7fb6e3" rung="#9cc5ea" />
        <div>
          {banner.motto.map((line) => (
            <p key={line} className="text-[18px] leading-[1.6] font-medium tracking-[0.22em]">
              {line}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Icons                                                                      */
/* -------------------------------------------------------------------------- */

/** A vertical double helix: the GENFuture mark. */
function DnaMark({
  width,
  height,
  turns,
  strandA,
  strandB,
  rung,
}: {
  width: number
  height: number
  turns: number
  strandA: string
  strandB: string
  rung: string
}) {
  const stroke = 5
  const cx = width / 2
  const amp = width / 2 - stroke
  const steps = 48
  const at = (t: number) => ({
    y: stroke + t * (height - stroke * 2),
    s: Math.sin(t * turns * Math.PI * 2),
  })
  const strand = (sign: 1 | -1) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const { y, s } = at(i / steps)
      return `${i === 0 ? 'M' : 'L'}${(cx + sign * amp * s).toFixed(2)},${y.toFixed(2)}`
    }).join('')
  const rungCount = Math.round(turns * 7)
  const rungs = Array.from({ length: rungCount - 1 }, (_, k) => at((k + 1) / rungCount)).filter(
    ({ s }) => Math.abs(s) > 0.3,
  )

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="shrink-0">
      {rungs.map(({ y, s }) => (
        <line
          key={y}
          x1={cx - amp * Math.abs(s) * 0.82}
          x2={cx + amp * Math.abs(s) * 0.82}
          y1={y}
          y2={y}
          stroke={rung}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      ))}
      <path d={strand(-1)} fill="none" stroke={strandB} strokeWidth={stroke} strokeLinecap="round" />
      <path d={strand(1)} fill="none" stroke={strandA} strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  )
}

function coinSide(cx: number, y: number, rx: number, ry: number, h: number): string {
  return `M${cx - rx},${y} v${h} a${rx},${ry} 0 0 0 ${rx * 2},0 v${-h} a${rx},${ry} 0 0 1 ${-rx * 2},0 z`
}

function CoinStack({ cx, bottom, count }: { cx: number; bottom: number; count: number }) {
  const rx = 17
  const ry = 6
  const h = 8.5
  const top = bottom - count * h
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <path
          key={i}
          d={coinSide(cx, bottom - (i + 1) * h, rx, ry, h)}
          className="fill-ig-navy"
          stroke="#f7f9fb"
          strokeWidth={1.8}
        />
      ))}
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} className="fill-ig-navy" stroke="#f7f9fb" strokeWidth={1.8} />
    </g>
  )
}

function CardGlyph({ icon }: { icon: WhyCloudCardIcon }) {
  const line = {
    fill: 'none',
    className: 'stroke-ig-navy',
    strokeWidth: 5.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={76} height={76} viewBox="0 0 76 76" aria-hidden>
      {icon === 'coins' ? (
        <>
          <CoinStack cx={50} bottom={60} count={5} />
          <CoinStack cx={25} bottom={70} count={3} />
        </>
      ) : null}
      {icon === 'growth' ? (
        <>
          <rect x={10} y={48} width={12} height={22} rx={1.5} className="fill-ig-navy" />
          <rect x={28} y={38} width={12} height={32} rx={1.5} className="fill-ig-navy" />
          <rect x={46} y={28} width={12} height={42} rx={1.5} className="fill-ig-navy" />
          <path {...line} d="M7 34 22 20l12 8L60 7" />
          <path {...line} d="M48 6h13v13" />
        </>
      ) : null}
      {icon === 'stopwatch' ? (
        <>
          <circle {...line} cx={38} cy={43} r={24} />
          <rect x={31} y={5} width={14} height={7} rx={2} className="fill-ig-navy" />
          <rect x={35.5} y={11} width={5} height={8} className="fill-ig-navy" />
          <path {...line} d="m57 21 5-5" />
          <path {...line} d="M38 43 47 32" />
          <circle cx={38} cy={43} r={4.5} className="fill-ig-navy" />
        </>
      ) : null}
    </svg>
  )
}

function ColumnGlyph({ icon }: { icon: WhyCloudColumnIcon }) {
  const white = {
    fill: 'none',
    stroke: '#ffffff',
    strokeWidth: 5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={84} height={84} viewBox="0 0 88 88" aria-hidden>
      {icon === 'piggy' ? (
        <>
          <circle cx={44} cy={22} r={11.5} fill="#ffffff" />
          <text x={44} y={27.5} textAnchor="middle" className="fill-ig-steel text-[16px] font-extrabold">
            $
          </text>
          <ellipse cx={42} cy={55} rx={21} ry={14.5} fill="#ffffff" />
          <rect x={58} y={49} width={10} height={11} rx={3.5} fill="#ffffff" />
          <path d="M33 45 37.5 36 45 43z" fill="#ffffff" />
          <rect x={29} y={63} width={8} height={12} rx={2.5} fill="#ffffff" />
          <rect x={47} y={63} width={8} height={12} rx={2.5} fill="#ffffff" />
          <path d="M22 53c-5-1-6-6-2-8" fill="none" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />
          <circle cx={55} cy={51} r={2.2} className="fill-ig-steel" />
          <path d="M37 45h11" className="stroke-ig-steel" strokeWidth={2.6} strokeLinecap="round" />
        </>
      ) : null}
      {icon === 'cloudUp' ? (
        <>
          <path
            d="M26 62h37a12 12 0 0 0 1.6-23.9A17 17 0 0 0 32 33.5 13.5 13.5 0 0 0 26 62z"
            fill="#ffffff"
          />
          <path d="M45 63V45" className="stroke-ig-green" strokeWidth={5.5} strokeLinecap="round" />
          <path
            d="m37 52 8-8 8 8"
            fill="none"
            className="stroke-ig-green"
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}
      {icon === 'shield' ? (
        <>
          <path {...white} d="M44 19 25 26.5V41c0 13 8.2 22.4 19 27 10.8-4.6 19-14 19-27V26.5L44 19z" />
          <path {...white} d="m35 44 7 7 12-14" />
        </>
      ) : null}
      {icon === 'bars' ? (
        <>
          <rect x={26} y={48} width={10} height={19} rx={2} fill="#ffffff" />
          <rect x={39} y={37} width={10} height={30} rx={2} fill="#ffffff" />
          <rect x={52} y={24} width={10} height={43} rx={2} fill="#ffffff" />
        </>
      ) : null}
    </svg>
  )
}
