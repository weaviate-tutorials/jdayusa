module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    indent: ['error', 2, { SwitchCase: 1 }],  // SwitchCase is default 0, which confuses IDEs and looks ugly at the default } brace - http://bit.ly/2BtM2k1
    semi: ['error', 'always'],
    quotes: ['warn', 'single', { avoidEscape: true }],
    'no-multi-spaces': ['error', { ignoreEOLComments: true }],
    'no-trailing-spaces': 'warn',
  }
};
