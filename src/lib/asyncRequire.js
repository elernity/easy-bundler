'use strict';

const dynamicRequire = (require);
module.exports = function(moduleID) {
  return Promise.resolve().then(() => dynamicRequire.importAll(moduleID));
};
