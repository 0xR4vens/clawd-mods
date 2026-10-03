// Renders a demo of Clawd's strip as an animated GIF, with no dependencies:
// each cell becomes a block of pixels (half blocks as two halves, braille
// cells as their dots), the colours are snapped to a 256-colour palette (a
// colour cube plus the background and a few greys), and the frames are
// LZW-encoded by hand.
//
//   node --experimental-strip-types scripts/demo-gif.ts docs/demo.gif
//   node --experimental-strip-types scripts/demo-gif.ts one.gif --frame 120
//
// Text cells (the task name) are skipped: there is no font here.

import { writeFileSync } from 'node:fs'

import { frame, newWalker, step, type Act, type Progress } from '../hooks/art.ts'

const COLS = 72
const ROWS = 4
const CW = 10
const CH = 20
// A margin round the strip, in the background colour.
const PAD = 24
const FPS = 12
const BG: [number, number, number] = [24, 24, 27]
const CLEAR = 0x01000000

// The tour: each act for a few seconds, the progress filling as it goes,
// a cheer at each new task and fireworks at the end.
const TOUR: [Act, number][] = [
  ['walk', 2],
  ['hammer', 2],
  ['fly', 2.5],
  ['magic', 4],
  ['race', 2.5],
  ['laser', 2],
  ['knight', 2.5],
  ['jetpack', 2],
  ['juggle', 1.5],
  ['trophy', 1.5],
  ['dj', 2],
  ['rocket', 2],
  ['finale', 3.5],
]

// 6 x 7 x 6 levels of red, green and blue, then the background and greys.
const LEVELS = [
  [0, 51, 102, 153, 204, 255],
  [0, 43, 85, 128, 170, 213, 255],
  [0, 51, 102, 153, 204, 255],
]
const PALETTE: number[] = []
for (const r of LEVELS[0]!) for (const g of LEVELS[1]!) for (const b of LEVELS[2]!) PALETTE.push(r, g, b)
PALETTE.push(...BG, 48, 48, 52, 72, 72, 76, 100, 100, 104)
const nearest = new Map<number, number>()
function paletteIndex(r: number, g: number, b: number) {
  const key = (r << 16) | (g << 8) | b
  const known = nearest.get(key)
  if (known !== undefined) return known
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < 256; i++) {
    const d = (PALETTE[i * 3]! - r) ** 2 * 2 + (PALETTE[i * 3 + 1]! - g) ** 2 * 4 + (PALETTE[i * 3 + 2]! - b) ** 2 * 3
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  nearest.set(key, best)

  return best
}

const W = COLS * CW + PAD * 2
const H = ROWS * CH + PAD * 2
const BRAILLE = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]

function render(words: Uint32Array): Uint8Array {
  const img = new Uint8Array(W * H).fill(paletteIndex(...BG))
  const fill = (x0: number, y0: number, w: number, h: number, c: number) => {
    if (c === CLEAR) return
    const p = paletteIndex((c >> 16) & 255, (c >> 8) & 255, c & 255)
    for (let y = y0; y < y0 + h; y++) img.fill(p, y * W + x0, y * W + x0 + w)
  }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const i = (r * COLS + c) * 3
      const ch = words[i]!
      const fg = words[i + 1]!
      const bg = words[i + 2]!
      const x = PAD + c * CW
      const y = PAD + r * CH
      fill(x, y, CW, CH, bg)
      if (ch === 0x2580) fill(x, y, CW, CH / 2, fg)
      else if (ch === 0x2584) fill(x, y + CH / 2, CW, CH / 2, fg)
      else if (ch >= 0x2800 && ch <= 0x28ff) {
        const bits = ch - 0x2800
        for (let dr = 0; dr < 4; dr++) for (let dc = 0; dc < 2; dc++) if (bits & BRAILLE[dr]![dc]!) fill(x + 2 + dc * 5, y + 2 + dr * 5, 2, 2, fg)
      }
    }

  return img
}

// LZW for one frame of 8-bit indices, as GIF wants it.
function lzw(pixels: Uint8Array): number[] {
  const out: number[] = []
  let cur = 0
  let nbits = 0
  let size = 9
  const emit = (code: number) => {
    cur |= code << nbits
    nbits += size
    while (nbits >= 8) {
      out.push(cur & 255)
      cur >>>= 8
      nbits -= 8
    }
  }
  const CLEAR_CODE = 256
  const END = 257
  let dict = new Map<string, number>()
  let next = 258
  emit(CLEAR_CODE)
  let prefix = String(pixels[0])
  for (let i = 1; i < pixels.length; i++) {
    const k = pixels[i]!
    const key = `${prefix},${k}`
    if (dict.has(key)) {
      prefix = key
      continue
    }
    emit(prefix.includes(',') ? dict.get(prefix)! : Number(prefix))
    if (next < 4096) {
      dict.set(key, next++)
      if (next > 1 << size && size < 12) size++
    } else {
      emit(CLEAR_CODE)
      dict = new Map()
      next = 258
      size = 9
    }
    prefix = String(k)
  }
  emit(prefix.includes(',') ? dict.get(prefix)! : Number(prefix))
  emit(END)
  if (nbits > 0) out.push(cur & 255)

  return out
}

function gif(frames: Uint8Array[]): Buffer {
  const b: number[] = []
  const u16 = (v: number) => b.push(v & 255, (v >> 8) & 255)
  b.push(...Buffer.from('GIF89a'))
  u16(W)
  u16(H)
  b.push(0xf7, 0, 0, ...PALETTE)
  b.push(0x21, 0xff, 11, ...Buffer.from('NETSCAPE2.0'), 3, 1, 0, 0, 0)
  for (const f of frames) {
    b.push(0x21, 0xf9, 4, 0, ...[Math.round(100 / FPS), 0], 0, 0)
    b.push(0x2c)
    u16(0)
    u16(0)
    u16(W)
    u16(H)
    b.push(0, 8)
    const data = lzw(f)
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.slice(i, i + 255)
      b.push(chunk.length, ...chunk)
    }
    b.push(0)
  }
  b.push(0x3b)

  return Buffer.from(b)
}

const total = TOUR.reduce((s, [, d]) => s + d, 0)
const walker = newWalker()
walker.x = 8
const frames: Uint8Array[] = []
let at = 0
let lastTask = 0
let cheerAt = -10
for (const [act, seconds] of TOUR) {
  for (let i = 0; i < seconds * FPS; i++) {
    const t = at + i / FPS
    // Five tasks over the tour, the last one done as the finale starts.
    const done = act === 'finale' ? 5 : Math.min(4, Math.floor((t / (total - 3.5)) * 5))
    if (done > lastTask) {
      lastTask = done
      cheerAt = t
    }
    const progress: Progress = { frac: done / 5, label: '', isDone: done === 5 }
    step(walker, t * 1000, act, COLS)
    const words = frame({ walker, t, act, cols: COLS, bg: BG, progress, cheerAge: act === 'finale' ? t - at : t - cheerAt, helpers: act === 'dj' ? 2 : 0, hasEvents: false })
    frames.push(render(words))
  }
  at += seconds
}

// --frame N writes that frame alone, to look at one moment.
const out = process.argv[2] ?? 'demo.gif'
const only = process.argv.indexOf('--frame')
const picked = only > 0 ? [frames[Number(process.argv[only + 1])]!] : frames
writeFileSync(out, gif(picked))
console.log(`${out}: ${picked.length} frames, ${W}x${H}`)
