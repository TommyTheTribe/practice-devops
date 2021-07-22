'use strict';

const config = require('../config.js');
const App = require('../lib/app.js');

(async () => {
  const app = new App({
    config,
  });
  await app.load();
})()
  .catch(error => {
    if (error) {
      console.error(error);
    }
  });
