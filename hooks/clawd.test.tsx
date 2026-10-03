import { test, expect, mock } from 'claude-code/testing'

import { ANIMALS, ROWS, actOf, commandAct, dotColor, frame, isNightAt, labelOf, newWalker, parisHour, seasonAt, step, toolAct } from './art'

const SPINNER = {
  surface: 'terminal' as const,
  component: 'Spinner' as const,
  props: { word: 'Sauteing', message: null, suffix: '…', mode: 'tool-use' as const },
}

test('the spinner keeps its line and draws Clawd under it', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  on('ui.render', { component: 'Spinner' }, ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>Sauteing…</Text>
  })
  const ui = await $.ui.mount({ plugin: 'clawd-mods', ...SPINNER })
  expect(await ui.find({ type: 'Text', text: /Sauteing/ })).toBeDefined()
  expect(await ui.find({ key: 'clawd' })).toBeDefined()
  await ui.unmount()
})

const ORANGE = (217 << 16) | (119 << 8) | 87

function cellsOf(words: Uint32Array) {
  const chars = new Set<number>()
  const colors = new Set<number>()
  for (let i = 0; i < words.length; i += 3) {
    chars.add(words[i]!)
    colors.add(words[i + 1]!)
  }

  return { chars, colors }
}

test('a frame is cols x ROWS cells, with a small orange Clawd and braille dots behind him', () => {
  const words = frame({ walker: newWalker(), t: 1.2, act: 'walk', cols: 40 })
  expect(words.length).toBe(40 * ROWS * 3)
  const { chars, colors } = cellsOf(words)
  expect(chars.has(0x2580)).toBe(true)
  expect([...chars].some(c => c > 0x2800 && c <= 0x28ff)).toBe(true)
  expect(colors.has(ORANGE)).toBe(true)
  const bare = frame({ walker: newWalker(), t: 1.2, act: 'walk', cols: 40, hasBackdrop: false })
  for (let i = 0; i < bare.length; i += 3) expect(bare[i]! >= 0x2800 && bare[i]! <= 0x28ff).toBe(false)
})

test('flying, he wears a red cape; with the laser, a beam leaves the gun', () => {
  const fly = cellsOf(frame({ walker: { x: 15, dir: 1, at: 0 }, t: 0.3, act: 'fly', cols: 50, hasBackdrop: false }))
  expect(fly.colors.has((214 << 16) | (48 << 8) | 49)).toBe(true)
  const shoot = frame({ walker: { x: 2, dir: 1, at: 0 }, t: 0.3, act: 'laser', cols: 50, hasBackdrop: false })
  const drawn = (words: Uint32Array) => {
    let n = 0
    for (let i = 0; i < words.length; i += 3) if (words[i] !== 0x20) n++
    return n
  }
  expect(drawn(shoot)).toBeGreaterThan(drawn(frame({ walker: { x: 2, dir: 1, at: 0 }, t: 0.3, act: 'stand', cols: 50, hasBackdrop: false })))
})

test('with a task list, the dots are lit up to the current task and its name shows', () => {
  const words = frame({ walker: { x: 0, dir: 1, at: 0 }, t: 2, act: 'stand', cols: 60, progress: { frac: 0.5, label: labelOf('Routes', 2, 4), isDone: false } })
  let text = ''
  for (let c = 0; c < 60; c++) text += String.fromCodePoint(words[c * 3]!)
  expect(text).toContain('Routes 2/4')
  expect(actOf({ mode: 'tool-use', t: 0, hasPlan: true })).toBe('laser')
  expect(actOf({ mode: 'tool-use', t: 0, hasPlan: true, isTravelling: true })).toBe('fly')
  expect(actOf({ mode: 'thinking', t: 0, hasPlan: true, isCheering: true })).toBe('cheer')
})

test('Clawd roams freely, turning round at the ends of the strip', () => {
  const w = newWalker()
  step(w, 1000, 'walk', 40)
  step(w, 1400, 'walk', 40)
  expect(w.x).toBeGreaterThan(0)
  const dirs = new Set<number>()
  for (let t = 1400; t < 4000; t += 50) {
    step(w, t, 'race', 40)
    dirs.add(w.dir)
    expect(w.x).toBeGreaterThanOrEqual(0)
    expect(w.x).toBeLessThanOrEqual(40 - 10 - 1)
  }
  expect(dirs.size).toBe(2)
})

test('the dots twinkle: a cell fades and changes colour over time', () => {
  const seen = new Set<string>()
  for (let t = 0; t < 10; t += 0.25) seen.add(dotColor(3, 2, t, [24, 24, 27]).join())
  expect(seen.size).toBeGreaterThan(3)
})

