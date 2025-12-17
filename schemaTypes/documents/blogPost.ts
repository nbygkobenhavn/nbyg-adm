import {defineField, defineType} from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Стаття блогу',
  type: 'document',
  fields: [
    // Hero секція
    defineField({
      name: 'heroTitle',
      type: 'string',
      title: 'Заголовок (Hero секція)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroDescription',
      type: 'text',
      title: 'Опис (Hero секція)',
      description: 'Опис для Hero секції (можна додати перенос рядків)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroDesktopImage',
      type: 'image',
      title: 'Зображення для десктопа (Hero секція)',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Альтернативний текст',
          description: 'Важливо для SEO та доступності',
        },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroMobileImage',
      type: 'image',
      title: 'Зображення для мобільних (Hero секція)',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Альтернативний текст',
          description: 'Важливо для SEO та доступності',
        },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Адреса (slug)',
      description: 'Автоматично генерується з заголовка, але можна змінити вручну',
      validation: (rule) => rule.required(),
      options: {
        source: 'heroTitle',
        maxLength: 96,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9а-яіїєґ/\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-'),
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
    }),
    // Основний контент
    defineField({
      name: 'content',
      type: 'array',
      title: 'Основний контент',
      description: 'Додайте контент статті: заголовки, параграфи, списки, зображення, таблиці',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Заголовок H2', value: 'h2'},
            {title: 'Заголовок H3', value: 'h3'},
            {title: 'Заголовок H4', value: 'h4'},
            {title: 'Звичайний текст', value: 'normal'},
          ],
          lists: [
            {title: 'Ненумерований список', value: 'bullet'},
            {title: 'Нумерований список', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Жирний', value: 'strong'},
              {title: 'Курсив', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Посилання',
                fields: [
                  {
                    name: 'href',
                    type: 'string',
                    title: 'URL',
                    validation: (rule) => rule.required(),
                  },
                  {
                    name: 'blank',
                    type: 'boolean',
                    title: 'Відкривати в новій вкладці',
                    initialValue: false,
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          title: 'Зображення',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Альтернативний текст',
              description: 'Важливо для SEO та доступності',
            },
          ],
        },
        {
          type: 'table',
          title: 'Таблиця',
        },
      ],
    }),
    // FAQ секція
    defineField({
      name: 'faq',
      type: 'faqSection',
      title: 'FAQ секція',
    }),
    // SEO блок
    defineField({
      name: 'seo',
      type: 'seoSettings',
      title: 'SEO блок',
    }),
  ],
  preview: {
    select: {
      title: 'heroTitle',
      slug: 'slug.current',
      image: 'heroMobileImage',
    },
    prepare(selection) {
      const {title, slug, image} = selection
      return {
        title: title || 'Без назви',
        subtitle: slug ? `/${slug}` : 'Slug не налаштований',
        media: image,
      }
    },
  },
})
