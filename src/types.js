/**
 * @flow
 */
'use strict';

const Module = require('./graph/Module');
const Package = require('./graph/Package');

/** import */
import type {MinifyOptions} from 'uglify-es';
import type {Ast} from '@babel/core';
import type {
    StringLiteral,
    Directive,
    Identifier,
} from '@babel/types';
/** export */
export type MinifierConfigType = MinifyOptions;
export type AstType = Ast;
export type StringLiteralType = StringLiteral;
export type DirectiveType = Directive;
export type IdentifierType = Identifier;

/** entry file */
export type ShellConfigType = {
    [string]: string | boolean
};

/** commands */
export type ContextType = {
    mainFields: Array<string>,
    sourceExts: Array<string>,
    doesFileExist: string => boolean,
    getModulePath: (moduleName: string, platform: string) => ?string,
    resolveAsset: (dirPath: string, assetName: string, platform: string) => ?Array<string>,
    getModule: (filePath: string) => Module,
    getPackageForModule: (module: Module) => ?Package,
    getPackageMainPath: (pkgJsonPath: string) => string,
    isAssetFile: (filePath: string) => boolean,
    isImageFile: (filePath: string) => boolean,
    addAssetInfo: (absPath: string, assetInfo: AssetInfoType) => void
};
export type CreateModuleIdFunctionType = (string => string);
export type CommandType = {
    name: string,
    description: string,
    // eslint-disable-next-line flowtype/no-weak-types
    func: any,
    options: CommandOptionArrayType,
    pathizationArgus: Array<string>
};
export type CommandOptionArrayType = Array<CommandOptionsType>;
export type CommandOptionsType = {
    command: string,
    description: string,
    default?: ?string,
    parse?: ?(string) => boolean
};

/** cache */
export type AssetResolutionCacheOptionsType = {
    assetExts: Set<string>,
    platforms: Set<string>,
    allFilePaths: Array<string>
};
export type ResolvedInfoByAssetNameType = Map<string, Array<ResolvedAssetInfoType>>;
export type ResolvedAssetInfoType = {
    fileName: string,
    platform: ?string
};
export type ModuleCacheType = Map<string, Module>;
export type PackageCacheType = Map<string, Package>;

/** graph */
export type PackageContentType = {
    name: string
};
export type ReplacementsType = {
  [string]: (string | false)
};
// eslint-disable-next-line flowtype/no-weak-types
export type BabelPathType = any;
export type CollectedDataType = {
    visited: Set<string>,
    dependencies: Set<string>
};
export type ResolvedDataType = {
    visited: Set<string>,
    map: Map<string, string>
};

export type ProcessOptionType = {
    prefetchOnly: boolean
};

/** config */
export type ConfigType = {
    userConfig: UserConfigType,
    systemConfig: SystemConfigType
};
export type UserConfigType = {
    projectRoot: string,
    entryFile: string,
    output: string,
    platform: string,
    dev: boolean,
    assetsOutput: string,
    split: boolean,
    configFile: string
};
export type SystemConfigType = {
    assetExts: Array<string>,
    imageExts: Array<string>,
    platforms: Array<string>,
    sourceExts: Array<string>,
    mainFields: Array<string>,
    searchExts: Array<string>,
    searchIgnore: string => boolean,
    createModuleIdFactory: string => CreateModuleIdFunctionType,
    runBeforeMainModule: Array<string>,
    minifierConfig: MinifierConfigType
};

/** hastefs */
export type PathType = string;
export type IgnoreMatcherType = (item: string) => boolean;
// FileDataMap： Map<绝对路径, 时间戳>
export type FileDataMapType = Map<PathType, number>;
// ModuleDataMap： Map<缩略名, Map<平台, Array<绝对路径, module/package>>>
export type ModuleDataMapType = Map<string, Map<string, Array<string>>>;

/** lib */
export type AssetInfoType = {
  httpServerLocation: string,
  name: string,
  scale: number,
  type: string,
  scales: Array<number>
};

/** resolve */
export type SfContextType = {
    mainFields: Array<string>,
    sourceExts: Array<string>,
    doesFileExist: string => boolean,
    getModulePath: (moduleName: string, platform: string) => ?string,
    resolveAsset: (dirPath: string, assetName: string, platform: string) => ?Array<string>,
    getModule: (filePath: string) => Module,
    getPackageForModule: (module: Module) => ?Package,
    getPackageMainPath: (pkgJsonPath: string) => string,
    isAssetFile: (filePath: string) => boolean,
    isImageFile: (filePath: string) => boolean,
    addAssetInfo: (absPath: string, assetInfo: AssetInfoType) => void,
    filePathPrefix: string
};

/** transform */

/** utils */
export type PathPartsType = {
    dirPath: string,
    baseName: string,
    platform: string | null,
    extension: string | null
};
export type BaseNamePartsType = {
    name: string,
    scale: number
};
export type AssetPathPartsType = {
    assetName: string,
    name: string,
    platform: ?string,
    scale: number,
    type: string
};
export type AssetDataType = {
    __packager_asset: boolean,
    httpServerLocation: string,
    width: number | void,
    height: number | void,
    scales: Array<number>,
    hash: string,
    name: string,
    type: string,
    files: Map<number, string>
};
export type PriAssetInfoType = {
    name: string,
    scales: Array<number>,
    hash: string,
    type: string,
    files: Map<number, string>
};
export type AssetRecordType = {
    scales: Array<number>,
    files: Map<number, string>
};
