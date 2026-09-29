'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DURATION, EASE_OUT } from '@/deck/motion-presets'

const VIDEO_SRC = '/media/hero.mp4'
const POSTER_SRC = '/media/hero-poster.jpg'

/**
 * Slide 1 only. Plays `public/media/hero.mp4` if it is there, and falls back to
 * a slow dotted DNA helix if it is not — which is also what happens on a
 * machine with no codec, so the deck never opens on a black rectangle.
 */
/** How long to wait for the video to produce metadata before giving up. */
const VIDEO_TIMEOUT_MS = 900

export function HeroBackdrop({ dimmed = false }: { dimmed?: boolean }) {
  const [videoFailed, setVideoFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current

    // A missing file usually fires `error`, but not on every browser and not
    // reliably when the poster is missing too. Falling back on a short timeout
    // as well makes the helix deterministic: no file, no codec, no metadata
    // within a beat, show the helix.
    const timer = window.setTimeout(() => {
      if ((videoRef.current?.readyState ?? 0) < HTMLMediaElement.HAVE_METADATA) {
        setVideoFailed(true)
      }
    }, VIDEO_TIMEOUT_MS)

    // Pause on unmount: leaving slide 1 must stop the audio-less video from
    // burning frames behind the rest of the deck.
    return () => {
      window.clearTimeout(timer)
      video?.pause()
    }
  }, [])

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      aria-hidden
      initial={false}
      // Once the timeline is on screen the backdrop steps back, so the Gantt
      // reads cleanly. It is still the same image, just quieter.
      animate={{ opacity: dimmed ? 0.3 : 1 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
    >
      {videoFailed ? (
        <DnaHelix />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
        />
      )}
      {/* The title has to stay readable over whatever is behind it. A bright
          video needs ~65%; the dark fallback helix only needs enough to push it
          behind the type. */}
      <div
        className={
          videoFailed
            ? 'absolute inset-0 bg-bg-deep/55'
            : 'absolute inset-0 bg-bg-deep/[0.68]'
        }
      />
    </motion.div>
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
