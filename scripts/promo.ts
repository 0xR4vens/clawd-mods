// Renders the promo clips: six 20-second 1920x1080 MP4s, one per theme,
// for a post. Each frame is drawn here (backdrop, a terminal window sliding
// in, Clawd's strip large, task checkboxes, an end card); the
// titles are an ASS subtitle track burnt in by ffmpeg (libass), so they can
// fade and glide in proper fonts.
//
//   FFMPEG=/path/to/ffmpeg FONTS=/path/to/fonts \
//     node --experimental-strip-types scripts/promo.ts out/        (six clips)
//     node --experimental-strip-types scripts/promo.ts out/ film   (one video)
//
// FONTS must hold Poppins (Bold) and DM Sans (Regular, Medium) TTFs.

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { frame, newWalker, step, type Act, type Look, type Progress, type Rgb } from '../hooks/art.ts'

const W = 1920
const H = 1080
const FPS = 30
const SECONDS = 20
const COLS = 96
const CW = 15
const CH = 30
const STRIP_X = 240
// The window: compact unless the clip shows tasks or usage bars, and
// centred under the titles either way. Everything inside is placed from
// its top.
function layout(clip: Clip) {
  const isTall = Boolean(clip.tasks)
  const h = isTall ? 520 : 340
  const y = isTall ? 330 : 380

  return { x: 180, y, w: 1560, h, prompt: y + 90, word: y + 140, strip: y + 180, tasks: y + 350 }
}
const BG_TOP: Rgb = [15, 15, 19]
const BG_BOTTOM: Rgb = [27, 22, 31]
const WIN_BG: Rgb = [24, 24, 27]
const WIN_EDGE: Rgb = [48, 48, 56]
const ORANGE: Rgb = [217, 119, 87]
const CLEAR = 0x01000000
// When the end card comes in; a clip without one (inside the film) never
// reaches it.
const END_AT = 18.2
let END_CARD = END_AT

type Segment = { to: number; act: Act; word: string; helpers?: number; look?: Look }
type Task = { title: string; doneAt: number }
type Clip = {
  name: string
  title: string
  subtitle: string
  prompt: string
  segments: Segment[]
  // a second title half-way, if any: [from, title, subtitle]
  then?: [number, string, string]
  tasks?: Task[]
}

