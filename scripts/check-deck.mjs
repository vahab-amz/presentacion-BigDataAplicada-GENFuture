/**
 * Smoke-checks the built deck in a headless browser: every keyboard shortcut,
 * the hash, walking forwards and backwards through all 27 reveals, the print
 * route, and cross-window sync between the deck and the presenter view.
 *
 *   npm run build && npm run check:deck
 */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright'

const PORT = 4174
const BASE = `http://127.0.0.1:${PORT}`
/** Mirrors SLIDES in src/data/deck.ts. */
const STEPS = [4, 5, 8, 5, 5]
const TOTAL_STEPS = STEPS.reduce((a, b) => a + b, 0)

const failures = []
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${name}`)
  } else {
    console.log(`  FAIL ${name} ${detail}`)
    failures.push(`${name} ${detail}`)
  }
}

async function startServer() {
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['http-server', 'out', '-p', String(PORT), '-c-1', '--silent'],
    { stdio: 'ignore', shell: process.platform === 'win32' },
  )
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return child
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  child.kill()
  throw new Error(`Static server never answered on ${BASE}`)
}

const hash = (page) => page.evaluate(() => window.location.hash)
const announcement = (page) =>
  page.evaluate(() => document.querySelector('[aria-live]')?.textContent ?? '')

async function main() {
  const server = await startServer()
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  const errors = []
  page.on('pageerror', (error) => errors.push(String(error)))

  await page.goto(`${BASE}/#/1/0`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-deck-stage]')
  await sleep(400)

  console.log('\nForward walk')
  for (let i = 1; i < TOTAL_STEPS; i += 1) {
    await page.keyboard.press('PageDown')
    await sleep(60)
  }
  check('reaches the last step of the last slide', (await hash(page)) === '#/5/4', await hash(page))

  console.log('\nBackward walk')
  for (let i = 1; i < TOTAL_STEPS; i += 1) {
    await page.keyboard.press('PageUp')
    await sleep(60)
  }
  check('returns to the first step of slide 1', (await hash(page)) === '#/1/0', await hash(page))

  console.log('\nKeys')
  await page.keyboard.press('End')
  await sleep(200)
  check('End jumps to the last position', (await hash(page)) === '#/5/4', await hash(page))
  await page.keyboard.press('Home')
  await sleep(200)
  check('Home returns to the start', (await hash(page)) === '#/1/0', await hash(page))

  for (const digit of ['3', '4', '2']) {
    await page.keyboard.press(digit)
    await sleep(150)
    check(`key ${digit} jumps to slide ${digit}`, (await hash(page)) === `#/${digit}/0`, await hash(page))
  }

  await page.keyboard.press('Space')
  await sleep(150)
  check('Space advances a step', (await hash(page)) === '#/2/1', await hash(page))
  await page.keyboard.press('Backspace')
  await sleep(150)
  check('Backspace steps back', (await hash(page)) === '#/2/0', await hash(page))
  await page.keyboard.press('ArrowLeft')
  await sleep(200)
  check(
    'stepping back past step 0 lands on the previous slide at its last step',
    (await hash(page)) === '#/1/3',
    await hash(page),
  )

  check(
    'announces the position for screen readers',
    (await announcement(page)).includes('Diapositiva 1 de 5, paso 3'),
    await announcement(page),
  )

  await page.keyboard.press('t')
  await sleep(200)
  const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme)
  check('T switches the theme', themeAfter === 'light', String(themeAfter))
  await page.keyboard.press('t')
  await sleep(200)

  await page.keyboard.press('?')
  await sleep(300)
  check('? opens the shortcut sheet', (await page.locator('text=Atajos de teclado').count()) > 0)
  await page.keyboard.press('Escape')
  await sleep(800)
  check('Escape closes it', (await page.locator('text=Atajos de teclado').count()) === 0)

  await page.keyboard.press('n')
  await sleep(300)
  check('N opens the notes overlay', (await page.locator('text=Notas del ponente').count()) > 0)
  await page.keyboard.press('Escape')
  await sleep(800)

  await page.keyboard.press('b')
  await sleep(300)
  check('B blacks the screen out', (await page.locator('text=Pantalla en negro').count()) > 0)
  await page.keyboard.press('b')
  await sleep(800)
  check('B restores it', (await page.locator('text=Pantalla en negro').count()) === 0)

  console.log('\nSlider focus')
  await page.goto(`${BASE}/#/4/3`, { waitUntil: 'networkidle' })
  await sleep(900)
  await page.focus('#genomes-per-year')
  const before = await hash(page)
  await page.keyboard.press('ArrowRight')
  await sleep(200)
  check('a focused slider keeps the arrow keys', (await hash(page)) === before, await hash(page))
  const sliderValue = await page.inputValue('#genomes-per-year')
  check('and the slider actually moved', Number(sliderValue) > 5000, sliderValue)
  await page.keyboard.press('Escape')
  await sleep(150)
  await page.keyboard.press('ArrowRight')
  await sleep(250)
  check('Escape gives the keys back to the deck', (await hash(page)) === '#/4/4', await hash(page))

  console.log('\nCross-window sync')
  const presenter = await context.newPage()
  await presenter.goto(`${BASE}/?view=presenter#/4/4`, { waitUntil: 'networkidle' })
  await sleep(800)
  await presenter.keyboard.press('1')
  await sleep(600)
  check('navigating in the presenter window moves the deck', (await hash(page)) === '#/1/0', await hash(page))
  await page.bringToFront()
  await page.keyboard.press('3')
  await sleep(600)
  check(
    'navigating in the deck moves the presenter window',
    (await hash(presenter)) === '#/3/0',
    await hash(presenter),
  )
  await presenter.close()

  console.log('\nPrint route')
  await page.goto(`${BASE}/print/`, { waitUntil: 'networkidle' })
  await sleep(1200)
  const pages = await page.locator('.print-page').count()
  check('renders one page per slide', pages === STEPS.length, String(pages))
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll('.print-page')].some((el) => el.scrollWidth > el.clientWidth + 1),
  )
  check('no page overflows horizontally', !overflow)

  console.log('\nOverflow at 1280x720')
  const small = await context.newPage()
  await small.setViewportSize({ width: 1280, height: 720 })
  await small.goto(`${BASE}/#/3/7`, { waitUntil: 'networkidle' })
  await sleep(900)
  const bodyOverflow = await small.evaluate(
    () => document.body.scrollWidth > window.innerWidth + 1 || document.body.scrollHeight > window.innerHeight + 1,
  )
  check('the page never scrolls', !bodyOverflow)
  await small.close()

  check('no uncaught errors', errors.length === 0, errors.join(' | '))

  await browser.close()
  server.kill()

  console.log(
    failures.length === 0
      ? '\nAll deck checks passed.'
      : `\n${failures.length} check(s) failed.`,
  )
  process.exitCode = failures.length === 0 ? 0 : 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
