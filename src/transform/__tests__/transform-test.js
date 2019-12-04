'use strict';
require('babel-register')();

jest.mock('../../utils/AssetUtil');

const path = require('path');
const generate = require('@babel/generator').default;
const transform = require('../transform');

const projectRoot = path.join(__dirname, '..');
const context = {
    isImageFile: (filePath) => true,
    addAssetInfo: () => {},
};
const userConfig = {
    projectRoot: projectRoot,
    dev: true,
    platform: 'android',
};

const generateCode = (ast) => {
    return generate(
        ast,
        {
          comments: false,
          compact: false,
          retainLines: false,
        }
    ).code;
}

describe('语法转换测试', () => {

    it('应转换script代码', () => {
        const transformedAst = transform(context, userConfig, path.join(projectRoot, '__files__', 'script.js'), 'script');
        const transformedCode = generateCode(transformedAst);
        expect(transformedCode).toMatchSnapshot();
    });

    it('应转换module代码', () => {
        const transformedAst = transform(context, userConfig, path.join(projectRoot, '__files__', 'module.js'), 'module');
        const transformedCode = generateCode(transformedAst);
        expect(transformedCode).toMatchSnapshot();
    });

    it('应转换asset代码', () => {
        const transformedAst = transform(context, userConfig, path.join(projectRoot, '__files__', 'asset.png'), 'asset');
        const transformedCode = generateCode(transformedAst);
        expect(transformedCode).toMatchSnapshot();
    });

    it('应转换json代码', () => {
        const transformedAst = transform(context, userConfig, path.join(projectRoot, '__files__', 'info.json'), 'json');
        expect(transformedAst).toBeNull();
    });
});
