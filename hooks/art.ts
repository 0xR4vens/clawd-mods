// Clawd's strip under the spinner, drawn as raster cells. A small Clawd (10 by
// 6 pixels, two pixels to a cell) acts out what Claude is doing:
//
// - with the tool at hand: a pickaxe to search, a hammer to edit, a screen to
//   run commands, a magnifying glass to read;
// - travelling: on foot, flying with a cape, in a race car, on a jetpack or a
//   skateboard; working: laser bolts, magic, a DJ set;
// - in costume while he roams: pirate, astronaut, knight against a
//   bug-dragon, chasing a bug;
// - thinking, cheering with confetti when a step finishes and with fireworks
//   when a whole plan does, tripping under a grey cloud after an error,
//   holding up a "?" when Claude waits on the person, sweating near a usage
//   limit, yawning at night.
//
// Behind him, braille dots twinkle (stars at night, Paris time); while a
// task list runs they are its progress bar, lit up to the current task,
// whose name sits in the corner. Little Clawds work beside him
// for each subagent, and now and then a cat walks by or a star shoots past.
// Nothing here asks a model for anything.

export type Rgb = [number, number, number]
export type Mode = 'requesting' | 'responding' | 'thinking' | 'tool-input' | 'tool-use'
export type Act =
  | 'stand'
  | 'walk'
  | 'fly'
  | 'race'
  | 'jetpack'
  | 'skate'
  | 'think'
  | 'laser'
  | 'magic'
  | 'dj'
  | 'pirate'
  | 'astronaut'
  | 'knight'
  | 'chase'
  | 'dig'
  | 'hammer'
  | 'terminal'
  | 'read'
  | 'trip'
  | 'sign'
  | 'cheer'
  | 'finale'
  | 'rocket'
  | 'flag'
  | 'juggle'
  | 'trophy'
  | 'coffee'
  | 'boxes'
  | 'dance'

// The acts that travel; the ones he travels to a plan's step with; the ones
// done at that step; the ones he roams through with no plan.
export const MOVES: Act[] = ['walk', 'fly', 'race', 'jetpack', 'skate', 'chase', 'astronaut', 'rocket']
const TRAVELS: Act[] = ['fly', 'race', 'jetpack', 'skate']
const WORKS: Act[] = ['laser', 'magic', 'dj']
export const ROAMS: Act[] = ['walk', 'fly', 'laser', 'race', 'magic', 'jetpack', 'pirate', 'skate', 'astronaut', 'dj', 'knight', 'chase']

// What /clawd <name> pins him to.
export const COSTUMES: Record<string, Act> = {
  marche: 'walk',
  cape: 'fly',
  superheros: 'fly',
  voiture: 'race',
  pilote: 'race',
  jetpack: 'jetpack',
  skate: 'skate',
  laser: 'laser',
  magicien: 'magic',
  dj: 'dj',
  pirate: 'pirate',
  astronaute: 'astronaut',
  chevalier: 'knight',
  chasse: 'chase',
}

// What a shell command shows: a rocket for a push, a flag for a commit,
// juggling for tests, boxes raining for an install.
export function commandAct(command: string | undefined): Act | undefined {
  if (!command) return undefined
  if (/\bgit\s+push\b/.test(command)) return 'rocket'
  if (/\bgit\s+commit\b/.test(command)) return 'flag'
  if (isTestCommand(command)) return 'juggle'
  if (/\b(npm|pnpm|yarn|bun)\s+(i|install|add|ci)\b|\bpip3?\s+install\b|\bcargo\s+(add|install)\b|\bapt(-get)?\s+install\b|\bbrew\s+install\b|\buv\s+(add|pip)\b/.test(command)) return 'boxes'

  return undefined
}

export function isTestCommand(command: string) {
  return /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bpytest\b|\bjest\b|\bvitest\b|\bcargo\s+test\b|\bgo\s+test\b|\bplugin\s+test\b|\bmake\s+test\b|\brspec\b|\bphpunit\b/.test(command)
}

// The prop for the tool Claude is running, if it has one.
export function toolAct(tool: string | undefined): Act | undefined {
  if (!tool) return undefined
  if (/^(Grep|Glob|LS|Search|ToolSearch)$/.test(tool)) return 'dig'
  if (/^(Edit|MultiEdit|Write|NotebookEdit)$/.test(tool)) return 'hammer'
  if (/^(Bash|PowerShell|Monitor)$/.test(tool)) return 'terminal'
  if (/^(Read|WebFetch|WebSearch)$/.test(tool)) return 'read'
  if (/^(Agent|Task|Skill|Workflow)$/.test(tool) || tool.startsWith('mcp__')) return 'magic'

  return undefined
}

// Four rows of cells are eight pixels: Clawd's six and two of air.
export const ROWS = 4
const PX_H = ROWS * 2
export const CLAWD_W = 10
const CLAWD_H = 6
const CLEAR = 0x01000000
const UPPER = 0x2580
const LOWER = 0x2584

const ORANGE: Rgb = [217, 119, 87]
const MINI: Rgb = [232, 150, 120]
const EYE: Rgb = [42, 22, 16]
const WHITE: Rgb = [255, 244, 200]
const BLACK: Rgb = [24, 22, 26]
const CAPE: Rgb = [214, 48, 49]
const CAPE_DARK: Rgb = [150, 30, 36]
const STEEL: Rgb = [150, 156, 168]
const STEEL_LIGHT: Rgb = [200, 204, 214]
const WOOD: Rgb = [120, 80, 50]
const DIRT: Rgb = [150, 110, 70]
const DOT: Rgb = [235, 170, 140]
const HAT: Rgb = [112, 72, 196]
const HAT_BAND: Rgb = [80, 48, 150]
const STAR: Rgb = [255, 214, 92]
const CAR: Rgb = [220, 40, 50]
const CAR_DARK: Rgb = [160, 24, 36]
const TYRE: Rgb = [30, 30, 34]
const SMOKE: Rgb = [130, 130, 138]
const CLOUD: Rgb = [110, 112, 122]
const RAIN: Rgb = [110, 170, 240]
const GLASS: Rgb = [170, 215, 250]
const SCREEN: Rgb = [16, 28, 48]
const CODE: Rgb = [110, 230, 140]
const DRAGON: Rgb = [80, 170, 90]
const DRAGON_DARK: Rgb = [40, 110, 60]
const FLAME: Rgb[] = [
  [255, 230, 120],
  [255, 160, 60],
  [235, 90, 40],
]
const GOLD: Rgb = [244, 190, 60]
const GOLD_DARK: Rgb = [190, 130, 30]
const BOX: Rgb = [196, 150, 100]
const TAPE: Rgb = [232, 204, 150]
const HULL: Rgb = [230, 232, 238]
const MUG: Rgb = [236, 236, 240]
const COFFEE: Rgb = [110, 70, 40]
const PACK: Rgb = [120, 92, 60]
const PAPER: Rgb = [245, 245, 235]
const BAT: Rgb = [150, 92, 196]
const WITCH: Rgb = [40, 30, 52]
const SANTA: Rgb = [210, 36, 44]
const BOLT_S = 0.4
const BOLT_SPEED = 70

