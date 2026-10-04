import { APPENDIX, SLIDES } from '@/data/deck'

/**
 * `out/deck-manifest.json`: the slide list, rendered once at build time.
 * scripts/check-deck.mjs and scripts/screenshots.mjs read it, so they walk
 * exactly the slides and steps in src/data/deck.ts, with nothing hard-coded.
 */
export const dynamic = 'force-static'

const summary = ({ id, name, steps, surface, backdrop }: (typeof SLIDES)[number]) => ({
  id,
  name,
  steps,
  surface: surface ?? null,
  backdrop: backdrop ?? null,
})

export function GET() {
  return Response.json({
    slides: SLIDES.map(summary),
    appendix: summary(APPENDIX),
  })
}
