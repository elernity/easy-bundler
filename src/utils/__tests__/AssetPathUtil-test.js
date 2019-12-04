'use strict';

const AssetPathUtil = require('../AssetPathUtil');

describe('Asset路径处理辅助工具测试', () => {
    it('通过分辨率获取Android的Asset文件夹后缀', () => {
        const getAndroidAssetSuffix = AssetPathUtil.getAndroidAssetSuffix;
        expect(getAndroidAssetSuffix(0.75)).toEqual('ldpi');
        expect(getAndroidAssetSuffix(1)).toEqual('mdpi');
        expect(getAndroidAssetSuffix(1.5)).toEqual('hdpi');
        expect(getAndroidAssetSuffix(2)).toEqual('xhdpi');
        expect(getAndroidAssetSuffix(3)).toEqual('xxhdpi');
        expect(getAndroidAssetSuffix(4)).toEqual('xxxhdpi');
        // 未匹配 崩溃
        expect(function () {
            getAndroidAssetSuffix(5);
        }).toThrowError('no such scale');
        expect(function () {
            getAndroidAssetSuffix(1.1);
        }).toThrowError('no such scale');
    });

    it('通过分辨率获取Android的Asset文件夹名', () => {
        const getAndroidDrawableFolderName = AssetPathUtil.getAndroidDrawableFolderName;
        // 空的asset对象 仅用作崩溃日志输出
        const simpleAsset = {
            __packager_asset: true,
            fileSystemLocation: '',
            httpServerLocation: '',
            width: 1,
            height: 1,
            scales: [],
            hash: '',
            name: '',
            type: '',
        };
        // 崩溃日志输出内容
        // const throwString = 'Don\'t know which android drawable suffix to use for asset: ' + JSON.stringify(simpleAsset);
        expect(getAndroidDrawableFolderName(simpleAsset, 0.75)).toEqual('drawable-ldpi');
        expect(getAndroidDrawableFolderName(simpleAsset, 1)).toEqual('drawable-mdpi');
        expect(getAndroidDrawableFolderName(simpleAsset, 1.5)).toEqual('drawable-hdpi');
        expect(getAndroidDrawableFolderName(simpleAsset, 2)).toEqual('drawable-xhdpi');
        expect(getAndroidDrawableFolderName(simpleAsset, 3)).toEqual('drawable-xxhdpi');
        expect(getAndroidDrawableFolderName(simpleAsset, 4)).toEqual('drawable-xxxhdpi');
        // 未匹配 崩溃
        expect(function () {
            getAndroidDrawableFolderName(simpleAsset, 5);
        }).toThrow('no such scale');
        expect(function () {
            getAndroidDrawableFolderName(simpleAsset, 7.1);
        }).toThrow('no such scale');
    });

    it('通过Asset信息获取资源名', () => {
        const getAndroidResourceIdentifier = AssetPathUtil.getAndroidResourceIdentifier;
        // 生成指定name的asset 方便测试
        const generateAsset = (n) => {
            return {
                __packager_asset: true,
                fileSystemLocation: '',
                httpServerLocation: 'assets/res',
                width: 1,
                height: 1,
                scales: [],
                hash: '',
                name: n,
                type: '',
            };
        };
        expect(getAndroidResourceIdentifier(generateAsset('gm'))).toEqual('res_gm');
        expect(getAndroidResourceIdentifier(generateAsset('gm-1'))).toEqual('res_gm1');
        expect(getAndroidResourceIdentifier(generateAsset('GGa-Bc'))).toEqual('res_ggabc');
        expect(getAndroidResourceIdentifier(generateAsset('=GGb--'))).toEqual('res_ggb');
    });

    it('通过Asset信息获取基础路径', () => {
        const getBasePath = AssetPathUtil.getBasePath;
        // 生成指定httpServerLocation的asset 方便测试
        const generateAsset = (hsl) => {
            return {
                __packager_asset: true,
                fileSystemLocation: '',
                httpServerLocation: hsl,
                width: 1,
                height: 1,
                scales: [],
                hash: '',
                name: '',
                type: '',
            };
        };
        expect(getBasePath(generateAsset('node_modules/nd/res'))).toEqual('node_modules/nd/res');
        expect(getBasePath(generateAsset('/assets/node_modules/nd/res'))).toEqual('assets/node_modules/nd/res');
        expect(getBasePath(generateAsset('.'))).toEqual('.');
        expect(getBasePath(generateAsset('/'))).toEqual('');
        expect(getBasePath(generateAsset('/a'))).toEqual('a');
        expect(getBasePath(generateAsset(''))).toEqual('');
    });
    it('应返回路径解析信息', () => {
        const platforms = new Set(['android', 'ios']);
        // 正常路径 完全解析
        expect(AssetPathUtil.tryParse('/tmp/pro/img@2x.ios.jpg', platforms)).toEqual({
            dirPath: '/tmp/pro',
            assetName: 'img.jpg',
            name: 'img',
            platform: 'ios',
            scale: 2,
            type: 'jpg',
        });
        // 缺失拓展名 返回null
        expect(AssetPathUtil.tryParse('/tmp/pro/pongpong', platforms)).toBeNull();
        // 疑似无效platform参数 当做文件名
        expect(AssetPathUtil.tryParse('/tmp/pro/img@2x.boy.jpg', platforms)).toEqual({
            dirPath: '/tmp/pro',
            assetName: 'img@2x.boy.jpg',
            name: 'img@2x.boy',
            platform: null,
            scale: 1,
            type: 'jpg',
        });
        expect(AssetPathUtil.tryParse('/tmp/pro/img.boy@2x.jpg', platforms)).toEqual({
            dirPath: '/tmp/pro',
            assetName: 'img.boy.jpg',
            name: 'img.boy',
            platform: null,
            scale: 2,
            type: 'jpg',
        });
    });
});
