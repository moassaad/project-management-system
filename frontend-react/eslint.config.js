import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Enforce Component rule: no direct fetch/axios in components/app (FE-S003-05)
    // Feature API layers → httpClient is the allowed path (docs/architecture/system-architecture.md:313-449)
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/features/**/components/**/*.{ts,tsx}',
      'src/features/**/pages/**/*.{ts,tsx}',
      'src/app/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message:
                'Do not import axios in components/pages/app. Use feature API (src/features/*/api) → shared httpClient (src/lib/http/client.ts).',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Do not use global fetch in components/pages/app. Use feature API → httpClient.',
        },
      ],
    },
  },
])
