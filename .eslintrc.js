module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    'jest/globals': true,
  },
  extends: ['standard', 'plugin:prettier/recommended'],

  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'prettier/prettier': 'error',
  },
  plugins: ['prettier', 'jest'],
};
