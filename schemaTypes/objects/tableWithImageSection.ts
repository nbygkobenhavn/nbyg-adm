import {defineArrayMember, defineField, defineType} from 'sanity'

export const tableWithImageSection = defineType({
  name: 'tableWithImageSection',
  title: 'Секція таблиця з картинкою',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'text',
      title: 'Заголовок (можна додати перенос рядків)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tablePosition',
      type: 'string',
      title: 'Розташування таблиці',
      description: 'Оберіть, де розташувати таблицю: зліва чи справа від картинки',
      initialValue: 'right',
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
      name: 'columns',
      type: 'array',
      title: 'Колонки таблиці',
      description: 'Додайте рівно 2 колонки до таблиці',
      validation: (rule) =>
        rule
          .required()
          .length(2)
          .custom((columns, context) => {
            if (!Array.isArray(columns)) {
              return 'Потрібно додати рівно 2 колонки'
            }

            if (columns.length !== 2) {
              return 'Потрібно додати рівно 2 колонки'
            }

            // Перевірка, що кількість значень однакова в обох колонках
            const valuesCounts = columns.map((col: any) => {
              if (!col || typeof col !== 'object') {
                return 0
              }
              const values = col?.values
              if (!Array.isArray(values)) {
                return 0
              }
              // Фільтруємо пусті значення
              return values.filter((val: any) => val && val.trim && val.trim().length > 0).length
            })

            const firstCount = valuesCounts[0]
            const secondCount = valuesCounts[1]

            // Перевірка, що обидві колонки мають хоча б одне значення
            if (firstCount === 0 || secondCount === 0) {
              return 'Кожна колонка повинна містити принаймні одне значення'
            }

            // Перевірка, що кількість значень однакова
            if (firstCount !== secondCount) {
              return `Кількість значень має бути однакова в обох колонках. Зараз: ${firstCount} та ${secondCount}`
            }

            return true
          }),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tableColumn',
          title: 'Колонка',
          fields: [
            defineField({
              name: 'title',
              type: 'string',
              title: 'Заголовок колонки',
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
  ],
  preview: {
    select: {
      title: 'title',
      image: 'image',
      tablePosition: 'tablePosition',
    },
    prepare({title, image, tablePosition}) {
      return {
        title: title || 'Секція таблиця з картинкою',
        subtitle: `Секція таблиця з картинкою, таблиця розташована ${tablePosition === 'left' ? 'зліва' : 'справа'}`,
        media: image,
      }
    },
  },
})
