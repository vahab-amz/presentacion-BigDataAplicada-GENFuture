/**
 * Shared by check-deck.mjs and screenshots.mjs: serve `out/`, open a browser
 * that can actually play the cover video, and read the deck manifest that the
 * build writes to `out/deck-manifest.json`.
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)

/**
 * Starts http-server on `out/`. Node runs the server directly (no shell), so
 * `kill()` really stops it on Windows too instead of orphaning it.
 */
export async function startServer(port) {
  const base = `http://127.0.0.1:${port}`
  const bin = require.resolve('http-server/bin/http-server')
  const child = spawn(process.execPath, [bin, 'out', '-p', String(port), '-c-1', '--silent'], {
    stdio: 'ignore',
  })
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(`${base}/`)).ok) return { child, base }
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  child.kill()
  throw new Error(`Static server never answered on ${base}`)
}

/**
 * Google Chrome when it is installed: Playwright's bundled Chromium is built
 * without proprietary codecs, so it cannot decode the H.264 cover video and
 * would only ever show the helix fallback. Falls back with a warning.
 */
export async function launchBrowser() {
  try {
    const browser = await chromium.launch({ channel: 'chrome' })
    return { browser, channel: 'chrome' }
  } catch (error) {
    const reason = String(error?.message ?? error).split('\n')[0]
    console.warn(
      `\n  ! Google Chrome not found (${reason}).\n` +
        '    Falling back to the bundled Chromium, which cannot decode H.264:\n' +
        '    slide 1 will show the helix fallback instead of the video.\n',
    )
    return { browser: await chromium.launch(), channel: 'chromium' }
  }
}

/** `{ slides: [{ id, name, steps, surface, backdrop }], appendix: {…} }` */
export async function readManifest(base) {
  const response = await fetch(`${base}/deck-manifest.json`)
  if (!response.ok) {
    throw new Error(`No deck manifest at ${base}/deck-manifest.json — run \`npm run build\` first.`)
  }
  return response.json()
}

/** The hero layer's state: loading · playing · failed · still (reduced motion). */
export function heroState(page) {
  return page.evaluate(() => document.querySelector('[data-hero-layer]')?.dataset.heroState ?? null)
}

/** Waits until the cover video is playing (or has definitively failed). */
export async function waitForHero(page, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  let state = await heroState(page)
  while (Date.now() < deadline && state !== 'playing' && state !== 'failed' && state !== 'still') {
    await sleep(150)
    state = await heroState(page)
  }
  return state
}