const CLIPS: Clip[] = [
  {
    name: '1-follows-the-work',
    title: 'Clawd follows the work',
    subtitle: 'A magnifying glass to read, a pickaxe to search, a hammer to edit',
    prompt: 'fix the pagination bug in the API',
    segments: [
      { to: 4.5, act: 'read', word: 'Reading src/api.ts…' },
      { to: 8, act: 'dig', word: 'Searching for "paginate"…' },
      { to: 11.5, act: 'hammer', word: 'Editing src/api.ts…' },
      { to: 14.5, act: 'terminal', word: 'Running npm run build…' },
      { to: 20, act: 'coffee', word: 'Running npm run e2e… (28s)' },
    ],
    then: [14.5, 'Long command? Coffee time', 'Anything over 20 seconds gets a mug'],
  },
  {
    name: '2-git-and-tests',
    title: 'It reacts to your workflow',
    subtitle: 'Tests, installs, commits and pushes all get their own moment',
    prompt: 'add the test, install zod, then commit and push',
    segments: [
      { to: 4, act: 'juggle', word: 'Running npm test…' },
      { to: 6.2, act: 'trophy', word: 'Tests passed' },
      { to: 9.5, act: 'boxes', word: 'Running npm install zod…' },
      { to: 12.5, act: 'flag', word: 'Running git commit…' },
      { to: 15.5, act: 'rocket', word: 'Running git push…' },
      { to: 20, act: 'trip', word: 'Error: exit code 1' },
    ],
    then: [15.5, 'And when it breaks…', 'a little rain cloud'],
  },
  {
    name: '3-costumes',
    title: 'A dozen costumes',
    subtitle: 'Superhero, racer, jetpack, skater, pirate, knight, astronaut, DJ',
    prompt: 'refactor the auth module',
    segments: [
      { to: 3, act: 'fly', word: 'Flying through the code…' },
      { to: 5.2, act: 'race', word: 'Refactoring…' },
      { to: 7.4, act: 'jetpack', word: 'Refactoring…' },
      { to: 9.6, act: 'skate', word: 'Refactoring…' },
      { to: 11.8, act: 'pirate', word: 'Refactoring…' },
      { to: 14, act: 'knight', word: 'Slaying a bug…' },
      { to: 16.2, act: 'astronaut', word: 'Refactoring…' },
      { to: 20, act: 'dj', word: 'Refactoring…' },
    ],
  },
  {
    name: '4-magician',
    title: 'The magician conjures friends',
    subtitle: 'Bunnies, frogs, birds, ducks, snails and butterflies',
    prompt: 'write the docs for the new endpoints',
    segments: [
      { to: 11, act: 'magic', word: 'Writing docs/api.md…' },
      { to: 20, act: 'laser', word: 'Running 3 agents…', helpers: 3 },
    ],
    then: [11, 'Subagents get helpers', 'One little Clawd per agent at work'],
  },
  {
    name: '5-progress',
    title: 'Your task list is the progress bar',
    subtitle: 'Colour up to the current task, grey after it, confetti at each step',
    prompt: 'migrate the settings page to the new API',
    segments: [
      { to: 4, act: 'read', word: 'Reading the settings page…' },
      { to: 8, act: 'hammer', word: 'Editing settings.tsx…' },
      { to: 12, act: 'race', word: 'Updating the API calls…' },
      { to: 16, act: 'juggle', word: 'Running the tests…' },
      { to: 20, act: 'finale', word: 'Done' },
    ],
    tasks: [
      { title: 'Read the settings page', doneAt: 4 },
      { title: 'Move the form to the new API', doneAt: 8 },
      { title: 'Update the API calls', doneAt: 12 },
      { title: 'Run the tests', doneAt: 16 },
    ],
  },
  {
    name: '6-little-moments',
    title: 'He lives a little',
    subtitle: 'A bulb after a long think, a crown for a streak, the seasons',
    prompt: 'why is the cache invalidated twice?',
    segments: [
      { to: 3.5, act: 'think', word: 'Thinking…' },
      { to: 6, act: 'stand', word: 'Thinking… (14s)', look: { bulbAge: 0 } },
      { to: 9.5, act: 'hammer', word: 'Editing cache.ts…', look: { hasCrown: true } },
      { to: 14, act: 'walk', word: 'Editing cache.ts…', look: { season: 'halloween' } },
      { to: 17, act: 'stand', word: 'Waiting…', look: { isNight: true } },
      { to: 20, act: 'dance', word: 'Dancing…' },
    ],
    then: [14, 'Stars after 9pm', 'and type “danse clawd” to make him dance'],
  },
]

// ---- drawing ----

const mix = (a: Rgb, b: Rgb, m: number): Rgb => [0, 1, 2].map(i => Math.round(a[i]! + (b[i]! - a[i]!) * m)) as Rgb
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3)

function backdrop() {
  const img = Buffer.alloc(W * H * 3)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const base = mix(BG_TOP, BG_BOTTOM, y / H)
      // a soft orange glow low in the middle
      const d = Math.hypot((x - W / 2) / W, (y - H * 0.9) / H)
      const glow = Math.max(0, 0.18 - d * 0.35)
      // a little grain, so the gradients don't band
      const grain = (((x * 7919 + y * 104729) % 97) / 97 - 0.5) * 3
      const c = mix(base, ORANGE, glow).map(v => Math.max(0, Math.min(255, Math.round(v + grain)))) as Rgb
      img.set(c, (y * W + x) * 3)
    }

  return img
}

class Canvas {
  img: Buffer
  constructor(base: Buffer) {
    this.img = Buffer.from(base)
  }
  fill(x0: number, y0: number, w: number, h: number, c: Rgb, a = 1) {
    const xa = Math.max(0, Math.round(x0))
    const ya = Math.max(0, Math.round(y0))
    const xb = Math.min(W, Math.round(x0 + w))
    const yb = Math.min(H, Math.round(y0 + h))
    for (let y = ya; y < yb; y++)
      for (let x = xa; x < xb; x++) {
        const i = (y * W + x) * 3
        if (a >= 1) this.img.set(c, i)
        else for (let k = 0; k < 3; k++) this.img[i + k] = Math.round(this.img[i + k]! + (c[k]! - this.img[i + k]!) * a)
      }
  }
  round(x0: number, y0: number, w: number, h: number, r: number, c: Rgb, a = 1) {
    for (let y = 0; y < h; y++) {
      const dy = y < r ? r - y : y >= h - r ? y - (h - r - 1) : 0
      const inset = dy > 0 ? r - Math.sqrt(Math.max(0, r * r - dy * dy)) : 0
      this.fill(x0 + inset, y0 + y, w - inset * 2, 1, c, a)
    }
  }
  disc(cx: number, cy: number, r: number, c: Rgb, a = 1) {
    for (let y = -r; y <= r; y++) {
      const half = Math.sqrt(r * r - y * y)
      this.fill(cx - half, cy + y, half * 2, 1, c, a)
    }
  }
}

