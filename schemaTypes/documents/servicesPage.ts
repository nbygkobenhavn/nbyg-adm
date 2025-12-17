import {defineField, defineType} from 'sanity'

export const servicesPage = defineType({
  name: 'servicesPage',
  title: 'Послуги',
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
        title: 'Послуги',
        subtitle: 'Сторінка послуг',
      }
    },
  },
})

