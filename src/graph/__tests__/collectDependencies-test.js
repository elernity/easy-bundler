'use strict';

require('babel-register')();
const babel = require('@babel/core');
const collectDependencies = require('../collectDependencies');

describe('依赖统计测试', () => {
    // TODO: transformSync的options需要补充filename 暂时跳过这个测试
    it.skip('应返回所有依赖项', () => {
        const code = `require('a');import('b');import 'c';import funcA from 'd';import {funcB} from 'e'`;
        const ast = babel.transformSync(code, {
            sourceType: 'unambiguous',
            presets: [require('../../transform/extraPresets/preset.js')],
            compact: false,
            comments: false,
            configFile: false,
            code: false,
            babelrc: false,
            ast: true,
        }).ast;
        const dependencies = collectDependencies(ast);
        // 还有asyncRequire.js和@babel/runtime/helpers/interopRequireDefault
        expect(dependencies.size).toEqual(5 + 2);
        expect(dependencies.has('a')).toBeTruthy();
        expect(dependencies.has('b')).toBeTruthy();
        expect(dependencies.has('c')).toBeTruthy();
        expect(dependencies.has('d')).toBeTruthy();
        expect(dependencies.has('e')).toBeTruthy();
    });
});