test('the magician wears a purple hat, the racer drives a red car, the jetpack burns', () => {
  const colorsOf = (act: 'magic' | 'race' | 'jetpack') => cellsOf(frame({ walker: { x: 20, dir: 1, at: 0 }, t: 0.37, act, cols: 60, hasBackdrop: false })).colors
  expect(colorsOf('magic').has((112 << 16) | (72 << 8) | 196)).toBe(true)
  expect(colorsOf('race').has((220 << 16) | (40 << 8) | 50)).toBe(true)
  expect([...colorsOf('jetpack')].some(c => c === ((255 << 16) | (160 << 8) | 60) || c === ((255 << 16) | (230 << 8) | 120))).toBe(true)
  const seen = new Set<string>()
  for (let t = 0; t < 84; t += 7) seen.add(actOf({ mode: 'tool-use', t }))
  expect(seen.size).toBe(12)
  expect(new Set([0, 1, 2, 3].map(turn => actOf({ mode: 'tool-use', t: 0, hasPlan: true, isTravelling: true, turn }))).size).toBe(4)
})

test('the tool at hand picks his prop; failures, questions and finales come first', () => {
  expect(toolAct('Grep')).toBe('dig')
  expect(toolAct('Edit')).toBe('hammer')
  expect(toolAct('Bash')).toBe('terminal')
  expect(toolAct('Read')).toBe('read')
  expect(actOf({ mode: 'tool-use', t: 0, tool: 'Edit' })).toBe('hammer')
  expect(actOf({ mode: 'tool-use', t: 0, tool: 'Edit', pinned: 'pirate' })).toBe('hammer')
  expect(actOf({ mode: 'thinking', t: 0, pinned: 'pirate' })).toBe('pirate')
  expect(actOf({ mode: 'tool-use', t: 0, tool: 'Edit', isFailing: true })).toBe('trip')
  expect(actOf({ mode: 'tool-use', t: 0, isAsking: true })).toBe('sign')
  expect(actOf({ mode: 'tool-use', t: 0, isFinale: true, isFailing: true })).toBe('finale')
})

test('every act draws without throwing, and the sign shows a "?"', () => {
  const acts = ['stand', 'walk', 'fly', 'race', 'jetpack', 'skate', 'think', 'laser', 'magic', 'dj', 'pirate', 'astronaut', 'knight', 'chase', 'dig', 'hammer', 'terminal', 'read', 'trip', 'sign', 'cheer', 'finale', 'rocket', 'flag', 'juggle', 'trophy', 'coffee', 'boxes', 'dance'] as const
  for (const act of acts) for (const dir of [1, -1]) frame({ walker: { x: 20, dir, at: 0 }, t: 1.3, act, cols: 80, helpers: 3, cheerAge: 0.8, look: { fuel: 0.1, isSweating: true, isNight: true, season: 'halloween', hasCrown: true, bulbAge: 0.5 }, switchAge: 0.1 })
  const sign = frame({ walker: { x: 10, dir: 1, at: 0 }, t: 1, act: 'sign', cols: 60, hasBackdrop: false, hasEvents: false })
  let row = ''
  for (let c = 0; c < 60; c++) row += String.fromCodePoint(sign[c * 3]!)
  expect(row).toContain('?')
})

test('night falls at 21:00 in Paris, summer time included', () => {
  expect(parisHour(Date.UTC(2026, 6, 1, 19, 30))).toBe(21)
  expect(parisHour(Date.UTC(2026, 0, 15, 19, 30))).toBe(20)
  expect(isNightAt(Date.UTC(2026, 6, 1, 19, 30))).toBe(true)
  expect(isNightAt(Date.UTC(2026, 6, 1, 10, 0))).toBe(false)
})

test('shell commands get their own act: push, commit, tests, installs', () => {
  expect(commandAct('git push origin main')).toBe('rocket')
  expect(commandAct('git commit -m "x"')).toBe('flag')
  expect(commandAct('npm test')).toBe('juggle')
  expect(commandAct('pytest -q')).toBe('juggle')
  expect(commandAct('pnpm add zod')).toBe('boxes')
  expect(commandAct('ls -la')).toBeUndefined()
  expect(actOf({ mode: 'tool-use', t: 0, tool: 'Bash', command: 'git push' })).toBe('rocket')
  expect(actOf({ mode: 'tool-use', t: 0, tool: 'Bash', command: 'sleep 60', isLongRun: true })).toBe('coffee')
  expect(actOf({ mode: 'tool-use', t: 0, tool: 'Bash', isTrophy: true })).toBe('trophy')
  expect(actOf({ mode: 'thinking', t: 0, isDancing: true })).toBe('dance')
})

test('the magician conjures little animals, and the seasons dress him up', () => {
  const seen = new Set<string>()
  for (let t = 0.5; t < 60; t += 3) {
    const words = frame({ walker: { x: 2, dir: 1, at: 0 }, t, act: 'magic', cols: 60, hasBackdrop: false, hasEvents: false })
    let n = 0
    for (let i = 0; i < words.length; i += 3) if (words[i] !== 0x20) n++
    seen.add(String(n))
  }
  expect(seen.size).toBeGreaterThan(2)
  expect(ANIMALS.length).toBe(6)
  expect(seasonAt(Date.UTC(2026, 9, 31, 12))).toBe('halloween')
  expect(seasonAt(Date.UTC(2026, 11, 24, 12))).toBe('christmas')
  expect(seasonAt(Date.UTC(2026, 5, 1, 12))).toBeUndefined()
})
