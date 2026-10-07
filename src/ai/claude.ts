// AI assistant for scripts, using the user's own Anthropic API key (BYOK).
//
// The key never leaves the browser except to call api.anthropic.com directly. It is kept in
// sessionStorage by default, or in localStorage only if the user ticks "remember". It is never part of
// the exported config file.
//
// Security note: a key stored in a browser can be read by any script running on this page. Use a key
// with a spending limit, and do not use this feature on a shared computer.

import { reactive, watch } from 'vue'

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (mejor calidad)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (equilibrado)' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (rápido y económico)' },
] as const
export type ModelId = (typeof MODELS)[number]['id']

const KEY_SESSION = 'teleprompter-libre-ai-key'
const KEY_LOCAL = 'teleprompter-libre-ai-key'
const PREFS = 'teleprompter-libre-ai-prefs'

function readKey(): { key: string; remember: boolean } {
  try {
    const local = localStorage.getItem(KEY_LOCAL)
    if (local) return { key: local, remember: true }
    return { key: sessionStorage.getItem(KEY_SESSION) ?? '', remember: false }
  } catch {
    return { key: '', remember: false }
  }
}

function readPrefs(): { model: ModelId } {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) ?? '{}') as { model?: string }
    if (MODELS.some((m) => m.id === p.model)) return { model: p.model as ModelId }
  } catch {
    /* ignore */
  }
  return { model: 'claude-opus-5-5' }
}

export const ai = reactive({ ...readKey(), ...readPrefs() })

watch(
  () => [ai.key, ai.remember] as const,
  ([key, remember]) => {
    try {
      if (remember && key) {
        localStorage.setItem(KEY_LOCAL, key)
        sessionStorage.removeItem(KEY_SESSION)
      } else {
        localStorage.removeItem(KEY_LOCAL)
        if (key) sessionStorage.setItem(KEY_SESSION, key)
        else sessionStorage.removeItem(KEY_SESSION)
      }
    } catch {
      /* ignore */
    }
  },
)
watch(
  () => ai.model,
  (model) => {
    try {
      localStorage.setItem(PREFS, JSON.stringify({ model }))
    } catch {
      /* ignore */
    }
  },
)

const SYSTEM = `Eres editor de guiones para teleprompter. Recibes el guion de una persona que lo leerá en voz alta frente a una cámara o un público, y una instrucción de edición.

Reglas:
- Devuelve únicamente el guion resultante, sin comentarios, sin títulos añadidos y sin envolverlo en bloques de código ni comillas.
- Escribe en texto plano: sin Markdown, sin viñetas salvo que el original las tenga.
- Conserva el idioma del guion salvo que la instrucción pida traducir.
- Conserva el contenido, los datos y las cifras; no inventes hechos, cifras ni citas.
- Las indicaciones escénicas van entre corchetes, por ejemplo [pausa], [mirar a cámara], [clic]. No se leen en voz alta. Conserva las que existan, salvo que la instrucción diga otra cosa.
- Separa los párrafos con una línea en blanco: cada párrafo es un bloque de lectura.`

export interface Preset {
  id: string
  label: string
  /** Builds the instruction; `arg` is the free-text value of the preset, if any. */
  instruction: (arg: string, ctx: { wpm: number }) => string
  arg?: { placeholder: string; default: string }
}

