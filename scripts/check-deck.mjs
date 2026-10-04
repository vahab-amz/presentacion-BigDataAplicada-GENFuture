/**
 * Smoke-checks the built deck in a real browser. Slides and steps come from
 * out/deck-manifest.json (i.e. from src/data/deck.ts), never from a list here.
 *
 *   npm run build && npm run check:deck
 *
 * Covers: every file in public/ made it into out/ (a stale build is the usual
 * reason the cover video "disappears"), every keyboard shortcut, the hash,
 * walking forwards and backwards through every reveal, the hidden appendix,
 * the mouse-only scenario buttons, the full-viewport cover video, the
 * letterbox colour, the print route, cross-window sync and page overflow.
 */
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { launchBrowser, readManifest, startServer, waitForHero } from './lib/deck-tools.mjs'

const PORT = 4174

const failures = []
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${name}`)
  } else {
    console.log(`  FAIL ${name} ${detail}`)
    failures.push(`${name} ${detail}`)
  }
}

/* -------------------------------------------------------------------------- */
/*  public/ → out/                                                             */
/* -------------------------------------------------------------------------- */

async function listFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const rel = path.join(prefix, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(path.join(dir, entry.name), rel)))
    else files.push(rel)
  }
  return files
}

async function sizeOf(file) {
  try {
    return (await stat(file)).size
  } catch {
    return null
  }
}

async function checkPublicCopied() {
  console.log('\npublic/ is in the build')
  const files = await listFiles('public')
  const stale = []
  for (const file of files) {
    const source = await sizeOf(path.join('public', file))
    const built = await sizeOf(path.join('out', file))
    if (built === null) stale.push(`out/${file.split(path.sep).join('/')} is missing`)
    else if (built !== source) stale.push(`out/${file.split(path.sep).join('/')} differs from public/`)
  }
  check(
    `all ${files.length} files in public/ are in out/`,
    stale.length === 0,
    `\n         ${stale.join('\n         ')}\n         → run \`npm run build\` again: out/ only picks up public/ when it is built.`,
  )
  const heroSource = await sizeOf(path.join('public', 'media', 'hero.mp4'))
  if (heroSource !== null) {
    check('out/media/hero.mp4 exists', (await sizeOf(path.join('out', 'media', 'hero.mp4'))) !== null)
  }
}

/* -------------------------------------------------------------------------- */
/*  Browser helpers                                                            */
/* -------------------------------------------------------------------------- */

const hash = (page) => page.evaluate(() => window.location.hash)
const announcement = (page) =>
  page.evaluate(() => document.querySelector('[aria-live]')?.textContent ?? '')
const onScreenSlide = (page) =>
  page.evaluate(() => {
    const slides = [...document.querySelectorAll('[data-slide-id]')]
    // During a cross-fade the leaving slide is still in the DOM; the last one is current.
    return slides.at(-1)?.getAttribute('data-slide-id') ?? null
  })
const counter = (page) =>
  page.evaluate(() => document.querySelector('[data-deck-counter]')?.textContent ?? '')
const progress = (page) =>
  page.evaluate(() => document.querySelector('[data-deck-progress]')?.getAttribute('data-deck-progress') ?? '')

