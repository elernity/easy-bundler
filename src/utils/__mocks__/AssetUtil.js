'use strict';

const template = require('@babel/template').default;
const types = require('@babel/types');
const parser = require('@babel/parser');

const assetRequire = template('module.exports = require(ASSET_REGISTRY_PATH).registerAsset(ASSET_DATA_AST)');

const assetData = {
    __packager_asset: true,
    httpServerLocation: '',
    width: 1,
    height: 1,
    scales: [],
    hash: 'hash',
    name: 'name',
    type: 'type',
    files: new Map(),
};

function getAssetData() {
    return assetData;
}

function generateAstOfAsset() {
    const assetDataAst = parser.parseExpression(JSON.stringify(assetData));
    return types.file(
        types.program([
            assetRequire({
                ASSET_REGISTRY_PATH: types.stringLiteral('AssetRegistry.js'),
                ASSET_DATA_AST: assetDataAst,
            }),
        ]),
    );
}

module.exports = {
    getAssetData: getAssetData,
    generateAstOfAsset: generateAstOfAsset,
};