const BODY = ['.BBBBBBBB.', 'BBBBBBBBBB', 'BBBBBBBBBB', '.BBBBBBBB.']
const FEET = [2, 4, 5, 7]
const EYES = [2, 7]

const SPEED: Partial<Record<Act, number>> = { walk: 12, fly: 30, race: 46, jetpack: 34, skate: 26, chase: 22, astronaut: 8, rocket: 60 }

export type Progress = { frac: number; label: string; isDone: boolean }

export type Walker = { x: number; dir: number; at: number }

export function newWalker(): Walker {
  return { x: 0, dir: 1, at: 0 }
}

export type Moment = {
  mode: Mode
  // seconds
  t: number
  hasPlan?: boolean
  isTravelling?: boolean
  isCheering?: boolean
  // the whole plan just finished
  isFinale?: boolean
  // the plan's step number, so each step gets its own pair of acts
  turn?: number
  tool?: string
  isFailing?: boolean
  isAsking?: boolean
  pinned?: Act
  // the shell command running (or just run)
  command?: string
  // tests just passed
  isTrophy?: boolean
  // "danse clawd" was typed
  isDancing?: boolean
  // the tool has been running for a while
  isLongRun?: boolean
}

// What Clawd does now, most pressing first.
export function actOf(m: Moment): Act {
  if (m.isFinale) return 'finale'
  if (m.isCheering) return 'cheer'
  if (m.isFailing) return 'trip'
  if (m.isTrophy) return 'trophy'
  if (m.isDancing) return 'dance'
  if (m.isAsking) return 'sign'
  const turn = m.turn ?? 0
  if (m.isTravelling) return m.pinned && MOVES.includes(m.pinned) ? m.pinned : TRAVELS[turn % TRAVELS.length]!
  const shell = commandAct(m.command)
  if (shell) return shell
  const prop = toolAct(m.tool)
  if (prop === 'terminal' && m.isLongRun) return 'coffee'
  if (prop) return prop
  if (m.pinned) return m.pinned
  if (m.mode === 'thinking') return 'think'
  if (m.mode === 'responding') return m.hasPlan ? 'cheer' : 'magic'
  if (m.mode === 'tool-use' || m.mode === 'tool-input') return m.hasPlan ? WORKS[turn % WORKS.length]! : ROAMS[Math.floor(m.t / 7) % ROAMS.length]!

  return 'stand'
}

// Moves the walker to time `now` (ms): toward the target when there is one,
// otherwise to and fro while his act travels.
export function step(w: Walker, now: number, act: Act, cols: number, target?: number) {
  const dt = w.at === 0 ? 0 : Math.min(0.5, (now - w.at) / 1000)
  w.at = now
  const travel = Math.max(0, cols - CLAWD_W - 1)
  if (target !== undefined) {
    const gap = target - w.x
    if (Math.abs(gap) < 0.5) {
      w.x = target

      return
    }
    w.dir = Math.sign(gap)
    w.x += w.dir * Math.min(Math.abs(gap), (SPEED[act] ?? 30) * dt)

    return
  }
  if (!MOVES.includes(act)) {
    w.x = Math.min(w.x, travel)

    return
  }
  w.x += w.dir * (SPEED[act] ?? 12) * dt
  if (w.x >= travel) {
    w.x = travel
    w.dir = -1
  } else if (w.x <= 0) {
    w.x = 0
    w.dir = 1
  }
}

export function hash(a: number, b: number, c: number) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)

  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function hsl(h: number, s: number, l: number): Rgb {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))

  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

const mix = (a: Rgb, b: Rgb, m: number): Rgb => [0, 1, 2].map(i => Math.round(a[i]! + (b[i]! - a[i]!) * m)) as Rgb

// The hour in Paris for a time in ms since the epoch: CET, or CEST from the
// last Sunday of March to the last Sunday of October (01:00 UTC both).
export function parisHour(ms: number) {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const lastSunday = (month: number) => {
    const end = new Date(Date.UTC(y, month + 1, 0, 1))

    return end.getTime() - end.getUTCDay() * 86_400_000
  }
  const isSummer = ms >= lastSunday(2) && ms < lastSunday(9)

  return (d.getUTCHours() + (isSummer ? 2 : 1)) % 24
}

export function isNightAt(ms: number) {
  const h = parisHour(ms)

  return h >= 21 || h < 7
}

type Put = (x: number, y: number, c: Rgb) => void
type Mark = { x: number; y: number; ch: string; fg: Rgb; bg: Rgb }

export type Season = 'halloween' | 'christmas'

export type Look = {
  // remaining context, 0 to 1, shown as fuel
  fuel?: number
  isSweating?: boolean
  isNight?: boolean
  season?: Season
  // ten tool calls in a row without an error
  hasCrown?: boolean
  // seconds since a long think ended: a light bulb
  bulbAge?: number
}

// The acts that already put something on his head.
const HATTED = new Set<Act>(['magic', 'pirate', 'knight', 'dj', 'astronaut', 'trip', 'trophy', 'juggle', 'boxes'])

