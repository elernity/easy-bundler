'use strict';

const getAssetDestPathAndroid = require('../getAssetDestPathAndroid');

describe('获取Asset文件对应的存储路径-Android', () => {
  it('应返回正确的存储路径', () => {
    const simpleAsset = {
        __packager_asset: true,
        fileSystemLocation: '',
        httpServerLocation: 'assets/res',
        width: 1,
        height: 1,
        scales: [],
        hash: '',
        name: 'nd',
        type: 'png',
    };
    expect(getAssetDestPathAndroid(simpleAsset, 0.75)).toEqual('drawable-ldpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 1)).toEqual('drawable-mdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 1.5)).toEqual('drawable-hdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 2)).toEqual('drawable-xhdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 3)).toEqual('drawable-xxhdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 4)).toEqual('drawable-xxxhdpi/res_nd.png');
  });

  it('应将路径全部小写化', () => {
    const simpleAsset = {
        __packager_asset: true,
        fileSystemLocation: '',
        httpServerLocation: 'assets/Res',
        width: 1,
        height: 1,
        scales: [],
        hash: '',
        name: 'ND',
        type: 'png',
    };
    expect(getAssetDestPathAndroid(simpleAsset, 0.75)).toEqual('drawable-ldpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 1)).toEqual('drawable-mdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 1.5)).toEqual('drawable-hdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 2)).toEqual('drawable-xhdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 3)).toEqual('drawable-xxhdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 4)).toEqual('drawable-xxxhdpi/res_nd.png');
  });

  it('应移除`assets/`前缀', () => {
    const simpleAsset = {
        __packager_asset: true,
        fileSystemLocation: '',
        httpServerLocation: '/assets/res',
        width: 1,
        height: 1,
        scales: [],
        hash: '',
        name: 'nd',
        type: 'png',
    };
    expect(getAssetDestPathAndroid(simpleAsset, 0.75)).toEqual('drawable-ldpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 1)).toEqual('drawable-mdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 1.5)).toEqual('drawable-hdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 2)).toEqual('drawable-xhdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 3)).toEqual('drawable-xxhdpi/res_nd.png');
    expect(getAssetDestPathAndroid(simpleAsset, 4)).toEqual('drawable-xxxhdpi/res_nd.png');
  });
});
