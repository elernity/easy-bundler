/**
 * @flow
 */
'use strict';

import type {
    AstType,
    DirectiveType,
    ContextType,
    UserConfigType,
} from '../types';

const path = require('path');
const fse = require('fs-extra');
const babel = require('@babel/core');
const types = require('@babel/types');
const AssetUtil = require('../utils/AssetUtil');

function transformModule(absolutePath: string): AstType {
    const code = fse.readFileSync(absolutePath, {encoding: 'utf8'});
    return babel.transformSync(code, {
        sourceType: 'unambiguous',
        filename: absolutePath,
        presets: [require('./extraPresets/preset.js')],
        compact: false,
        comments: false,
        configFile: false,
        code: false,
        babelrc: false,
        ast: true,
    }).ast;
}

function transformAsset(
    context: ContextType,
    absolutePath: string,
    relativePath: string,
    platform: string,
): AstType {
    // 获取Asset信息
    const assetData = AssetUtil.getAssetData(absolutePath, relativePath, platform, context.isImageFile);
    assetData.files.forEach((absPath: string, scale: number, files: Map<number, string>) => {
        const assetInfo = {
            httpServerLocation: assetData.httpServerLocation,
            name: assetData.name,
            scale: scale,
            type: assetData.type,
            scales: Array.from(files.keys()),
        };
        context.addAssetInfo(absPath, assetInfo);
    });
    delete assetData.files;
    // 生成AST
    return AssetUtil.generateAstOfAsset('react-native/Libraries/Image/AssetRegistry', assetData);
}

function transform(
    context: ContextType,
    userConfig: UserConfigType,
    absolutePath: string,
    type: string
): AstType | null {
    const relativePath = path.relative(userConfig.projectRoot, absolutePath);
    let ast;
    switch (type) {
        case 'script':
          ast = transformModule(absolutePath);
          break;
        case 'module':
          ast = transformModule(absolutePath);
          break;
        case 'asset':
          ast = transformAsset(context, absolutePath, relativePath, userConfig.platform);
          break;
        case 'json':
          return null;
        default:
          console.warn(`[转义失败] 未知类型: ${type}, 路径: ${absolutePath}`);
          return null;
    }
    // 添加use strict
    if (
        ast.program.sourceType === 'module' &&
        ast.program.directives.findIndex((d: DirectiveType): boolean => d.value.value === 'use strict') === -1
    ) {
        ast.program.directives.push(types.directive(types.directiveLiteral('use strict')));
    }
    // 在0.59.9版本中，dev环境下不再折叠常量和内联处理。因此，为了和官方包保持一致，在dev环境下直接return
    if (userConfig.dev) {
        return ast;
    }
    // 使用插件转义
    const opts = {
        dev: userConfig.dev,
        platform: userConfig.platform,
    };
    ast = babel.transformFromAstSync(ast, '', {
        plugins: [
            [require('./extraPlugins/constant-folding-plugin.js'), opts],
            [require('./extraPlugins/inline-plugin.js'), opts],
        ],
        compact: false,
        comments: false,
        configFile: false,
        code: false,
        babelrc: false,
        ast: true,
    }).ast;
    return ast;
}

module.exports = transform;