const BRAILLE = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]

function strip(cv: Canvas, words: Uint32Array, x0: number, y0: number, a: number) {
  const rgb = (c: number): Rgb => [(c >> 16) & 255, (c >> 8) & 255, c & 255]
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < COLS; c++) {
      const i = (r * COLS + c) * 3
      const ch = words[i]!
      const fg = words[i + 1]!
      const bg = words[i + 2]!
      const x = x0 + c * CW
      const y = y0 + r * CH
      if (bg !== CLEAR) cv.fill(x, y, CW, CH, rgb(bg), a)
      if (fg === CLEAR) continue
      if (ch === 0x2580) cv.fill(x, y, CW, CH / 2, rgb(fg), a)
      else if (ch === 0x2584) cv.fill(x, y + CH / 2, CW, CH / 2, rgb(fg), a)
      else if (ch >= 0x2800 && ch <= 0x28ff) {
        const bits = ch - 0x2800
        for (let dr = 0; dr < 4; dr++) for (let dc = 0; dc < 2; dc++) if (bits & BRAILLE[dr]![dc]!) cv.fill(x + 3 + dc * 6, y + 3 + dr * 7, 3, 3, rgb(fg), a)
      }
    }
}

// The spinner's little star.
function star(cv: Canvas, cx: number, cy: number, t: number, a: number) {
  const s = 1 + Math.round((Math.sin(t * 6) + 1) * 1.5)
  cv.fill(cx - 1, cy - 4 - s, 3, 9 + s * 2, ORANGE, a)
  cv.fill(cx - 4 - s, cy - 1, 9 + s * 2, 3, ORANGE, a)
  cv.fill(cx - 3, cy - 3, 7, 7, ORANGE, a * 0.6)
}

// ---- titles (ASS) ----

const ts = (s: number) => {
  const cs = Math.round(Math.max(0, s) * 100)
  const h = Math.floor(cs / 360000)
  const m = Math.floor((cs / 6000) % 60)
  const sec = Math.floor((cs / 100) % 60)

  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`
}
const esc = (s: string) => s.replace(/[{}\\]/g, '')

function ass(clip: Clip) {
  const L = layout(clip)
  const ev: string[] = []
  const line = (from: number, to: number, style: string, tags: string, text: string) => ev.push(`Dialogue: 0,${ts(from)},${ts(to)},${style},,0,0,0,,{${tags}}${esc(text)}`)
  const titleTo = clip.then ? clip.then[0] : END_CARD
  line(0.3, titleTo, 'Title', '\\an8\\fad(450,300)\\move(960,150,960,118,0,600)', clip.title)
  line(0.55, titleTo, 'Sub', '\\an8\\fad(450,300)\\move(960,232,960,206,0,650)', clip.subtitle)
  if (clip.then) {
    const [from, title, sub] = clip.then
    line(from + 0.1, END_CARD, 'Title', '\\an8\\fad(400,300)\\move(960,150,960,118,0,550)', title)
    line(from + 0.3, END_CARD, 'Sub', '\\an8\\fad(400,300)\\move(960,232,960,206,0,600)', sub)
  }
  line(0.6, END_CARD, 'Chrome', `\\an4\\pos(300,${L.y + 21})\\fad(500,200)`, 'claude — ~/project')
  line(0.8, END_CARD, 'Prompt', `\\an4\\pos(240,${L.prompt})\\fad(400,200)`, `> ${clip.prompt}`)
  let from = 1
  for (const seg of clip.segments) {
    line(Math.max(1, from), Math.min(seg.to, END_CARD), 'Word', `\\an4\\pos(276,${L.word})\\fad(120,80)`, seg.word)
    from = seg.to
  }
  clip.tasks?.forEach((task, i) => {
    const y = L.tasks + i * 38
    line(0.9 + i * 0.12, task.doneAt, 'Task', `\\an4\\pos(290,${y})\\fad(300,0)`, task.title)
    line(task.doneAt, END_CARD, 'TaskDone', `\\an4\\pos(290,${y})`, task.title)
  })
  line(0.8, END_CARD, 'Footer', '\\an2\\pos(960,1030)\\fad(600,300)', 'clawd-mods  ·  open source  ·  zero tokens')
  if (END_CARD < SECONDS) line(END_CARD + 0.2, SECONDS, 'Card', '\\an5\\fad(400,0)\\move(960,520,960,490,0,600)', 'clawd-mods')
  if (END_CARD < SECONDS) line(END_CARD + 0.4, SECONDS, 'CardSub', '\\an5\\fad(400,0)\\move(960,610,960,590,0,600)', 'Pixel Clawd for Claude Code · open source')

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Poppins,72,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,8,0,0,0,1
Style: Sub,DM Sans,34,&H00C8C0BC,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,8,0,0,0,1
Style: Chrome,DM Sans,24,&H00908A86,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,4,0,0,0,1
Style: Prompt,DM Sans,32,&H00E6E2E0,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,4,0,0,0,1
Style: Word,DM Sans,32,&H005777D9,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,4,0,0,0,1
Style: Task,DM Sans,28,&H00E6E2E0,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,4,0,0,0,1
Style: TaskDone,DM Sans,28,&H00706A66,&H00FFFFFF,&H00000000,&H00000000,0,0,0,-1,100,100,0,0,1,0,0,4,0,0,0,1
Style: Footer,DM Sans,26,&H00807A76,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1
Style: Card,Poppins,120,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1
Style: CardSub,DM Sans,40,&H00C8C0BC,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${ev.join('\n')}
`
}

