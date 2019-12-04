/**
 * @flow
 */
'use strict';

import type {
    AstType,
    AssetDataType,
    AssetPathPartsType,
    PriAssetInfoType,
    AssetRecordType
} from '../types';

const path = require('path');
const fse = require('fs-extra');
const crypto = require('crypto');
const imageSize = require('image-size');
const template = require('@babel/template').default;
const types = require('@babel/types');
const parser = require('@babel/parser');
const AssetPathUtil = require('./AssetPathUtil');

const assetRequire = template('module.exports = require(ASSET_REGISTRY_PATH).registerAsset(ASSET_DATA_AST)');

function getAssetData(
    absolutePath: string,
    relativePath: string,
    platform: string | null,
    isImage: (filePath: string) => boolean,
): AssetDataType {
    const platforms = new Set(platform ? [platform] : []);
    const httpServerLocation = path.join('/assets', path.dirname(relativePath));
    const assetInfo = getAssetInfoByAbsolutePath(absolutePath, platforms);
    const dimensions = isImage(absolutePath) ? imageSize(absolutePath) : null;
    const scale = assetInfo.scales[0];
    const assetData = {
        __packager_asset: true,
        httpServerLocation: httpServerLocation,
        width: dimensions ? dimensions.width / scale : undefined,
        height: dimensions ? dimensions.height / scale : undefined,
        scales: assetInfo.scales,
        hash: assetInfo.hash,
        name: assetInfo.name,
        type: assetInfo.type,
        files: assetInfo.files,
    };
    return assetData;
}

function getAssetInfoByAbsolutePath(
    absolutePath: string,
    platforms: Set<string>,
): PriAssetInfoType {
    // $FlowFixMe 如果tryParse返回了null 直接抛错
    const {name, type} = AssetPathUtil.tryParse(absolutePath, platforms);
    const {scales, files} = getAssetRecordByAbsolutePath(absolutePath, platforms);
    const hasher = crypto.createHash('md5');
    for (const file of files.values()) {
        hasher.update(fse.readFileSync(file));
    }
    return {
        name: name,
        scales: scales,
        hash: hasher.digest('hex'),
        type: type,
        files: files,
    };
}

function getAssetRecordByAbsolutePath(
    absolutePath: string,
    platforms: Set<string>,
): AssetRecordType {
    const dirPath = path.dirname(absolutePath);
    const fileName = path.basename(absolutePath);
    const fileNames = fse.readdirSync(dirPath);
    const curAsset = AssetPathUtil.tryParse(fileName, platforms);
    if (!curAsset) {
        throw new Error(`无法解析Asset文件名${fileName}`);
    }
    const curAssetKey = curAsset.platform ? curAsset.assetName + curAsset.platform : curAsset.assetName;
    const assetInfoMap = new Map();
    const assets = fileNames.map((fn: string): ?AssetPathPartsType => AssetPathUtil.tryParse(fn, platforms));
    assets.forEach((asset: AssetPathPartsType, index: number): ?null => {
        if (!asset) {
            return null;
        }
        const assetKey = asset.platform ? asset.assetName + asset.platform : asset.assetName;
        const assetInfo = assetInfoMap.get(assetKey) || {scales: [], files: new Map()};

        const absolutePathOfAsset = path.join(dirPath, fileNames[index]);
        assetInfo.scales.push(asset.scale);
        assetInfo.scales.sort();
        assetInfo.files.set(asset.scale, absolutePathOfAsset);
        assetInfoMap.set(assetKey, assetInfo);
    });
    // $FlowFixMe 上面代码遍历了当前Asset所在目录下的所有文件，故map中必有该项
    return assetInfoMap.get(curAssetKey);
}

function generateAstOfAsset(
    assetRegistryPath: string,
    assetData: AssetDataType,
): AstType {
    // {...}
    const assetDataAst = parser.parseExpression(JSON.stringify(assetData));
    // require('AssetRegistry').registerAsset({...})
    return types.file(
        types.program([
            assetRequire({
                ASSET_REGISTRY_PATH: types.stringLiteral(assetRegistryPath),
                ASSET_DATA_AST: assetDataAst,
            }),
        ]),
    );
}

module.exports = {
    getAssetData: getAssetData,
    generateAstOfAsset: generateAstOfAsset,
};
