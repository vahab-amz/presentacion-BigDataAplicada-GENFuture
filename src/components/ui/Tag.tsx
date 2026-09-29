import { UI_TEXT } from '@/data/deck'

/**
 * The small "Ilustrativo" flag. Every figure that has no published source
 * carries one, so nothing on screen looks more certain than it is.
 */
export function IllustrativeTag({ label = UI_TEXT.illustrative }: { label?: string }) {
  return (
    <span className="inline-flex items-center border border-rule px-3 py-[3px] text-micro tracking-[0.14em] text-ink-faint uppercase">
      {label}
    </span>
  )
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-micro font-medium tracking-[0.22em] text-ink-faint uppercase">
      {children}
    </p>
  )
}

/** A hairline rule; the deck's only divider. */
export function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-rule ${className}`} />
}
