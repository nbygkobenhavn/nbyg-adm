/**
 * Импорт blogPost из структурированного raw-файла (маркеры SLUG, P, H2, …).
 * Не парсит HTML. Неизвестные маркеры → ошибка (кроме явных editor-заметок в квадратных скобках).
 */

import {createClient, type SanityClient} from '@sanity/client'
import {decode} from 'html-entities'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({path: path.join(__dirname, '..', '.env')})

const DEFAULT_PROJECT_ID = 'fz2ftte6'
const DEFAULT_DATASET = 'production'
const API_VERSION = '2024-01-01'

// --- Маркеры (только явные, без угадывания) ---

const META_MARKERS = new Set([
  'SLUG',
  'OG_IMAGE',
  'ALT_TEXT',
  'TITLE',
  'DESCRIPTION',
  'H1',
  'COVER_IMAGE',
  'BODY_START',
])

const BODY_MARKERS = new Set([
  'BODY_END',
  'P',
  'H2',
  'H3',
  'H4',
  'LIST_BULLET',
  'LIST_NUMBER',
  'TABLE',
  'BUTTON',
  'GALLERY_FOLDER',
  'GALLERY_COUNT',
  'IMAGE',
  'FAQ',
])

const ALL_KNOWN_TOP = new Set([...META_MARKERS, ...BODY_MARKERS])

// --- Portable Text (blogPost.content) ---

type PtLinkDef = {_type: 'link'; _key: string; href: string; blank?: boolean}
type PtSpan = {_type: 'span'; _key: string; text: string; marks: string[]}
type PtBlock = {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2' | 'h3' | 'h4'
  children: PtSpan[]
  markDefs: PtLinkDef[]
  listItem?: 'bullet' | 'number'
  level?: number
}
type PtImage = {
  _type: 'image'
  _key: string
  asset: {_type: 'reference'; _ref: string}
  alt?: string
}
type PtTable = {
  _type: 'table'
  _key: string
  rows: Array<{_type: 'tableRow'; _key: string; cells: string[]}>
}

type GalleryItemBlock = {
  _type: 'galleryItem'
  _key: string
  image: {_type: 'image'; asset: {_type: 'reference'; _ref: string}; alt?: string}
}

/** После импорта — только items; до резолва — _pending и поля для Drive. */
export type GallerySectionBlock =
  | {
      _type: 'gallerySection'
      _key: string
      _pending: true
      _rawFolderUrl: string
      _expectedCount: number
    }
  | {
      _type: 'gallerySection'
      _key: string
      items: GalleryItemBlock[]
    }

export type ContentBlock = PtBlock | PtImage | PtTable | GallerySectionBlock

type BlogMeta = {
  slug: string
  ogImageUrl: string
  altText: string
  title: string
  description: string
  h1: string
  coverImageUrl: string
}

type ParsedStats = {
  paragraphs: number
  h2: number
  h3: number
  h4: number
  listItems: number
  tables: number
  buttons: number
  images: number
  galleryBlocks: number
  galleryExpectedImages: number
  faqPairs: number
}

type FaqItem = {question: string; answer: string}

// --- Текстовый пайплайн ---

function cleanText(raw: string): string {
  let s = decode(raw, {level: 'html5'}).replace(/\u00a0/g, ' ')
  s = s
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}

function cleanLine(raw: string): string {
  return cleanText(raw).replace(/\n/g, ' ').trim()
}

function newKey(): string {
  return Math.random().toString(36).slice(2, 12)
}

function isEditorSkipLine(line: string): boolean {
  const t = line.trim()
  if (!t.startsWith('[')) return false
  if (!t.endsWith(']')) return false
  const inner = t.slice(1, -1).toUpperCase()
  return inner.startsWith('INSERT') || inner.startsWith('SCHEMA MISSING')
}

function unwrapRedirectUrl(href: string): string {
  try {
    const u = new URL(href)
    if ((u.hostname === 'www.google.com' || u.hostname === 'google.com') && u.pathname === '/url') {
      const q = u.searchParams.get('q')
      if (q) return decodeURIComponent(q)
    }
  } catch {
    /* ignore */
  }
  return href
}

const DRIVE_FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: '*/*',
} as const

