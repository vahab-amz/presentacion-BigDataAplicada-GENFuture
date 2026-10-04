/**
 * Checks public/media/hero.mp4 and, when ffmpeg is installed, fixes it.
 *
 *   npm run media:hero        then   npm run build
 *
 * The cover video must be H.264 + yuv420p with `moov` before `mdat`
 * (faststart), so every browser can decode it and start playing before the
 * whole file has arrived. If it is not, and ffmpeg is on the PATH:
 *   1. the original is kept as public/media/hero-original.mp4,
 *   2. hero.mp4 is re-encoded (libx264, CRF 20, yuv420p, +faststart, no audio),
 *   3. hero.webm is produced as well (VP9, no audio); the deck lists it first.
 * Without ffmpeg it only reports what it found and prints the commands.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { rename } from 'node:fs/promises'
import path from 'node:path'
import { mp4Info } from './lib/mp4-info.mjs'

const MEDIA = path.join('public', 'media')
const HERO = path.join(MEDIA, 'hero.mp4')
const ORIGINAL = path.join(MEDIA, 'hero-original.mp4')
const WEBM = path.join(MEDIA, 'hero.webm')

const has = (tool) => spawnSync(tool, ['-version'], { stdio: 'ignore' }).status === 0

function ffprobe(file) {
  const result = spawnSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,pix_fmt,profile,width,height', '-of', 'json', file],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) return null
  return JSON.parse(result.stdout).streams?.[0] ?? null
}

function run(args) {
  console.log(`  $ ffmpeg ${args.join(' ')}`)
  const result = spawnSync('ffmpeg', args, { stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`ffmpeg exited with ${result.status}`)
}

const mp4Args = (input) => [
  '-y', '-i', input,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', '-an', HERO,
]
const webmArgs = (input) => [
  '-y', '-i', input,
  '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p',
  '-an', WEBM,
]

async function main() {
  if (!existsSync(HERO)) {
    console.log(`No ${HERO}: the deck will show the helix on slide 1. Nothing to do.`)
    return
  }

  const info = await mp4Info(HERO)
  const probe = has('ffprobe') ? ffprobe(HERO) : null
  const codec = probe?.codec_name ?? (info.video?.codec?.startsWith('avc') ? 'h264' : info.video?.codec)
  const pixFmt =
    probe?.pix_fmt ??
    (info.video?.chroma === '4:2:0' && info.video?.bitDepth === 8 ? 'yuv420p' : `${info.video?.chroma} ${info.video?.bitDepth}-bit`)

  console.log(`\n${HERO}`)
  console.log(`  codec        ${codec}${info.video?.profile ? ` (${info.video.profile}, level ${info.video.level})` : ''}`)
  console.log(`  pixel format ${pixFmt}${probe ? '' : '  (read from the avcC box; ffprobe not installed)'}`)
  console.log(`  size         ${info.video?.width} x ${info.video?.height}`)
  console.log(`  faststart    ${info.faststart ? 'yes' : 'no — moov is after mdat'}`)
  console.log(`  audio track  ${info.hasAudio ? 'yes (the deck plays it muted)' : 'no'}`)

  const problems = []
  if (codec !== 'h264') problems.push(`codec is ${codec}, not H.264`)
  if (pixFmt !== 'yuv420p') problems.push(`pixel format is ${pixFmt}, not yuv420p`)
  if (!info.faststart) problems.push('moov is not at the start (no faststart)')

  const needsMp4 = problems.length > 0
  const needsWebm = !existsSync(WEBM)
  if (!needsMp4 && !needsWebm) {
    console.log('\nAlready H.264 + yuv420p + faststart, and hero.webm exists. Nothing to do.')
    return
  }
  if (needsMp4) console.log(`\nNeeds a re-encode: ${problems.join('; ')}.`)

  if (!has('ffmpeg')) {
    const source = needsMp4 ? ORIGINAL : HERO
    console.log('\nffmpeg is not installed, so nothing was changed. With ffmpeg on the PATH, run')
    console.log('this script again, or by hand:')
    if (needsMp4) console.log(`  move ${HERO} ${ORIGINAL}\n  ffmpeg ${mp4Args(ORIGINAL).join(' ')}`)
    console.log(`  ffmpeg ${webmArgs(source).join(' ')}`)
    console.log('then `npm run build`.')
    return
  }

  let source = HERO
  if (needsMp4) {
    if (!existsSync(ORIGINAL)) {
      await rename(HERO, ORIGINAL)
      console.log(`\nKept the original as ${ORIGINAL}`)
    }
    source = ORIGINAL
    run(mp4Args(ORIGINAL))
  }
  run(webmArgs(source))
  console.log('\nDone. Now run `npm run build`: out/ only picks up public/ when it is built.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
