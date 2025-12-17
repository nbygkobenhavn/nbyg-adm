import {defineArrayMember, defineField, defineType} from 'sanity'

export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ',
  type: 'object',
  fields: [
    defineField({
      name: 'description',
      type: 'text',
      title: 'Опис',
      rows: 3,
      description: 'Коротке пояснення або вступ до блоку FAQ',
    }),
    defineField({
      name: 'items',
      type: 'array',
      title: 'Питання та відповіді',
      description: 'Додайте одне або кілька питань з відповідями',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'Питання',
          fields: [
            defineField({
              name: 'question',
              type: 'string',
              title: 'Питання',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'answer',
              type: 'text',
              title: 'Відповідь',
              description: 'Текст відповіді (можна додати перенос рядків)',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'buttons',
              type: 'array',
              title: 'Кнопки',
              description: 'Оберіть одну або кілька кнопок, які показати під відповіддю',
              of: [
                defineArrayMember({
                  type: 'string',
                }),
              ],
              options: {
                list: [
                  {title: 'Калькулятор тераси', value: 'calculatorTerrace'},
                  {title: 'Калькулятор даху', value: 'calculatorRoof'},
                  {title: 'Послуги', value: 'services'},
                  {title: 'Напишіть нам', value: 'contact'},
                ],
                layout: 'grid',
              },
            }),
          ],
          preview: {
            select: {
              title: 'question',
              buttons: 'buttons',
            },
            prepare({title, buttons}) {
              const buttonCount = Array.isArray(buttons) ? buttons.length : 0
              return {
                title: title || 'Питання без заголовка',
                subtitle: buttonCount ? `Кнопок: ${buttonCount}` : 'FAQ елемент',
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
        title: 'FAQ',
        subtitle: `Питань: ${count}`,
      }
    },
  },
})
