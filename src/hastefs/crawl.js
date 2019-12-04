/**
 * @flow
 */
'use strict';

import type {
  PathType,
  IgnoreMatcherType,
  FileDataMapType
} from '../types';

const fse = require('fs-extra');
const path = require('path');

/**
 *
 * @param {Array<PathType>} rootsForSearch 需要检索的文件目录
 * @param {Array<string>} extensions 允许匹配的文件后缀
 * @param {IgnoreMatcherType} ignore 需要过滤的文件路径
 */
function crawl(
  rootsForSearch: Array<PathType>,
  extensions: Array<string>,
  ignore: IgnoreMatcherType,
): FileDataMapType {
  const files = new Map();
  function search(directory: string): ?null {
    const childNames = fse.readdirSync(directory);
    childNames.forEach((file: string): ?null => {
      const absolutePath = path.resolve(directory, file);
      // 过滤无需匹配的文件
      if (ignore(absolutePath)) {
        return null;
      }
      const stat = fse.lstatSync(absolutePath);
      // 仅对非链接文件处理
      if (stat && !stat.isSymbolicLink()) {
        if (stat.isDirectory()) {
          search(absolutePath);
        } else {
          // 提取文件后缀 判断是否为允许匹配的文件后缀
          const ext = path.extname(absolutePath).substr(1);
          if (extensions.indexOf(ext) !== -1) {
            files.set(absolutePath, stat.mtime.getTime());
          }
        }
      }
    });
  }
  rootsForSearch.forEach(search);
  return files;
}

module.exports = crawl;
