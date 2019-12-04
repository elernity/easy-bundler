/**
 * @flow
 */
'use strict';

import type {
  ContextType,
  SfContextType
} from '../types';

const path = require('path');

function resolve(
  context: ContextType,
  from: string,
  to: string,
  platform: string,
): string | false {
    if (isRelative(to) || isAbsolute(to)) {
        return resolveModulePath(context, from, to, platform);
    }

    let realModuleName = redirectModulePath(context, from, to);
    if (realModuleName === false) {
      return false;
    }
    // 路径解析： /.../node_modules/originModuleDir/realModuleName
    if (isRelative(realModuleName) || isAbsolute(realModuleName)) {
      const fromModuleParentIdx = from.lastIndexOf('node_modules' + path.sep) + 13;
      const originModuleDir = from.slice(0, from.indexOf(path.sep, fromModuleParentIdx));
      const absPath = path.join(originModuleDir, realModuleName);
      return resolveModulePath(context, from, absPath, platform);
    }

    const normalizedName = normalizePath(realModuleName);
    const hastePath = resolveHasteName(context, normalizedName, platform);
    if (hastePath) {
      return hastePath;
    }

    const dirPaths = [];
    for (
      let currDir = path.dirname(from);
      currDir !== '.' && currDir !== path.parse(from).root;
      currDir = path.dirname(currDir)
    ) {
      const searchPath = path.join(currDir, 'node_modules');
      dirPaths.push(path.join(searchPath, realModuleName));
    }
    const extraPaths = [];
    const allDirPaths = dirPaths.concat(extraPaths);
    for (let i = 0; i < allDirPaths.length; i++) {
      realModuleName = redirectModulePath(context, from, allDirPaths[i]);
      if (!realModuleName) {
        continue;
      }
      const result = resolveFileOrDir(context, realModuleName, platform);
      if (result) {
        return result;
      }
    }
    throw new Error(`[resolve]路径解析失败! from= ${from} , to= ${to} `);
}

function resolveModulePath(
  context: ContextType,
  from: string,
  to: string,
  platform: string,
): string | false {
  const modulePath = isAbsolute(to) ? to : path.join(path.dirname(from), to);
  const redirectedPath = redirectModulePath(context, from, modulePath);
  if (redirectedPath === false) {
    return false;
  }
  const result = resolveFileOrDir(context, redirectedPath, platform);
  if (result) {
    return result;
  }
  throw new Error(`[resolveModulePath]路径解析失败! from= ${from} , to= ${to} `);
}

function resolveHasteName(
  context: ContextType,
  moduleName: string,
  platform: string,
): string | null {
  const modulePath = context.getModulePath(moduleName, platform);
  if (modulePath != null) {
    return modulePath;
  }
  let packageName = moduleName;
  let packageJsonPath = null;
  while (packageJsonPath == null && packageName && packageName !== '.') {
    packageName = path.dirname(packageName);
    packageJsonPath = context.getModulePath(packageName, platform);
  }
  if (packageJsonPath == null) {
    return null;
  }
  const packageDirPath = path.dirname(packageJsonPath);
  const pathInModule = moduleName.substring(packageName.length + 1);
  const potentialModulePath = path.join(packageDirPath, pathInModule);
  const result = resolveFileOrDir(context, potentialModulePath, platform);
  if (result) {
    return result;
  }
  throw new Error(`路径解析失败! HasteName=${moduleName}`);
}

function resolveFileOrDir(
  context: ContextType,
  modulePath: string,
  platform: string,
): string | null {
  const dirPath = path.dirname(modulePath);
  const fileName = path.basename(modulePath);
  const fileResult = resolveFile(context, dirPath, fileName, platform);
  if (fileResult) {
    return fileResult;
  }
  const dirResult = resolveDir(context, modulePath, platform);
  if (dirResult) {
    return dirResult;
  }
  return null;
}

function resolveFile(
  context: ContextType,
  dirPath: string,
  fileName: string,
  platform: string,
): string | null {
  if (context.isAssetFile(fileName)) {
    return resolveAssetFile(context, dirPath, fileName, platform);
  }
  const filePathPrefix = path.join(dirPath, fileName);
  const sfContext = {...context, filePathPrefix};
  const filePath = resolveSourceFile(sfContext, platform);
  return filePath;
}

