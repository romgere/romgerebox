module.exports = {
  root: true,
  extends: ['peopledoc/ember'],
  rules: {
    'prettier/prettier': 'off' // to remove after update prettier conf to allow empty line
  },
  parser: '@typescript-eslint/parser',
  overrides: [
    {
      "files": ["config/ember-intl.js"],
      "rules": {
        "ember-suave/require-access-in-comments": "off"
      }
    },
    {
      files: ['**/*.ts'],
      plugins: [
        '@typescript-eslint'
      ],

      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error'],
        'no-duplicate-imports': 'off'
      }
    },
    {
      files: ['**.d.ts'],
      rules: {
        'ember-suave/no-const-outside-module-scope': 'off'
      }
    }
  ]

  

  ignorePatterns: ['public/**/*.js', 'maquette/**/*.js']
}
