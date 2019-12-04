'use strict';
require('babel-register')();
const minify = require('../minify');
const minifierConfig = require('../../config/default').systemConfig.minifierConfig;

describe('代码混淆测试', () => {
    it('应混淆代码', () => {
        const minifiedCode = minify('for(let index = 0; index < 1000; index++) {console.log(index);}', minifierConfig);
        expect(minifiedCode).toMatchSnapshot();
    });

    it('应抛错，代码无法解析', () => {
        expect(() => minify('do(', minifierConfig)).toThrow();
    });
});