function resolveAssetFile(
  context: ContextType,
  dirPath: string,
  fileName: string,
  platform: string,
): string | null {
  const assetNames = context.resolveAsset(dirPath, fileName, platform);
  if (assetNames) {
    const assetPaths = assetNames.map((assetName: string): string => path.join(dirPath, assetName)).sort();
    return assetPaths[0];
  }
  return null;
}

function resolveSourceFile(
  sfContext: SfContextType,
  platform: string,
): string | null {
  let filePath = resolveSourceFileForAllExts(sfContext, '');
  if (filePath) {
    return filePath;
  }
  const sourceExts = sfContext.sourceExts;
  for (let i = 0; i < sourceExts.length; i++) {
    const ext = `.${sourceExts[i]}`;
    filePath = resolveSourceFileForAllExts(sfContext, ext, platform);
    if (filePath) {
      return filePath;
    }
  }
  return null;
}

function resolveSourceFileForAllExts(
  sfContext: SfContextType,
  sourceExt: string,
  platform: ?string,
): string | null {
  if (platform) {
    const ext = `.${platform}${sourceExt}`;
    const filePath = resolveSourceFileForExt(sfContext, ext);
    if (filePath) {
      return filePath;
    }
  }
  let filePath = resolveSourceFileForExt(sfContext, `.native${sourceExt}`);
    if (filePath) {
      return filePath;
  }
  filePath = resolveSourceFileForExt(sfContext, sourceExt);
  return filePath;
}

function resolveSourceFileForExt(
  sfContext: SfContextType,
  extension: string,
): string | null {
  const filePath = `${sfContext.filePathPrefix}${extension}`;
  if (sfContext.doesFileExist(filePath)) {
    return filePath;
  }
  return null;
}

function resolveDir(
  context: ContextType,
  dirPath: string,
  platform: string,
): string | null {
  const packageJsonPath = path.join(dirPath, 'package.json');
  if (context.doesFileExist(packageJsonPath)) {
    return resolvePackage(context, packageJsonPath, platform);
  }
  return resolveFile(context, dirPath, 'index', platform);
}

function resolvePackage(
  context: ContextType,
  packageJsonPath: string,
  platform: string,
): string | null {
  const mainPrefixPath = context.getPackageMainPath(packageJsonPath);
  const dirPath = path.dirname(mainPrefixPath);
  const prefixName = path.basename(mainPrefixPath);
  const fileResult = resolveFile(context, dirPath, prefixName, platform);
  if (fileResult) {
    return fileResult;
  }
  const indexResult = resolveFile(context, mainPrefixPath, 'index', platform);
  if (indexResult) {
    return indexResult;
  }
  return null;
}

function redirectModulePath(
  context: ContextType,
  from: string,
  to: string,
): string | false {
    try {
      const fromModule = context.getModule(from);
      if (to.startsWith('.')) {
        const fromPackage = context.getPackageForModule(fromModule);
        if (fromPackage) {
          const dirPathOfFrom = path.dirname(from);
          const absPath = path.resolve(dirPathOfFrom, to);
          const relativePath = path.relative(dirPathOfFrom, absPath);
          const fromPackagePath = `./${relativePath}`;
          let redirectedPath = fromPackage.redirectRequire(fromPackagePath, context.mainFields);
          if (redirectedPath) {
            const absRedirectedPath = path.resolve(dirPathOfFrom, redirectedPath);
            const relativeRedirectedPath = path.relative(dirPathOfFrom, absRedirectedPath);
            redirectedPath = `./${relativeRedirectedPath}`;
          }
          return redirectedPath;
        }
      } else {
        const pck = isAbsolute(to)
          ? context.getPackageForModule(context.getModule(to))
          : context.getPackageForModule(fromModule);
        if (pck) {
          return pck.redirectRequire(to, context.mainFields);
        }
      }
    } catch (err) {
      console.error(err);
    }
    return to;
}

function normalizePath(modulePath: string): string {
  if (path.sep === '/') {
    modulePath = path.normalize(modulePath);
  } else if (path.posix) {
    modulePath = path.posix.normalize(modulePath);
  }
  return modulePath.replace(/\/$/, '');
}

function isRelative(filePath: string): boolean {
    return /^[.][.]?(?:[/]|$)/.test(filePath);
}

function isAbsolute(filePath: string): boolean {
  return path.isAbsolute(filePath);
}

module.exports = resolve;