// The day in Paris for a time in ms since the epoch.
export function parisDay(ms: number) {
  const d = new Date(ms + (parisHour(ms) - new Date(ms).getUTCHours() + 24) % 24 * 3_600_000)

  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

export function seasonAt(ms: number): Season | undefined {
  const { month, day } = parisDay(ms)
  if ((month === 10 && day >= 15) || (month === 11 && day <= 2)) return 'halloween'
  if (month === 12 && day <= 26) return 'christmas'

  return undefined
}

// Clawd at (left, top) in pixels, facing dir (1 right, -1 left), doing act.
// Text marks (the "?" on his sign) go to `marks`, in cells.
function drawClawd(put: Put, marks: Mark[], left: number, top: number, dir: number, act: Act, t: number, stride: number, look: Look) {
  const front = (dx: number) => (dir > 0 ? left + CLAWD_W - 1 + dx : left - dx)
  const back = (dx: number) => (dir > 0 ? left - dx : left + CLAWD_W - 1 + dx)
  const at = (x: number) => (dir > 0 ? left + x : left + CLAWD_W - 1 - x)
  const fuel = Math.max(0, Math.min(1, look.fuel ?? 1))
  const fuelColor: Rgb = fuel > 0.5 ? [98, 196, 120] : fuel > 0.2 ? [230, 180, 80] : [229, 83, 75]

  // Behind the body.
  if (act === 'fly') {
    for (let y = 0; y < 4; y++) {
      const len = 3 + y + Math.round(Math.sin(t * 14 + y))
      for (let i = 1; i <= len; i++) {
        const ripple = Math.round(Math.sin(t * 16 - i * 0.9) * 0.6)
        put(back(i), top + y + ripple + (i > 4 ? 1 : 0), i % 3 === 0 ? CAPE_DARK : CAPE)
      }
    }
  }
  if (act === 'jetpack') {
    // The tank, its colour the context left; a flame under it.
    for (let y = 1; y <= 3; y++) put(back(1), top + y, y >= 3 - Math.round(fuel * 2) ? fuelColor : STEEL)
    put(back(2), top + 2, STEEL)
    const flicker = Math.floor(t * 20)
    for (let y = 4; y <= 5 + (flicker % 3); y++) put(back(1 + (y > 5 ? 1 : 0)), top + y, FLAME[Math.min(2, y - 4)]!)
  }
  if (act === 'race' || act === 'skate') {
    // Speed lines, and for the car puffs of exhaust.
    for (let k = 0; k < 3; k++) {
      const off = (Math.floor(t * 30) + k * 5) % 14
      put(back(3 + off), top + 1 + k, mix(SMOKE, WHITE, 0.3))
      if (act === 'race') put(back(4 + off), top + 1 + k, mix(SMOKE, WHITE, 0.3))
    }
    if (act === 'race') {
      const puff = (t * 3) % 1
      put(back(3 + Math.round(puff * 6)), top + 4 - Math.round(puff * 2), SMOKE)
    }
  }
  if (act === 'astronaut') {
    // The helmet's glass round him, and an antenna with a blinking light.
    for (let x = -1; x <= CLAWD_W; x++) put(left + x, top - 1, GLASS)
    for (let y = 0; y <= 3; y++) {
      put(left - 1, top + y, GLASS)
      put(left + CLAWD_W, top + y, GLASS)
    }
    put(at(8), top - 2, STEEL)
    put(at(8), top - 3, Math.floor(t * 2) % 2 ? CAPE : STEEL_LIGHT)
  }

  // The body, eyes and feet.
  BODY.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === 'B') put(left + x, top + y, ORANGE)
  })
  const isYawning = Boolean(look.isNight) && (act === 'stand' || act === 'think') && t % 8 < 1.2
  const isBlinking = t % 3.4 < 0.14 || isYawning
  const glanceDown = Boolean(look.isSweating) && t % 6 < 2
  const eyeLook = act === 'think' || act === 'sign' ? 0 : dir
  for (const ex of EYES) {
    const x = left + ex + eyeLook
    if (act === 'trip') {
      // Dizzy: eyes as little crosses.
      put(x - 1, top + 1, EYE)
      put(x + 1, top + 1, EYE)
      put(x, top + 2, EYE)
    } else if (isBlinking) put(x, top + 2, EYE)
    else if (act === 'think' || act === 'sign') {
      put(x, top, EYE)
      put(x, top + 1, EYE)
    } else {
      put(x, top + (glanceDown ? 2 : 1), EYE)
      put(x, top + (glanceDown ? 3 : 2), EYE)
    }
  }
  if (isYawning) {
    put(left + 4, top + 2, EYE)
    put(left + 5, top + 2, EYE)
    put(left + 4, top + 3, EYE)
    put(left + 5, top + 3, EYE)
  }
  // On his head: a crown for a streak, else the season's hat.
  if (!HATTED.has(act)) {
    if (look.hasCrown) {
      for (let x = 2; x <= 7; x++) put(left + x, top - 1, GOLD)
      for (const x of [2, 4, 5, 7]) put(left + x, top - 2, x === 4 || x === 5 ? GOLD_DARK : GOLD)
      put(left + (Math.floor(t * 2) % 2 ? 3 : 6), top - 1, CAPE)
    } else if (look.season === 'halloween') {
      for (let x = 1; x <= 8; x++) put(left + x, top - 1, x === 1 || x === 8 ? WITCH : x === 4 || x === 5 ? HAT : WITCH)
      for (let x = 3; x <= 6; x++) put(left + x, top - 2, WITCH)
      put(at(6), top - 3, WITCH)
    } else if (look.season === 'christmas') {
      for (let x = 1; x <= 8; x++) put(left + x, top - 1, WHITE)
      for (let x = 2; x <= 6; x++) put(left + x, top - 2, SANTA)
      put(at(7), top - 3, SANTA)
      put(at(8), top - 3, WHITE)
    }
  }
  // Context nearly full: a backpack stuffed with pages.
  if (fuel < 0.15 && !['fly', 'jetpack', 'rocket', 'astronaut', 'race'].includes(act)) {
    for (let y = 1; y <= 3; y++) put(back(1), top + y, PACK)
    put(back(2), top + 2, PACK)
    put(back(1), top, PAPER)
    put(back(2), top - 1 + (Math.floor(t * 2) % 2), PAPER)
  }
  // A long think just ended: a light bulb.
  if (look.bulbAge !== undefined && look.bulbAge < 1.6) {
    const isOn = look.bulbAge > 0.2
    put(left + 4, top - 2, isOn ? STAR : STEEL_LIGHT)
    put(left + 5, top - 2, isOn ? STAR : STEEL_LIGHT)
    put(left + 4, top - 1, STEEL)
    put(left + 5, top - 1, STEEL)
    if (isOn && Math.floor(t * 6) % 2) {
      put(left + 2, top - 2, WHITE)
      put(left + 7, top - 2, WHITE)
    }
  }
  if (act !== 'race' && act !== 'trip' && act !== 'rocket') {
    FEET.forEach((fx, i) => {
      const isLifted =
        act === 'fly' ||
        act === 'jetpack' ||
        act === 'cheer' ||
        act === 'finale' ||
        act === 'astronaut' ||
        ((act === 'walk' || act === 'chase') && (Math.floor(stride) % 2 === 0 ? i < 2 : i >= 2)) ||
        (act === 'coffee' && i === 3 && Math.floor(t * 4) % 2 === 0) ||
        (act === 'dance' && (Math.floor(t * 4) % 2 === 0 ? i < 2 : i >= 2))
      put(left + fx, top + 4, ORANGE)
      if (!isLifted && act !== 'skate') put(left + fx, top + 5, ORANGE)
    })
  }

  // In front of him.
  switch (act) {
    case 'fly':
      // A fist out front, superhero style.
      put(front(1), top + 1, ORANGE)
      put(front(2), top + 1, ORANGE)
      break
    case 'laser': {
      // Short bolts, one every BOLT_S seconds, with a flash at the muzzle.
      put(front(1), top + 2, ORANGE)
      put(front(2), top + 2, STEEL)
      put(front(3), top + 2, STEEL)
      put(front(2), top + 3, STEEL)
      const since = t % BOLT_S
      if (since < 0.06) {
        put(front(4), top + 1, WHITE)
        put(front(4), top + 3, WHITE)
        put(front(5), top + 2, WHITE)
      }
      for (let n = 0; n < 4; n++) {
        const head = 4 + Math.round((since + n * BOLT_S) * BOLT_SPEED)
        const color = hsl(((Math.floor(t / BOLT_S) - n) * 67) % 360, 0.9, 0.62)
        for (let i = 0; i < 3; i++) put(front(head - i), top + 2, color)
      }
      break
    }
    case 'magic': {
      // A pointed hat with a star, and a wand throwing swirling sparkles.
      for (let x = 1; x <= 8; x++) put(left + x, top - 1, x === 1 || x === 8 ? HAT_BAND : HAT)
      for (let x = 3; x <= 6; x++) put(left + x, top - 2, HAT)
      put(at(6), top - 3, HAT)
      if (Math.floor(t * 4) % 2 === 0) put(at(7), top - 3, STAR)
      put(front(1), top + 2, ORANGE)
      put(front(2), top + 1, WOOD)
      put(front(3), top, WOOD)
      put(front(4), top - 1, Math.floor(t * 8) % 2 ? STAR : WHITE)
      for (let k = 0; k < 9; k++) {
        const age = (t * 0.9 + k / 9) % 1
        const angle = age * Math.PI * 4 + k
        put(front(4 + Math.round(age * 16 + Math.cos(angle) * 2)), top + 1 + Math.round(Math.sin(angle) * 2.4), k % 3 === 0 ? STAR : k % 3 === 1 ? WHITE : mix(HAT, WHITE, 0.4))
      }
      // Every few seconds a puff, and out comes a little animal that runs,
      // hops or flies away.
      const k = Math.floor(t / SUMMON_S)
      const a = (t % SUMMON_S) / SUMMON_S
      if (a < 0.12) {
        const r = Math.round(a * 20)
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]] as const) put(front(10) + dx * r, PX_H - 3 + dy * r, mix(WHITE, HAT, a * 6))
      } else drawAnimal(put, ANIMALS[Math.floor(hash(k, 4, 17) * ANIMALS.length)]!, front(10), dir, (a - 0.12) * SUMMON_S, t)
      break
    }
    case 'race': {
      // A low red car whose stripe is the fuel gauge (the context left), a
      // spoiler, goggles, and wheels whose rims spin.
      for (let x = -2; x <= CLAWD_W + 1; x++) {
        put(left + x, top + 3, x === -2 || x === CLAWD_W + 1 ? CAR_DARK : CAR)
        const isStripe = x >= 1 && x <= 8
        const isLit = (dir > 0 ? x - 1 : 8 - x) < Math.round(fuel * 8)
        put(left + x, top + 4, isStripe ? (isLit ? fuelColor : CAR_DARK) : CAR)
      }
      put(front(2), top + 3, CAR)
      put(front(3), top + 4, CAR)
      put(back(2), top + 1, CAR_DARK)
      put(back(3), top + 1, CAR_DARK)
      put(back(2), top + 2, CAR_DARK)
      const spin = Math.floor(t * 24) % 2
      for (const wx of [1, 7]) {
        put(left + wx, top + 5, spin ? TYRE : STEEL)
        put(left + wx + 1, top + 5, spin ? STEEL : TYRE)
      }
      for (const ex of EYES) put(left + ex + dir, top + 1, WHITE)
      break
    }
    case 'skate':
      // A board under his feet, wheels below; an ollie now and then.
      for (let x = -1; x <= CLAWD_W; x++) put(left + x, top + 5, x === -1 || x === CLAWD_W ? mix(WOOD, BLACK, 0.3) : WOOD)
      put(left + 1, top + 6, BLACK)
      put(left + CLAWD_W - 2, top + 6, BLACK)
      break
    case 'dj': {
      // Headphones, a deck in front with a spinning record; notes rise.
      for (let x = 1; x <= 8; x++) put(left + x, top - 1, BLACK)
      put(left, top + 1, BLACK)
      put(left, top + 2, BLACK)
      put(left + CLAWD_W - 1, top + 1, BLACK)
      put(left + CLAWD_W - 1, top + 2, BLACK)
      for (let x = 1; x <= 7; x++) for (let y = 4; y <= 5; y++) put(front(x), top + y, STEEL)
      for (let x = 2; x <= 5; x++) put(front(x), top + 3, BLACK)
      put(front(2 + (Math.floor(t * 8) % 4)), top + 3, STEEL_LIGHT)
      put(front(1), top + 2, ORANGE)
      for (let k = 0; k < 3; k++) {
        const age = (t * 0.7 + k / 3) % 1
        put(front(4 + k * 2 + Math.round(Math.sin(age * 6))), top + 2 - Math.round(age * 4), hsl((k * 120 + t * 60) % 360, 0.8, 0.65))
      }
      break
    }
    case 'pirate': {
      // A black hat with a white skull, a patch over one eye, a sword that
      // thrusts.
      for (let x = 0; x <= 9; x++) put(left + x, top - 1, BLACK)
      for (let x = 2; x <= 7; x++) put(left + x, top - 2, BLACK)
      put(left + 4, top - 2, WHITE)
      put(left + 5, top - 2, WHITE)
      const patch = left + EYES[dir > 0 ? 1 : 0]! + dir
      put(patch, top + 1, BLACK)
      put(patch, top + 2, BLACK)
      put(patch, top, BLACK)
      const thrust = Math.floor(t * 3) % 2
      put(front(1), top + 2, ORANGE)
      put(front(2), top + 2, WOOD)
      for (let i = 3; i <= 6 + thrust * 2; i++) put(front(i), top + 2, STEEL_LIGHT)
      break
    }
    case 'knight': {
      // A steel helmet with a red plume and a visor slit, a sword swinging
      // at a little green dragon (the bug) that puffs fire back.
      for (let x = 0; x <= 9; x++) put(left + x, top, STEEL)
      for (let x = 1; x <= 8; x++) put(left + x, top - 1, STEEL)
      put(at(4), top - 2, CAPE)
      put(at(5), top - 2, CAPE)
      put(at(6), top - 3, CAPE)
      for (let x = 0; x <= 9; x++) put(left + x, top + 1, x === 2 || x === 7 ? EYE : STEEL)
      const swing = Math.floor(t * 4) % 2
      put(front(1), top + 2, ORANGE)
      for (let i = 2; i <= 5; i++) put(front(i), top + (swing ? 2 : 4 - i), STEEL_LIGHT)
      const dx = 9 + Math.round(Math.sin(t * 2))
      for (let x = 0; x < 6; x++) for (let y = 2; y <= 4; y++) if (!(x === 5 && y === 4)) put(front(dx + x), top + y, DRAGON)
      put(front(dx + 1), top + 2, CAPE)
      put(front(dx), top + 5, DRAGON_DARK)
      put(front(dx + 4), top + 5, DRAGON_DARK)
      const wing = Math.floor(t * 6) % 2
      put(front(dx + 3), top + 1 - wing, DRAGON_DARK)
      put(front(dx + 4), top + 1 - wing, DRAGON_DARK)
      if (t % 2 < 0.4) for (let i = 1; i <= 2; i++) put(front(dx - i), top + 3, FLAME[i]!)
      break
    }
    case 'chase': {
      // A bug scurrying ahead of him.
      const bx = 5 + Math.round((Math.sin(t * 3) + 1) * 3)
      put(front(bx), top + 4, BLACK)
      put(front(bx + 1), top + 4, BLACK)
      put(front(bx), top + 3, mix(DRAGON_DARK, BLACK, 0.4))
      put(front(bx + 1), top + 3, mix(DRAGON_DARK, BLACK, 0.4))
      put(front(bx + (Math.floor(t * 12) % 2)), top + 5, BLACK)
      put(front(bx + 2), top + 3, BLACK)
      break
    }
    case 'dig': {
      // A pickaxe, up then down, earth flying when it lands.
      const isDown = Math.floor(t * 4) % 2
      put(front(1), top + 2, ORANGE)
      if (isDown) {
        put(front(2), top + 3, WOOD)
        put(front(3), top + 4, WOOD)
        put(front(3), top + 5, STEEL)
        put(front(4), top + 5, STEEL)
        put(front(5), top + 4, STEEL)
        for (let k = 0; k < 3; k++) put(front(5 + k), top + 2 + ((k + Math.floor(t * 8)) % 3), DIRT)
      } else {
        put(front(2), top + 1, WOOD)
        put(front(3), top, WOOD)
        put(front(2), top - 1, STEEL)
        put(front(3), top - 1, STEEL)
        put(front(4), top, STEEL)
      }
      break
    }
    case 'hammer': {
      // A hammer, up then down, sparks when it lands.
      const isDown = Math.floor(t * 5) % 2
      put(front(1), top + 2, ORANGE)
      if (isDown) {
        put(front(2), top + 3, WOOD)
        for (const x of [3, 4]) for (const y of [4, 5]) put(front(x), top + y, STEEL)
        put(front(5), top + 3, STAR)
        put(front(6), top + 4, WHITE)
      } else {
        put(front(2), top + 1, WOOD)
        for (const x of [2, 3]) for (const y of [-1, 0]) put(front(x), top + y, STEEL)
      }
      break
    }
    case 'terminal': {
      // A screen in front of him, lines of green code typing out.
      for (let x = 2; x <= 9; x++) for (let y = 0; y <= 4; y++) put(front(x), top + y, x === 2 || x === 9 || y === 0 || y === 4 ? STEEL : SCREEN)
      const typed = Math.floor(t * 12) % 18
      for (let y = 1; y <= 3; y++) {
        const len = Math.max(0, Math.min(6, typed - (y - 1) * 6))
        for (let x = 0; x < len; x++) if (hash(x, y, Math.floor(t / 1.5)) < 0.75) put(front(3 + x), top + y, CODE)
      }
      if (Math.floor(t * 3) % 2) put(front(3 + Math.min(5, typed % 6)), top + 1 + Math.min(2, Math.floor(typed / 6)), WHITE)
      put(front(5), top + 5, STEEL)
      put(front(1), top + 3 + (Math.floor(t * 8) % 2), ORANGE)
      break
    }
    case 'read': {
      // A magnifying glass that scans up and down.
      const dy = Math.round(Math.sin(t * 2))
      put(front(1), top + 3, ORANGE)
      put(front(2), top + 3, WOOD)
      put(front(3), top + 2 + dy, WOOD)
      for (const [x, y] of [[4, 0], [5, 0], [6, 1], [6, 2], [5, 3], [4, 3], [3, 1], [3, 2]] as const) put(front(x), top + y + dy - 1, STEEL_LIGHT)
      for (const [x, y] of [[4, 1], [5, 1], [4, 2], [5, 2]] as const) put(front(x), top + y + dy - 1, GLASS)
      break
    }
    case 'trip': {
      // A grey cloud over his head, raining, with a flash now and then.
      for (let x = 1; x <= 8; x++) put(left + x, top - 2, CLOUD)
      for (let x = 2; x <= 6; x++) put(left + x, top - 3, CLOUD)
      for (let k = 0; k < 4; k++) put(left + 2 + k * 2, top - 1 + ((Math.floor(t * 10) + k * 2) % 3), RAIN)
      if (t % 1.6 < 0.1) put(left + 5, top - 1, STAR)
      break
    }
    case 'sign': {
      // A sign held up high with a "?" on it.
      put(front(1), top + 1, ORANGE)
      for (let y = 2; y <= top + 1; y++) put(front(3), y, WOOD)
      for (let x = 1; x <= 5; x++) for (let y = 0; y <= 1; y++) put(front(x), y, WHITE)
      marks.push({ x: front(3), y: 0, ch: '?', fg: EYE, bg: WHITE })
      break
    }
    case 'rocket': {
      // Riding a rocket: a white hull under him with a red nose and fins,
      // a long flame and a trail of smoke.
      for (let x = -3; x <= CLAWD_W + 1; x++) for (let y = 3; y <= 5; y++) put(left + x, top + y, HULL)
      put(front(2), top + 3, CAPE)
      put(front(2), top + 4, CAPE)
      put(front(2), top + 5, CAPE)
      put(front(3), top + 4, CAPE)
      put(front(4), top + 4, CAPE)
      put(back(4), top + 2, CAPE)
      put(back(4), top + 6, CAPE)
      put(left + 5, top + 4, GLASS)
      const flicker = Math.floor(t * 20) % 3
      for (let i = 5; i <= 8 + flicker; i++) put(back(i), top + 4, FLAME[Math.min(2, Math.floor((i - 5) / 2))]!)
      put(back(5), top + 3, FLAME[1]!)
      put(back(5), top + 5, FLAME[1]!)
      for (let k = 0; k < 4; k++) put(back(11 + k * 3 + (Math.floor(t * 10) % 3)), top + 3 + (k % 3), mix(SMOKE, WHITE, 0.2))
      break
    }
    case 'flag': {
      // Planting a flag that waves.
      for (let y = 0; y <= top + 5; y++) put(front(2), y, STEEL)
      for (let x = 3; x <= 7; x++)
        for (let y = 0; y <= 2; y++) {
          const wobble = Math.round(Math.sin(t * 8 - x) * 0.5)
          put(front(x), y + wobble, (x + y) % 2 ? CAPE : WHITE)
        }
      put(front(1), top + 2, ORANGE)
      break
    }
    case 'juggle': {
      // Three balls arcing over his head.
      put(left - 1, top + 1, ORANGE)
      put(left + CLAWD_W, top + 1, ORANGE)
      const colors: Rgb[] = [CAPE, STAR, RAIN]
      for (let k = 0; k < 3; k++) {
        const a = t * 4 + (k * Math.PI * 2) / 3
        put(Math.round(left + CLAWD_W / 2 - 0.5 + Math.cos(a) * 6), Math.round(top - 0.5 - Math.abs(Math.sin(a)) * 2), colors[k]!)
      }
      break
    }
    case 'trophy': {
      // A golden cup held high, sparkling.
      put(left - 1, top, ORANGE)
      put(left + CLAWD_W, top, ORANGE)
      for (let x = 3; x <= 6; x++) put(left + x, top - 2, GOLD)
      put(left + 2, top - 2, GOLD_DARK)
      put(left + 7, top - 2, GOLD_DARK)
      put(left + 4, top - 1, GOLD)
      put(left + 5, top - 1, GOLD)
      for (let k = 0; k < 4; k++) if (Math.floor(t * 6 + k) % 3 === 0) put(left + [1, 8, 0, 9][k]!, top - 2 + (k % 2), WHITE)
      break
    }
    case 'coffee': {
      // A mug of coffee, steam curling up; one foot taps.
      put(front(1), top + 2, ORANGE)
      put(front(2), top + 2, COFFEE)
      put(front(3), top + 2, COFFEE)
      put(front(2), top + 3, MUG)
      put(front(3), top + 3, MUG)
      put(front(4), top + 3, MUG)
      for (let k = 0; k < 2; k++) {
        const rise = (t * 1.5 + k * 0.5) % 1
        put(front(2 + k + Math.round(Math.sin(t * 5 + k))), top + 1 - Math.round(rise * 3), mix(STEEL_LIGHT, SMOKE, rise))
      }
      break
    }
    case 'boxes': {
      // Boxes falling from the sky onto a stack he guards.
      put(left - 1, top, ORANGE)
      put(left + CLAWD_W, top, ORANGE)
      const cycle = t % 6
      const stacked = Math.min(3, Math.floor(cycle / 1.5))
      const box = (x0: number, y0: number) => {
        for (let x = 0; x < 4; x++) for (let y = 0; y < 2; y++) put(front(3 + x0 + x), y0 + y, y === 0 && (x === 1 || x === 2) ? TAPE : BOX)
      }
      for (let k = 0; k < stacked; k++) box(0, PX_H - 2 - k * 2)
      const fall = (cycle % 1.5) / 1.5
      if (stacked < 3) box(0, Math.min(PX_H - 2 - stacked * 2, Math.round(-2 + fall * PX_H)))
      break
    }
    case 'dance':
      // Claws up and down by turns, a sparkle each beat.
      put(Math.floor(t * 4) % 2 ? left - 1 : left + CLAWD_W, top, ORANGE)
      put(Math.floor(t * 4) % 2 ? left + CLAWD_W : left - 1, top + 2, ORANGE)
      put(left + Math.floor(hash(Math.floor(t * 4), 1, 21) * CLAWD_W), top - 1 - Math.floor(t * 4) % 2, hsl((t * 200) % 360, 0.9, 0.65))
      break
    case 'think':
      // A claw on his chin.
      put(front(1), top + 3, ORANGE)
      break
    case 'cheer':
    case 'finale':
      put(left - 1, top, ORANGE)
      put(left + CLAWD_W, top, ORANGE)
      break
    default:
      break
  }

  // Near a usage limit, drops of sweat run off him.
  if (look.isSweating) {
    const drop = (t * 4) % 1
    put(back(1), top + Math.round(drop * 4), RAIN)
    if (drop > 0.5) put(back(2), top + 2 + Math.round(drop * 2), RAIN)
  }
}