/** Порядок: прямые download-URL (реже HTML-заглушка), затем страница /view. */
function toDriveFetchUrls(pageUrl: string): string[] {
  const unwrapped = unwrapRedirectUrl(pageUrl)
  const m =
    unwrapped.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ??
    unwrapped.match(/drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]+)/)
  if (!m) return [unwrapped]
  const id = m[1]
  const candidates = [
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://drive.google.com/uc?export=download&id=${id}&confirm=t`,
    `https://drive.usercontent.google.com/download?id=${id}&export=download`,
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
    unwrapped,
  ]
  return [...new Set(candidates)]
}

function imageExtFromContentType(ct: string): string {
  const c = ct.toLowerCase()
  if (c.includes('webp')) return 'webp'
  if (c.includes('png')) return 'png'
  if (c.includes('gif')) return 'gif'
  if (c.includes('jpeg') || c.includes('jpg')) return 'jpg'
  return 'jpg'
}

/** ID папки из ссылки вида /folders/ID или id= для drive.google.com */
function extractDriveFolderId(folderUrl: string): string | null {
  const u = unwrapRedirectUrl(folderUrl.trim())
  const folders = u.match(/drive\.google\.com\/(?:drive\/)?folders\/([a-zA-Z0-9_-]+)/)
  if (folders) return folders[1]
  try {
    const url = new URL(u)
    if (!url.hostname.includes('drive.google.com')) return null
    const id = url.searchParams.get('id')
    if (id && /^[a-zA-Z0-9_-]+$/.test(id)) return id
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Список ID файлов в публичной папке (порядок как в HTML).
 * Использует embeddedfolderview — в обычном HTML список часто не попадает в ответ.
 */
async function listDriveFolderFileIds(folderUrl: string): Promise<string[]> {
  const folderId = extractDriveFolderId(folderUrl)
  if (!folderId) {
    throw new Error(
      `GALLERY: не удалось извлечь ID папки Google Drive из URL. Укажите ссылку вида https://drive.google.com/drive/folders/… Получено: ${folderUrl.slice(0, 120)}`,
    )
  }
  const listUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`
  const res = await fetch(listUrl, {
    redirect: 'follow',
    headers: {
      Accept: 'text/html',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  if (!res.ok) {
    throw new Error(
      `GALLERY: не удалось открыть папку Drive (HTTP ${res.status}). Папка не публична или URL неверный: ${folderUrl.slice(0, 120)}`,
    )
  }
  const html = await res.text()
  const re = /\/file\/d\/([a-zA-Z0-9_-]{10,})\//g
  const seen = new Set<string>()
  const ids: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const id = m[1]
    if (id === folderId || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  if (ids.length === 0) {
    throw new Error(
      `GALLERY: в ответе встроенного просмотра папки нет ни одного /file/d/… Возможно, папка пуста, не публична или требуется вход. URL папки: ${folderUrl}`,
    )
  }
  return ids
}

async function uploadImageFromUrl(
  client: SanityClient,
  pageUrl: string,
  label: string,
): Promise<string> {
  const tryUrls = toDriveFetchUrls(pageUrl)
  let lastErr: unknown
  for (const u of tryUrls) {
    try {
      const res = await fetch(u, {redirect: 'follow', headers: {...DRIVE_FETCH_HEADERS}})
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      const ct = res.headers.get('content-type') ?? ''
      if (ct.includes('text/html')) throw new Error('получен HTML (файл не публичный или нужен другой URL)')
      const ext = imageExtFromContentType(ct)
      const asset = await client.assets.upload('image', buf, {
        filename: `${label}-${newKey()}.${ext}`,
        label,
      })
      return asset._id
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error(
    `Загрузка изображения (${label}): не удалось. URIs: ${tryUrls.join(' | ')}. Причина: ${String(lastErr)}`,
  )
}

function imageField(ref: string, alt?: string): {
  _type: 'image'
  asset: {_type: 'reference'; _ref: string}
  alt?: string
} {
  return {_type: 'image', asset: {_type: 'reference', _ref: ref}, ...(alt ? {alt} : {})}
}

// --- Portable Text builders ---

function ptTextBlock(
  style: PtBlock['style'],
  text: string,
  listItem?: PtBlock['listItem'],
  level = 1,
): PtBlock {
  const t = cleanLine(text)
  if (!t) throw new Error('Внутренняя ошибка: пустой текст для text block')
  return {
    _type: 'block',
    _key: newKey(),
    style,
    children: [{_type: 'span', _key: newKey(), text: t, marks: []}],
    markDefs: [],
    ...(listItem ? {listItem, level} : {}),
  }
}

function ptButtonBlock(label: string, url: string): PtBlock {
  const lab = cleanLine(label)
  const href = unwrapRedirectUrl(url.trim())
  if (!lab || !href) throw new Error('BUTTON: пустые TEXT или URL')
  const lk = newKey()
  return {
    _type: 'block',
    _key: newKey(),
    style: 'normal',
    children: [{_type: 'span', _key: newKey(), text: lab, marks: [lk]}],
    markDefs: [{_type: 'link', _key: lk, href, blank: false}],
  }
}

function pendingGalleryBlock(
  folderUrl: string,
  expectedCount: number,
): Extract<GallerySectionBlock, {_pending: true}> {
  return {
    _type: 'gallerySection',
    _key: newKey(),
    _pending: true,
    _rawFolderUrl: unwrapRedirectUrl(folderUrl.trim()),
    _expectedCount: expectedCount,
  }
}

// --- Парсер ---

function splitTableCells(s: string): string[] {
  return s.split(/\s*\|\s*/).map((c) => cleanLine(c))
}

function parseLines(file: string): string[] {
  return file.replace(/^\uFEFF/, '').split(/\r?\n/)
}

function skipBlanks(lines: string[], i: number): number {
  let j = i
  while (j < lines.length && lines[j].trim() === '') j++
  return j
}

function isTopMarker(line: string): string | null {
  const t = line.trim()
  return ALL_KNOWN_TOP.has(t) ? t : null
}

interface ParseResult {
  meta: BlogMeta
  content: ContentBlock[]
  faq: FaqItem[] | null
  stats: ParsedStats
}

/** Пропуск служебных вставок редактора (не контент статьи). */
function skipOptionalEditorInset(lines: string[], i: number): number {
  let j = i
  const t = lines[j]?.trim() ?? ''
  if (
    t === '[INSERT_NO_BUTTON_HERE]' ||
    t === '[INSERT_IF_SCHEMA_MISSING]' ||
    t === '[CURSOR_TASK]' ||
    t === '[CURSOR_TASK_FINAL]'
  ) {
    j++
    while (j < lines.length) {
      if (isEditorSkipLine(lines[j])) {
        j++
        continue
      }
      if (lines[j].trim() === '') break
      if (isTopMarker(lines[j])) break
      j++
    }
  }
  return j
}

/** Пустые строки и блоки CURSOR/INSERT внутри одного DSL-блока (между HEADERS/ROW, пунктами списка и т.д.). */
function skipEditorInsetsLoop(lines: string[], i: number): number {
  let j = i
  while (j < lines.length) {
    if (lines[j].trim() === '') {
      j++
      continue
    }
    if (isEditorSkipLine(lines[j])) {
      j++
      continue
    }
    const t = lines[j].trim()
    if (
      t === '[CURSOR_TASK]' ||
      t === '[CURSOR_TASK_FINAL]' ||
      t === '[INSERT_NO_BUTTON_HERE]' ||
      t === '[INSERT_IF_SCHEMA_MISSING]'
    ) {
      j = skipOptionalEditorInset(lines, j)
      continue
    }
    break
  }
  return j
}

function parseStructuredRaw(file: string): ParseResult {
  const raw = file.replace(/^\uFEFF/, '')
  if (!raw.trimStart().startsWith('SLUG')) {
    throw new Error(
      'Файл должен начинаться с маркера SLUG в первой строке. Сейчас это не structured raw (часто на диске лежит старый HTML внутри .md) — сохраните файл из редактора или укажите --file= к актуальному источнику.',
    )
  }
  const lines = parseLines(raw)
  let i = 0
  const meta: Partial<BlogMeta> = {}
  const stats: ParsedStats = {
    paragraphs: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    listItems: 0,
    tables: 0,
    buttons: 0,
    images: 0,
    galleryBlocks: 0,
    galleryExpectedImages: 0,
    faqPairs: 0,
  }

  const takeValue = (): string => {
    const buf: string[] = []
    while (i < lines.length) {
      if (isEditorSkipLine(lines[i])) {
        i++
        continue
      }
      const tInset = lines[i].trim()
      if (
        tInset === '[CURSOR_TASK]' ||
        tInset === '[CURSOR_TASK_FINAL]' ||
        tInset === '[INSERT_NO_BUTTON_HERE]' ||
        tInset === '[INSERT_IF_SCHEMA_MISSING]'
      ) {
        i = skipOptionalEditorInset(lines, i)
        continue
      }
      const line = lines[i]
      const m = isTopMarker(line)
      if (line.trim() === '' && buf.length > 0) break
      if (m && buf.length > 0) break
      if (m && buf.length === 0) break
      if (line.trim() === '' && buf.length === 0) {
        i++
        continue
      }
      buf.push(line)
      i++
    }
    return cleanText(buf.join('\n'))
  }

  while (i < lines.length) {
    i = skipBlanks(lines, i)
    if (i >= lines.length) break
    i = skipOptionalEditorInset(lines, i)
    if (i >= lines.length) break
    if (isEditorSkipLine(lines[i])) {
      i++
      continue
    }
    const marker = isTopMarker(lines[i])
    if (!marker) {
      throw new Error(`Строка ${i + 1}: неизвестный маркер: ${JSON.stringify(lines[i].slice(0, 100))}`)
    }
    if (marker === 'BODY_START') {
      i++
      break
    }
    if (!META_MARKERS.has(marker)) {
      throw new Error(`До BODY_START недопустим маркер ${marker}`)
    }
    i++
    const val = takeValue()
    switch (marker) {
      case 'SLUG':
        meta.slug = val
        break
      case 'OG_IMAGE':
        meta.ogImageUrl = val
        break
      case 'ALT_TEXT':
        meta.altText = val
        break
      case 'TITLE':
        meta.title = val
        break
      case 'DESCRIPTION':
        meta.description = val
        break
      case 'H1':
        meta.h1 = val
        break
      case 'COVER_IMAGE':
        meta.coverImageUrl = val
        break
      default:
        break
    }
  }

  const req: (keyof BlogMeta)[] = [
    'slug',
    'ogImageUrl',
    'altText',
    'title',
    'description',
    'h1',
    'coverImageUrl',
  ]
  for (const k of req) {
    if (!meta[k]) throw new Error(`Нет мета-поля ${k}`)
  }
  const m = meta as BlogMeta

  const content: ContentBlock[] = []
  let faqItems: FaqItem[] | null = null

  const pushP = (body: string) => {
    const t = cleanText(body)
    if (!t) return
    content.push(ptTextBlock('normal', t))
    stats.paragraphs++
  }

  while (i < lines.length) {
    i = skipBlanks(lines, i)
    if (i >= lines.length) throw new Error('Нет BODY_END')
    i = skipOptionalEditorInset(lines, i)
    if (i >= lines.length) throw new Error('Нет BODY_END')
    if (isEditorSkipLine(lines[i])) {
      i++
      continue
    }
    const marker = isTopMarker(lines[i])
    if (!marker) {
      throw new Error(`BODY строка ${i + 1}: мусор ${JSON.stringify(lines[i].slice(0, 80))}`)
    }
    if (marker === 'BODY_END') {
      i++
      break
    }

    if (marker === 'FAQ') {
      i++
      faqItems = []
      while (i < lines.length) {
        i = skipEditorInsetsLoop(lines, i)
        if (i >= lines.length) break
        const mEnd = isTopMarker(lines[i])
        if (mEnd === 'BODY_END' || (mEnd && mEnd !== 'FAQ' && BODY_MARKERS.has(mEnd))) {
          break
        }
        const qLine = lines[i].trim()
        const qm = qLine.match(/^Q:\s*(.+)$/)
        if (!qm) throw new Error(`FAQ: ожидался Q:, получено ${qLine.slice(0, 80)}`)
        const question = cleanLine(qm[1])
        i++
        i = skipEditorInsetsLoop(lines, i)
        if (i >= lines.length) throw new Error('FAQ: нет ответа после Q:')
        const aLine = lines[i].trim()
        const am = aLine.match(/^A:\s*(.+)$/)
        if (!am) throw new Error(`FAQ: ожидался A:, получено ${aLine.slice(0, 80)}`)
        let answer = am[1]
        i++
        while (i < lines.length) {
          i = skipEditorInsetsLoop(lines, i)
          if (i >= lines.length) break
          const peek = lines[i].trim()
          if (peek.startsWith('Q:')) break
          const m2 = isTopMarker(lines[i])
          if (m2 && BODY_MARKERS.has(m2)) break
          answer += '\n' + lines[i]
          i++
        }
        const aClean = cleanText(answer)
        if (!question || !aClean) throw new Error('FAQ: пустой вопрос или ответ')
        faqItems.push({question, answer: aClean})
        stats.faqPairs++
      }
      if (faqItems.length === 0) throw new Error('FAQ: ни одной пары Q/A')
      continue
    }

    i++

    switch (marker) {
      case 'P': {
        const buf: string[] = []
        while (i < lines.length) {
          i = skipEditorInsetsLoop(lines, i)
          if (i >= lines.length) break
          const m2 = isTopMarker(lines[i])
          if (m2) break
          buf.push(lines[i])
          i++
        }
        pushP(buf.join('\n'))
        break
      }
      case 'H2':
      case 'H3':
      case 'H4': {
        const buf: string[] = []
        while (i < lines.length) {
          i = skipEditorInsetsLoop(lines, i)
          if (i >= lines.length) break
          const m2 = isTopMarker(lines[i])
          if (m2) break
          buf.push(lines[i])
          i++
        }
        const body = cleanLine(buf.join('\n'))
        if (!body) throw new Error(`${marker}: пустой заголовок`)
        content.push(ptTextBlock(marker.toLowerCase() as 'h2' | 'h3' | 'h4', body))
        if (marker === 'H2') stats.h2++
        if (marker === 'H3') stats.h3++
        if (marker === 'H4') stats.h4++
        break
      }
      case 'LIST_BULLET':
      case 'LIST_NUMBER': {
        const kind = marker === 'LIST_BULLET' ? 'bullet' : 'number'
        const buf: string[] = []
        while (i < lines.length) {
          i = skipEditorInsetsLoop(lines, i)
          if (i >= lines.length) break
          const m2 = isTopMarker(lines[i])
          if (m2) break
          buf.push(lines[i])
          i++
        }
        const items = buf
          .join('\n')
          .split(/\r?\n/)
          .map((x) => cleanLine(x))
          .filter(Boolean)
        if (items.length === 0) throw new Error(`${marker}: нет пунктов`)
        for (const item of items) {
          content.push(ptTextBlock('normal', item, kind, 1))
          stats.listItems++
        }
        break
      }
      case 'TABLE': {
        let hdrs: string[] | null = null
        const rows: string[][] = []
        while (i < lines.length) {
          i = skipEditorInsetsLoop(lines, i)
          if (i >= lines.length) break
          const m2 = isTopMarker(lines[i])
          if (m2) break
          const ln = lines[i].trim()
          if (ln.startsWith('HEADERS:')) {
            hdrs = splitTableCells(ln.slice('HEADERS:'.length))
            if (hdrs.some((c) => !c)) throw new Error('TABLE: пустая ячейка HEADERS')
            i++
            continue
          }
          if (ln.startsWith('ROW:')) {
            const cells = splitTableCells(ln.slice('ROW:'.length))
            if (hdrs && cells.length !== hdrs.length) {
              throw new Error('TABLE: неверное число ячеек в ROW')
            }
            rows.push(cells)
            i++
            continue
          }
          throw new Error(`TABLE: ожидался HEADERS или ROW, получено: ${ln.slice(0, 60)}`)
        }
        if (!hdrs?.length) throw new Error('TABLE: нет HEADERS')
        if (!rows.length) throw new Error('TABLE: нет ROW')
        content.push({
          _type: 'table',
          _key: newKey(),
          rows: [
            {_type: 'tableRow', _key: newKey(), cells: hdrs},
            ...rows.map((cells) => ({_type: 'tableRow' as const, _key: newKey(), cells})),
          ],
        })
        stats.tables++
        break
      }
      case 'BUTTON': {
        let label = ''
        let url = ''
        while (i < lines.length) {
          i = skipEditorInsetsLoop(lines, i)
          if (i >= lines.length) break
          const m2 = isTopMarker(lines[i])
          if (m2) break
          const t = lines[i].trim()
          const tM = t.match(/^TEXT:\s*(.*)$/)
          const uM = t.match(/^URL:\s*(.*)$/)
          if (tM) label = cleanLine(tM[1])
          else if (uM) url = cleanLine(uM[1])
          else throw new Error(`BUTTON: нужны строки TEXT: и URL:, а не ${t}`)
          i++
        }
        if (!label || !url) throw new Error('BUTTON: неполный блок')
        content.push(ptButtonBlock(label, url))
        stats.buttons++
        break
      }
      case 'GALLERY_FOLDER': {
        const buf: string[] = []
        while (i < lines.length) {
          i = skipEditorInsetsLoop(lines, i)
          if (i >= lines.length) break
          const m2 = isTopMarker(lines[i])
          if (m2 === 'GALLERY_COUNT') break
          if (m2) throw new Error(`GALLERY_FOLDER: ожидался URL, затем GALLERY_COUNT, а не ${m2}`)
          buf.push(lines[i])
          i++
        }
        const folderUrl = cleanLine(buf.join('\n'))
        if (!folderUrl) throw new Error('GALLERY_FOLDER: пустой URL')
        if (i >= lines.length || isTopMarker(lines[i]) !== 'GALLERY_COUNT') {
          throw new Error('GALLERY_FOLDER: после URL нужен GALLERY_COUNT')
        }
        i++
        const cntBuf: string[] = []
        while (i < lines.length) {
          i = skipEditorInsetsLoop(lines, i)
          if (i >= lines.length) break
          const m2 = isTopMarker(lines[i])
          if (m2) break
          cntBuf.push(lines[i])
          i++
        }
        const n = parseInt(cleanLine(cntBuf.join('\n')), 10)
        if (Number.isNaN(n) || n < 1) throw new Error('GALLERY_COUNT: нужно положительное число изображений')
        content.push(pendingGalleryBlock(folderUrl, n))
        stats.galleryBlocks++
        stats.galleryExpectedImages += n
        break
      }
      case 'GALLERY_COUNT':
        throw new Error('GALLERY_COUNT без GALLERY_FOLDER')
      case 'IMAGE': {
        const buf: string[] = []
        while (i < lines.length) {
          i = skipEditorInsetsLoop(lines, i)
          if (i >= lines.length) break
          const m2 = isTopMarker(lines[i])
          if (m2) break
          buf.push(lines[i])
          i++
        }
        const url = cleanLine(buf.join('\n'))
        if (!url) throw new Error('IMAGE: пустой URL')
        const img: PtImage & {_rawUrl: string} = {
          _type: 'image',
          _key: newKey(),
          asset: {_type: 'reference', _ref: 'PENDING_UPLOAD'},
          alt: m.altText,
          _rawUrl: url,
        }
        content.push(img)
        stats.images++
        break
      }
      default:
        throw new Error(`Неизвестный маркер в BODY: ${marker}`)
    }
  }

  if (faqItems && faqItems.length === 0) throw new Error('Пустой FAQ')

  return {meta: m, content, faq: faqItems, stats}
}

async function deleteBlogPostsBySlug(client: SanityClient, slug: string): Promise<void> {
  const ids = await client.fetch<string[]>(
    `*[_type == "blogPost" && slug.current == $slug]._id`,
    {slug},
  )
  for (const id of ids) {
    await client.delete(id)
    console.log('[import] Удалён:', id)
  }
  if (ids.length === 0) console.log('[import] Старых постов с этим slug не было')
}

function validateParsed(content: ContentBlock[], stats: ParsedStats): void {
  console.log('[import] --- Разбор (валидация) ---')
  console.log(
    JSON.stringify(
      {
        headings: {h2: stats.h2, h3: stats.h3, h4: stats.h4},
        listItems: stats.listItems,
        tables: stats.tables,
        buttons: stats.buttons,
        paragraphs: stats.paragraphs,
        imagesPending: stats.images,
        galleryBlocks: stats.galleryBlocks,
        galleryExpectedImages: stats.galleryExpectedImages,
        faqPairs: stats.faqPairs,
        contentBlocks: content.length,
      },
      null,
      2,
    ),
  )

  if (content.length === 0) {
    throw new Error('Валидация: нет блоков контента')
  }
  for (const b of content) {
    if (b._type === 'block') {
      const bb = b as PtBlock
      const txt = bb.children.map((c) => c.text).join('')
      if (!txt.trim()) throw new Error('Валидация: пустой block')
    }
    if (b._type === 'image') {
      const ref = (b as PtImage).asset._ref
      if (!ref || ref === 'PENDING_UPLOAD') {
        /* допускается до resolveImageRefs */
      }
    }
    if (b._type === 'gallerySection') {
      if ('_pending' in b && b._pending) continue
      const items = (b as {items?: unknown}).items
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Валидация: gallerySection без элементов')
      }
    }
  }
  const substance =
    stats.paragraphs +
    stats.h2 +
    stats.h3 +
    stats.h4 +
    stats.tables +
    stats.listItems +
    stats.buttons +
    stats.galleryBlocks
  if (substance === 0) {
    throw new Error('Валидация: нет осмысленных блоков (P/H/LIST/TABLE/BUTTON/GALLERY) — остановка')
  }
}

async function resolveImageRefs(
  client: SanityClient,
  blocks: ContentBlock[],
  labelPrefix: string,
): Promise<void> {
  let idx = 0
  for (const b of blocks) {
    if (b._type !== 'image') continue
    const im = b as PtImage & {_rawUrl?: string}
    const url = im._rawUrl
    if (!url) throw new Error('IMAGE без _rawUrl')
    idx++
    const ref = await uploadImageFromUrl(client, url, `${labelPrefix}-${idx}`)
    im.asset = {_type: 'reference', _ref: ref}
    delete im._rawUrl
  }
}

async function resolveGallerySections(
  client: SanityClient | null,
  blocks: ContentBlock[],
  altEach: string,
  opts: {dryRun: boolean; slugLabel: string},
): Promise<void> {
  let gIdx = 0
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (b._type !== 'gallerySection') continue
    if (!('_pending' in b) || !b._pending) continue
    const p = b as Extract<GallerySectionBlock, {_pending: true}>
    gIdx++
    let ids: string[]
    try {
      ids = await listDriveFolderFileIds(p._rawFolderUrl)
    } catch (e) {
      throw new Error(
        `GALLERY: не удалось прочитать папку (импорт остановлен). Блок #${gIdx}. URL: ${p._rawFolderUrl}. Причина: ${String(e)}`,
      )
    }
    if (ids.length !== p._expectedCount) {
      throw new Error(
        `GALLERY: число файлов в папке (${ids.length}) не совпадает с GALLERY_COUNT (${p._expectedCount}). URL: ${p._rawFolderUrl}`,
      )
    }
    console.log(
      `[import] Галерея #${gIdx}: ${ids.length} файлов, порядок как в папке — ${p._rawFolderUrl.slice(0, 88)}`,
    )
    if (opts.dryRun) continue
    if (!client) throw new Error('GALLERY: внутренняя ошибка — нет клиента Sanity')
    const items: GalleryItemBlock[] = []
    for (let j = 0; j < ids.length; j++) {
      const downloadPage = `https://drive.google.com/uc?export=download&id=${ids[j]}`
      try {
        const ref = await uploadImageFromUrl(
          client,
          downloadPage,
          `${opts.slugLabel}-gallery${gIdx}-img${j + 1}`,
        )
        items.push({
          _type: 'galleryItem',
          _key: newKey(),
          image: {_type: 'image', asset: {_type: 'reference', _ref: ref}, alt: altEach},
        })
        console.log(`[import]   └─ галерея #${gIdx}: ${j + 1}/${ids.length} → asset ${ref}`)
      } catch (e) {
        throw new Error(
          `GALLERY: сбой загрузки файла ${j + 1}/${ids.length} (Drive id=${ids[j]}) из ${p._rawFolderUrl}: ${String(e)}`,
        )
      }
    }
    blocks[i] = {_type: 'gallerySection', _key: p._key, items}
  }
}

