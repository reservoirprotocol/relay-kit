import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['.src/']
  },
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      import: importPlugin
    },
    rules: {
      'no-prototype-builtins': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-const': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
          index: 'never'
        }
      ]
    }
  }
)
