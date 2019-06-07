'use strict';

let browsers = [
  'last 2 Chrome versions',

];

const isCI = !!process.env.CI;
const isProduction = process.env.EMBER_ENV === 'production';

if (isCI || isProduction) {
  browsers.push('ie 11');
  browsers.push('last 2 Firefox versions');
  browsers.push('last 2 Safari versions');
}

module.exports = {
  browsers
};
