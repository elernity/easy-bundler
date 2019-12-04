'use strict';

const filterPlatformAssetScales = require('../filterPlatformAssetScales');

describe('Asset分辨率过滤测试', () => {
  it('应过滤出ios白名单分辨率', () => {
    // 正常情况 筛选出ios白名单分辨率(1x/2x/3x)
    expect(filterPlatformAssetScales('ios', [1, 1.5, 2, 3, 4])).toEqual([1, 2, 3]);
    // 正常情况 筛选出ios白名单分辨率
    expect(filterPlatformAssetScales('ios', [3, 4])).toEqual([3]);
  });

  it('应取比白名单分辨率大的最小值', () => {
    // 不存在白名单分辨率 但有比白名单分辨率稍大的值 取最小稍大值
    expect(filterPlatformAssetScales('ios', [0.5, 4, 100])).toEqual([4]);
    expect(filterPlatformAssetScales('ios', [0.5, 100])).toEqual([100]);
    expect(filterPlatformAssetScales('ios', [4, 5])).toEqual([4]);
    expect(filterPlatformAssetScales('ios', [3.5, 5])).toEqual([3.5]);
  });

  it('应取列表最大值', () => {
    // 不存在白名单分辨率 也无比白名单分辨率稍大的值 取当前最大值
    expect(filterPlatformAssetScales('ios', [0.25, 0.75])).toEqual([0.75]);
    expect(filterPlatformAssetScales('ios', [1.5, 2.5])).toEqual([2.5]);
    expect(filterPlatformAssetScales('ios', [0.5])).toEqual([0.5]);
  });

  it('应保留全部分辨率', () => {
    expect(filterPlatformAssetScales('ndos', [1, 1.5, 2, 3.7])).toEqual([1, 1.5, 2, 3.7]);
    expect(filterPlatformAssetScales('ndos', [1])).toEqual([1]);
  });

  it('应返回空数组', () => {
    // 空数组 返回空数组
    expect(filterPlatformAssetScales('ios', [])).toEqual([]);
  });
});
