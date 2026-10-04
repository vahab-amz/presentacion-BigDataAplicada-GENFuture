/**
 * Just enough of an ISO-BMFF (MP4) reader to answer the questions that decide
 * whether a browser can stream the cover video: which codec, which chroma
 * format, is there an audio track, and does `moov` come before `mdat`
 * (“faststart”). Works without ffprobe.
 */
import { readFile } from 'node:fs/promises'

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl'])
const PROFILES = { 66: 'Baseline', 77: 'Main', 88: 'Extended', 100: 'High', 110: 'High 10', 122: 'High 4:2:2', 244: 'High 4:4:4' }
const CHROMA = ['4:0:0', '4:2:0', '4:2:2', '4:4:4']

export async function mp4Info(file) {
  const buf = await readFile(file)
  const topLevel = []
  const tracks = []
  let current = null

  const walk = (start, end, depth) => {
    let p = start
    while (p + 8 <= end) {
      let size = buf.readUInt32BE(p)
      const type = buf.toString('latin1', p + 4, p + 8)
      let header = 8
      if (size === 1) {
        size = Number(buf.readBigUInt64BE(p + 8))
        header = 16
      } else if (size === 0) {
        size = end - p
      }
      if (size < header) break
      if (depth === 0) topLevel.push({ type, offset: p })
      if (type === 'trak') {
        current = {}
        tracks.push(current)
      }
      if (type === 'hdlr' && current) current.handler = buf.toString('latin1', p + header + 8, p + header + 12)
      if (type === 'stsd' && current) readSampleEntry(p + header + 8, current)
      if (CONTAINERS.has(type)) walk(p + header, p + size, depth + 1)
      p += size
    }
  }

  const readSampleEntry = (entry, track) => {
    const entrySize = buf.readUInt32BE(entry)
    track.codec = buf.toString('latin1', entry + 4, entry + 8)
    if (!['avc1', 'avc3'].includes(track.codec)) return
    track.width = buf.readUInt16BE(entry + 32)
    track.height = buf.readUInt16BE(entry + 34)
    // Child boxes of a visual sample entry start after its 78-byte body.
    let q = entry + 86
    while (q + 8 <= entry + entrySize) {
      const size = buf.readUInt32BE(q)
      if (size < 8) break
      if (buf.toString('latin1', q + 4, q + 8) === 'avcC') {
        const profile = buf[q + 9]
        track.profile = PROFILES[profile] ?? String(profile)
        track.level = buf[q + 11] / 10
        track.chroma = '4:2:0' // the default for profiles without the extension
        track.bitDepth = 8
        if ([100, 110, 122, 244].includes(profile)) {
          let r = q + 13
          const sps = buf[r] & 31
          r += 1
          for (let i = 0; i < sps; i += 1) r += 2 + buf.readUInt16BE(r)
          const pps = buf[r]
          r += 1
          for (let i = 0; i < pps; i += 1) r += 2 + buf.readUInt16BE(r)
          if (r + 2 < q + size) {
            track.chroma = CHROMA[buf[r] & 3]
            track.bitDepth = (buf[r + 1] & 7) + 8
          }
        }
      }
      q += size
    }
  }

  walk(0, buf.length, 0)
  const moov = topLevel.findIndex((box) => box.type === 'moov')
  const mdat = topLevel.findIndex((box) => box.type === 'mdat')
  const video = tracks.find((t) => t.handler === 'vide')
  return {
    video,
    hasAudio: tracks.some((t) => t.handler === 'soun'),
    faststart: moov !== -1 && mdat !== -1 && moov < mdat,
  }
}
