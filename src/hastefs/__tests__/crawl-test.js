'use strict';
require('babel-register')();

const crawl = require('../crawl');
const mockFs = require('mock-fs');

describe('文件系统爬取测试', () => {

    beforeEach(() => {
        mockFs({
            '/root1/demo': {
                'index.js': '',
                'package.json': '',
                'img1.jpg': '',
                'img2.png': '',
                '.babelrc': {},
                'src': {
                    'bundle.js': '',
                    'cache.js': '',
                    'index.bundle': ''
                }
            },
            '/root2/demo': {
                'index.js': '',
                'lindex.js': mockFs.symlink({
                    path: 'index.js'
                }),
                'package.json': '',
                'src': '',
                'src': {
                    'bundle.js': '',
                    'cache': {
                        'cache1': '',
                        'cacheDir': {
                            'bundle.meta': '',
                            'genCache.js': ''
                        }
                    },
                    'config': {
                        'default.js': '',
                        'default.json': {},
                        'config.js': ''
                    }
                }
            },
        });
    });

    afterEach(() => {
        mockFs.restore();
    });

    it('应当返回符合条件的文件信息', () => {
        const data = crawl(
            ['/root1', '/root2'],
            ['js', 'json', 'jpg', 'png'],
            (filePath) => new RegExp(/src\/config\/.*/).test(filePath)
        );
        // 符合条件的文件
        expect(data.has('/root1/demo/index.js')).toBeTruthy();
        expect(data.has('/root1/demo/package.json')).toBeTruthy();
        expect(data.has('/root1/demo/img1.jpg')).toBeTruthy();
        expect(data.has('/root1/demo/img2.png')).toBeTruthy();
        expect(data.has('/root1/demo/src/bundle.js')).toBeTruthy();
        expect(data.has('/root1/demo/src/cache.js')).toBeTruthy();
        expect(data.has('/root2/demo/index.js')).toBeTruthy();
        expect(data.has('/root2/demo/package.json')).toBeTruthy();
        expect(data.has('/root2/demo/src/bundle.js')).toBeTruthy();
        expect(data.has('/root2/demo/src/cache/cacheDir/genCache.js')).toBeTruthy();
        // 后缀名不符合的文件
        expect(data.has('/root1/demo/.babelrc')).toBeFalsy();
        expect(data.has('/root1/demo/src/index.bundle')).toBeFalsy();
        expect(data.has('/root2/demo/src')).toBeFalsy();
        expect(data.has('/root2/demo/src/cache/cache1')).toBeFalsy();
        expect(data.has('/root2/demo/src/cache/cacheDir/bundle.meta')).toBeFalsy();
        // 被过滤掉的文件
        expect(data.has('/root2/demo/src/config/default.js')).toBeFalsy();
        expect(data.has('/root2/demo/src/config/default.json')).toBeFalsy();
        expect(data.has('/root2/demo/src/config/config.js')).toBeFalsy();
        // 不处理链接文件
        expect(data.has('/root2/demo/lindex.js')).toBeFalsy();
        // 核对数据总数
        expect(data.size).toEqual(10);
    });
});
