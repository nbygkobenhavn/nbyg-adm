/**
 * Створює тестовий проєкт (projectPage) з усіма блоками конструктора по черзі.
 * У тексти вставлено нумерацію та опис кожного блоку.
 *
 * Запуск:
 *   npx tsx createTestProject.ts          # створити / оновити
 *   npx tsx createTestProject.ts --delete # видалити
 *
 * Документ має фіксований _id, тож повторний запуск оновлює той самий проєкт.
 */

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({path: path.join(__dirname, '..', '.env')})

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.PROJECT_ID ?? 'fz2ftte6'
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN

if (!token) {
  throw new Error('Потрібен SANITY_API_TOKEN (або SANITY_API_WRITE_TOKEN) у .env')
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false})

// ВАЖЛИВО: _id без крапки. Публічний read-грант датасету — `_id in path("*")`,
// тобто анонімно (як читає фронт) видно лише документи з односегментним _id (без крапки).
// Крапка в _id (напр. "projectPage.test-delete") робить документ невидимим для сайту.
const DOC_ID = 'projectPageTestDelete'

// --- Генератор унікальних _key ---
let keyCounter = 0
const k = () => `k${(keyCounter++).toString(36)}${Date.now().toString(36).slice(-3)}`

// --- Хелпери ---
type ImgField = {_type: 'image'; asset: {_type: 'reference'; _ref: string}; alt?: string}
const img = (ref: string, alt: string): ImgField => ({
  _type: 'image',
  asset: {_type: 'reference', _ref: ref},
  alt,
})

type Span = {_type: 'span'; _key: string; text: string; marks: string[]}
type Block = {
  _type: 'block'
  _key: string
  style: string
  markDefs: never[]
  children: Span[]
  listItem?: 'bullet' | 'number'
  level?: number
}
const block = (text: string, opts: {listItem?: 'bullet' | 'number'} = {}): Block => ({
  _type: 'block',
  _key: k(),
  style: 'normal',
  markDefs: [],
  children: [{_type: 'span', _key: k(), text, marks: []}],
  ...(opts.listItem ? {listItem: opts.listItem, level: 1} : {}),
})

