/**
 * @flow
 */
'use strict';

import type {AssetInfoType} from '../types';

const path = require('path');
const fse = require('fs-extra');
const filterPlatformAssetScales = require('./filterPlatformAssetScales');
const getAssetDestPathAndroid = require('./getAssetDestPathAndroid');
const getAssetDestPathIOS = require('./getAssetDestPathIOS');

function saveAssets(
    assetsMap: Map<string, AssetInfoType>,
    platform: string,
    assetsOutput: string,
) {
    const filesToCopy = new Map();
    const getAssetDestPath = platform === 'android' ? getAssetDestPathAndroid : getAssetDestPathIOS;
    assetsMap.forEach((assetInfo: AssetInfoType, absPath: string) => {
        const validScales = new Set(filterPlatformAssetScales(platform, assetInfo.scales));
        if (!validScales.has(assetInfo.scale)) {
            return;
        }
        const output = path.join(assetsOutput, getAssetDestPath(assetInfo, assetInfo.scale));
        filesToCopy.set(absPath, output);
    });
    filesToCopy.forEach((dest: string, src: string) => {
        const dirPath = path.dirname(dest);
        if (!fse.existsSync(dirPath)) {
            fse.mkdirpSync(dirPath);
        }
        fse.copySync(src, dest);
    });
    console.log(`拷贝Asset数量: ${filesToCopy.size}`);
}

module.exports = saveAssets;
