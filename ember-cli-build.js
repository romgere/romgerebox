'use strict'

const EmberApp = require('ember-cli/lib/broccoli/ember-app')

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    'ember-composable-helpers': {
      only: ['pick']
    }
  })

  app.import('node_modules/uikit/dist/js/uikit.min.js')

  return app.toTree()
}
