'use strict';
require('babel-register')();

const utils = require('../utils');
const mockFs = require('mock-fs');

describe('文件系统映射辅助工具测试', () => {

    beforeEach(() => {
        mockFs({
            '/tmp/pro': {
                'node_modules': {
                    'react-native': {
                        'main.json': '',
                        'img.jpg': '',
                        'entry.js': '',
                        '__tests__': {
                            'entry-test.js': ''
                        },
                        '__mocks__': {
                            'entry.js': ''
                        },
                        'Libraries': {
                            'Animated': {
                                'src': {
                                    'polyfills': {
                                        'es6.js': ''
                                    }
                                }
                            },
                            'Renderer': {
                                'fb': {
                                    'fb.js': ''
                                }
                            },
                            'Image': {
                                'Image.android.js': '',
                                'Image.ios.js': ''
                            }
                        },
                        'IntegrationTests': {
                            'int.js': ''
                        },
                        'ReactAndroid': {
                            'local.js': ''
                        },
                        'RNTester': {
                            'rnTester.js': ''
                        }
                    },
                    'react': {
                        'package.json': JSON.stringify({
                            version: '0.0.1'
                        }),
                        'index.js': ''
                    },
                    'split': {
                        'package.json': JSON.stringify({
                            name: 'superSplit',
                            version: '0.0.1'
                        }),
                        'index.js': ''
                    }
                }
            }
        });
    });

    afterEach(() => {
        mockFs.restore();
    });

    it('应当根据绝对路径返回正确的类型', () => {
        expect(utils.getModuleType('/tmp/package.json')).toEqual('type-package');
        expect(utils.getModuleType('/package.json')).toEqual('type-package');
        expect(utils.getModuleType('/tmp/index.js')).toEqual('type-module');
        expect(utils.getModuleType('/tmp/Package.json')).toEqual('type-module');
        expect(utils.getModuleType('/tmp/package.js')).toEqual('type-module');
    });

    it('应当根据绝对路径返回正确的平台', () => {
        expect(utils.getPlatformExt('/tmp/Image.android.js')).toEqual('android');
        expect(utils.getPlatformExt('/tmp/Image.ios.js')).toEqual('ios');
        expect(utils.getPlatformExt('/tmp/Image.js')).toEqual('platform-generic');
        expect(utils.getPlatformExt('/tmp/Image.invalid.js')).toEqual('platform-generic');
        expect(utils.getPlatformExt('/tmp/Image.some.info.ios.js')).toEqual('ios');
        expect(utils.getPlatformExt('/tmp/Lib/some/info/module.ios.js')).toEqual('ios');
        expect(utils.getPlatformExt('/tmp/Lib/some/info/Image.some.info.ios.js')).toEqual('ios');
        expect(utils.getPlatformExt('/tmp/Lib/some/info/Image.some.info.ios.json')).toEqual('ios');
    });

    it('应当根据绝对路径返回正确的缩略名', () => {
        // 处理package.json 提取缩略名
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/split/package.json')).toEqual('superSplit');
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react/package.json')).toBeNull();
        // 后缀黑白名单处理 只通过js/js.flow文件
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/main.json')).toBeNull();
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/img.jpg')).toBeNull();
        // 排除非react-native子模块
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react/index.js')).toBeNull();
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/split/index.js')).toBeNull();
        // 排除黑名单路径
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/__tests__/entry-test.js')).toBeNull();
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/__mocks__/entry.js')).toBeNull();
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/Libraries/Animated/src/polyfills/es6.js')).toBeNull();
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/Libraries/Renderer/fb/fb.js')).toBeNull();
        // 排除非白名单路径
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/entry.js')).toBeNull();
        // 对haste模块提取缩略名
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/Libraries/Image/Image.android.js')).toEqual('Image');
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/Libraries/Image/Image.ios.js')).toEqual('Image');
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/IntegrationTests/int.js')).toEqual('int');
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/ReactAndroid/local.js')).toEqual('local');
        expect(utils.getShortName('/tmp/pro', '/tmp/pro/node_modules/react-native/RNTester/rnTester.js')).toEqual('rnTester');
    });
});