export const PRESETS: Preset[] = [
  {
    id: 'oral',
    label: 'Adaptar para leer en voz alta',
    instruction: () =>
      'Reescribe el guion para que suene natural al leerlo en voz alta: frases cortas, una idea por frase, sin subordinadas largas ni paréntesis, con palabras fáciles de pronunciar. No cambies el contenido.',
  },
  {
    id: 'duracion',
    label: 'Ajustar a una duración',
    arg: { placeholder: 'Minutos', default: '3' },
    instruction: (arg, { wpm }) => {
      const min = Math.max(0.5, Number(arg.replace(',', '.')) || 3)
      return `Ajusta el guion para que dure ${min} minutos leído a ${wpm} palabras por minuto, es decir, unas ${Math.round(min * wpm)} palabras (sin contar las indicaciones entre corchetes). Si hay que acortar, conserva las ideas principales y elimina las secundarias; si hay que alargar, desarrolla las ideas existentes sin inventar datos.`
    },
  },
  {
    id: 'indicaciones',
    label: 'Agregar indicaciones [pausa] [énfasis]',
    instruction: () =>
      'Agrega indicaciones escénicas entre corchetes donde ayuden a la lectura: [pausa] después de ideas importantes, [respirar] antes de frases largas, [énfasis] antes de la palabra clave, [mirar a cámara] en las conclusiones. Úsalas con moderación. No cambies el texto hablado.',
  },
  {
    id: 'corregir',
    label: 'Corregir ortografía y puntuación',
    instruction: () =>
      'Corrige ortografía, gramática y puntuación. Ajusta la puntuación para marcar las pausas naturales de la lectura. No cambies el estilo ni el contenido.',
  },
  {
    id: 'traducir',
    label: 'Traducir',
    arg: { placeholder: 'Idioma', default: 'inglés' },
    instruction: (arg) =>
      `Traduce el guion al ${arg || 'inglés'}, con un registro hablado natural para ese idioma. Traduce también el texto de las indicaciones entre corchetes.`,
  },
  {
    id: 'tarjetas',
    label: 'Resumir en tarjetas de apoyo',
    instruction: () =>
      'Convierte el guion en tarjetas de apoyo para hablar sin leer: un párrafo por tarjeta, cada una con 1 a 3 frases cortas que recuerden la idea, los datos clave y la transición a la siguiente.',
  },
  {
    id: 'libre',
    label: 'Instrucción libre',
    arg: { placeholder: 'Qué quieres cambiar', default: '' },
    instruction: (arg) => arg || 'Mejora la claridad del guion.',
  },
]

export class AiError extends Error {}

/**
 * Run an edit over the script, streaming the partial result through `onText`.
 * Returns the full edited script.
 */
export async function runEdit(opts: {
  script: string
  instruction: string
  onText: (soFar: string) => void
  signal?: AbortSignal
}): Promise<string> {
  if (!ai.key.trim()) throw new AiError('Falta la API key de Anthropic.')
  // Loaded on demand so the SDK is only downloaded when the assistant is used.
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: ai.key.trim(), dangerouslyAllowBrowser: true })

  const isHaiku = ai.model === 'claude-haiku-4-5'
  const request = {
    model: ai.model,
    max_tokens: 64000,
    system: SYSTEM,
    messages: [
      {
        role: 'user' as const,
        content: `<guion>\n${opts.script}\n</guion>\n\nInstrucción: ${opts.instruction}`,
      },
    ],
    // Script edits are routine work: medium effort keeps them fast. Haiku 4.5 does not take effort.
    ...(isHaiku ? {} : { output_config: { effort: 'medium' as const } }),
    // If a safety classifier declines, let the API retry on a fallback model in the same call.
    ...(isHaiku ? {} : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }),
  }

  let text = ''
  try {
    const stream = client.beta.messages.stream(request, { signal: opts.signal })
    stream.on('text', (delta) => {
      text += delta
      opts.onText(text)
    })
    const msg = await stream.finalMessage()
    if (msg.stop_reason === 'refusal') throw new AiError('El modelo rechazó esta solicitud.')
    if (msg.stop_reason === 'max_tokens') throw new AiError('La respuesta quedó incompleta: el guion es demasiado largo.')
    return text.trim()
  } catch (e) {
    if (e instanceof AiError) throw e
    if (e instanceof Anthropic.APIUserAbortError) throw new AiError('Cancelado.')
    if (e instanceof Anthropic.AuthenticationError) throw new AiError('API key inválida.')
    if (e instanceof Anthropic.PermissionDeniedError) throw new AiError('La API key no tiene permiso para este modelo.')
    if (e instanceof Anthropic.RateLimitError) throw new AiError('Límite de uso alcanzado; intenta en un momento.')
    if (e instanceof Anthropic.BadRequestError) throw new AiError('Solicitud rechazada: ' + e.message)
    if (e instanceof Anthropic.APIConnectionError) throw new AiError('Sin conexión con la API de Anthropic.')
    if (e instanceof Anthropic.APIError) throw new AiError(`Error de la API (${e.status}): ${e.message}`)
    throw e
  }
}
