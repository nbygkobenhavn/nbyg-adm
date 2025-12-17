import {defineArrayMember, defineField, defineType} from 'sanity'

export const beforeAfterSection = defineType({
  name: 'beforeAfterSection',
  title: 'До та Після',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      type: 'array',
      title: 'Приклади',
      description: 'Додайте парні зображення: “до” та “після”',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'beforeAfterItem',
          title: 'Приклад',
          fields: [
            defineField({
              name: 'beforeImage',
              type: 'image',
              title: 'Зображення ДО',
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
              name: 'afterImage',
              type: 'image',
              title: 'Зображення ПІСЛЯ',
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
              beforeImage: 'beforeImage',
              afterImage: 'afterImage',
            },
            prepare({beforeImage, afterImage}) {
              return {
                title: 'До / Після',
                subtitle: `${beforeImage ? '✅' : '❌'} до · ${afterImage ? '✅' : '❌'} після`,
                media: afterImage || beforeImage,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      items: 'items',
    },
    prepare({items}) {
      const count = Array.isArray(items) ? items.length : 0
      return {
        title: 'До та Після',
        subtitle: `Прикладів: ${count}`,
      }
    },
  },
})
