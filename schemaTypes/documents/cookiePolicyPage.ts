import {defineField, defineType} from 'sanity'

export const cookiePolicyPage = defineType({
  name: 'cookiePolicyPage',
  title: 'Політика кукі',
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
        title: 'Політика кукі',
        subtitle: 'Сторінка політики кукі',
      }
    },
  },
})