// ---- a clip ----

async function render(clip: Clip, base: Buffer, outDir: string, ffmpeg: string, fonts: string, hasEndCard = true) {
  END_CARD = hasEndCard ? END_AT : SECONDS + 1
  const WIN = layout(clip)
  const assPath = join(outDir, `${clip.name}.ass`)
  writeFileSync(assPath, ass(clip))
  const out = join(outDir, `${clip.name}.mp4`)
  const filter = `subtitles=filename='${assPath}':fontsdir='${fonts}'`
  const ff = spawn(
    ffmpeg,
    ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-vf', filter, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  )
  const done = new Promise<void>((ok, fail) => ff.on('close', code => (code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`)))))

  const walker = newWalker()
  walker.x = 30
  let lastDone = 0
  let cheerAt = -10
  for (let f = 0; f < SECONDS * FPS; f++) {
    const t = f / FPS
    const seg = clip.segments.find(s => t < s.to) ?? clip.segments[clip.segments.length - 1]!
    const cv = new Canvas(base)
    // The window slides up and fades in, then holds; the end card dims it.
    const enter = ease(t / 0.7)
    const a = enter * (t > END_CARD ? 1 - ease((t - END_CARD) / 0.5) * 0.93 : 1)
    const dy = Math.round((1 - enter) * 40)
    cv.round(WIN.x - 2, WIN.y - 2 + dy, WIN.w + 4, WIN.h + 4, 18, WIN_EDGE, a)
    cv.round(WIN.x, WIN.y + dy, WIN.w, WIN.h, 16, WIN_BG, a)
    cv.fill(WIN.x + 16, WIN.y + 42 + dy, WIN.w - 32, 1, WIN_EDGE, a)
    ;[[226, 96, 86], [226, 180, 76], [98, 190, 110]].forEach((c, i) => cv.disc(WIN.x + 28 + i * 26, WIN.y + 21 + dy, 7, mix(c as Rgb, WIN_BG, 0.35), a))

    let progress: Progress | undefined
    if (clip.tasks) {
      const done = clip.tasks.filter(k => t >= k.doneAt).length
      if (done > lastDone) {
        lastDone = done
        cheerAt = t
      }
      progress = { frac: done / clip.tasks.length, label: '', isDone: done === clip.tasks.length }
      clip.tasks.forEach((task, i) => {
        const y = WIN.tasks + i * 38 + dy
        const isDone = t >= task.doneAt
        cv.round(250, y - 12, 24, 24, 6, isDone ? [98, 196, 120] : [70, 70, 80], a * ease((t - 0.9 - i * 0.12) / 0.3))
        if (!isDone) cv.round(253, y - 9, 18, 18, 4, WIN_BG, a)
        else {
          // a tick: down-right for three steps, then up-right for six
          for (let k = 0; k < 3; k++) cv.fill(255 + k * 2, y - 1 + k * 2, 3, 3, WIN_BG, a)
          for (let k = 0; k < 5; k++) cv.fill(261 + k * 2, y + 3 - k * 2, 3, 3, WIN_BG, a)
        }
      })
    }
    const act = seg.act
    step(walker, f * (1000 / FPS), act, COLS)
    const finaleAge = clip.tasks && act === 'finale' ? t - 16 : undefined
    // A segment's bulb lights as the segment starts.
    const segFrom = clip.segments[clip.segments.indexOf(seg) - 1]?.to ?? 0
    const look: Look = { ...(seg.look ?? {}), ...(seg.look?.bulbAge !== undefined ? { bulbAge: t - segFrom } : {}) }
    const words = frame({ walker, t: t + 3, act, cols: COLS, bg: WIN_BG, progress, cheerAge: finaleAge ?? t - cheerAt, helpers: seg.helpers ?? 0, look, hasEvents: false })
    strip(cv, words, STRIP_X, WIN.strip + dy, a)
    if (t >= 1 && t < END_CARD) star(cv, 250, WIN.word + dy, t, a)
    if (!ff.stdin.write(cv.img)) await new Promise(ok => ff.stdin.once('drain', ok))
  }
  ff.stdin.end()
  await done
  console.log(out)
}

// The film: a title card, then the clips joined by half-second crossfades,
// the end card only after the last one.
const INTRO_S = 3
const FADE_S = 0.5
const FILM = ['1-', '2-', '5-', '3-', '4-', '6-']

async function renderIntro(base: Buffer, outDir: string, ffmpeg: string, fonts: string) {
  const assPath = join(outDir, '0-intro.ass')
  writeFileSync(
    assPath,
    ass({ name: '0-intro', title: '', subtitle: '', prompt: '', segments: [] })
      .replace(/^Dialogue:.*$/gm, '')
      .concat(
        [
          `Dialogue: 0,${ts(0.2)},${ts(INTRO_S)},Card,,0,0,0,,{\\an5\\fad(500,0)\\move(960,430,960,400,0,700)}clawd-mods`,
          `Dialogue: 0,${ts(0.6)},${ts(INTRO_S)},CardSub,,0,0,0,,{\\an5\\fad(500,0)\\move(960,520,960,500,0,700)}A pixel Clawd that lives under the Claude Code spinner`,
        ].join('\n') + '\n',
      ),
  )
  const out = join(outDir, '0-intro.mp4')
  const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-vf', `subtitles=filename='${assPath}':fontsdir='${fonts}'`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = new Promise<void>((ok, fail) => ff.on('close', code => (code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`)))))
  // Clawd walks along under the title.
  const walker = newWalker()
  walker.x = 10
  for (let f = 0; f < INTRO_S * FPS; f++) {
    const t = f / FPS
    const cv = new Canvas(base)
    step(walker, f * (1000 / FPS), 'walk', COLS)
    const words = frame({ walker, t, act: 'walk', cols: COLS, bg: BG_TOP, hasEvents: false })
    strip(cv, words, STRIP_X, 620, ease(t / 0.6))
    if (!ff.stdin.write(cv.img)) await new Promise(ok => ff.stdin.once('drain', ok))
  }
  ff.stdin.end()
  await done

  return out
}

