import {defineField, defineType} from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Головна',
  type: 'document',
  fields: [
    defineField({
      name: 'seo',
      type: 'seoSettings',
      title: 'SEO блок',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Головна',
        subtitle: 'Головна сторінка',
      }
    },
  },
})

