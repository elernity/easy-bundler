'use strict';

require('babel-register')();
const babel = require('@babel/core');
const generate = require('@babel/generator').default;
const replaceDependencies = require('../replaceDependencies');

describe('依赖替换测试', () => {
    it('应替换所有依赖项', () => {
        const resolveMap = new Map();
        resolveMap.set('a', 'a.js');
        const code = `require('a');`;
        const ast = babel.transformSync(code, {
            sourceType: 'unambiguous',
            filename: 'file.js',
            presets: [require('../../transform/extraPresets/preset.js')],
            compact: false,
            comments: false,
            configFile: false,
            code: false,
            babelrc: false,
            ast: true,
        }).ast;
        const resolvedAst = replaceDependencies(ast, resolveMap);
        const resolvedCode = generate(ast, {
            comments: false,
            compact: false,
            retainLines: false,
        }).code;
        expect(resolvedCode).toEqual(`require("a.js");`);
    });
});
