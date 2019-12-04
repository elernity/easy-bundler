/**
 * @flow
 */
'use strict';

import type {
    ConfigType,
    CreateModuleIdFunctionType,
} from '../types';

const path = require('path');

const config: ConfigType = {
    userConfig: {
        projectRoot: '',
        entryFile: '',
        output: '',
        platform: 'android',
        dev: true,
        assetsOutput: '',
        split: false,
        configFile: '',
    },
    systemConfig: {
        assetExts: [
            'bmp', 'gif', 'jpg', 'jpeg', 'png',
            'psd', 'svg', 'webp', 'm4v', 'mov',
            'mp4', 'mpeg', 'mpg', 'webm', 'aac',
            'aiff', 'caf', 'm4a', 'mp3', 'wav',
            'html', 'pdf', 'otf', 'ttf',
        ],
        imageExts: [
            'png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff',
        ],
        platforms: [
            'ios', 'android', 'windows', 'web', 'native',
        ],
        sourceExts: [ 'js', 'json', 'ts', 'tsx' ],
        mainFields: [ 'react-native', 'browser', 'main' ],
        searchExts: [
            'js', 'json', 'ts', 'tsx', 'bmp',
            'gif', 'jpg', 'jpeg', 'png', 'psd',
            'svg', 'webp', 'm4v', 'mov', 'mp4',
            'mpeg', 'mpg', 'webm', 'aac', 'aiff',
            'caf', 'm4a', 'mp3', 'wav', 'html',
            'pdf', 'otf', 'ttf',
        ],
        searchIgnore: (filePath: string): boolean => {
            return new RegExp(/node_modules\/react\/dist\/.*/).test(filePath)
            ||  new RegExp(/website\/node_modules\/.*/).test(filePath)
            ||  new RegExp(/heapCapture\/bundle\.js/).test(filePath)
            ||  new RegExp(/.*\/__files__\/.*/).test(filePath)
            ||  new RegExp(/.*\/__mocks__\/.*/).test(filePath)
            ||  new RegExp(/.*\/__tests__\/.*/).test(filePath)
            ||  new RegExp(/.*\/__fixtures__\/.*/).test(filePath);
        },
        createModuleIdFactory: (projectRoot: string): CreateModuleIdFunctionType => {
            const idMap = new Map();
            return (absolutePath: string): string => {
              let id = idMap.get(absolutePath);
              if (!id) {
                id = path.relative(projectRoot, absolutePath);
                idMap.set(absolutePath, id);
              }
              return id;
            };
        },
        runBeforeMainModule: [
            'node_modules/react-native/Libraries/Core/InitializeCore.js',
            'node_modules/@sdp.nd/nd-react-wrapper/bundleUtil.js',
        ],
        minifierConfig: {
            mangle: {
                toplevel: false,
                reserved: [ 'g', 'r', 'i', 'a', 'm', 'e', 'd' ],
              },
              output: {
                ascii_only: true,
                quote_style: 3,
                wrap_iife: true,
                beautify: false,
                bracketize: false,
                comments: false,
                ecma: 5,
                ie8: false,
                indent_level: 4,
                indent_start: 0,
                inline_script: true,
                keep_quoted_props: false,
                max_line_len: false,
                preamble: null,
                preserve_line: false,
                quote_keys: false,
                safari10: false,
                semicolons: true,
                shebang: true,
                shorthand: false,
                webkit: false,
                width: 80,
              },
              sourceMap: false,
              toplevel: false,
              compress: {
                reduce_funcs: false,
                arrows: true,
                booleans: true,
                collapse_vars: true,
                comparisons: true,
                computed_props: true,
                conditionals: true,
                dead_code: true,
                drop_console: false,
                drop_debugger: true,
                ecma: 5,
                evaluate: true,
                expression: false,
                global_defs: {},
                hoist_funs: false,
                hoist_props: true,
                hoist_vars: false,
                ie8: false,
                if_return: true,
                inline: 3,
                join_vars: true,
                keep_classnames: false,
                keep_fargs: true,
                keep_fnames: false,
                keep_infinity: false,
                loops: true,
                negate_iife: true,
                passes: 1,
                properties: true,
                pure_getters: 'strict',
                pure_funcs: null,
                reduce_vars: true,
                sequences: true,
                side_effects: true,
                switches: true,
                top_retain: null,
                toplevel: false,
                typeofs: true,
                unsafe: false,
                unsafe_arrows: false,
                unsafe_comps: false,
                unsafe_Function: false,
                unsafe_math: false,
                unsafe_methods: false,
                unsafe_proto: false,
                unsafe_regexp: false,
                unsafe_undefined: false,
                unused: true,
                warnings: false
            },
        },
    }
};

module.exports = config;
