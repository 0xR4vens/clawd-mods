// clawd-mods: Clawd in pixel art under the spinner while Claude works, in
// front of a field of twinkling dots that doubles as the task list's progress
// bar. Everything he does comes from what the session already knows (the
// spinner's mode, the tools Claude calls, the task list, the usage figures);
// nothing here asks a model for anything, so it costs no tokens.
//
// The engine follows $ only within one file, so every hook lives here; the
// drawing is in art.ts. The status line is statusline.sh, set as the
// statusLine command in settings.

import type { EngineInterface, Register } from 'claude-code'

import {
  CHEER_S,
  CLAWD_W,
  COSTUMES,
  FINALE_S,
  ROWS,
  actOf,
  encode,
  frame,
  isNightAt,
  isTestCommand,
  labelOf,
  liftOf,
  newWalker,
  seasonAt,
  step,
  type Act,
  type Mode,
  type Progress,
  type Rgb,
  type Walker,
} from './art'

type Raw = Record<string, unknown>
type TaskStatus = 'pending' | 'in_progress' | 'completed'
type Task = { subject: string; status: TaskStatus }

const KEY = 'clawd'
const SHOWN = 'mascot.shown'
const BACKDROP = 'mascot.backdrop'
const PINNED = 'mascot.pinned'

// An act holds the stage at least this long, so brief turns between tools
// don't flicker; the urgent ones cut in at once.
const MIN_ACT_MS = 1500
const URGENT = new Set<Act>(['finale', 'cheer', 'trip', 'trophy', 'dance'])
// A tool's prop stays a moment after the tool ends.
const TOOL_LINGER_MS = 1200
const FAIL_MS = 2500
const TROPHY_MS = 2500
const DANCE_MS = 6000
// A command running this long gets a coffee; a think this long, a bulb.
const LONG_RUN_MS = 20_000
const LONG_THINK_MS = 8000
// Tool calls in a row without an error that earn a crown.
const STREAK = 10
// A finished task list stays on screen this long, then clears.
const DONE_SHOWN_MS = 6000

type Buddy = {
  spinner?: string
  mode: Mode
  cols: number
  isShown: boolean
  hasBackdrop: boolean
  isAnimating: boolean
  walker: Walker
  pinned?: Act
  bg: Rgb
  // the tool running now (or last, and when it ended), its shell command
  tool?: string
  command?: string
  toolStartAt: number
  lastTool?: string
  lastCommand?: string
  toolEndAt: number
  failAt: number
  trophyAt: number
  danceAt: number
  streak: number
  // when Claude started thinking, and when a long think ended
  thinkSince?: number
  bulbAt: number
  // tasks done as last drawn, to cheer each new one; when the list finished
  tasksDone: number
  cheerAt: number
  finaleAt: number
  allDoneAt?: number
  // the act on screen, since when, and the height it started from
  act: Act
  actSince: number
  liftFrom: number
  // from the session's usage: context left (0 to 1), a limit near
  fuel: number
  isNearLimit: boolean
}

const buddy: Buddy = {
  mode: 'requesting',
  cols: 40,
  isShown: true,
  hasBackdrop: true,
  isAnimating: false,
  walker: newWalker(),
  bg: [24, 24, 27],
  toolStartAt: 0,
  toolEndAt: -1e9,
  failAt: -1e9,
  trophyAt: -1e9,
  danceAt: -1e9,
  streak: 0,
  bulbAt: -1e9,
  tasksDone: 0,
  cheerAt: -1e9,
  finaleAt: -1e9,
  act: 'stand',
  actSince: 0,
  liftFrom: 0,
  fuel: 1,
  isNearLimit: false,
}

// The task list, as Claude keeps it with TaskCreate / TaskUpdate or
// TodoWrite, read off those calls as they pass.
const tasks = new Map<string, Task>()
const subagents = new Set<string>()

function noteTasks(tool: string, input: Raw, result: unknown) {
  if (buddy.allDoneAt !== undefined) {
    tasks.clear()
    buddy.allDoneAt = undefined
    buddy.tasksDone = 0
  }
  if (tool === 'TodoWrite' && Array.isArray(input.todos)) {
    tasks.clear()
    ;(input.todos as Raw[]).forEach((t, i) => tasks.set(`todo:${i}`, { subject: String(t.activeForm || t.content || ''), status: (t.status as TaskStatus) ?? 'pending' }))
  } else if (tool === 'TaskCreate') {
    const id = (result as { task?: { id?: string } } | undefined)?.task?.id
    if (id) tasks.set(id, { subject: String(input.subject ?? ''), status: 'pending' })
  } else if (tool === 'TaskUpdate' && typeof input.taskId === 'string') {
    const task = tasks.get(input.taskId)
    if (input.status === 'deleted') tasks.delete(input.taskId)
    else if (task) tasks.set(input.taskId, { subject: typeof input.subject === 'string' ? input.subject : task.subject, status: (input.status as TaskStatus) ?? task.status })
  }
}

