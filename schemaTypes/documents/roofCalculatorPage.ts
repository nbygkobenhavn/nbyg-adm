import {defineField, defineType} from 'sanity'

export const roofCalculatorPage = defineType({
  name: 'roofCalculatorPage',
  title: 'Калькулятор дахів',
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
        title: 'Калькулятор дахів',
        subtitle: 'Сторінка калькулятора дахів',
      }
    },
  },
})

