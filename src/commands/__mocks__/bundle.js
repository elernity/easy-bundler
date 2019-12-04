'use strict';

const options = require('../options/bundleOptions');

const pathizationArgus = [
    'projectRoot',
    'entryFile',
    'output',
    'assetsOutput',
    'configFile',
];

function bundle(config) {
    console.log(JSON.stringify(config));
}

module.exports = {
    name: 'bundle',
    description: '离线包构建',
    func: bundle,
    options: options,
    pathizationArgus: pathizationArgus,
};
