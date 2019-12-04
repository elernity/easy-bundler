/**
 * @flow
 */
'use strict';

import type {MinifierConfigType} from '../types';
const uglify = require('uglify-es');

function minifyCode(code: string, minifierConfig: MinifierConfigType): string {
    const result = uglify.minify(code, minifierConfig);
    if (result.error) {
        throw result.error;
    }
    return result.code;
}

module.exports = minifyCode;
