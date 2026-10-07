// Script importers: turn a dropped/opened file into plain teleprompter text.
// Supported: .txt, .md/.markdown, .docx (Word), .srt/.vtt (subtitles), .html.

export const ACCEPT = '.txt,.md,.markdown,.docx,.srt,.vtt,.html,.htm,text/plain,text/markdown'

export function isSupportedFile(f: File): boolean {
  return /\.(txt|md|markdown|docx|srt|vtt|html?)$/i.test(f.name) || f.type.startsWith('text/')
}

/** Markdown → readable plain text (keeps paragraphs; drops markup, links and images). */
export function markdownToText(md: string): string {
  return md
    .replace(/^---\n[\s\S]*?\n---\n/, '') // front matter
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/<!--[\s\S]*?-->/g, '') // comments
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}>\s?/gm, '') // quotes
    .replace(/^\s*[-*+]\s+/gm, '• ') // bullets
    .replace(/^\s*(\d+)\.\s+/gm, '$1. ')
    .replace(/(\*\*|__)(.+?)\1/g, '$2') // bold
    .replace(/(^|[^\w*])[*_]([^*_\n]+)[*_](?=[^\w*]|$)/g, '$1$2') // italic
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*([-*_]\s*){3,}$/gm, '') // horizontal rules
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** SRT / WebVTT → text: drops cue numbers, timestamps and tags; one blank line between cues. */
export function subtitlesToText(src: string): string {
  return src
    .replace(/\r/g, '')
    .replace(/^WEBVTT.*\n/, '')
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split('\n')
        .filter((l) => !/^\d+$/.test(l.trim()) && !/-->/.test(l) && !/^(NOTE|STYLE|REGION)\b/.test(l))
        .join(' ')
        .replace(/<[^>]+>/g, '')
        .trim(),
    )
    .filter(Boolean)
    .join('\n\n')
}

/** HTML → text (paragraph breaks preserved). */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script,style,noscript').forEach((el) => el.remove())
  doc.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,br,tr').forEach((el) => el.append('\n'))
  return (doc.body.textContent ?? '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

async function docxToText(file: File): Promise<string> {
  // Loaded on demand: mammoth is only needed when someone opens a Word file.
  const mammoth = await import('mammoth')
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return value.replace(/\n{3,}/g, '\n\n').trim()
}

/** Read any supported file as teleprompter text. Throws if the format is not supported. */
export async function readScriptFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.docx')) return docxToText(file)
  if (!isSupportedFile(file)) throw new Error('unsupported')
  const text = await file.text()
  if (/\.(md|markdown)$/.test(name)) return markdownToText(text)
  if (/\.(srt|vtt)$/.test(name)) return subtitlesToText(text)
  if (/\.html?$/.test(name)) return htmlToText(text)
  return text
}
