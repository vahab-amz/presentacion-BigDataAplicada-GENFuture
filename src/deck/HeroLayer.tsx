'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HERO_MEDIA, heroOverlay } from '@/data/deck'
import { DURATION, EASE_OUT } from './motion-presets'
import type { Palette } from './deck-state'

export type HeroSource = { src: string; type: string }

type VideoState = 'loading' | 'playing' | 'failed'

/**
 * The cover video, at viewport level: it sits behind the (transparent) stage
 * and covers the whole window, letterbox included, whenever the slide on
 * screen declares `backdrop: 'hero'`.
 *
 * Loading never gives up on a timer. The dotted helix is drawn first; the
 * video sits on top of it at opacity 0 and fades in on `playing`. Only if
 * every <source> fails (or the element reports an error) does the helix stay.
 * The <video> is mounted once the deck is ready, i.e. after hydration, so no
 * media event can fire before React is listening.
 */
export function HeroLayer({
  sources,
  visible,
  ready,
  step,
  palette,
}: {
  sources: readonly HeroSource[]
  visible: boolean
  /** The deck has hydrated and read the hash. */
  ready: boolean
  step: number
  palette: Palette
}) {
  const reduceMotion = useReducedMotion() === true
  const videoRef = useRef<HTMLVideoElement>(null)
  const failedSources = useRef(0)
  const [videoState, setVideoState] = useState<VideoState>(
    sources.length > 0 ? 'loading' : 'failed',
  )
  /** The video has finished fading in: the helix underneath can stop. */
  const [covered, setCovered] = useState(false)
  /** On screen or still fading out. */
  const [active, setActive] = useState(visible)
  if (visible && !active) setActive(true)

  const withVideo = ready && sources.length > 0 && !reduceMotion

  // Play while shown. Pausing waits for the fade-out to finish (below).
  useEffect(() => {
    const video = videoRef.current
    if (!video || !visible) return
    video.muted = true
    video.play().catch(() => {
      /* Autoplay refused or no playable source: the helix stays underneath. */
    })
  }, [visible, withVideo])

  const fail = () => {
    setVideoState('failed')
    setCovered(false)
  }

  return (
    <motion.div
      aria-hidden
      data-palette={palette}
      data-hero-layer=""
      data-hero-state={reduceMotion ? 'still' : videoState}
      className="pointer-events-none fixed inset-0 overflow-hidden bg-bg-deep"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: DURATION.slide, ease: EASE_OUT }}
      onAnimationComplete={() => {
        if (visible) return
        setActive(false)
        videoRef.current?.pause()
      }}
    >
      {active && !covered ? <DnaHelix /> : null}

      {reduceMotion ? (
        // A still frame honours the reduced-motion preference.
        <Image
          src={HERO_MEDIA.poster}
          alt=""
          fill
          loading="eager"
          className="object-cover"
        />
      ) : null}

      {withVideo ? (
        <motion.video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="auto"
          initial={false}
          animate={{ opacity: videoState === 'playing' ? 1 : 0 }}
          transition={{ duration: DURATION.slow, ease: EASE_OUT }}
          onAnimationComplete={() => setCovered(videoState === 'playing')}
          onPlaying={() => setVideoState('playing')}
          onError={fail}
        >
          {sources.map((source) => (
            <source
              key={source.src}
              src={source.src}
              type={source.type}
              onError={() => {
                failedSources.current += 1
                if (failedSources.current >= sources.length) fail()
              }}
            />
          ))}
        </motion.video>
      ) : null}

      {/* The title has to stay readable over whatever is behind it. */}
      <motion.div
        className="absolute inset-0 bg-bg-deep"
        initial={false}
        animate={{ opacity: heroOverlay(step) }}
        transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      />
    </motion.div>
  )
}

/**
 * The same backdrop as a still, inside a stage: the presenter's previews and
 * the print route show the poster rather than decoding the video again.
 */
export function HeroStill({ step }: { step: number }) {
  return (
    <div aria-hidden data-palette="dark" className="absolute inset-0 overflow-hidden bg-bg-deep">
      <Image src={HERO_MEDIA.poster} alt="" fill loading="eager" className="object-cover" />
      <div className="absolute inset-0 bg-bg-deep" style={{ opacity: heroOverlay(step) }} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Fallback: a dotted double helix                                            */
/* -------------------------------------------------------------------------- */

const HELIX_WIDTH = 1920
const HELIX_HEIGHT = 1080
/** Horizontal distance of one full turn. */
const PERIOD = 620
const DOT_SPACING = 18
const AMPLITUDE = 210

type Dot = { x: number; y: number; r: number; opacity: number }

function buildStrand(phaseOffset: number): Dot[] {
  const dots: Dot[] = []
  // Two extra periods are drawn so the group can be translated by exactly one
  // period forever without ever showing an edge.
  const total = HELIX_WIDTH + PERIOD * 2
  for (let x = 0; x <= total; x += DOT_SPACING) {
    const theta = (x / PERIOD) * Math.PI * 2 + phaseOffset
    const depth = (Math.cos(theta) + 1) / 2 // 0 = far, 1 = near
    dots.push({
      x,
      y: HELIX_HEIGHT / 2 + Math.sin(theta) * AMPLITUDE,
      r: 3 + depth * 5,
      opacity: 0.3 + depth * 0.5,
    })
  }
  return dots
}

function DnaHelix() {
  const reduceMotion = useReducedMotion()
  const strandA = useMemo(() => buildStrand(0), [])
  const strandB = useMemo(() => buildStrand(Math.PI), [])
  const rungs = useMemo(() => {
    const out: { x: number; y1: number; y2: number; opacity: number }[] = []
    for (let i = 0; i < strandA.length; i += 5) {
      const a = strandA[i]
      const b = strandB[i]
      if (!a || !b) continue
      out.push({ x: a.x, y1: a.y, y2: b.y, opacity: 0.1 + Math.min(a.opacity, b.opacity) * 0.3 })
    }
    return out
  }, [strandA, strandB])

  return (
    <svg
      data-hero-helix=""
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${HELIX_WIDTH} ${HELIX_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* The pattern is drawn one period wider than the stage on both sides, so
          translating it by exactly one period loops without a visible seam. */}
      <g transform={`translate(${-PERIOD}, 0)`}>
        <motion.g
          initial={false}
          animate={reduceMotion ? { x: 0 } : { x: [0, -PERIOD] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 26, ease: 'linear', repeat: Infinity, repeatType: 'loop' }
          }
        >
          {rungs.map((rung) => (
            <line
              key={`rung-${rung.x}`}
              x1={rung.x}
              x2={rung.x}
              y1={rung.y1}
              y2={rung.y2}
              className="stroke-accent"
              strokeWidth={1.5}
              opacity={rung.opacity}
            />
          ))}
          {strandA.map((dot) => (
            <circle
              key={`a-${dot.x}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              className="fill-accent"
              opacity={dot.opacity}
            />
          ))}
          {strandB.map((dot) => (
            <circle
              key={`b-${dot.x}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              className="fill-cloud"
              opacity={dot.opacity * 0.85}
            />
          ))}
        </motion.g>
      </g>
    </svg>
  )
}
