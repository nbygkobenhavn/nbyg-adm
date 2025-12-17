import {defineField, defineType} from 'sanity'

export const terraceCalculatorPage = defineType({
  name: 'terraceCalculatorPage',
  title: 'Калькулятор терас',
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
        title: 'Калькулятор терас',
        subtitle: 'Сторінка калькулятора терас',
      }
    },
  },
})

