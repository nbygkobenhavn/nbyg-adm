import {defineArrayMember, defineField, defineType} from 'sanity'

export const tableBlock = defineType({
  name: 'tableBlock',
  title: 'Таблиця',
  type: 'object',
  fields: [
    defineField({
      name: 'rows',
      type: 'array',
      title: 'Рядки',
      description: 'Додайте рядки таблиці',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tableRow',
          title: 'Рядок',
          fields: [
            defineField({
              name: 'cells',
              type: 'array',
              title: 'Комірки',
              description: 'Додайте комірки в рядок',
              of: [
                defineArrayMember({
                  type: 'string',
                  title: 'Комірка',
                }),
              ],
            }),
          ],
          preview: {
            select: {
              cells: 'cells',
            },
            prepare({cells}) {
              const cellCount = Array.isArray(cells) ? cells.length : 0
              const firstCell = Array.isArray(cells) && cells.length > 0 ? cells[0] : ''
              return {
                title: firstCell || 'Порожній рядок',
                subtitle: `Комірок: ${cellCount}`,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      rows: 'rows',
    },
    prepare({rows}) {
      const rowCount = Array.isArray(rows) ? rows.length : 0
      return {
        title: 'Таблиця',
        subtitle: `Рядків: ${rowCount}`,
      }
    },
  },
})
