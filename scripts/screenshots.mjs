/**
 * Walks every slide and every reveal step of the built deck — slides and step
 * counts come from out/deck-manifest.json, i.e. from src/data/deck.ts — and
 * writes a PNG of each to ./screenshots, plus the appendix, the presenter
 * view and the print route.
 *
 *   npm run build && npm run screenshots
 *
 * Optional flags:
 *   --url=http://localhost:4173   serve `out/` yourself instead of letting the
 *                                 script start http-server
 *   --theme=light                 capture the light theme
 *   --width=1280 --height=720     capture at a second viewport
 *   --all                         dark and light, at 1920x1080 and 1280x720
 *
 * Uses Google Chrome when installed (it can play the H.264 cover video);
 * otherwise the bundled Chromium, with a warning.
 */
import { mkdir, rm } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import path from 'node:path'
import { launchBrowser, readManifest, startServer, waitForHero } from './lib/deck-tools.mjs'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
    return [key, value]
  }),
)

const PORT = Number(args.port ?? 4173)
/** Long enough for the slowest reveal (count-ups, the travelling packet). */
const SETTLE_MS = 1_400

const RUNS =
  args.all === 'true'
    ? [
        { theme: 'dark', width: 1920, height: 1080 },
        { theme: 'light', width: 1920, height: 1080 },
        { theme: 'dark', width: 1280, height: 720 },
        { theme: 'light', width: 1280, height: 720 },
      ]
    : [
        {
          theme: args.theme === 'light' ? 'light' : 'dark',
          width: Number(args.width ?? 1920),
          height: Number(args.height ?? 1080),
        },
      ]

async function capture(browser, channel, base, manifest, { theme, width, height }) {
  const outDir = path.resolve('screenshots', `${theme}-${width}x${height}`)
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  })
  await context.addInitScript(
    (value) => window.localStorage.setItem('genfuture-deck-theme', value),
    theme,
  )

  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })

  const shoot = async (name) => {
    await page.screenshot({ path: path.join(outDir, name) })
    process.stdout.write(`  ${theme}-${width}x${height}/${name}\n`)
  }

  for (const [index, slide] of manifest.slides.entries()) {
    for (let step = 0; step < slide.steps; step += 1) {
      await page.goto(`${base}/#/${index + 1}/${step}`, { waitUntil: 'networkidle' })
      await page.waitForSelector('[data-deck-stage]')
      if (slide.backdrop === 'hero') {
        const state = await waitForHero(page)
        // Only Chrome can decode the H.264 file; Chromium shows the helix.
        if (channel === 'chrome' && step === 0 && state !== 'playing') {
          errors.push(`slide ${index + 1}: cover video did not play (state: ${state})`)
        }
      }
      await sleep(SETTLE_MS)
      await shoot(`${index + 1}-${slide.id}-step${step}.png`)
    }
  }

  // The appendix opens fully revealed; walk its reveals back to the first.
  const appendix = manifest.appendix
  await page.goto(`${base}/#/${manifest.slides.length}/0`, { waitUntil: 'networkidle' })
  await sleep(400)
  await page.keyboard.press('a')
  for (let step = appendix.steps - 1; step >= 0; step -= 1) {
    await sleep(SETTLE_MS)
    await shoot(`A-${appendix.id}-step${step}.png`)
    if (step > 0) await page.keyboard.press('PageUp')
  }
  await page.keyboard.press('a')

  // Presenter view, on the cover and on the interactive budget step.
  for (const hash of ['#/1/0', '#/3/3']) {
    await page.goto(`${base}/?view=presenter${hash}`, { waitUntil: 'networkidle' })
    await sleep(SETTLE_MS)
    await shoot(`presenter-${hash.slice(2).replace('/', '-')}.png`)
  }

  // Print route, full page.
  await page.goto(`${base}/print/`, { waitUntil: 'networkidle' })
  await sleep(1_500)
  await page.screenshot({ path: path.join(outDir, 'print.png'), fullPage: true })
  process.stdout.write(`  ${theme}-${width}x${height}/print.png\n`)

  await context.close()
  return errors
}

async function main() {
  const server = args.url ? null : await startServer(PORT)
  const base = args.url ?? server.base
  const manifest = await readManifest(base)
  const { browser, channel } = await launchBrowser()
  console.log(`Capturing with ${channel === 'chrome' ? 'Google Chrome' : 'bundled Chromium'}\n`)

  const errors = []
  for (const run of RUNS) errors.push(...(await capture(browser, channel, base, manifest, run)))

  await browser.close()
  server?.child.kill()

  console.log(`\nScreenshots written to ${path.resolve('screenshots')}`)
  if (errors.length > 0) {
    console.log('\nBrowser errors:')
    for (const error of new Set(errors)) console.log(`  ! ${error}`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
