import {defineField, defineType} from 'sanity'

export const contactsPage = defineType({
  name: 'contactsPage',
  title: 'Контакти',
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
        title: 'Контакти',
        subtitle: 'Сторінка контактів',
      }
    },
  },
})

