const tseslintPlugin = require('@typescript-eslint/eslint-plugin')
const tseslintParser = require('@typescript-eslint/parser')
const globals = require('globals')
const prettierPlugin = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
  {
    ignores: ['dist', 'node_modules', 'eslint.config.js']
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts', '*.ts'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname
      },
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      prettier: prettierPlugin
    },
    rules: {
      ...tseslintPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      // '@typescript-eslint/naming-convention': 'off',
      // '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false
        }
      ]
    }
  }
]
