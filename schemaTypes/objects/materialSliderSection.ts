import {defineArrayMember, defineField, defineType} from 'sanity'

export const materialSliderSection = defineType({
  name: 'materialSliderSection',
  title: 'Матеріали (слайдер)',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Заголовок',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'titlePosition',
      type: 'string',
      title: 'Позиція заголовка',
      description: 'Оберіть, де розташувати заголовок на десктопі',
      initialValue: 'left',
      options: {
        list: [
          {title: 'Зліва', value: 'left'},
          {title: 'Справа', value: 'right'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      type: 'string',
      title: 'Підзаголовок',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description1',
      type: 'array',
      title: 'Опис 1',
      description: 'Текст з переносами рядків та ненумерований список',
      of: [
        {
          type: 'block',
          styles: [],
          lists: [{title: 'Ненумерований список', value: 'bullet'}],
          marks: {
            decorators: [],
            annotations: [],
          },
        },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description2',
      type: 'array',
      title: 'Опис 2',
      description: 'Текст з переносами рядків та ненумерований список',
      of: [
        {
          type: 'block',
          styles: [],
          lists: [{title: 'Ненумерований список', value: 'bullet'}],
          marks: {
            decorators: [],
            annotations: [],
          },
        },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slides',
      type: 'array',
      title: 'Слайди',
      description: 'Додайте картки матеріалів для слайдера',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'materialSlide',
          title: 'Слайд',
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
              description: 'Короткий опис (можна додати перенос рядків)',
              validation: (rule) => rule.required().min(1),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              image: 'image',
            },
            prepare({title, image}) {
              return {
                title: title || 'Слайд без назви',
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
      slideCount: 'slides',
    },
    prepare({title, slideCount}) {
      const count = Array.isArray(slideCount) ? slideCount.length : 0
      return {
        title: title || 'Матеріали (слайдер)',
        subtitle: `Секція з матеріалами. Слайдів: ${count}`,
      }
    },
  },
})
