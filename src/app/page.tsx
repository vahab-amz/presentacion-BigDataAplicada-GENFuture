import { existsSync } from 'node:fs'
import path from 'node:path'
import { HERO_MEDIA } from '@/data/deck'
import { DeckApp } from '@/deck/DeckApp'
import type { HeroSource } from '@/deck/HeroLayer'

/**
 * A server component, so it runs once, at build time: it lists only the cover
 * video files that really are in `public/`. WebM goes first when present
 * (smaller, and every Chromium decodes it); MP4 is the fallback. A missing
 * file is simply left out, so the deck never requests something that 404s.
 */
function heroSources(): HeroSource[] {
  const candidates: HeroSource[] = [
    { src: HERO_MEDIA.webm, type: 'video/webm' },
    { src: HERO_MEDIA.mp4, type: 'video/mp4' },
  ]
  return candidates.filter(({ src }) => existsSync(path.join(process.cwd(), 'public', src)))
}

export default function DeckPage() {
  return <DeckApp heroSources={heroSources()} />
}
