// Stage cues: any text between square brackets, e.g. [pausa], [mirar a cámara], [clic].
// Cues are shown dimmed on the prompter, ignored by speech matching and excluded from the duration estimate.

/**
 * Mark every character that belongs to a [cue] (brackets included). An unclosed "[" is not a cue.
 * Accepts a string (UTF-16 indices) or an array of code points (prompter span indices).
 */
export function cueMask(text: ArrayLike<string>): boolean[] {
  const mask: boolean[] = new Array(text.length).fill(false)
  let open = -1
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '[') open = i
    else if (ch === '\n') open = -1 // cues never span lines
    else if (ch === ']' && open >= 0) {
      for (let j = open; j <= i; j++) mask[j] = true
      open = -1
    }
  }
  return mask
}

/** Remove [cues] from the text. */
export function stripCues(text: string): string {
  return text.replace(/\[[^\]\n]*\]/g, ' ')
}

const LATIN_WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu
const CJK_CHAR = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu

/**
 * Count spoken words: Latin/Cyrillic words plus one "word" per CJK character
 * (the usual approximation for Chinese/Japanese reading speed).
 */
export function countWords(text: string): number {
  const clean = stripCues(text)
  const cjk = clean.match(CJK_CHAR)?.length ?? 0
  const latin = clean.replace(CJK_CHAR, ' ').match(LATIN_WORD)?.length ?? 0
  return latin + cjk
}

/** Format seconds as m:ss. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
