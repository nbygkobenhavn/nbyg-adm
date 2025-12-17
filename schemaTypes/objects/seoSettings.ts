import {defineField, defineType} from 'sanity'

export const seoSettings = defineType({
  name: 'seoSettings',
  title: 'SEO налаштування',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      type: 'string',
      title: 'SEO title',
      description: 'Заголовок сторінки для пошукових систем (до 60 символів)',
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: 'metaDescription',
      type: 'text',
      rows: 3,
      title: 'SEO description',
      description: 'Короткий опис сторінки (до 160 символів)',
      validation: (rule) => rule.max(260),
    }),
    defineField({
      name: 'keywords',
      type: 'array',
      title: 'Ключові слова',
      description: 'Додайте ключові слова через список тегів',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'opengraphImage',
      type: 'image',
      title: 'Open Graph зображення',
      description: 'Зображення для спільного доступу у соціальних мережах (1200×630 px)',
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
    }),
    defineField({
      name: 'schemaJson',
      type: 'file',
      title: 'schema.org JSON',
      description: 'Завантажте JSON файл зі структурованими даними',
      options: {
        accept: 'application/json',
        storeOriginalFilename: true,
      },
    }),
  ],
})
