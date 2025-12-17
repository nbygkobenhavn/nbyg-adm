import {defineField, defineType} from 'sanity'

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'CTA блок',
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
      description: 'Короткий опис (можна додати перенос рядків)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'showMoreOnMobile',
      type: 'boolean',
      title: 'Приховати частину опису на мобільних',
      description:
        'Якщо увімкнено, на мобільних пристроях частина опису буде прихована з кнопкою "Показати більше"',
      initialValue: false,
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
      name: 'buttonType',
      type: 'string',
      title: 'Кнопка',
      description: 'Оберіть, яка кнопка має відображатися',
      options: {
        list: [
          {title: 'Калькулятор тераси', value: 'calculatorTerrace'},
          {title: 'Калькулятор даху', value: 'calculatorRoof'},
          {title: 'Напишіть нам', value: 'contact'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      image: 'image',
    },
    prepare(selection) {
      const {title, image} = selection

      return {
        title: title || 'CTA блок без назви',
        subtitle: 'CTA секція',
        media: image,
      }
    },
  },
})
