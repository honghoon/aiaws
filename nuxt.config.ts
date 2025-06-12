// https://nuxt.com/docs/api/configuration/nuxt-config

import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['@/assets/css/tailwind.css'],
  ssr: false,
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  vite: {
    plugins: [
      AutoImport({
        imports: [
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar',
              'useForm',
              'useThemeVars'
            ]
          }
        ]
      }),
      Components({
        resolvers: [NaiveUiResolver()]
      })
    ]
  }
})