async function renderFilm(base: Buffer, outDir: string, ffmpeg: string, fonts: string) {
  const parts = [await renderIntro(base, outDir, ffmpeg, fonts)]
  for (const [i, prefix] of FILM.entries()) {
    const clip = CLIPS.find(c => c.name.startsWith(prefix))!
    const partDir = join(outDir, 'film-parts')
    mkdirSync(partDir, { recursive: true })
    await render(clip, base, partDir, ffmpeg, fonts, i === FILM.length - 1)
    parts.push(join(partDir, `${clip.name}.mp4`))
  }
  const lengths = [INTRO_S, ...FILM.map(() => SECONDS)]
  const chain: string[] = []
  let offset = 0
  let last = '[0:v]'
  for (let i = 1; i < parts.length; i++) {
    offset += lengths[i - 1]! - FADE_S
    const label = i === parts.length - 1 ? '[out]' : `[v${i}]`
    chain.push(`${last}[${i}:v]xfade=transition=fade:duration=${FADE_S}:offset=${offset.toFixed(2)}${label}`)
    last = label
  }
  const out = join(outDir, 'clawd-mods.mp4')
  await new Promise<void>((ok, fail) => {
    const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', ...parts.flatMap(p => ['-i', p]), '-filter_complex', chain.join(';'), '-map', '[out]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' })
    ff.on('close', code => (code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`))))
  })
  console.log(out)
}

const outDir = process.argv[2] ?? 'promo'
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
const fonts = process.env.FONTS ?? 'fonts'
const only = process.argv[3]
mkdirSync(outDir, { recursive: true })
const base = backdrop()
if (only === 'film') await renderFilm(base, outDir, ffmpeg, fonts)
else for (const clip of CLIPS) if (!only || clip.name.startsWith(only)) await render(clip, base, outDir, ffmpeg, fonts)
