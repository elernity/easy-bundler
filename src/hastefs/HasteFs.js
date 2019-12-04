/**
 * @flow
 */
'use strict';

import type {
    PathType,
    FileDataMapType,
    ModuleDataMapType,
    IgnoreMatcherType
} from '../types';

const path = require('path');
const H = require('./constants').constValue;
const crawl = require('./crawl');
const utils = require('./utils');

/**
 * HasteFs用于将文件系统映射到内存
 * 该类对外提供的方法基于两个对象（files、modules），二者数据结构如下：
 * files(Map)
 *   └──绝对路径-时间戳
 * modules(Map)
 *   └──缩略名-一级信息(Map)
 *               └──平台-二级信息(Array)
 *                          └──绝对路径,类型（module或package）
 *
 * Note: 过滤部分文件，但映射总量仍然总是大于实际使用量，即映射文件使用率<1
 */
class HasteFs {
    projectRoot: PathType;
    files: FileDataMapType;
    modules: ModuleDataMapType;

    constructor(
      projectRoot: PathType,
      rootsForSearch: Array<PathType>,
      extensions: Array<string>,
      ignore: IgnoreMatcherType,
    ) {
        this.projectRoot = projectRoot;
        this.files = crawl(rootsForSearch, extensions, ignore);
        this.modules = new Map();
        for (const absolutePath of this.files.keys()) {
            const shortName = utils.getShortName(projectRoot, absolutePath);
            const platformExt = utils.getPlatformExt(absolutePath);
            const moduleType = utils.getModuleType(absolutePath);
            if (shortName) {
                const map = this.modules.get(shortName) || new Map();
                map.set(platformExt, [absolutePath, moduleType]);
                this.modules.set(shortName, map);
            }
        }
    }

    exist(absolutePath: PathType): boolean {
        return this.files.has(absolutePath);
    }

    getAllFilePaths(): Array<PathType> {
        return Array.from(this.files.keys());
    }

    getRelativePath(absolutePath: PathType): PathType {
        return path.relative(this.projectRoot, absolutePath);
    }

    getModulePath(
        shortName: string,
        platform: string,
    ): ?PathType {
        const map = this.modules.get(shortName);
        if (!map) {
            return null;
        }
        // 平台匹配优先级 platform > native > generic
        const moduleInfo = map.get(platform)
            || map.get(H.NATIVE)
            || map.get(H.GENERIC);
        if (moduleInfo && moduleInfo[H.TYPE] === H.MODULE) {
            return moduleInfo[H.PATH];
        }
        return null;
    }

    getPackagePath(
        shortName: string,
        platform: string
    ): ?PathType {
        const map = this.modules.get(shortName);
        if (!map) {
            return null;
        }
        // 平台匹配优先级 platform > generic
        const moduleInfo = map.get(platform) || map.get(H.GENERIC);
        if (moduleInfo && moduleInfo[H.TYPE] === H.PACKAGE) {
            return moduleInfo[H.PATH];
        }
        return null;
    }

}

module.exports = HasteFs;
