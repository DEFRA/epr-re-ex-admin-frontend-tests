import neostandard from 'neostandard'

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

export default ns