// The animals Clawd conjures, and how each gets away.
export const ANIMALS = ['bunny', 'frog', 'bird', 'duck', 'snail', 'butterfly'] as const
export type Animal = (typeof ANIMALS)[number]
const SUMMON_S = 3

// An animal `age` seconds after it appeared at x, heading the way dir goes.
// Pixels are [dx, height above the ground, colour].
function drawAnimal(put: Put, kind: Animal, x0: number, dir: number, age: number, t: number) {
  const ground = PX_H - 1
  const speed = { bunny: 18, frog: 14, bird: 16, duck: 9, snail: 2.5, butterfly: 10 }[kind]
  const x = x0 + dir * Math.round(age * speed)
  const hop = kind === 'bunny' || kind === 'frog' ? Math.round(Math.abs(Math.sin(t * 7)) * 2) : 0
  const rise = kind === 'bird' || kind === 'butterfly' ? Math.min(5, Math.round(age * 3)) : 0
  const flap = Math.floor(t * 10) % 2
  const white: Rgb = [242, 242, 246]
  const pix: [number, number, Rgb][] = []
  if (kind === 'bunny')
    pix.push([0, 0, white], [1, 0, white], [2, 0, white], [0, 1, white], [1, 1, white], [2, 1, white], [3, 1, white], [3, 2, white], [4, 2, white], [3, 3, white], [4, 3, [240, 170, 190]], [4, 2, EYE], [-1, 1, white])
  else if (kind === 'frog')
    pix.push([0, 0, DRAGON], [1, 0, DRAGON], [2, 0, DRAGON], [3, 0, DRAGON], [0, 1, DRAGON], [1, 1, DRAGON], [2, 1, DRAGON], [3, 1, DRAGON], [0, 2, white], [3, 2, white])
  else if (kind === 'bird') pix.push([0, 0, RAIN], [1, 0, RAIN], [2, 0, RAIN], [3, 1, RAIN], [4, 1, STAR], [1, flap ? 1 : -1, mix(RAIN, BLACK, 0.3)])
  else if (kind === 'duck')
    pix.push([0, 0, GOLD], [1, 0, GOLD], [2, 0, GOLD], [3, 0, GOLD], [0, 1, GOLD], [1, 1, GOLD], [3, 1, GOLD], [3, 2, GOLD], [4, 2, GOLD], [5, 2, [240, 130, 40]], [4, 3, GOLD], [4, 2, EYE])
  else if (kind === 'snail')
    pix.push([0, 0, [200, 190, 150]], [1, 0, [200, 190, 150]], [2, 0, [200, 190, 150]], [3, 0, [200, 190, 150]], [4, 0, [200, 190, 150]], [1, 1, WOOD], [2, 1, DIRT], [1, 2, DIRT], [2, 2, WOOD], [4, 1, [200, 190, 150]], [4, 2, EYE])
  else {
    const wing = hsl((t * 90) % 360, 0.85, 0.65)
    pix.push([1, 0, BLACK], [1, 1, BLACK], [1, 2, BLACK])
    if (flap) pix.push([0, 1, wing], [0, 2, wing], [2, 1, wing], [2, 2, wing])
    else pix.push([0, 2, wing], [2, 2, wing])
  }
  for (const [dx, h, c] of pix) put(x + dir * dx, ground - h - hop - rise, c)
}

