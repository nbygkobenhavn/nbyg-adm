import {defineArrayMember, defineField, defineType} from 'sanity'

export const roofTypesSection = defineType({
  name: 'roofTypesSection',
  title: 'Секція види дахів',
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
      type: 'array',
      title: 'Опис 1',
      description: 'Перший опис секції з можливістю додати нумерований та ненумерований список',
      validation: (rule) => rule.required(),
      of: [
        {
          type: 'block',
          styles: [],
          lists: [
            {title: 'Ненумерований список', value: 'bullet'},
            {title: 'Нумерований список', value: 'number'},
          ],
          marks: {
            decorators: [],
            annotations: [],
          },
        },
      ],
    }),
    defineField({
      name: 'description2',
      type: 'array',
      title: 'Опис 2',
      description: 'Другий опис секції з можливістю додати нумерований та ненумерований список',
      validation: (rule) => rule.required(),
      of: [
        {
          type: 'block',
          styles: [],
          lists: [
            {title: 'Ненумерований список', value: 'bullet'},
            {title: 'Нумерований список', value: 'number'},
          ],
          marks: {
            decorators: [],
            annotations: [],
          },
        },
      ],
    }),
    defineField({
      name: 'description3',
      type: 'array',
      title: 'Опис 3',
      description: 'Третій опис секції з можливістю додати нумерований та ненумерований список',
      validation: (rule) => rule.required(),
      of: [
        {
          type: 'block',
          styles: [],
          lists: [
            {title: 'Ненумерований список', value: 'bullet'},
            {title: 'Нумерований список', value: 'number'},
          ],
          marks: {
            decorators: [],
            annotations: [],
          },
        },
      ],
    }),
    defineField({
      name: 'subtitle',
      type: 'text',
      title: 'Підзаголовок (можна додати перенос рядків)',
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
    defineField({
      name: 'roofTypes',
      type: 'array',
      title: 'Види дахів',
      description: 'Додайте види дахів (мінімум один)',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'roofType',
          title: 'Вид даху',
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
              description: 'Опис виду даху (можна додати перенос рядків)',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              description: 'description',
            },
            prepare({title, description}) {
              return {
                title: title || 'Вид даху без назви',
                subtitle: description || 'Без опису',
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
      image: 'image',
    },
    prepare({title, image}) {
      return {
        title: title || 'Секція види дахів',
        subtitle: `Секція види дахів.`,
        media: image,
      }
    },
  },
})
