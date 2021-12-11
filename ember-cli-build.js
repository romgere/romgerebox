'use strict'

const EmberApp = require('ember-cli/lib/broccoli/ember-app')

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    'ember-composable-helpers': {
      only: ['pick']
    }
  })

  return app.toTree()
}