// The season's sky: bats round Halloween, snow at Christmas.
function drawSeasonSky(put: Put, season: Season, cols: number, t: number) {
  if (season === 'halloween') {
    for (let k = 0; k < 2; k++) {
      const x = Math.round(((t * 9 + k * (cols / 2)) % (cols + 8)) - 4)
      const y = 1 + Math.round(Math.sin(t * 2 + k * 3))
      const wing = Math.floor(t * 8 + k) % 2
      put(x, y, BAT)
      put(x - 1, y - wing, BAT)
      put(x + 1, y - wing, BAT)
      put(x - 2, y + 1 - wing, BAT)
      put(x + 2, y + 1 - wing, BAT)
    }
  } else {
    for (let k = 0; k < Math.max(6, Math.floor(cols / 8)); k++) {
      const x = Math.round(hash(k, 1, 19) * cols + Math.sin(t + k) * 1.5)
      const y = Math.floor((t * 2.5 + hash(k, 2, 19) * PX_H) % PX_H)
      put(x, y, WHITE)
    }
  }
}

// A little Clawd for a subagent, 5 by 4 pixels, stepping in place.
function drawMini(put: Put, left: number, top: number, t: number, k: number) {
  const isStep = Math.floor(t * 4 + k) % 2
  for (let x = 1; x <= 3; x++) put(left + x, top, MINI)
  for (let x = 0; x <= 4; x++) put(left + x, top + 1, x === 1 || x === 3 ? EYE : MINI)
  for (let x = 0; x <= 4; x++) put(left + x, top + 2, MINI)
  put(left + (isStep ? 1 : 0), top + 3, MINI)
  put(left + (isStep ? 3 : 4), top + 3, MINI)
  if (Math.floor(t * 3 + k) % 3 === 0) put(left + 5, top + 1, k % 2 ? STAR : CODE)
}

