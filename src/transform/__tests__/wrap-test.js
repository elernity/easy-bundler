'use strict';
require('babel-register')();
const babel = require('@babel/core');
const wrap = require('../wrap');
const userConfig = {
    projectRoot: '/tmp/pro',
};

describe('代码封装测试', () => {

    it('应封装script代码', () => {
        const code = `console.log('script')`;
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
        const wrappedCode = wrap(userConfig, ast, '/tmp/pro/script.js', val => 'scriptModuleId', 'script');
        expect(wrappedCode).toMatchSnapshot();
    });

    // TODO: transformSync的options需要补充filename 暂时跳过这个测试
    it.skip('应封装module代码', () => {
        const code = `function output() {console.log('module');}\n module.exports = output;`;
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
        const wrappedCode = wrap(userConfig, ast, '/tmp/pro/module.js', val => 'moduleModuleId', 'module');
        expect(wrappedCode).toMatchSnapshot();
    });

    // TODO: transformSync的options需要补充filename 暂时跳过这个测试
    it.skip('应封装asset代码', () => {
        const code = `module.exports = require('AssetRegistry.js').registerAsset({});`;
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
        const wrappedCode = wrap(userConfig, ast, '/tmp/pro/asset.png', val => 'assetModuleId', 'asset');
        expect(wrappedCode).toMatchSnapshot();
    });

    it('应封装json代码', () => {
        const code = `console.log('json')`;
        const ast = babel.transformSync('').ast;
        const mockFs = require('mock-fs');
        mockFs({
            '/tmp/pro': {
                'info.json': JSON.stringify({
                    name: 'info',
                    type: 'json'
                })
            }
        });
        const wrappedCode = wrap(userConfig, ast, '/tmp/pro/info.json', val => 'jsonModuleId', 'json');
        mockFs.restore();
        expect(wrappedCode).toMatchSnapshot();
    });
});
