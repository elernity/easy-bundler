'use strict';

const generate = require('@babel/generator').default;
const AssetUtil = require('../AssetUtil');
const mockFs = require('mock-fs');

describe('Asset辅助工具测试', () => {

    beforeEach(() => {
        mockFs({
            '/tmp/pro/img': {
                'img@2x.android.png': '🤨',
                'img@3x.android.png': '💩',
                'img.png': '🦸',
                'img@2x.png': '🤔',
                'img@3x.jpg': '⛷',
            }
        });
    });

    afterEach(() => {
        mockFs.restore();
    });

    it('应返回Asset模块信息', () => {
        const files = new Map();
        // 解析带平台信息的Asset模块
        files.set(2, '/tmp/pro/img/img@2x.android.png');
        files.set(3, '/tmp/pro/img/img@3x.android.png');
        expect(AssetUtil.getAssetData(
            '/tmp/pro/img/img@2x.android.png',
            'img/img@2x.android.png',
            'android',
            () => true,
        )).toEqual({
            __packager_asset: true,
            httpServerLocation: '/assets/img',
            width: 55 / 2,
            height: 55 / 2,
            scales: [2, 3],
            hash: 'b944c9affae6679fb7ad32f9fb875893',
            name: 'img',
            type: 'png',
            files: files,
        });

        // 解析不带平台信息的Asset模块
        files.clear();
        files.set(1, '/tmp/pro/img/img.png');
        files.set(2, '/tmp/pro/img/img@2x.png');
        expect(AssetUtil.getAssetData(
            '/tmp/pro/img/img.png',
            'img/img.png',
            'android',
            () => true,
        )).toEqual({
            __packager_asset: true,
            httpServerLocation: '/assets/img',
            width: 55,
            height: 55,
            scales: [1, 2],
            hash: 'd0946c97909acf19d698cd6b564c1775',
            name: 'img',
            type: 'png',
            files: files,
        });
    });

    it('应生成正确的Asset模块语法分析树', () => {
        // 屏蔽mock-fs
        mockFs.restore();
        const data = {
            __packager_asset: true,
            httpServerLocation: '/assets/location',
            width: 55,
            height: 55,
            scales: [1],
            hash: 'hash',
            name: 'name',
            type: 'png',
        };
        const ast = AssetUtil.generateAstOfAsset('/path/of/asset/registry', data);
        // 通过转换成代码验证结果
        expect(generate(ast).code).toMatchSnapshot();
    });
});