// The cat that walks by now and then, 8 by 4 pixels.
function drawCat(put: Put, x: number, t: number) {
  const fur: Rgb = [120, 110, 105]
  const top = PX_H - 4
  put(x, top, fur)
  put(x + 2, top, fur)
  for (let i = 0; i <= 2; i++) put(x + i, top + 1, fur)
  put(x, top + 1, STAR)
  for (let i = 1; i <= 5; i++) put(x + i, top + 2, fur)
  const isStep = Math.floor(t * 6) % 2
  put(x + 1 + isStep, top + 3, fur)
  put(x + 4 + isStep, top + 3, fur)
  put(x + 6, top + 1, fur)
  put(x + 7, top + (Math.floor(t * 2) % 2), fur)
}

// The backdrop: braille dots, a few to a cell, each cell fading in and out on a sine wave of its own
// period, in a hue that drifts across the strip and over time, mixed into
// the terminal's background. Past the plan's current step they rest grey.
// At night they thin out into blue and white stars.
const BRAILLE_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]
const TWINKLE = [2000, 2600, 3100, 2400]
const DELAY = [0, 500, 1100, 1700]
const LEVELS = 8
const q = (m: number) => Math.round(Math.max(0, Math.min(1, m)) * LEVELS) / LEVELS
const wave = (t: number, periodMs: number, offset = 0) => 0.5 + 0.5 * Math.sin((t / periodMs + offset) * Math.PI * 2)