interface CliOptions {
  dryRun: boolean
  recreate: boolean
  file: string
}

function parseCli(argv: string[]): CliOptions {
  const dryRun = argv.includes('--dry-run')
  const recreate = argv.includes('--recreate')
  const fileArg = argv.find((a) => a.startsWith('--file='))
  const file = fileArg
    ? fileArg.slice('--file='.length)
    : path.join(__dirname, 'blog', 'blogPostsRaw', 'SommerhuspBornholm2026.md')
  return {dryRun, recreate, file: path.resolve(file)}
}

async function main() {
  const opts = parseCli(process.argv.slice(2))
  const rawFile = fs.readFileSync(opts.file, 'utf8')
  const parsed = parseStructuredRaw(rawFile)
  const slugCurrent = parsed.meta.slug
  const galleryAlt = cleanLine(parsed.meta.altText) || '[INSERT ALT TEXT HERE]'

  console.log('[import] Мета:', {
    slug: parsed.meta.slug,
    title: parsed.meta.title.slice(0, 60) + (parsed.meta.title.length > 60 ? '…' : ''),
    h1: parsed.meta.h1.slice(0, 60) + (parsed.meta.h1.length > 60 ? '…' : ''),
  })

  validateParsed(parsed.content, parsed.stats)

  if (opts.dryRun) {
    await resolveGallerySections(null, parsed.content, galleryAlt, {
      dryRun: true,
      slugLabel: slugCurrent,
    })
    console.log('[import] dry-run: без загрузки ассетов и без записи в Sanity')
    console.log('[import] Блоков контента (без cover image):', parsed.content.length)
    return
  }

  const projectId =
    process.env.SANITY_PROJECT_ID ?? process.env.PROJECT_ID ?? DEFAULT_PROJECT_ID
  const dataset = process.env.SANITY_DATASET ?? DEFAULT_DATASET
  const token = process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN

  if (!token) {
    throw new Error('Нужен SANITY_API_TOKEN (или SANITY_API_WRITE_TOKEN) в .env')
  }

  const client = createClient({projectId, dataset, apiVersion: API_VERSION, token, useCdn: false})

  if (opts.recreate) {
    console.log('[import] --recreate: удаление постов с slug', slugCurrent)
    await deleteBlogPostsBySlug(client, slugCurrent)
  }

  console.log('[import] Загрузка OG / hero…')
  const heroRef = await uploadImageFromUrl(client, parsed.meta.ogImageUrl, 'hero')
  const ogRef = heroRef
  console.log('[import] Загрузка COVER (первый блок контента)…')
  const coverRef = await uploadImageFromUrl(client, parsed.meta.coverImageUrl, 'cover')
  const contentForUpload = parsed.content.map((b) =>
    JSON.parse(JSON.stringify(b)),
  ) as ContentBlock[]
  await resolveImageRefs(client, contentForUpload, 'inline')
  await resolveGallerySections(client, contentForUpload, galleryAlt, {
    dryRun: false,
    slugLabel: slugCurrent,
  })
  const coverBlock: PtImage = {
    _type: 'image',
    _key: newKey(),
    asset: {_type: 'reference', _ref: coverRef},
    alt: parsed.meta.altText,
  }
  const finalContent = [coverBlock, ...contentForUpload]
  validateParsed(finalContent, parsed.stats)

  const docId =
    (await client.fetch<string | null>(
      `*[_type == "blogPost" && slug.current == $slug][0]._id`,
      {slug: slugCurrent},
    )) ?? `blog-import-${slugCurrent.replace(/[^a-zA-Z0-9._-]/g, '-')}`

  const doc: Record<string, unknown> = {
    _id: docId,
    _type: 'blogPost',
    heroTitle: parsed.meta.h1,
    heroDescription: parsed.meta.description,
    heroDesktopImage: imageField(heroRef, parsed.meta.altText),
    heroMobileImage: imageField(heroRef, parsed.meta.altText),
    slug: {_type: 'slug', current: slugCurrent},
    content: finalContent,
    seo: {
      metaTitle: parsed.meta.title,
      metaDescription: parsed.meta.description,
      opengraphImage: imageField(ogRef, parsed.meta.altText),
    },
  }

  if (parsed.faq?.length) {
    doc.faq = {
      items: parsed.faq.map((it) => ({
        _type: 'faqItem',
        _key: newKey(),
        question: it.question,
        answer: it.answer,
      })),
    }
  }

  await client.createOrReplace(doc)
  console.log('[import] Сохранено:', docId)
}

main().catch((e) => {
  console.error('[import]', e)
  process.exit(1)
})