async function main() {
  if (process.argv.includes('--delete')) {
    await client.delete(DOC_ID)
    console.log(`🗑  Видалено ${DOC_ID}`)
    return
  }

  // Беремо кілька існуючих зображень з датасету, щоб усі блоки рендерились коректно
  const ids: string[] = await client.fetch(`*[_type == "sanity.imageAsset"]._id | order(_id)[0...8]`)
  if (!ids.length) {
    throw new Error('У датасеті немає зображень (sanity.imageAsset). Спершу завантажте хоч одне зображення.')
  }
  const pick = (i: number) => ids[i % ids.length]

  const sections: Record<string, unknown>[] = [
    // 1 — Hero (обов'язково перший)
    {
      _type: 'heroSection',
      _key: k(),
      title: 'Блок 1 — Hero',
      description:
        'heroSection: велика шапка сторінки із заголовком, описом і фоновим зображенням. Перший (обов’язковий) блок конструктора.',
      desktopImage: img(pick(0), 'Блок 1 — Hero (desktop)'),
      mobileImage: img(pick(1), 'Блок 1 — Hero (mobile)'),
      showDiscussButton: true,
      showCalculatorTerraceButton: true,
      showCalculatorRoofButton: true,
    },
    // 2 — CTA
    {
      _type: 'ctaSection',
      _key: k(),
      title: 'Блок 2 — CTA',
      description: 'ctaSection: блок заклику до дії з картинкою та кнопкою.',
      showMoreOnMobile: false,
      image: img(pick(2), 'Блок 2 — CTA'),
      buttonType: 'contact',
    },
    // 3 — Картинка/текст/кнопка (PortableText + список)
    {
      _type: 'imageTextButtonSection',
      _key: k(),
      title: 'Блок 3 — Картинка / текст / кнопка',
      titlePosition: 'left',
      image: img(pick(3), 'Блок 3 — зображення'),
      imagePosition: 'right',
      description: [
        block(
          'imageTextButtonSection: блок із зображенням, текстом і кнопкою. Нижче — нумерований список для перевірки.',
        ),
        block('Перший пункт списку', {listItem: 'number'}),
        block('Другий пункт списку', {listItem: 'number'}),
      ],
      buttonText: 'Кнопка блоку 3',
      buttonStyle: 'white',
      buttonUrl: '/projects',
    },
    // 4 — Таблиця (2-3 колонки)
    {
      _type: 'tableSection',
      _key: k(),
      title: 'Блок 4 — Таблиця',
      description: 'tableSection: проста таблиця з 2–3 колонок.',
      columns: [
        {_type: 'tableColumn', _key: k(), title: 'Колонка A', values: ['A — рядок 1', 'A — рядок 2', 'A — рядок 3']},
        {_type: 'tableColumn', _key: k(), title: 'Колонка B', values: ['B — рядок 1', 'B — рядок 2', 'B — рядок 3']},
      ],
      desktopAlignment: 'right',
      showDecorativeCircles: true,
    },
    // 5 — Таблиця з картинкою (рівно 2 колонки, однакова к-ть значень)
    {
      _type: 'tableWithImageSection',
      _key: k(),
      title: 'Блок 5 — Таблиця з картинкою',
      tablePosition: 'right',
      image: img(pick(4), 'Блок 5 — зображення'),
      columns: [
        {_type: 'tableColumn', _key: k(), title: 'Параметр', values: ['Рядок 1', 'Рядок 2', 'Рядок 3']},
        {_type: 'tableColumn', _key: k(), title: 'Значення', values: ['Значення 1', 'Значення 2', 'Значення 3']},
      ],
    },
    // 6 — Слайдер матеріалів (2 описи-PortableText + слайди)
    {
      _type: 'materialSliderSection',
      _key: k(),
      title: 'Блок 6 — Слайдер матеріалів',
      titlePosition: 'left',
      subtitle: 'Підзаголовок блоку 6',
      description1: [
        block('materialSliderSection: слайдер карток матеріалів із двома описами.'),
        block('Пункт списку 1', {listItem: 'bullet'}),
        block('Пункт списку 2', {listItem: 'bullet'}),
      ],
      description2: [block('Другий опис блоку 6.')],
      slides: [
        {_type: 'materialSlide', _key: k(), image: img(pick(5), 'Матеріал 1'), title: 'Матеріал 1', description: 'Опис матеріалу 1.'},
        {_type: 'materialSlide', _key: k(), image: img(pick(0), 'Матеріал 2'), title: 'Матеріал 2', description: 'Опис матеріалу 2.'},
        {_type: 'materialSlide', _key: k(), image: img(pick(1), 'Матеріал 3'), title: 'Матеріал 3', description: 'Опис матеріалу 3.'},
      ],
    },
    // 7 — До/Після (без текстових полів — нумерація в alt зображень)
    {
      _type: 'beforeAfterSection',
      _key: k(),
      items: [
        {
          _type: 'beforeAfterItem',
          _key: k(),
          beforeImage: img(pick(2), 'Блок 7 — До (приклад 1)'),
          afterImage: img(pick(3), 'Блок 7 — Після (приклад 1)'),
        },
        {
          _type: 'beforeAfterItem',
          _key: k(),
          beforeImage: img(pick(4), 'Блок 7 — До (приклад 2)'),
          afterImage: img(pick(5), 'Блок 7 — Після (приклад 2)'),
        },
      ],
    },
    // 8 — Галерея (без текстових полів — нумерація в alt зображень)
    {
      _type: 'gallerySection',
      _key: k(),
      items: [
        {_type: 'galleryItem', _key: k(), image: img(pick(0), 'Блок 8 — Галерея 1')},
        {_type: 'galleryItem', _key: k(), image: img(pick(1), 'Блок 8 — Галерея 2')},
        {_type: 'galleryItem', _key: k(), image: img(pick(2), 'Блок 8 — Галерея 3')},
        {_type: 'galleryItem', _key: k(), image: img(pick(3), 'Блок 8 — Галерея 4')},
      ],
    },
    // 9 — Слайдер карток з текстом
    {
      _type: 'textReavealCardsSliderSection',
      _key: k(),
      title: 'Блок 9 — Слайдер карток з текстом',
      description: 'textReavealCardsSliderSection: слайдер карток із текстом, що розкривається.',
      description2: 'Додатковий опис блоку 9 (на рівні кнопок слайдера).',
      cards: [
        {_type: 'card', _key: k(), title: 'Картка 1', description: 'Опис картки 1.', image: img(pick(4), 'Картка 1')},
        {_type: 'card', _key: k(), title: 'Картка 2', description: 'Опис картки 2.', image: img(pick(5), 'Картка 2')},
        {_type: 'card', _key: k(), title: 'Картка 3', description: 'Опис картки 3.', image: img(pick(0), 'Картка 3')},
      ],
    },
    // 10 — Види дахів (3 описи-PortableText + список)
    {
      _type: 'roofTypesSection',
      _key: k(),
      title: 'Блок 10 — Види дахів',
      description: [
        block('roofTypesSection: блок із типами дахів, трьома описами та списком.'),
        block('Пункт 1', {listItem: 'number'}),
        block('Пункт 2', {listItem: 'number'}),
      ],
      description2: [block('Другий опис блоку 10.')],
      description3: [block('Третій опис блоку 10.')],
      subtitle: 'Підзаголовок блоку 10',
      image: img(pick(1), 'Блок 10 — зображення'),
      roofTypes: [
        {_type: 'roofType', _key: k(), title: 'Тип 1', description: 'Опис типу 1.'},
        {_type: 'roofType', _key: k(), title: 'Тип 2', description: 'Опис типу 2.'},
        {_type: 'roofType', _key: k(), title: 'Тип 3', description: 'Опис типу 3.'},
      ],
    },
    // 11 — Велика таблиця (рівно 4 колонки)
    {
      _type: 'largeTableSection',
      _key: k(),
      title: 'Блок 11 — Велика таблиця',
      description: 'largeTableSection: велика таблиця на 4 колонки з кнопкою.',
      description2: 'Другий опис блоку 11.',
      image: img(pick(2), 'Блок 11 — зображення'),
      buttonText: 'Кнопка блоку 11',
      buttonLink: '/projects',
      columns: [
        {_type: 'tableColumn', _key: k(), title: 'Колонка 1', values: ['1-1', '1-2', '1-3']},
        {_type: 'tableColumn', _key: k(), title: 'Колонка 2', values: ['2-1', '2-2', '2-3']},
        {_type: 'tableColumn', _key: k(), title: 'Колонка 3', values: ['3-1', '3-2', '3-3']},
        {_type: 'tableColumn', _key: k(), title: 'Колонка 4', values: ['4-1', '4-2', '4-3']},
      ],
    },
    // 12 — FAQ
    {
      _type: 'faqSection',
      _key: k(),
      description: 'Блок 12 — FAQ: акордеон запитань і відповідей.',
      items: [
        {_type: 'faqItem', _key: k(), question: 'Блок 12 — Питання 1?', answer: 'Відповідь на питання 1.', buttons: ['contact']},
        {_type: 'faqItem', _key: k(), question: 'Блок 12 — Питання 2?', answer: 'Відповідь на питання 2.'},
        {_type: 'faqItem', _key: k(), question: 'Блок 12 — Питання 3?', answer: 'Відповідь на питання 3.', buttons: ['services', 'calculatorRoof']},
      ],
    },
  ]

  const doc = {
    _id: DOC_ID,
    _type: 'projectPage',
    title: 'тестовый проект удалить',
    slug: {_type: 'slug', current: 'test-projekt-slet'},
    menuOrder: 999,
    sections,
  }

  const res = await client.createOrReplace(doc)
  console.log(`✅ Створено/оновлено проєкт: ${res._id}`)
  console.log(`   Блоків у конструкторі: ${sections.length}`)
  console.log(`   Використано зображень із датасету: ${ids.length}`)
  console.log(`   URL: /projects/test-projekt-slet`)
}

main().catch((err) => {
  console.error('❌ Помилка:', err.message)
  process.exit(1)
})
