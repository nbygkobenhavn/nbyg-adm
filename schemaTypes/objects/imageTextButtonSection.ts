import {defineField, defineType} from 'sanity'

export const imageTextButtonSection = defineType({
  name: 'imageTextButtonSection',
  title: 'Секція картинка/текст/кнопка',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'text',
      title: 'Заголовок (можна додати перенос рядків)',
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
    }),
    defineField({
      name: 'imagePosition',
      type: 'string',
      title: 'Позиція картинки',
      description: 'Оберіть, де розташувати зображення на десктопі',
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
      name: 'description',
      type: 'array',
      title: 'Опис',
      description: 'Текст з переносами рядків та список',
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
      name: 'buttonText',
      type: 'string',
      title: 'Текст кнопки',
    }),
    defineField({
      name: 'buttonStyle',
      type: 'string',
      title: 'Стиль кнопки',
      initialValue: 'transparentBorder',
      options: {
        list: [
          {title: 'Прозорий з бордером', value: 'transparentBorder'},
          {title: 'Білий', value: 'white'},
          {title: 'Коричневий градієнт', value: 'brownGradient'},
        ],
        layout: 'radio',
      },
      validation: (rule) =>
        rule.custom((value, context) => {
          const buttonText = (context.parent as {buttonText?: string})?.buttonText
          if (buttonText && !value) {
            return "Стиль кнопки обов'язковий, якщо вказано текст кнопки"
          }
          return true
        }),
    }),
    defineField({
      name: 'buttonPage',
      type: 'reference',
      title: 'Сторінка для кнопки',
      description:
        'Оберіть сторінку, на яку має вести кнопка. Заповнюйте або це поле, або ручне посилання нижче.',
      to: [{type: 'page'}],
      options: {
        disableNew: true,
      },
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {buttonText?: string; buttonUrl?: string}
          const buttonText = parent?.buttonText
          const buttonUrl = parent?.buttonUrl
          const hasPage = Boolean(value?._ref)
          const hasUrl = Boolean(buttonUrl)

          if (hasPage && hasUrl) {
            return 'Заповніть тільки одне поле: сторінка або ручне посилання'
          }

          if (buttonText && !hasPage && !hasUrl) {
            return "Оберіть сторінку або вкажіть ручне посилання, якщо вказано текст кнопки"
          }
          return true
        }),
    }),
    defineField({
      name: 'buttonUrl',
      type: 'url',
      title: 'Ручне посилання для кнопки',
      description:
        'Вкажіть повний URL (https://...) або відносний шлях (/catalog). Заповнюйте або це поле, або вибір сторінки вище.',
      validation: (rule) =>
        rule
          .uri({
            scheme: ['http', 'https'],
            allowRelative: true,
          })
          .custom((value, context) => {
            const buttonText = (context.parent as {buttonText?: string})?.buttonText
            const buttonPage = (context.parent as {buttonPage?: {_ref?: string}})?.buttonPage
            const hasUrl = Boolean(value)
            const hasPage = Boolean(buttonPage?._ref)

            if (hasUrl && hasPage) {
              return 'Заповніть тільки одне поле: сторінка або ручне посилання'
            }

            if (buttonText && !hasUrl && !hasPage) {
              return "Оберіть сторінку або вкажіть ручне посилання, якщо вказано текст кнопки"
            }
            return true
          }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      image: 'image',
    },
    prepare({title, image}) {
      return {
        title: title || 'Секція картинка/текст/кнопка',
        subtitle: 'Секція картинка/текст/кнопка',
        media: image,
      }
    },
  },
})
