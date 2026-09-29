/**
 * Walks every slide and every reveal step of the built deck and writes a PNG
 * of each to ./screenshots, plus the presenter view and the print route.
 *
 *   npm run build && npm run screenshots
 *
 * Optional flags:
 *   --url=http://localhost:4173   serve `out/` yourself instead of letting the
 *                                 script start http-server
 *   --theme=light                 capture the light theme
 *   --width=1280 --height=720     capture at a second viewport
 */
import { mkdir, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
    return [key, value]
  }),
)

const PORT = Number(args.port ?? 4173)
const BASE = args.url ?? `http://127.0.0.1:${PORT}`
const THEME = args.theme === 'light' ? 'light' : 'dark'
const WIDTH = Number(args.width ?? 1920)
const HEIGHT = Number(args.height ?? 1080)
const OUT_DIR = path.resolve(
  'screenshots',
  `${THEME}-${WIDTH}x${HEIGHT}`,
)

/** Mirrors src/data/deck.ts — kept as plain data so this script stays dependency-free. */
const SLIDES = [
  { id: '1-carrera', steps: 4 },
  { id: '2-empresa', steps: 5 },
  { id: '3-nube', steps: 8 },
  { id: '4-presupuesto', steps: 5 },
  { id: '5-riesgos', steps: 5 },
]

async function startServer() {
  if (args.url) return null
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['http-server', 'out', '-p', String(PORT), '-c-1', '--silent'],
    { stdio: 'ignore', shell: process.platform === 'win32' },
  )
  // Wait until it answers.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/`)
      if (response.ok) return child
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  child.kill()
  throw new Error(`Static server never answered on ${BASE}`)
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const server = await startServer()
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  })
  await context.addInitScript(
    (theme) => window.localStorage.setItem('genfuture-deck-theme', theme),
    THEME,
  )

  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(String(error)))

  let count = 0
  for (const [index, slide] of SLIDES.entries()) {
    for (let step = 0; step < slide.steps; step += 1) {
      await page.goto(`${BASE}/#/${index + 1}/${step}`, { waitUntil: 'networkidle' })
      await page.waitForSelector('[data-deck-stage]')
      // Let the reveal for this step settle.
      await sleep(900)
      const name = `${slide.id}-step${step}.png`
      await page.screenshot({ path: path.join(OUT_DIR, name) })
      count += 1
      process.stdout.write(`  ${name}\n`)
    }
  }

  // Presenter view
  await page.goto(`${BASE}/?view=presenter#/3/5`, { waitUntil: 'networkidle' })
  await sleep(1200)
  await page.screenshot({ path: path.join(OUT_DIR, 'presenter.png') })
  count += 1

  // Print route, full page
  await page.goto(`${BASE}/print/`, { waitUntil: 'networkidle' })
  await sleep(1500)
  await page.screenshot({ path: path.join(OUT_DIR, 'print.png'), fullPage: true })
  count += 1

  await browser.close()
  server?.kill()

  console.log(`\n${count} screenshots written to ${OUT_DIR}`)
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
