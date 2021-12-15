module.exports = {
  root: true,
  extends: ['peopledoc/ember'],
  rules: {
    'prettier/prettier': 'off' // to remove after update prettier conf to allow empty line
  },

  "overrides": [
    {
      "files": ["config/ember-intl.js"],
      "rules": {
        "ember-suave/require-access-in-comments": "off"
      }
    }
  ],

  

  ignorePatterns: ['public/**/*.js', 'maquette/**/*.js']
}