// Which dots a cell holds: about a third of its eight (a single one in a
// few cells at night), fixed for the cell.
export function dotBits(col: number, row: number, isNight = false) {
  if (isNight) {
    if (hash(col, row, 5) > 0.3) return 0

    return BRAILLE_BITS[Math.floor(hash(col, row, 6) * 4)]![Math.floor(hash(col, row, 7) * 2)]!
  }
  let bits = 0
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) if (hash(col * 2 + c, row * 4 + r, 1) < 0.34) bits |= BRAILLE_BITS[r]![c]!

  return bits
}

// A cell's dot colour at `t` seconds over the terminal background `bg`.
// While a task list runs the dots are its progress bar: lit (colour, twinkling)
// up to the current step, a still grey beyond it, and the column at the
// boundary glows white.
export function dotColor(col: number, row: number, t: number, bg: Rgb, isLit = true, isNight = false, isHead = false): Rgb {
  if (isHead) return mix(bg, WHITE, 0.55 + 0.35 * wave(t * 1000, 900))
  if (!isLit) return mix(bg, [140, 140, 140], 0.3)
  const cls = Math.floor(hash(col, row, 2) * 4)
  const blink = 1 - 0.55 * wave(t * 1000 + DELAY[cls]!, TWINKLE[cls]!, 0.25)
  const night: Rgb = hash(col, row, 8) < 0.5 ? hsl(215 + hash(col, row, 4) * 40, 0.7, 0.72) : [235, 238, 255]
  const tone = isNight ? night : hsl((t * 35 + col * 3 + row * 14) % 360, 0.75, 0.62)

  return mix(bg, tone, q((0.5 + 0.5 * hash(col, row, 3)) * blink))
}

export type Scene = {
  walker: Walker
  t: number
  act: Act
  cols: number
  hasBackdrop?: boolean
  bg?: Rgb
  progress?: Progress
  // seconds since a step (or the plan) finished, while the confetti falls
  cheerAge?: number
  // how many subagents are working
  helpers?: number
  look?: Look
  // the cat and the shooting stars
  hasEvents?: boolean
  // his height, eased by the caller across a change of act; else the act's
  lift?: number
  // seconds since the act changed, for the dust puff
  switchAge?: number
}

export const CHEER_S = 1.4

// How high an act holds him, in pixels, at `t` seconds.
export function liftOf(act: Act, t: number) {
  if (act === 'cheer' || act === 'finale') return Math.round(Math.abs(Math.sin(t * 9)) * 2)
  if (act === 'fly') return 1 + Math.round(Math.sin(t * 5) * 0.6)
  if (act === 'jetpack') return 2 - Math.round(Math.abs(Math.sin(t * 3)))
  if (act === 'astronaut') return Math.round((Math.sin(t * 1.5) + 1) / 2)
  if (act === 'skate') return 1 + (t % 3 < 0.4 ? 1 : 0)
  if (act === 'dj' || act === 'dance') return Math.floor(t * 4) % 2
  if (act === 'trophy') return 1

  return 0
}

// Seconds the dust puff of a change of act lasts.
export const PUFF_S = 0.35
export const FINALE_S = 3.5

