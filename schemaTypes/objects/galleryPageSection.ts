import {defineArrayMember, defineField, defineType} from 'sanity'

export const galleryPageSection = defineType({
  name: 'galleryPageSection',
  title: 'Секція галереї',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Назва секції',
      description: 'Назва секції галереї',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Опис секції галереї',
      description: 'Опис секції галереї для сторінки Галереї (можна додати перенос рядків)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'items',
      type: 'array',
      title: 'Зображення',
      description: 'Додайте зображення для галереї',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'galleryItem',
          title: 'Елемент галереї',
          fields: [
            defineField({
              name: 'image',
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
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              image: 'image',
            },
            prepare({image}) {
              return {
                title: 'Елемент галереї',
                subtitle: image ? 'Зображення додано' : 'Без зображення',
                media: image,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      items: 'items',
    },
    prepare({title, items}) {
      const count = Array.isArray(items) ? items.length : 0
      return {
        title: title || 'Без назви',
        subtitle: `Елементів: ${count}`,
      }
    },
  },
})