function progressOf(now: number): Progress | undefined {
  const list = [...tasks.values()]
  if (list.length === 0) return undefined
  const done = list.filter(t => t.status === 'completed').length
  const isDone = done === list.length
  if (isDone && buddy.allDoneAt !== undefined && now - buddy.allDoneAt > DONE_SHOWN_MS) {
    tasks.clear()
    buddy.allDoneAt = undefined
    buddy.tasksDone = 0

    return undefined
  }
  if (done > buddy.tasksDone) {
    if (isDone) {
      buddy.finaleAt = now
      buddy.allDoneAt = now
    } else buddy.cheerAt = now
  }
  buddy.tasksDone = done
  const active = list.find(t => t.status === 'in_progress') ?? list.find(t => t.status !== 'completed')

  return { frac: done / list.length, isDone, label: labelOf(isDone ? 'Terminé' : (active?.subject ?? ''), done, list.length) }
}

// A failing test run often exits without the tool reporting an error;
// its output still says so.
function testsFailed(result: unknown) {
  const text = JSON.stringify(result ?? '')

  return /\b[1-9]\d*\s+(failed|failing|fail)\b|\bFAIL(ED)?\b|\bfailures?:\s*[1-9]/.test(text)
}

async function paintClawd($: EngineInterface) {
  const now = await $.clock.now()
  const progress = progressOf(now)
  const finaleAge = (now - buddy.finaleAt) / 1000
  const isFinale = finaleAge < FINALE_S
  const cheerAge = isFinale ? finaleAge : (now - buddy.cheerAt) / 1000
  const isLingering = now - buddy.toolEndAt < TOOL_LINGER_MS
  const wanted = actOf({
    mode: buddy.mode,
    t: now / 1000,
    hasPlan: progress !== undefined,
    isCheering: cheerAge < CHEER_S,
    isFinale,
    turn: buddy.tasksDone,
    tool: buddy.tool ?? (isLingering ? buddy.lastTool : undefined),
    command: buddy.command ?? (isLingering ? buddy.lastCommand : undefined),
    isFailing: now - buddy.failAt < FAIL_MS,
    isTrophy: now - buddy.trophyAt < TROPHY_MS,
    isDancing: now - buddy.danceAt < DANCE_MS,
    isLongRun: buddy.tool !== undefined && now - buddy.toolStartAt > LONG_RUN_MS,
    pinned: buddy.pinned,
  })
  if (wanted !== buddy.act && (URGENT.has(wanted) || now - buddy.actSince >= MIN_ACT_MS)) {
    buddy.liftFrom = liftOf(buddy.act, now / 1000)
    buddy.act = wanted
    buddy.actSince = now
  }
  const act = buddy.act
  const switchAge = (now - buddy.actSince) / 1000
  const lift = Math.round(buddy.liftFrom + (liftOf(act, now / 1000) - buddy.liftFrom) * Math.min(1, switchAge / 0.3))
  step(buddy.walker, now, act, buddy.cols)

  return encode(
    frame({
      walker: buddy.walker,
      t: now / 1000,
      act,
      cols: buddy.cols,
      hasBackdrop: buddy.hasBackdrop,
      bg: buddy.bg,
      progress,
      cheerAge,
      helpers: subagents.size,
      look: {
        fuel: buddy.fuel,
        isSweating: buddy.isNearLimit,
        isNight: isNightAt(now),
        season: seasonAt(now),
        hasCrown: buddy.streak >= STREAK,
        bulbAge: (now - buddy.bulbAt) / 1000,
      },
      lift,
      switchAge,
    }),
  )
}

// About 20 frames a second while the spinner shows.
async function animateClawd($: EngineInterface) {
  if (buddy.isAnimating) return
  buddy.isAnimating = true
  try {
    while (buddy.spinner && buddy.isShown) {
      const cells = await paintClawd($)
      const at = buddy.spinner
      if (!at) break
      await $.ui.blit({ requestId: at, key: KEY, cells, columns: buddy.cols, rows: ROWS }).catch(() => {})
      await $.clock.sleep(50)
    }
  } finally {
    buddy.isAnimating = false
  }
}

// The context left and how near the usage limits are, read from the
// session every few seconds; no request is made.
async function pollUsage($: EngineInterface) {
  const usage = await $.session.usage()
  if (usage.context.percent !== undefined) buddy.fuel = Math.max(0, 1 - usage.context.percent / 100)
  const near = (kind: string, at: number) => (usage.rateLimits.find(r => r.kind === kind)?.percentUsed ?? 0) >= at
  buddy.isNearLimit = near('five_hour', 80) || near('seven_day', 90)
}

