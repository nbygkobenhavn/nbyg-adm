import {defineArrayMember, defineField, defineType} from 'sanity'

export const tableSection = defineType({
  name: 'tableSection',
  title: 'Таблиця',
  type: 'object',
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
      description: 'Опис секції (можна додати перенос рядків)',
    }),
    defineField({
      name: 'columns',
      type: 'array',
      title: 'Колонки',
      description: 'Додайте від 2 до 3 колонок таблиці',
      validation: (rule) => rule.required().min(2).max(3),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tableColumn',
          title: 'Колонка',
          fields: [
            defineField({
              name: 'title',
              type: 'string',
              title: 'Назва колонки',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'values',
              type: 'array',
              title: 'Значення',
              description: 'Додайте значення в колонку (кожен рядок окремо)',
              validation: (rule) => rule.required().min(1),
              of: [
                defineArrayMember({
                  type: 'string',
                  title: 'Рядок',
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: 'title',
              values: 'values',
            },
            prepare({title, values}) {
              const count = Array.isArray(values) ? values.length : 0
              return {
                title: title || 'Колонка без назви',
                subtitle: `Рядків: ${count}`,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'desktopAlignment',
      type: 'string',
      title: 'Розташування на десктопі',
      description: 'Оберіть, де показувати таблицю: ліворуч чи праворуч на широких екранах',
      initialValue: 'right',
      options: {
        list: [
          {title: 'Ліворуч', value: 'left'},
          {title: 'Праворуч', value: 'right'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'showDecorativeCircles',
      type: 'boolean',
      title: 'Показувати декоративні три кружечки для десктопа',
      description: 'Якщо увімкнено, на десктопі будуть відображатися декоративні три кружечки',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      image: 'image',
      desktopAlignment: 'desktopAlignment',
    },
    prepare({title, desktopAlignment, image}) {
      return {
        title: title || 'Таблиця',
        subtitle: desktopAlignment
          ? `Таблиця. Розташування: ${desktopAlignment === 'left' ? 'ліворуч' : 'праворуч'}`
          : 'Таблиця',
        media: image,
      }
    },
  },
})
