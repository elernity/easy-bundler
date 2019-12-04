/**
 * @flow
 */
'use strict';

import type {
  ModuleCacheType,
  PackageCacheType,
} from '../types';

const path = require('path');
const Module = require('../graph/Module');
const Package = require('../graph/Package');
const HasteFs = require('../hastefs/HasteFs');

class ModulePackageCache {
  hasteFs: HasteFs;
  moduleCache: ModuleCacheType;
  packageCache: PackageCacheType;
  modulePackageMap: WeakMap<Module, Package>;

  constructor(hasteFs: HasteFs) {
    this.hasteFs = hasteFs;
    this.moduleCache = new Map();
    this.packageCache = new Map();
    this.modulePackageMap = new WeakMap();
  }

  getModule(filePath: string): Module {
    if (!this.moduleCache.has(filePath)) {
      this.moduleCache.set(filePath, new Module(filePath));
    }
    // $FlowFixMe 不存在时有set操作 保证一定存在
    return this.moduleCache.get(filePath);
  }

  getPackage(filePath: string): Package {
    if (!this.packageCache.has(filePath)) {
      this.packageCache.set(filePath, new Package(filePath));
    }
    // $FlowFixMe 不存在时有set操作 保证一定存在
    return this.packageCache.get(filePath);
  }

  getPackageForModule(module: Module): ?Package {
    let pkg = this.modulePackageMap.get(module);
    if (pkg) {
      return pkg;
    }

    pkg = this.getClosestPackage(module);
    if (!pkg) {
      return null;
    }
    const pkgPath = pkg.pkgPath;
    this.packageCache.set(pkgPath, pkg);
    this.modulePackageMap.set(module, pkg);
    return pkg;
  }

  getClosestPackage(module: Module): ?Package {
    const parsedPath = path.parse(module.modulePath);
    const root = parsedPath.root;
    let dir = parsedPath.dir;
    do {
      const candidate = path.join(dir, 'package.json');
      if (this.hasteFs.exist(candidate)) {
        return new Package(candidate);
      }
      dir = path.dirname(dir);
    } while (dir !== '.' && dir !== root);
    return null;
  }
}

module.exports = ModulePackageCache;