// One frame: `cols` x ROWS cells, row-major, three u32 words a cell.
export function frame(s: Scene): Uint32Array {
  const { walker: w, t, act, cols, progress } = s
  const bg = s.bg ?? [24, 24, 27]
  const look = s.look ?? {}
  const isNight = Boolean(look.isNight)
  const px: (Rgb | undefined)[] = new Array(cols * PX_H)
  const marks: Mark[] = []
  const put: Put = (x, y, c) => {
    if (x >= 0 && x < cols && y >= 0 && y < PX_H) px[y * cols + x] = c
  }

  // Now and then: a shooting star (more often at night), a cat.
  if (s.hasEvents ?? true) {
    const every = isNight ? 12 : 30
    const n = Math.floor(t / every)
    const since = t - n * every
    if (hash(n, 1, 11) < 0.7 && since < 0.9) {
      const head = Math.round(cols * (0.3 + 0.6 * hash(n, 2, 11))) - Math.round(since * 60)
      for (let i = 0; i < 6; i++) put(head + i, Math.round((since * 60 - i) / 12), mix(WHITE, bg, i / 6))
    }
    const c = Math.floor(t / 120)
    const catSince = t - c * 120
    if (hash(c, 3, 11) < 0.5 && catSince < 10) drawCat(put, Math.round(cols - (catSince / 10) * (cols + 10)), t)
  }

  if (look.season) drawSeasonSky(put, look.season, cols, t)

  // Subagents' little Clawds, on the far side of the strip from him.
  const helpers = Math.min(4, s.helpers ?? 0)
  const isClawdRight = w.x > cols / 2
  for (let k = 0; k < helpers; k++) drawMini(put, isClawdRight ? 2 + k * 8 : cols - 8 - k * 8, PX_H - 4, t, k)

  const left = Math.round(w.x) + (act === 'dance' ? Math.round(Math.sin(t * 6)) : 0)
  const lift = s.lift ?? liftOf(act, t)
  // Tripped, he sits a pixel lower.
  const top = PX_H - CLAWD_H - lift + (act === 'trip' ? 1 : 0)
  drawClawd(put, marks, left, top, w.dir || 1, act, t, w.x / 2, look)
  if (s.switchAge !== undefined && s.switchAge < PUFF_S) {
    // A little puff of dust at his feet as he changes act.
    const a = s.switchAge / PUFF_S
    const spread = Math.round(1 + a * 4)
    const dust = mix(SMOKE, bg, a)
    for (const side of [-1, 1]) {
      const x = side < 0 ? left - spread : left + CLAWD_W - 1 + spread
      put(x, PX_H - 1, dust)
      put(x - side, PX_H - 2, dust)
    }
  }
  let right = left + CLAWD_W
  if (act === 'think') {
    const n = Math.floor(t * 2.5) % 4
    for (let i = 0; i < n; i++) put(left + CLAWD_W + 1 + i * 2, 1, DOT)
    right += 7
  }
  if (act === 'sign') right += 6
  if (s.cheerAge !== undefined && s.cheerAge < CHEER_S) {
    // Confetti: a burst from his head, falling back down.
    const a = s.cheerAge
    for (let i = 0; i < 16; i++) {
      const vx = (hash(i, 1, 9) - 0.5) * 30
      const vy = -6 - hash(i, 2, 9) * 8
      put(Math.round(left + CLAWD_W / 2 + vx * a), Math.round(top + vy * a + 9 * a * a), hsl(hash(i, 3, 9) * 360, 0.85, 0.6))
    }
  }
  if (act === 'finale' && s.cheerAge !== undefined) {
    // Fireworks along the whole strip: shells at staggered times, each
    // rising, then a ring of sparks that spreads, falls and fades.
    for (let k = 0; k < Math.max(3, Math.floor(cols / 14)); k++) {
      const a = s.cheerAge - hash(k, 1, 13) * 1.6
      if (a < 0 || a > 1.6) continue
      const cx = Math.round(cols * hash(k, 2, 13))
      const color = hsl(hash(k, 3, 13) * 360, 0.9, 0.62)
      if (a < 0.3) put(cx, Math.round(PX_H - a * 20), WHITE)
      else
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2
          const r = (a - 0.3) * 9
          put(Math.round(cx + Math.cos(ang) * r * 1.8), Math.round(2 + Math.sin(ang) * r * 0.7 + (a - 0.3) * (a - 0.3) * 3), a > 1.2 ? mix(color, bg, (a - 1.2) / 0.4) : color)
        }
    }
  }

  // The step's name, top right, where Clawd is not.
  const label = progress ? [...progress.label].slice(0, Math.max(0, Math.floor(cols / 2))) : []
  const labelAt = cols - label.length - 1
  const fg = mix(bg, [235, 235, 240], 0.6)
  const labelFg = progress?.isDone ? mix(fg, [80, 200, 120], 0.6) : fg
  const head = progress ? Math.round(progress.frac * cols) : cols
  const isHeadCol = (c: number) => progress !== undefined && !progress.isDone && c === head
  const markAt = new Map(marks.filter(m => m.x >= 0 && m.x < cols).map(m => [m.y * cols + m.x, m]))
  const words = new Uint32Array(cols * ROWS * 3)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < cols; c++) {
      const hi = px[2 * r * cols + c]
      const lo = px[(2 * r + 1) * cols + c]
      const i = (r * cols + c) * 3
      const mark = markAt.get(r * cols + c)
      const ch = r === 0 && c >= labelAt && c < labelAt + label.length && (c < left - 1 || c > right) ? label[c - labelAt] : undefined
      if (mark) words.set([mark.ch.codePointAt(0) ?? 0x3f, rgb(mark.fg), rgb(mark.bg)], i)
      else if (hi && lo) words.set([UPPER, rgb(hi), rgb(lo)], i)
      else if (hi) words.set([UPPER, rgb(hi), CLEAR], i)
      else if (lo) words.set([LOWER, rgb(lo), CLEAR], i)
      else if (ch) words.set([ch.codePointAt(0) ?? 0x20, rgb(labelFg), CLEAR], i)
      else if ((s.hasBackdrop ?? true) && (dotBits(c, r, isNight) || isHeadCol(c))) words.set([0x2800 + (isHeadCol(c) ? 0x47 : dotBits(c, r, isNight)), rgb(dotColor(c, r, act === 'dance' ? t * 6 : t, bg, c < head, isNight && act !== 'dance', progress !== undefined && !progress.isDone && c === head)), CLEAR], i)
      else words.set([0x20, CLEAR, CLEAR], i)
    }
  }

  return words
}

// The label for a plan: the step under way and how far along, each
// character one cell (anything wider, or unprintable, becomes a dot).
export function labelOf(title: string, pos: number, total: number) {
  const clean = [...title].map(ch => {
    const cp = ch.codePointAt(0) ?? 0x3f
    const isWide = cp > 0xffff || (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe4f) || (cp >= 0xff00 && cp <= 0xff60) || (cp >= 0xffe0 && cp <= 0xffe6)

    return cp < 0x20 || isWide ? '·' : ch
  })

  return `${clean.join('')} ${pos}/${total} · ${total > 0 ? Math.round((pos / total) * 100) : 0}%`
}

function rgb([r, g, b]: Rgb) {
  return ((r & 255) << 16) | ((g & 255) << 8) | (b & 255)
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function encode(words: Uint32Array) {
  const bytes = new Uint8Array(words.buffer)
  let out = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const v = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!
    out += B64[(v >> 18) & 63]! + B64[(v >> 12) & 63]! + B64[(v >> 6) & 63]! + B64[v & 63]!
  }
  if (i < bytes.length) {
    const v = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8)
    out += B64[(v >> 18) & 63]! + B64[(v >> 12) & 63]!
    out += i + 1 < bytes.length ? B64[(v >> 6) & 63]! + '=' : '=='
  }

  return out
}
