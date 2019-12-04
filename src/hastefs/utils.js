/**
 * @flow
 */
'use strict';

import type {PathType} from '../types';

const path = require('path');
const fse = require('fs-extra');
const H = require('./constants').constValue;
const EXT_BLACK_LIST = require('./constants').extBlackList;

/**
 * haste module路径黑名单（优先级:黑名单>白名单）
 * 删除绝对路径中的${ProjectRoot}部分后再匹配
 * 也就是说，一旦匹配到下列路径，则不是haste module
 */
const BLACKLISTED_PATTERNS: Array<RegExp> = [
  /.*[\\\/]__(mocks|tests)__[\\\/].*/,
  /^Libraries[\\\/]Animated[\\\/]src[\\\/]polyfills[\\\/].*/,
  /^Libraries[\\\/]Renderer[\\\/]fb[\\\/].*/,
];

/**
 * haste module路径白名单
 * 删除绝对路径中的${ProjectRoot}/node_modules/react-native部分后再匹配
 * 也就是说，仅下列文件夹下的文件，才可能是haste module
 */
const WHITELISTED_PREFIXES: Array<string> = [
  'IntegrationTests',
  'Libraries',
  'ReactAndroid',
  'RNTester'
];

// 用于从路径中提取module name字段的正则序列
const NAME_REDUCERS: Array<[RegExp, string]> = [
  [/^(?:.*[\\\/])?([a-zA-Z0-9$_.-]+)$/, '$1'], // 提取basename
  [/^(.*)\.js(\.flow)?$/, '$1'], // 去掉拓展名后缀
  [/^(.*)\.(android|ios|native)$/, '$1'], // 去掉平台后缀
];

function getShortName(
    projectRoot: PathType,
    absolutePath: PathType,
): ?string {
    // 获取缩略名策略根据类型不同而不同
    if (getModuleType(absolutePath) === H.PACKAGE) {
        // package.json文件，返回name字段值
        const json = fse.readJsonSync(absolutePath);
        return json.name || null;
    } else if (getModuleType(absolutePath) === H.MODULE) {
        /**
         * Module文件：
         *  1.排除匹配到后缀黑名单的路径
         *  2.排除非Haste路径
         *  3.通过正则从路径中提取信息字段
         */
        if (EXT_BLACK_LIST.has(_getExt(absolutePath))
         || !_isHastePath(projectRoot, absolutePath)) {
            return null;
        }
        // 从absolutePath中提取hasteName
        const hasteName = NAME_REDUCERS.reduce(
          (name: string, [pattern, replacement]: [RegExp, string]): string => name.replace(pattern, replacement),
          absolutePath,
        );

      return hasteName;
    }
    return null;
}

function _getExt(absolutePath: PathType): string {
    const extIndex = absolutePath.lastIndexOf('.');
    return absolutePath.substr(extIndex);
}

/**
  * haste module(亦称为short-name module)，是指直接以模块名标识的基础模块，如Image
  * 它们在react-native目录下
  */
function _isHastePath(
    projectRoot: PathType,
    absolutePath: PathType,
): boolean {
    const rnDirPath = path.join(projectRoot, 'node_modules', 'react-native') + path.sep;
    // 排除非.js/.js.flow结尾的文件路径
    if (!absolutePath.endsWith('.js') && !absolutePath.endsWith('.js.flow')) {
        return false;
    }
    // 排除非 ${ProjectRoot}/node_modules/react-native 开头的文件路径
    if (!absolutePath.startsWith(rnDirPath)) {
      return false;
    }
    const subPath = absolutePath.substr(rnDirPath.length);
    // 排除黑名单中的文件路径
    if (BLACKLISTED_PATTERNS.some((pattern: RegExp): boolean => pattern.test(subPath))) {
      return false;
    }
    // 对于白名单命中的文件路径 返回真
    return WHITELISTED_PREFIXES.some((prefix: string): boolean => subPath.startsWith(prefix));
}

// 提取平台后缀： index.ios.js -> ios
function getPlatformExt(absolutePath: PathType): string {
    const last = absolutePath.lastIndexOf('.');
    const secondToLast = absolutePath.lastIndexOf('.', last - 1);
    if (secondToLast === -1) {
      return H.GENERIC;
    }
    const platform = absolutePath.substring(secondToLast + 1, last);
    if (H.SUPPORTED_PLATFORM_EXTS.indexOf(platform) !== -1) {
      return platform;
    }
    return H.GENERIC;
}

function getModuleType(absolutePath: PathType): string {
    return absolutePath.endsWith(path.sep + 'package.json') ? H.PACKAGE : H.MODULE;
}

module.exports = {
    getShortName: getShortName,
    getPlatformExt: getPlatformExt,
    getModuleType: getModuleType,
};
