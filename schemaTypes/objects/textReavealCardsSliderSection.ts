import {defineArrayMember, defineField, defineType} from 'sanity'

export const textReavealCardsSliderSection = defineType({
  name: 'textReavealCardsSliderSection',
  title: 'Секція слайдер карток з текстом',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'text',
      title: 'Заголовок (можна додати перенос рядків)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Опис',
      description: 'Короткий опис секції (можна додати перенос рядків)',
    }),
    defineField({
      name: 'description2',
      type: 'text',
      title: 'Опис 2',
      description:
        'Додатковий опис секції, відображається на рівні кнопок слайдера (можна додати перенос рядків)',
    }),
    defineField({
      name: 'cards',
      type: 'array',
      title: 'Картки',
      description: 'Додайте картки для слайдера (мінімум одна)',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'card',
          title: 'Картка',
          fields: [
            defineField({
              name: 'title',
              type: 'string',
              title: 'Заголовок',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'description',
              type: 'text',
              title: 'Опис',
              description: 'Опис картки (можна додати перенос рядків)',
              validation: (rule) => rule.required(),
            }),
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
              title: 'title',
              image: 'image',
            },
            prepare({title, image}) {
              return {
                title: title || 'Картка без назви',
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
      cards: 'cards',
    },
    prepare({title, cards}) {
      const count = Array.isArray(cards) ? cards.length : 0
      return {
        title: title || 'Секція слайдер карток з текстом',
        subtitle: `Секція слайдер карток з текстом. Карток: ${count}`,
      }
    },
  },
})
