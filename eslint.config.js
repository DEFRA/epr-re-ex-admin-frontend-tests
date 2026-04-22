import neostandard from 'neostandard'
import wdio from 'eslint-plugin-wdio'

const ns = neostandard({
  env: ['node', 'es2022', 'jest'],
  files: ['test/**/*.js'],
  ignores: [
    ...neostandard.resolveIgnoresFromGitignore(),
    'allure-results/',
    'allure-report/',
    'docker/',
    'wdio*.conf.js'
  ],
  noJsx: true,
  noStyle: true
})

// Fix to override ecmaVersion for import attributes support, see related issue:
// https://github.com/neostandard/neostandard/issues/307
for (const item of ns) {
  if (item?.languageOptions?.ecmaVersion < 2025) {
    item.languageOptions.ecmaVersion = 2025
  }
}

export default [
  ...ns,
  {
    files: ['test/**/*.js'],
    languageOptions: { globals: wdio.configs['flat/recommended'].languageOptions.globals }
  },
  {
    rules: {
      camelcase: [
        'error',
        {
          allow: ['^faker[A-Z]{2}_[A-Z]{2}$']
        }
      ]
    }
  }
]
