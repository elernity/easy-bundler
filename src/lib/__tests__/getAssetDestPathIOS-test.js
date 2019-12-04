'use strict';

const getAssetDestPathIOS = require('../getAssetDestPathIOS');

describe('获取Asset文件对应的存储路径-IOS', () => {
  it('应返回不带分辨率的存储路径', () => {
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
    expect(getAssetDestPathIOS(simpleAsset, 1)).toEqual('assets/res/nd.png');
  });

  it('应返回带分辨率的存储路径', () => {
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
    expect(getAssetDestPathIOS(simpleAsset, 2)).toEqual('assets/res/nd@2x.png');
    expect(getAssetDestPathIOS(simpleAsset, 3)).toEqual('assets/res/nd@3x.png');
  });
});