/** RGB of one screen pixel, read back from a real screenshot. */
async function pixel(page, x, y) {
  const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } })
  return page.evaluate(async (b64) => {
    const image = new Image()
    image.src = `data:image/png;base64,${b64}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)
    return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)]
  }, png.toString('base64'))
}

const close = (a, b, tolerance = 3) => a.every((value, i) => Math.abs(value - b[i]) <= tolerance)

/* -------------------------------------------------------------------------- */

async function main() {
  await checkPublicCopied()

  const { child: server, base } = await startServer(PORT)
  const manifest = await readManifest(base)
  const slides = manifest.slides
  const total = slides.reduce((sum, slide) => sum + slide.steps, 0)
  const lastHash = `#/${slides.length}/${slides.at(-1).steps - 1}`
  const heroIndex = slides.findIndex((slide) => slide.backdrop === 'hero')

  const { browser, channel } = await launchBrowser()
  console.log(`\nBrowser: ${channel === 'chrome' ? 'Google Chrome' : 'bundled Chromium'}`)
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  const errors = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto(`${base}/#/1/0`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-deck-stage]')
  await sleep(400)

  console.log(`\nForward walk (${slides.length} slides, ${total} states, from the manifest)`)
  for (let i = 1; i < total; i += 1) {
    await page.keyboard.press('PageDown')
    await sleep(60)
  }
  check('reaches the last step of the last slide', (await hash(page)) === lastHash, await hash(page))

  console.log('\nBackward walk')
  for (let i = 1; i < total; i += 1) {
    await page.keyboard.press('PageUp')
    await sleep(60)
  }
  check('returns to the first step of slide 1', (await hash(page)) === '#/1/0', await hash(page))

  console.log('\nKeys')
  await page.keyboard.press('End')
  await sleep(200)
  check('End jumps to the last position', (await hash(page)) === lastHash, await hash(page))
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
  const lastOfFirst = slides[0].steps - 1
  check(
    'stepping back past step 0 lands on the previous slide at its last step',
    (await hash(page)) === `#/1/${lastOfFirst}`,
    await hash(page),
  )
  check(
    'announces the position for screen readers',
    (await announcement(page)).includes(`Diapositiva 1 de ${slides.length}, paso ${lastOfFirst}`),
    await announcement(page),
  )
  check('shows "n / total"', (await counter(page)) === `1 / ${slides.length}`, await counter(page))

  await page.keyboard.press('t')
  await sleep(200)
  const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme)
  check('T switches the theme', themeAfter === 'light', String(themeAfter))
  await page.keyboard.press('t')
  await sleep(200)

  await page.keyboard.press('?')
  await sleep(300)
  check('? opens the shortcut sheet', (await page.locator('text=Atajos de teclado').count()) > 0)
  check('the shortcut sheet lists the appendix', (await page.locator('dt:text-is("A")').count()) === 1)
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

  console.log('\nAppendix')
  await page.goto(`${base}/#/3/2`, { waitUntil: 'networkidle' })
  await sleep(500)
  const progressBefore = await progress(page)
  await page.keyboard.press('a')
  await sleep(700)
  check('A opens the appendix', (await onScreenSlide(page)) === manifest.appendix.id, await onScreenSlide(page))
  check('the appendix is not numbered', (await counter(page)) === 'Anexo', await counter(page))
  check('opening it leaves the position alone', (await hash(page)) === '#/3/2', await hash(page))
  const progressDuring = await progress(page)
  check('the progress bar does not move', progressDuring === progressBefore, `${progressBefore} → ${progressDuring}`)
  await page.keyboard.press('ArrowRight')
  await sleep(300)
  check('→ inside the appendix never leaves it', (await onScreenSlide(page)) === manifest.appendix.id)
  await page.keyboard.press('a')
  await sleep(700)
  check('A again returns to the same position', (await onScreenSlide(page)) === slides[2].id && (await hash(page)) === '#/3/2')
  await page.keyboard.press('a')
  await sleep(500)
  await page.keyboard.press('Escape')
  await sleep(700)
  check('Esc also returns from the appendix', (await onScreenSlide(page)) === slides[2].id && (await hash(page)) === '#/3/2')

  console.log('\nScenario buttons (slide 3)')
  await page.goto(`${base}/#/3/3`, { waitUntil: 'networkidle' })
  await sleep(900)
  await page.click('[data-scenario="expansion"]')
  await sleep(700)
  check(
    'a click selects the scenario',
    (await page.getAttribute('[data-scenario="expansion"]', 'aria-pressed')) === 'true',
  )
  const focused = await page.evaluate(() => document.activeElement?.tagName ?? '')
  check('the button gives the focus back', focused === 'BODY', focused)
  check('the click does not move the deck', (await hash(page)) === '#/3/3', await hash(page))
  const panelText = await page.evaluate(() => document.querySelector('[data-slide-id="budget"]')?.textContent ?? '')
  check('the panel counts to the Expansión total', panelText.includes('37.450'), '')
  await page.keyboard.press('Space')
  await sleep(300)
  check('Space after a click still advances the deck', (await hash(page)) === '#/3/4', await hash(page))

  console.log('\nCover video and letterbox (4:3 window, 1600x1200)')
  // A context of its own: pages that share one are synced over
  // BroadcastChannel, and the main page would pull this one to its slide.
  const squareContext = await browser.newContext({ viewport: { width: 1600, height: 1200 } })
  const square = await squareContext.newPage()
  square.on('pageerror', (error) => errors.push(String(error)))
  square.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await square.goto(`${base}/#/${heroIndex + 1}/0`, { waitUntil: 'networkidle' })
  const state = await waitForHero(square)
  await sleep(900)
  const layer = await square.evaluate(() => {
    const el = document.querySelector('[data-hero-layer]')
    const video = el?.querySelector('video')
    const r = el?.getBoundingClientRect()
    const v = video?.getBoundingClientRect()
    return {
      layer: r ? [r.left, r.top, r.width, r.height] : null,
      video: v ? [v.left, v.top, v.width, v.height] : null,
      videoOpacity: video ? Number(getComputedStyle(video).opacity) : null,
      frame: getComputedStyle(document.querySelector('[data-stage-frame]')).backgroundColor,
    }
  })
  check('the hero layer covers the whole viewport', JSON.stringify(layer.layer) === '[0,0,1600,1200]', JSON.stringify(layer.layer))
  check('the stage and letterbox are transparent over it', layer.frame === 'rgba(0, 0, 0, 0)', layer.frame)
  if (channel === 'chrome') {
    check('the cover video plays', state === 'playing', String(state))
    check('the video covers the whole viewport', JSON.stringify(layer.video) === '[0,0,1600,1200]', JSON.stringify(layer.video))
    check('the video has faded in', layer.videoOpacity !== null && layer.videoOpacity > 0.95, String(layer.videoOpacity))
  } else {
    console.log(`  skip video playback (bundled Chromium; hero state: ${state})`)
  }

  // Outside the hero slide the letterbox must be the slide's own background.
  for (const theme of ['dark', 'light']) {
    // The theme is stored, so it survives the navigations below.
    if ((await square.evaluate(() => document.documentElement.dataset.theme)) !== theme) {
      await square.keyboard.press('t')
      await sleep(300)
    }
    for (let index = 0; index < slides.length; index += 1) {
      if (index === heroIndex) continue
      await square.goto(`${base}/#/${index + 1}/0`, { waitUntil: 'networkidle' })
      await sleep(700)
      // Letterbox band is y < 150; the stage's own top margin starts at y = 150.
      const letterbox = await pixel(square, 800, 40)
      const stageEdge = await pixel(square, 800, 162)
      check(
        `${theme}: slide ${index + 1} letterbox matches the slide`,
        close(letterbox, stageEdge),
        `${letterbox} vs ${stageEdge}`,
      )
    }
  }
  // Every source failing is the only way to stay on the helix.
  const brokenContext = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const broken = await brokenContext.newPage()
  await broken.route(/\/media\/hero\.(mp4|webm)$/, (route) => route.fulfill({ status: 404 }))
  await broken.goto(`${base}/#/${heroIndex + 1}/0`, { waitUntil: 'networkidle' })
  const brokenState = await waitForHero(broken, 6_000)
  const helix = await broken.locator('[data-hero-helix]').count()
  check('with every video source failing, the helix stays', brokenState === 'failed' && helix === 1, `${brokenState}, helix ${helix}`)
  await brokenContext.close()

  const pausedAway = await square.evaluate(() => document.querySelector('[data-hero-layer] video')?.paused ?? true)
  check('the video is paused while hidden', pausedAway === true)
  await squareContext.close()

  console.log('\nCross-window sync')
  await page.goto(`${base}/#/4/4`, { waitUntil: 'networkidle' })
  const presenter = await context.newPage()
  await presenter.goto(`${base}/?view=presenter#/4/4`, { waitUntil: 'networkidle' })
  await sleep(800)
  await presenter.keyboard.press('1')
  await sleep(600)
  check('navigating in the presenter window moves the deck', (await hash(page)) === '#/1/0', await hash(page))
  const presenterMedia = await presenter.evaluate(() => ({
    videos: document.querySelectorAll('video').length,
    posters: document.querySelectorAll('img[src*="hero-poster"]').length,
  }))
  check('the presenter view shows the poster, not the video', presenterMedia.videos === 0 && presenterMedia.posters > 0, JSON.stringify(presenterMedia))
  await page.bringToFront()
  await page.keyboard.press('3')
  await sleep(600)
  check('navigating in the deck moves the presenter window', (await hash(presenter)) === '#/3/0', await hash(presenter))
  await page.keyboard.press('a')
  await sleep(600)
  check(
    'the appendix opens in the presenter window too',
    (await presenter.locator(`text=${manifest.appendix.name}`).count()) > 0,
  )
  await page.keyboard.press('a')
  await sleep(300)
  await presenter.close()

  console.log('\nPrint route')
  await page.goto(`${base}/print/`, { waitUntil: 'networkidle' })
  await sleep(1200)
  const pages = await page.locator('.print-page').count()
  check('renders one page per slide, plus the appendix', pages === slides.length + 1, String(pages))
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll('.print-page')].some((el) => el.scrollWidth > el.clientWidth + 1),
  )
  check('no page overflows horizontally', !overflow)
  const printMedia = await page.evaluate(() => ({
    videos: document.querySelectorAll('video').length,
    posterLoaded: [...document.querySelectorAll('img[src*="hero-poster"]')].some((img) => img.complete && img.naturalWidth > 0),
  }))
  check('print uses the poster still', printMedia.videos === 0 && printMedia.posterLoaded, JSON.stringify(printMedia))

  console.log('\nOverflow at 1280x720')
  const small = await context.newPage()
  await small.setViewportSize({ width: 1280, height: 720 })
  await small.goto(`${base}/#/2/6`, { waitUntil: 'networkidle' })
  await sleep(900)
  const bodyOverflow = await small.evaluate(
    () => document.body.scrollWidth > window.innerWidth + 1 || document.body.scrollHeight > window.innerHeight + 1,
  )
  check('the page never scrolls', !bodyOverflow)
  await small.close()

  check('no uncaught errors or failed requests', errors.length === 0, [...new Set(errors)].join(' | '))

  await browser.close()
  server.kill()

  console.log(failures.length === 0 ? '\nAll deck checks passed.' : `\n${failures.length} check(s) failed.`)
  process.exitCode = failures.length === 0 ? 0 : 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
