/**
 * @flow
 */
'use strict';

import type {
  AssetResolutionCacheOptionsType,
  ResolvedInfoByAssetNameType,
  ResolvedAssetInfoType,
} from '../types';

const path = require('path');
const AssetPathUtil = require('../utils/AssetPathUtil');
const MapWithDefaults = require('../lib/MapWithDefaults');

/**
 * require('foo.png')的实际意义可能为：
 *  require('foo@2x.png') 或
 *  require('foo.ios.png') 等等
 *
 * 由于Asset的匹配规则较为复杂，所以我们在计算中记录了结果
 * 数据结构如下：
 * infoByDirPath(Map)
 *     └──目录名-一级信息(Map)
 *                 └──Asset名-二级信息数组[option1, option2...]
 *               (eg.foo.png)              ├──fileName: 真实文件名
 *                                         │  (eg. foo@2x.png)
 *                                         └──platform: 平台
 */
class AssetResolutionCache {
  infoByDirPath: MapWithDefaults<string, ResolvedInfoByAssetNameType>;
  fileNamesByDirPath: Map<string, Array<string>>;
  options: AssetResolutionCacheOptionsType;

  constructor(options: AssetResolutionCacheOptionsType) {
    // MapWithDefaults是一个懒加载的Map：取值为空时，调用findAssets方法计算值
    this.infoByDirPath = new MapWithDefaults(this.findAssets);
    this.fileNamesByDirPath = new Map();
    this.options = options;
    // 根据options.allFilePaths 计算 fileNamesByDirPath
    const allFilePaths = options.allFilePaths;
    for (let i = 0; i < allFilePaths.length; i++) {
      const filePath = allFilePaths[i];
      const dirPath = path.dirname(filePath);
      let fileNames = this.fileNamesByDirPath.get(dirPath);
      if (fileNames === undefined) {
        fileNames = [];
        this.fileNamesByDirPath.set(dirPath, fileNames);
      }
      fileNames.push(path.basename(filePath));
    }
  }

  resolve(
    dirPath: string,
    assetName: string,
    platform: string | null,
  ): ?Array<string> {
    const infoByAssetName = this.infoByDirPath.get(dirPath);
    const assetsInfo = infoByAssetName.get(assetName);
    if (assetsInfo == null) {
      return null;
    }
    // 根据信息检索，返回无平台信息或平台信息匹配的真实文件名
    return assetsInfo
      .filter((assetInfo: ResolvedAssetInfoType): boolean =>
        assetInfo.platform == null ||
        assetInfo.platform === platform
      )
      .map((assetInfo: ResolvedAssetInfoType): string => assetInfo.fileName);
  }

  findAssets = (dirPath: string): ?Map<string, Array<ResolvedAssetInfoType>> => {
    const infoByAssetName = new Map();
    const fileNames = this.fileNamesByDirPath.get(dirPath);
    if (!fileNames) {
      throw new Error(`findAssets失败， 未映射路径: ${dirPath}`);
    }
    for (let i = 0; i < fileNames.length; ++i) {
      const fileName = fileNames[i];
      const assetPathParts = AssetPathUtil.tryParse(fileName, this.options.platforms);
      // 解析失败 或 asset类型不在合法范围内 => 不处理
      if (
        assetPathParts == null ||
        !this.options.assetExts.has(assetPathParts.type)
      ) {
        continue;
      }

      // 成功解析 记录解析结果
      let assetsInfo = infoByAssetName.get(assetPathParts.assetName);
      let assetInfo = {
        fileName,
        platform: assetPathParts.platform,
      };
      if (!assetsInfo) {
        assetsInfo = [];
      }
      assetsInfo.push(assetInfo);
      infoByAssetName.set(assetPathParts.assetName, assetsInfo);

      // 当解析到平台信息时，添加补充信息
      if (assetPathParts.platform) {
        const assetNameWithPlatform = `${assetPathParts.name}.${assetPathParts.platform}.${assetPathParts.type}`;
        assetsInfo = infoByAssetName.get(assetNameWithPlatform);
        assetInfo = {
          fileName,
          platform: null,
        };
        if (!assetsInfo) {
          assetsInfo = [];
        }
        assetsInfo.push(assetInfo);
        infoByAssetName.set(assetNameWithPlatform, assetsInfo);
      }
    }
    return infoByAssetName;
  };
}

module.exports = AssetResolutionCache;
