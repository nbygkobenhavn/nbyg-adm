import {defineArrayMember, defineField, defineType} from 'sanity'

export const largeTableSection = defineType({
  name: 'largeTableSection',
  title: 'Секція з великою таблицею',
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
      title: 'Опис 1',
      description: 'Перший опис секції',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description2',
      type: 'text',
      title: 'Опис 2',
      description: 'Другий опис секції з можливістю додати нумерований та ненумерований список',
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
      name: 'buttonText',
      type: 'string',
      title: 'Текст кнопки',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'buttonLink',
      type: 'string',
      title: 'Посилання кнопки',
      description: 'URL адреса, на яку має вести кнопка',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'columns',
      type: 'array',
      title: 'Колонки таблиці',
      description: 'Додайте рівно 4 колонки до таблиці',
      validation: (rule) =>
        rule
          .required()
          .length(4)
          .custom((columns, context) => {
            if (!Array.isArray(columns)) {
              return 'Потрібно додати рівно 4 колонки'
            }

            if (columns.length !== 4) {
              return 'Потрібно додати рівно 4 колонки'
            }

            // Перевірка, що всі колонки мають хоча б одне значення
            const hasEmptyColumn = columns.some((col: any) => {
              if (!col || typeof col !== 'object') {
                return true
              }
              const values = col?.values
              if (!Array.isArray(values) || values.length === 0) {
                return true
              }
              // Перевірка, що є хоча б одне непусте значення
              return !values.some((val: any) => val && val.trim && val.trim().length > 0)
            })

            if (hasEmptyColumn) {
              return 'Кожна колонка повинна містити принаймні одне значення'
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
  ],
  preview: {
    select: {
      title: 'title',
      image: 'image',
    },
    prepare({title, image}) {
      return {
        title: title || 'Секція з великою таблицею',
        subtitle: 'Секція з великою таблицею',
        media: image,
      }
    },
  },
})
