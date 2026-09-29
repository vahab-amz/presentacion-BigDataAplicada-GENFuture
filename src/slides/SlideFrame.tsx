'use client'

import type { ReactNode } from 'react'

/** Stage padding shared by every slide, in stage pixels. */
export const SLIDE_PADDING = { x: 120, top: 84, bottom: 132 } as const
export const CONTENT_WIDTH = 1920 - SLIDE_PADDING.x * 2 // 1680
export const CONTENT_HEIGHT = 1080 - SLIDE_PADDING.top - SLIDE_PADDING.bottom // 864

/**
 * Every slide is absolutely positioned inside the stage and lays its content
 * out on the same 1680 x 864 grid, so the chrome band at the foot is never
 * encroached on and the eye finds the title in the same place each time.
 */
export function SlideFrame({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`absolute inset-0 ${className}`}
      style={{
        paddingLeft: SLIDE_PADDING.x,
        paddingRight: SLIDE_PADDING.x,
        paddingTop: SLIDE_PADDING.top,
        paddingBottom: SLIDE_PADDING.bottom,
      }}
    >
      <div className="relative h-full w-full">{children}</div>
    </section>
  )
}

/** Absolute placement helper so slides read as a layout spec, not a flex maze. */
export function Place({
  top,
  left = 0,
  width,
  height,
  right,
  children,
  className = '',
}: {
  top: number
  left?: number
  right?: number
  width?: number
  height?: number
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`absolute ${className}`} style={{ top, left, right, width, height }}>
      {children}
    </div>
  )
}

export function SlideTitle({
  children,
  size = 'h1',
  className = '',
}: {
  children: ReactNode
  size?: 'h1' | 'h2' | 'hero'
  className?: string
}) {
  const sizeClass = size === 'hero' ? 'text-hero' : size === 'h2' ? 'text-h2' : 'text-h1'
  return (
    <h2 className={`font-serif ${sizeClass} font-semibold text-balance text-ink ${className}`}>
      {children}
    </h2>
  )
}