async function readTheme($: EngineInterface) {
  const theme = (await $.config.list().catch(() => [])).find(row => row.key === 'theme')
  buddy.bg = /light/i.test(String(theme?.value ?? '')) ? [255, 255, 255] : [24, 24, 27]
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    buddy.isShown = (await $.store.get(SHOWN)) !== false
    buddy.hasBackdrop = (await $.store.get(BACKDROP)) !== false
    const pinned = await $.store.get(PINNED)
    buddy.pinned = typeof pinned === 'string' ? (pinned as Act) : undefined
    await readTheme($)
    await pollUsage($).catch(() => {})
    $.clock.every(5000, () => pollUsage($).catch(() => {}))
    await $.command.register({ name: 'clawd', description: 'Clawd sous le spinner : /clawd, /clawd fond, /clawd <rôle> (magicien, pilote, pirate…), /clawd aléatoire' })

    return next(e)
  })

  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const result = await next(e)
    await readTheme($)

    return result
  })

  on('command.run', { command: 'clawd' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'fond') {
      buddy.hasBackdrop = !buddy.hasBackdrop
      await $.store.set(BACKDROP, buddy.hasBackdrop)

      return { text: buddy.hasBackdrop ? 'Fond de points activé.' : 'Fond désactivé : Clawd seul.' }
    }
    if (arg === 'aléatoire' || arg === 'aleatoire' || arg === 'auto') {
      buddy.pinned = undefined
      await $.store.delete(PINNED)

      return { text: 'Clawd change de rôle tout seul.' }
    }
    const costume = COSTUMES[arg]
    if (costume) {
      buddy.pinned = costume
      await $.store.set(PINNED, costume)

      return { text: `Clawd garde le rôle « ${arg} ». /clawd aléatoire pour qu’il en change.` }
    }
    if (arg !== '') return { text: `Usage : /clawd (afficher/masquer), /clawd fond, /clawd aléatoire, /clawd <rôle> parmi : ${Object.keys(COSTUMES).join(', ')}` }
    buddy.isShown = !buddy.isShown
    await $.store.set(SHOWN, buddy.isShown)
    $.ui.invalidate('ui.render')

    return { text: buddy.isShown ? 'Clawd est de retour sous le spinner.' : 'Clawd est caché. /clawd pour le faire revenir.' }
  })

  // "danse clawd" anywhere in a prompt: he dances while Claude works on it.
  on('prompt.submit', async ($, e, next) => {
    const text = (e as unknown as Raw).text
    if (typeof text === 'string' && /\bdanse\s+clawd\b|\bclawd\s+danse\b/i.test(text)) buddy.danceAt = await $.clock.now()

    return next(e)
  })

  // The main conversation's tools: the prop for each, failures, test
  // results, the streak, and the task list.
  on('tool.call', async ($, e, next) => {
    if (e.agentId) return next(e)
    const input = e as unknown as Raw
    const isTaskTool = /^(TaskCreate|TaskUpdate|TodoWrite|TaskGet|TaskList)$/.test(e.tool)
    if (!isTaskTool) {
      buddy.tool = e.tool
      buddy.command = typeof input.command === 'string' ? input.command : undefined
      buddy.toolStartAt = await $.clock.now()
    }
    let ran: Awaited<ReturnType<typeof next>>
    try {
      ran = await next(e)
    } finally {
      if (!isTaskTool && buddy.tool === e.tool) {
        buddy.lastTool = buddy.tool
        buddy.lastCommand = buddy.command
        buddy.tool = undefined
        buddy.command = undefined
        buddy.toolEndAt = await $.clock.now()
      }
    }
    if (ran.deny !== undefined) return ran
    const now = await $.clock.now()
    if (isTaskTool) noteTasks(e.tool, input, ran.result)
    else if (ran.isError || (buddy.lastCommand && isTestCommand(buddy.lastCommand) && testsFailed(ran.result))) {
      buddy.failAt = now
      buddy.streak = 0
    } else {
      buddy.streak += 1
      if (buddy.lastCommand && isTestCommand(buddy.lastCommand)) buddy.trophyAt = now
    }

    return ran
  })

  // Subagents at work: one little Clawd each.
  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if ('agentId' in started && started.agentId) subagents.add(started.agentId)

    return started
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) subagents.delete(e.agentId)
    else {
      buddy.spinner = undefined
      buddy.thinkSince = undefined
    }

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (e.surface !== 'terminal') return next(e)
    const line = await next(e)
    if (!buddy.isShown) {
      buddy.spinner = undefined

      return line
    }
    const { Box, Raster } = $.ui.resolve(e)
    const now = await $.clock.now()
    // A long think that just ended lights a bulb.
    if (e.props.mode === 'thinking') buddy.thinkSince ??= now
    else if (buddy.thinkSince !== undefined) {
      if (now - buddy.thinkSince > LONG_THINK_MS) buddy.bulbAt = now
      buddy.thinkSince = undefined
    }
    buddy.mode = e.props.mode
    buddy.spinner = e.requestId
    // The whole row, less the spinner's indent.
    buddy.cols = Math.max(CLAWD_W + 8, Math.min(512, (e.viewport?.columns ?? 80) - 2))
    const cells = await paintClawd($)
    void animateClawd($).catch(() => {})

    return (
      <Box flexDirection="column">
        {line}
        <Raster key={KEY} columns={buddy.cols} rows={ROWS} cells={cells} />
      </Box>
    )
  })
}
