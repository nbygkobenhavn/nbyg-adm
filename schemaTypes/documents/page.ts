import {defineArrayMember, defineField, defineType} from 'sanity'

export const page = defineType({
  name: 'page',
  title: 'Сторінка',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Назва сторінки',
      validation: (rule) => rule.required().min(3),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Адреса (slug)',
      description: 'Автоматично генерується з назви, але можна змінити вручну',
      validation: (rule) => rule.required(),
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9а-яіїєґ/\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-'),
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
    }),
    defineField({
      name: 'parent',
      type: 'reference',
      title: 'Батьківська сторінка',
      description: 'Оберіть батьківську сторінку, щоб створити один рівень вкладеності',
      to: [{type: 'page'}],
      validation: (rule) =>
        rule.custom(async (parentRef, context) => {
          if (!parentRef?._ref) {
            return true
          }

          const normalizeId = (id: string) => id.replace(/^drafts\./, '')
          const currentId = context.document?._id ? normalizeId(context.document._id) : null
          const parentId = normalizeId(parentRef._ref)

          if (currentId && parentId === currentId) {
            return 'Сторінка не може бути власним батьком'
          }

          const client = context.getClient({apiVersion: '2023-05-31'})
          const parentDocument = await client.fetch(
            `*[_type == "page" && _id in [$parentId, "drafts." + $parentId]][0]{parent}`,
            {parentId},
          )

          if (parentDocument?.parent?._ref) {
            return 'Обрана сторінка вже має батьківську сторінку. Дозволено лише один рівень вкладеності.'
          }

          return true
        }),
    }),
    defineField({
      name: 'menuOrder',
      type: 'number',
      title: 'Порядок у меню',
      description:
        'Використовується для сортування сторінок у меню. Менше значення = вище у списку.',
      initialValue: 0,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'sections',
      type: 'array',
      title: 'Секції сторінки',
      description: 'Додайте секції та наповніть сторінку контентом',
      of: [
        defineArrayMember({
          type: 'heroSection',
          title: 'Hero секція',
        }),
        defineArrayMember({
          type: 'ctaSection',
          title: 'CTA секція',
        }),
        defineArrayMember({
          type: 'gallerySection',
          title: 'Галерея',
        }),
        defineArrayMember({
          type: 'faqSection',
          title: 'FAQ',
        }),
        defineArrayMember({
          type: 'tableSection',
          title: 'Таблиця',
        }),
        defineArrayMember({
          type: 'beforeAfterSection',
          title: 'До та Після',
        }),
        defineArrayMember({
          type: 'materialSliderSection',
          title: 'Матеріали (слайдер)',
        }),
        defineArrayMember({
          type: 'imageTextButtonSection',
          title: 'Секція картинка/текст/кнопка',
        }),
        defineArrayMember({
          type: 'tableWithImageSection',
          title: 'Секція таблиця з картинкою',
        }),
        defineArrayMember({
          type: 'textReavealCardsSliderSection',
          title: 'Секція слайдер карток з текстом',
        }),
        defineArrayMember({
          type: 'roofTypesSection',
          title: 'Секція види дахів',
        }),
        defineArrayMember({
          type: 'largeTableSection',
          title: 'Секція з великою таблицею',
        }),
      ],
      validation: (rule) =>
        rule
          .min(1)
          .required()
          .custom((sections) => {
            if (!Array.isArray(sections) || sections.length === 0) {
              return 'Додайте принаймні одну секцію'
            }

            const [first] = sections as Array<{_type?: string}>
            if (first?._type !== 'heroSection') {
              return 'Першою секцією має бути Hero блок'
            }

            return true
          }),
    }),
    defineField({
      name: 'seo',
      type: 'seoSettings',
      title: 'SEO блок',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
    },
    prepare(selection) {
      const {title, slug} = selection
      return {
        title: title || 'Без назви',
        subtitle: slug ? `/${slug}` : 'Slug не налаштований',
      }
    },
  },
})
