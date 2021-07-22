'use strict';

async function version({req, res}) {
  return res.json({version: '0.1.0'});
}

module.exports = {
  version,
};
