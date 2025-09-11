module.exports = {
  extends: ['@nuxt/eslint-config', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'vue/require-default-prop': 'warn',
    'vue/require-explicit-emits': 'warn',
    'vue/no-template-shadow': 'warn',
    'prefer-const': 'warn',
    'nuxt/prefer-import-meta': 'warn',
    'import/first': 'warn',
  },
}
