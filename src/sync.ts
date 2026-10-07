// Multi-window sync and external control.
//
// Roles
//   control  – the normal app (editor + prompter). Owns the script and the scroll position.
//   display  – opened with ?pantalla (or ?display): prompter only, for a second monitor, a glass rig or
//              an OBS browser source. It follows the control window and keeps its own font size,
//              mirror and rotation.
//
// Transport: BroadcastChannel (same browser, same origin). Works over http(s)/localhost; browsers do
// not reliably share a channel between file:// pages.
//
// External control API: any page or script can drive the control window with
//   new BroadcastChannel('teleprompter-libre').postMessage({ type: 'cmd', cmd: 'next' })
// or window.postMessage({ type: 'cmd', cmd: 'next' }, '*') to an iframe/popup of the app.
// Commands: start, stop, pause, next, prev, faster, slower, bigger, smaller, mirror.

import { reactive, watch } from 'vue'
import { state, type AppConfig, rebuildNorm } from './store'

export type Role = 'control' | 'display'
export type Command =
  | 'start'
  | 'stop'
  | 'pause'
  | 'next'
  | 'prev'
  | 'faster'
  | 'slower'
  | 'bigger'
  | 'smaller'
  | 'mirror'

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams()
export const role: Role = params.has('pantalla') || params.has('display') ? 'display' : 'control'

const CHANNEL = 'teleprompter-libre'
const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null

// Settings that travel from the control window to displays. Font size, mirror, rotation and window
// geometry stay local to each display because they depend on its screen and physical setup.
const SHARED = [
  'script',
  'mode',
  'fontFamily',
  'color',
  'background',
  'lineHeight',
  'letterSpacing',
  'breakWords',
  'removeBlankLines',
  'readLine',
] as const
type Shared = Pick<AppConfig, (typeof SHARED)[number]>

/** Read position shared with displays: character at the read line plus the fraction of that line already passed. */
export const remotePos = reactive({ idx: 0, frac: 0, running: false })

/** Paragraph-jump requests (keyboard, clicker or external command) consumed by the prompter. */
export const nav = reactive({ seq: 0, dir: 1 as 1 | -1 })
export function requestJump(dir: 1 | -1) {
  nav.dir = dir
  nav.seq++
}

type Msg =
  | { type: 'hello' }
  | { type: 'config'; cfg: Shared }
  | { type: 'pos'; idx: number; frac: number; running: boolean }
  | { type: 'cmd'; cmd: Command }

function post(msg: Msg) {
  channel?.postMessage(msg)
}

function sharedConfig(): Shared {
  const out = {} as Record<string, unknown>
  for (const k of SHARED) out[k] = state[k]
  return out as Shared
}

let lastIdx = -1
let lastFrac = -1
let lastRunning = false
/** Called by the control window's prompter every frame; only sends when the position changed. */
export function publishPos(idx: number, frac: number) {
  if (role !== 'control' || !channel) return
  const f = Math.round(frac * 100) / 100
  if (idx === lastIdx && f === lastFrac && state.running === lastRunning) return
  lastIdx = idx
  lastFrac = f
  lastRunning = state.running
  post({ type: 'pos', idx, frac: f, running: state.running })
}

// ===== Display-local settings (separate storage key, so a display never overwrites the control config) =====
const DISPLAY_KEY = 'teleprompter-libre-display'
const LOCAL = ['fontSize', 'flipH', 'flipV', 'rotation'] as const

function loadDisplayLocal() {
  try {
    const raw = localStorage.getItem(DISPLAY_KEY)
    if (raw) Object.assign(state, JSON.parse(raw))
  } catch {
    /* ignore */
  }
}
function saveDisplayLocal() {
  const out: Record<string, unknown> = {}
  for (const k of LOCAL) out[k] = state[k]
  try {
    localStorage.setItem(DISPLAY_KEY, JSON.stringify(out))
  } catch {
    /* ignore */
  }
}

/**
 * Start syncing. `onCommand` receives commands from other windows/pages (control role only).
 */
export function initSync(onCommand: (cmd: Command) => void) {
  const handle = (data: unknown) => {
    if (!data || typeof data !== 'object') return
    const msg = data as Msg
    if (role === 'control') {
      if (msg.type === 'hello') {
        post({ type: 'config', cfg: sharedConfig() })
        lastIdx = -1
      } else if (msg.type === 'cmd') onCommand(msg.cmd)
    } else {
      if (msg.type === 'config') {
        Object.assign(state, msg.cfg)
        rebuildNorm()
      } else if (msg.type === 'pos') {
        remotePos.idx = msg.idx
        remotePos.frac = msg.frac
        remotePos.running = msg.running
      }
    }
  }
  if (channel) channel.onmessage = (e) => handle(e.data)
  // Same commands through window.postMessage (embedding in another page or a parent window).
  window.addEventListener('message', (e) => {
    const d = e.data as Msg | undefined
    if (d && d.type === 'cmd') handle(d)
  })

  if (role === 'control') {
    watch(sharedConfig, (cfg) => post({ type: 'config', cfg }), { deep: true })
  } else {
    state.windowMode = 'window'
    loadDisplayLocal()
    watch(() => LOCAL.map((k) => state[k]), saveDisplayLocal)
    post({ type: 'hello' })
  }
}

/** Open (or focus) a display window for a second monitor. */
export function openDisplay() {
  const url = new URL(location.href)
  url.search = '?pantalla'
  url.hash = ''
  window.open(url.href, 'teleprompter-libre-pantalla', 'popup,width=960,height=600')
}

export const syncAvailable = !!channel
