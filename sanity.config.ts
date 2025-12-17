import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {table} from '@sanity/table'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'nbyg-admin',

  projectId: 'fz2ftte6',
  dataset: 'production',

  plugins: [
    table(),
    structureTool({
      structure: (S) =>
        S.list()
          .title('Контент')
          .items([
            S.listItem()
              .title('Сторінки послуг')
              .schemaType('page')
              .child(
                S.documentList()
                  .title('Сторінки послуг')
                  .filter('_type == "page"')
                  .defaultOrdering([
                    {field: 'menuOrder', direction: 'asc'},
                    {field: 'title', direction: 'asc'},
                  ]),
              ),
            S.listItem()
              .title('Статті блогу')
              .schemaType('blogPost')
              .child(
                S.documentList()
                  .title('Статті блогу')
                  .filter('_type == "blogPost"')
                  .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
              ),
            S.listItem()
              .title('Галерея')
              .schemaType('galleryPage')
              .child(S.document().schemaType('galleryPage').documentId('galleryPage')),
            S.listItem()
              .title('Головна')
              .schemaType('homePage')
              .child(S.document().schemaType('homePage').documentId('homePage')),
            S.listItem()
              .title('Послуги')
              .schemaType('servicesPage')
              .child(S.document().schemaType('servicesPage').documentId('servicesPage')),
            S.listItem()
              .title('Про нас')
              .schemaType('aboutPage')
              .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
            S.listItem()
              .title('Контакти')
              .schemaType('contactsPage')
              .child(S.document().schemaType('contactsPage').documentId('contactsPage')),
            S.listItem()
              .title('Політика кукі')
              .schemaType('cookiePolicyPage')
              .child(S.document().schemaType('cookiePolicyPage').documentId('cookiePolicyPage')),
            S.listItem()
              .title('Блог')
              .schemaType('blogPage')
              .child(S.document().schemaType('blogPage').documentId('blogPage')),
            S.listItem()
              .title('Калькулятор терас')
              .schemaType('terraceCalculatorPage')
              .child(
                S.document()
                  .schemaType('terraceCalculatorPage')
                  .documentId('terraceCalculatorPage'),
              ),
            S.listItem()
              .title('Калькулятор дахів')
              .schemaType('roofCalculatorPage')
              .child(
                S.document().schemaType('roofCalculatorPage').documentId('roofCalculatorPage'),
              ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
