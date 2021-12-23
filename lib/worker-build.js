'use strict';
// inspired from https://github.com/NullVoxPopuli/emberclear/blob/master/client/web/addons/crypto/lib/worker-build.js
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const appFolder = path.join(__dirname, '..');
const workerRoot = path.join(appFolder, 'workers');

function detectWorkers() {
  let workers = {};
  let dir = fs.readdirSync(workerRoot);

  for (let i = 0; i < dir.length; i++) {
    let name = dir[i];
    workers[name.substring(0, name.length - 3)] = path.join(workerRoot, name);
  }

  return workers;
}

function configureWorkerTree({ isProduction, buildDir }) {
  return ([name, entryPath]) => {
    esbuild.buildSync({
      loader: { '.ts': 'ts' },
      entryPoints: [entryPath],
      bundle: true,
      outfile: path.join(buildDir, `${name}.js`),
      format: 'esm',
      minify: isProduction,
      sourcemap: !isProduction,
      // incremental: true,
      tsconfig: path.join(appFolder, 'tsconfig.json'),
    });
  };
}

function buildWorkers(env) {
  let inputs = detectWorkers();
  let workerBuilder = configureWorkerTree(env);

  // separate build from ember, will be detached, won't watch
  Object.entries(inputs).map(workerBuilder);
}

module.exports = { buildWorkers };
