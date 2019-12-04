/**
 * @flow
 */
'use strict';

import type {
  AssetInfoType,
  PathPartsType,
  BaseNamePartsType,
  AssetPathPartsType
} from '../types';

const path = require('path');

// "name" + "scale" = "baseName"
// "baseName" + 合法的platform字段 = "fileName"
const FILE_NAME_RE = /^(.+?)(\.([^.]+))?\.([^.]+)$/;
const BASE_NAME_RE = /(.+?)(@([\d.]+)x)?$/;

function getAndroidAssetSuffix(scale: number): ?string {
  switch (scale) {
    case 0.75: return 'ldpi';
    case 1: return 'mdpi';
    case 1.5: return 'hdpi';
    case 2: return 'xhdpi';
    case 3: return 'xxhdpi';
    case 4: return 'xxxhdpi';
  }
  throw new Error('no such scale');
}

function getAndroidDrawableFolderName(asset: AssetInfoType, scale: number): string {
  var suffix = getAndroidAssetSuffix(scale);
  if (!suffix) {
    throw new Error(
      'Don\'t know which android drawable suffix to use for asset: ' +
      JSON.stringify(asset)
    );
  }
  const androidFolder = 'drawable-' + suffix;
  return androidFolder;
}

function getAndroidResourceIdentifier(asset: AssetInfoType): string {
  var folderPath = getBasePath(asset);
  return (folderPath + '/' + asset.name)
    .toLowerCase()
    .replace(/\//g, '_')           // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '')  // Remove illegal chars
    .replace(/^assets_/, '');      // Remove "assets_" prefix
}

function getBasePath(asset: AssetInfoType): string {
  var basePath = asset.httpServerLocation;
  if (basePath[0] === '/') {
    basePath = basePath.substr(1);
  }
  return basePath;
}

// 从路径中拆解出 dirPath/baseName.platform.extension
function parsePath(
  filePath: string,
  platforms: Set<string>,
): PathPartsType {
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const match = fileName.match(FILE_NAME_RE);
  if (!match) {
    return {
      dirPath: dirPath,
      baseName: fileName,
      platform: null,
      extension: null,
    };
  }
  const platform = match[3] || null;
  const extension = match[4] || null;
  // platform有效 返回platform
  if (platform == null || platforms.has(platform)) {
    return {
      dirPath: dirPath,
      baseName: match[1],
      platform: platform,
      extension: extension,
    };
  }
  // platform无效 将platform归于文件名
  const baseName = `${match[1]}.${platform}`;
  return {
    dirPath: dirPath,
    baseName: baseName,
    platform: null,
    extension: extension,
  };
}

function parseBaseName(baseName: string): BaseNamePartsType {
  const match = baseName.match(BASE_NAME_RE);
  if (!match) {
    throw new Error(`无效的asset名: \`${baseName}'`);
  }
  const name = match[1];
  if (match[3] != null) {
    const scale = parseFloat(match[3]);
    if (!Number.isNaN(scale)) {
      return {
        name: name,
        scale: scale,
      };
    }
  }
  return {
    name: name,
    scale: 1,
  };
}

/**
 * filePath必须带拓展名
 */
function tryParse(filePath: string, platforms: Set<string>): null | AssetPathPartsType {
  const {
    dirPath,
    baseName,
    platform,
    extension,
  } = parsePath(filePath, platforms);
  if (extension == null) {
    return null;
  }
  const {name, scale} = parseBaseName(baseName);
  return {
    dirPath: dirPath,
    assetName: `${name}.${extension}`,
    name: name,
    platform: platform,
    scale: scale,
    type: extension,
  };
}

module.exports = {
  getAndroidAssetSuffix: getAndroidAssetSuffix,
  getAndroidDrawableFolderName: getAndroidDrawableFolderName,
  getAndroidResourceIdentifier: getAndroidResourceIdentifier,
  getBasePath: getBasePath,
  tryParse: tryParse,
};
