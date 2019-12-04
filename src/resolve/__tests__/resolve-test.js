'use strict';
require('babel-register')();

const path = require('path');
const resolve = require('../resolve');

const mockFs = require('mock-fs');
const fse = require('fs-extra');

const hasteModuleMap = new Map();
hasteModuleMap.set('Command', '/tmp/pro/node_modules/command/package.json');
hasteModuleMap.set('Image', '/tmp/pro/node_modules/react-native/Image.js');

const mockContext = {
    mainFields: [],
    sourceExts: ['js', 'json'],
    doesFileExist: (filePath) => fse.existsSync(filePath) && fse.statSync(filePath).isFile(),
    getModulePath: (moduleName, platform) => hasteModuleMap.get(moduleName),
    resolveAsset: (dirPath, assetName, platform) => [],
    getModule: (filePath) => filePath,
    getPackageForModule: (modulePath) => {
        return {
            redirectRequire: (to, mainFields) => to,
        }
    },
    getPackageMainPath: (pkgJsonPath) => path.join(path.dirname(pkgJsonPath), 'index.js'),
    isAssetFile: (filePath) => false,
    isImageFile: (filePath) => false,
    addAssetInfo: (absPath, assetInfo) => {},
};

describe('路径解析测试', () => {

    beforeEach(() => {
        // mockfs之前需要调用console.log，以支持懒加载
        // bug issue参见 https://github.com/facebook/jest/issues/5792
        console.log('');
        mockFs({
            '/tmp/pro': {
                'index.js': '',
                'run.js': '',
                'go.js': '',
                'package.json': '',
                'src': {
                    'bobo.js': '',
                },
                'node_modules': {
                    'split': {
                        'index.js': '',
                        'package.json': '',
                    },
                    'react-native': {
                        'Image.js': '',
                    },
                    'command': {
                        'build': {
                            'index.js': '',
                        },
                        'package.json': '',
                    }
                }
            }
        });
    });

    afterEach(() => {
        mockFs.restore();
    });

    it('应正确解析绝对路径', () => {
        const result = resolve(mockContext, '/tmp/pro/index.js', '/tmp/pro/src/bobo.js', 'android');
        expect(result).toEqual('/tmp/pro/src/bobo.js');
    });

    it('应正确解析相对路径（不带拓展名）', () => {
        const result = resolve(mockContext, '/tmp/pro/index.js', './run', 'android');
        expect(result).toEqual('/tmp/pro/run.js');
    });

    it('应正确解析相对路径（带拓展名）', () => {
        const result = resolve(mockContext, '/tmp/pro/index.js', './go.js', 'android');
        expect(result).toEqual('/tmp/pro/go.js');
    });

    it('应正确解析包名', () => {
        const result = resolve(mockContext, '/tmp/pro/index.js', 'split', 'android');
        expect(result).toEqual('/tmp/pro/node_modules/split/index.js');
    });

    it('应正确解析缩略名', () => {
        const result = resolve(mockContext, '/tmp/pro/index.js', 'Image', 'android');
        expect(result).toEqual('/tmp/pro/node_modules/react-native/Image.js');
    });

    it('应正确解析带缩略名路径', () => {
        const result = resolve(mockContext, '/tmp/pro/index.js', 'Command/build', 'android');
        expect(result).toEqual('/tmp/pro/node_modules/command/build/index.js');
    });

});
