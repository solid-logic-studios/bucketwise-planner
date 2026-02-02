import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

const isTypeAware = process.env.ESLINT_TYPE_AWARE === '1';

const tsRecommended = isTypeAware
  ? tseslint.configs.recommendedTypeChecked
  : tseslint.configs.recommended;

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    '**/.cache/**',
    '**/.turbo/**',
    'frontend/vite.config.ts.timestamp-*',
    'download.tar',
  ]),

  // Lint repo JS config files with Node globals.
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    extends: [js.configs.recommended, eslintConfigPrettier],
  },

  // TypeScript (fast, IDE-friendly by default).
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ...(isTypeAware
        ? {
            parserOptions: {
              projectService: true,
              tsconfigRootDir: import.meta.dirname,
            },
          }
        : {}),
    },
    extends: [js.configs.recommended, ...tsRecommended, eslintConfigPrettier],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Backend: Node runtime.
  {
    files: ['backend/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Frontend: React + Vite.
  {
    files: ['frontend/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },
]);
