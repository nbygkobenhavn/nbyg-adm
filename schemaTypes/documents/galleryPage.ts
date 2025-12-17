import {defineArrayMember, defineField, defineType} from 'sanity'

export const galleryPage = defineType({
  name: 'galleryPage',
  title: 'Сторінка Галереї',
  type: 'document',
  fields: [
    defineField({
      name: 'galleries',
      type: 'array',
      title: 'Секції галерей',
      description: 'Додайте секції галерей. Мінімум 1 секція обов\'язкова.',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'galleryPageSection',
          title: 'Секція галереї',
        }),
      ],
    }),
    defineField({
      name: 'seo',
      type: 'seoSettings',
      title: 'SEO блок',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Сторінка Галереї',
        subtitle: 'Галерея',
      }
    },
  },
})

