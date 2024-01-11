const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // render.com needs to point to a different dir to install browser
  // https://github.com/puppeteer/puppeteer/issues/9694
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
};