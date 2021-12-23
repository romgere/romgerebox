'use strict'

const EmberApp = require('ember-cli/lib/broccoli/ember-app')
const Funnel = require('broccoli-funnel')
const path = require('path')
const os = require('os')
const fs = require('fs')
const mergeTrees = require('broccoli-merge-trees')
const { buildWorkers } = require('./lib/worker-build')

let environment = process.env.EMBER_ENV || 'development'

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    'ember-composable-helpers': {
      only: ['pick']
    },

    'ember-cli-babel': {
      enableTypeScriptTransform: true
    }
  })

  app.import('node_modules/uikit/dist/js/uikit.min.js')

  let buildDir = fs.mkdtempSync(path.join(os.tmpdir(), '@romgerebox--'))

  let options = {
    isProduction: environment === 'production',
    buildDir
  }

  // Build all .ts files located in app/workers in `buildDir`
  buildWorkers(options)
  // "move" all compiled workers files in 'asset/workers/'
  let workersFunnel = new Funnel(buildDir, {
    destDir: 'assets/workers/'
  })

  // Add "vmsg.wasm" (needed for mp3 recording) to output build
  let vmsgFunnel = new Funnel('node_modules/vmsg/', {
    include: ['vmsg.wasm'],
    destDir: 'assets/workers/'
  })

  return mergeTrees([app.toTree(), workersFunnel, vmsgFunnel])
}
