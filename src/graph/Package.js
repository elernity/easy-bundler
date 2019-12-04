/**
 * @flow
 */
'use strict';

import type {
  PackageContentType,
  ReplacementsType
} from '../types';

const path = require('path');
const fse = require('fs-extra');

class Package {
  pkgPath: string;
  dirPath: string;
  content: PackageContentType | null;

  constructor(filePath: string) {
    this.pkgPath = path.resolve(filePath);
    this.dirPath = path.dirname(filePath);
    this.content = null;
  }

  // 解析package.json 获取入口模块（经重定向处理过）
  getMain(mainFields: Array<string>): string {
    // 获取内容
    const json = this.getContent();
    // 获取入口 默认为index
    let main = 'index';
    for (const mainField of mainFields) {
      if (typeof json[mainField] === 'string') {
        main = json[mainField];
        break;
      }
    }
    // 入口重定向
    const replacements = getReplacements(json, mainFields);
    if (replacements) {
      const variants = [main];
      const mainBrother = main.startsWith('./') ? main.slice(2) : './' + main;
      variants.push(mainBrother);
      for (const variant of variants) {
        const winner =
          replacements[variant] ||
          replacements[variant + '.js'] ||
          replacements[variant + '.json'] ||
          replacements[variant.replace(/(\.js|\.json)$/, '')];
        if (winner) {
          main = winner;
          break;
        }
      }
    }
    return path.join(this.dirPath, main);
  }

  redirectRequire(
    filePath: string,
    mainFields: Array<string>,
  ): string | false {
    const json = this.getContent();
    const replacements = getReplacements(json, mainFields);
    // 没有重定向表 无需重定向 直接返回
    if (!replacements) {
      return filePath;
    }

    if (!isRelative(filePath) && !isAbsolute(filePath)) {
      const replacement = replacements[filePath];
      return replacement === false ? false : replacement || filePath;
    }

    let absolutePath = path.resolve(this.dirPath, filePath);
    let relativePath = './' + path.relative(this.dirPath, absolutePath);
    let redirectPath =
      replacements[relativePath] ||
      replacements[relativePath + '.js'] ||
      replacements[relativePath + '.json'];

    if (redirectPath === false) {
      return false;
    }
    if (redirectPath) {
      return path.join(this.dirPath, redirectPath);
    }
    return filePath;
  }

  getContent(): PackageContentType {
    if (this.content == null) {
      this.content = fse.readJsonSync(this.pkgPath);
    }
    return this.content;
  }

  invalidate() {
    this.content = null;
  }
}

function isRelative(filePath: string): boolean {
  return /^[.][.]?(?:[/]|$)/.test(filePath);
}

function isAbsolute(filePath: string): boolean {
  return path.isAbsolute(filePath);
}

// 获取重定向表
/**
 * Replacements
 * eg.
 *    main: { a: a.js }
 *          or
 *    main: { a: false } // false表示无效值
 */
function getReplacements(
  pkgContent: PackageContentType,
  mainFields: Array<string>,
): ReplacementsType | null {
  // 遍历mainFields 合并重定向表
  const result = mainFields.map((key: string): ?ReplacementsType | false => {
    // 找不到对应字段 或 对应字段非映射表类型 返回false
    if (!pkgContent[key] || typeof pkgContent[key] === 'string') {
      return false;
    }
    // pkgContent[key]是单个mainField对应的重定向表
    return pkgContent[key];
  }).filter((replacements: ?ReplacementsType | false): boolean => {
    // 过滤掉return false的项
    return !!replacements;
  });
  if (!result.length) {
    return null;
  }
  // mainFields数组中，越靠前的字段优先级越高，默认配置react-native > browser > main
  // 由于Object.assign是越靠后优先级越高（覆盖前者），因此需要倒置后拆解
  // $FlowFixMe result已经经过过滤，排除了无效的replacements
  return Object.assign({}, ...result.reverse());
}

module.exports = Package;
