/**
 * @flow
 */
'use strict';

import type {
    ContextType,
    ConfigType,
    CreateModuleIdFunctionType,
    AssetInfoType
} from '../types';

const path = require('path');
const fse = require('fs-extra');
const Buffer = require('buffer').Buffer;
const HasteFs = require('../hastefs/HasteFs');
const ModulePackageCache = require('../cache/ModulePackageCache');
const AssetResolutionCache = require('../cache/AssetResolutionCache');
const Module = require('../graph/Module');
const Package = require('../graph/Package');
const transform = require('../transform/transform');
const generateImportNames = require('../lib/generateImportNames');
const wrap = require('../transform/wrap');
const minify = require('../transform/minify');
const collectDependencies = require('../graph/collectDependencies');
const replaceDependencies = require('../graph/replaceDependencies');
const resolve = require('../resolve/resolve');
const saveAssets = require('../lib/saveAssets');
const SplitUtil = require('../utils/SplitUtil');
const options = require('./options/bundleOptions');

// 识别unbundle-indexed业务包的magic number
// 目前加载部分没有根据该值做任何类型判断，只起到占位作用
const MAGIC_UNBUNDLE_FILE_HEADER = '0xFB0BD1E5';
const SIZEOF_UINT8 = 1;
const SIZEOF_UINT32 = 4;
const SIZEOF_CHAR = 1;

// 已处理模块集合 避免重复处理
const hasProcessed = new Set();
// 离线包构建涉及到的asset模块：absPath -> assetInfo
const assetsMap = new Map();
// 模块分类集
const baseModuleAbsPaths = [];
const businessModuleAbsPaths = [];
// 离线包代码
let baseCode = '';
let businessCode = '';

const pathizationArgus = [
    'projectRoot',
    'entryFile',
    'output',
    'assetsOutput',
    'configFile',
];

function bundle(config: ConfigType) {
    const {
        projectRoot,
        entryFile,
        output,
        platform,
        /* eslint-disable-next-line no-unused-vars */
        dev,
        assetsOutput,
        split,
    } = config.userConfig;
    // 文件系统映射
    const hasteFs = new HasteFs(
        projectRoot,
        [projectRoot],
        config.systemConfig.searchExts,
        config.systemConfig.searchIgnore,
    );
    const modulePackageCache = new ModulePackageCache(hasteFs);
    const assetResolutionCache = new AssetResolutionCache({
        allFilePaths: hasteFs.getAllFilePaths(),
        assetExts: new Set(config.systemConfig.assetExts),
        platforms: new Set(config.systemConfig.platforms),
    });
    const context = {
        mainFields: config.systemConfig.mainFields,
        sourceExts: config.systemConfig.sourceExts,
        doesFileExist: (filePath: string): boolean => hasteFs.exist(filePath),
        /* eslint-disable-next-line no-shadow */
        getModulePath: (moduleName: string, platform: string): ?string => hasteFs.getModulePath(moduleName, platform),
        /* eslint-disable-next-line no-shadow */
        resolveAsset: (dirPath: string, assetName: string, platform: string): ?Array<string> => assetResolutionCache.resolve(dirPath, assetName, platform),
        getModule: (filePath: string): Module => modulePackageCache.getModule(filePath),
        getPackageForModule: (module: Module): ?Package => modulePackageCache.getPackageForModule(module),
        getPackageMainPath: (pkgJsonPath: string): string => {
            const pkg = modulePackageCache.getPackage(pkgJsonPath);
            return pkg.getMain(config.systemConfig.mainFields);
        },
        isAssetFile: (filePath: string): boolean => {
            const ext = path.extname(filePath).slice(1);
            return config.systemConfig.assetExts.indexOf(ext) !== -1;
        },
        isImageFile: (filePath: string): boolean => {
            const ext = path.extname(filePath).slice(1);
            return config.systemConfig.imageExts.indexOf(ext) !== -1;
        },
        addAssetInfo: (absPath: string, assetInfo: AssetInfoType) => {
            assetsMap.set(absPath, assetInfo);
        },
    };

    const createModuleId = config.systemConfig.createModuleIdFactory(projectRoot);
    // 离线包构建
    processFile(
        context,
        config,
        entryFile,
        platform,
        'module',
        createModuleId,
    );
    // 以unbundle模式处理业务包(含前/后置代码)
    processBusinessCode(context, config, createModuleId);
    if (split) {
        const preCode = getPreCode(config);
        const postCodeForBase = getPostCode(config, config.systemConfig.runBeforeMainModule, (val: string): string => val);
        // 以普通模式处理基础包(不含前/后置代码)
        processBaseCode(context);
        baseCode = preCode + baseCode + postCodeForBase;
        const baseBundleDir = path.join(output, 'base');
        const businessBundleDir = path.join(output, 'main');
        fse.ensureDirSync(baseBundleDir);
        fse.ensureDirSync(businessBundleDir);
        const baseBundle = path.join(baseBundleDir, 'main.bundle');
        const businessBundle = path.join(businessBundleDir, 'main.bundle');
        fse.writeFileSync(baseBundle, baseCode, {encoding: 'utf8'});
        fse.writeFileSync(businessBundle, businessCode, {encoding: 'utf8'});
        console.log(`离线包拆分成功: ${output}`);
    } else {
        const codes = businessCode;
        fse.writeFileSync(output, codes, {encoding: 'utf8'});
        console.log(`离线包构建成功: ${output}`);
    }
    if (assetsOutput) {
        saveAssets(assetsMap, platform, assetsOutput);
        console.log(`Asset拷贝成功: ${assetsOutput}`);
    }
}

function processFile(
    context: ContextType,
    config: ConfigType,
    absolutePath: string,
    platform: string,
    type: string,
    createModuleId: CreateModuleIdFunctionType,
) {
    // 已经处理过的 不处理
    if (hasProcessed.has(absolutePath)) {
        return;
    }
    hasProcessed.add(absolutePath);
    // 非拆包模式 不处理基础包模块
    if (!config.userConfig.split && SplitUtil.isBaseModule(createModuleId(absolutePath))) {
        return;
    }

    // 模块分类
    if (SplitUtil.isBaseModule(createModuleId(absolutePath))) {
        baseModuleAbsPaths.push(absolutePath);
    } else {
        businessModuleAbsPaths.push(absolutePath);
    }

    const replacedPathMap = new Map();
    const module = context.getModule(absolutePath);
    const ast = transform(context, config.userConfig, absolutePath, type);
    const {importDefault, importAll} = generateImportNames(ast);
    const dependencies = collectDependencies(ast, [importDefault, importAll]);
    for (const dependency of dependencies) {
        const absolutePathOfDep = resolve(context, absolutePath, dependency, platform);
        if (absolutePathOfDep === false) {
            replacedPathMap.set(dependency, dependency);
        } else {
            replacedPathMap.set(dependency, createModuleId(absolutePathOfDep));
            const typeOfDep = getType(context, absolutePathOfDep);
            processFile(
                context,
                config,
                absolutePathOfDep,
                platform,
                typeOfDep,
                createModuleId,
            );
        }
    }
    const replacedAst = replaceDependencies(ast, replacedPathMap);
    let code = wrap(config.userConfig, replacedAst, absolutePath, createModuleId, type, importDefault, importAll);
    if (!config.userConfig.dev) {
        code = minify(code, config.systemConfig.minifierConfig);
    }
    module.moduleId = createModuleId(absolutePath);
    module.code = code;
}

function getType(
    context: ContextType,
    absolutePath: string,
): string {
    if (absolutePath.endsWith('.json')) {
        return 'json';
    }
    if (context.isAssetFile(absolutePath)) {
        return 'asset';
    }
    return 'module';
}

function getPreCode(config: ConfigType): string {
    let preCode = '';
    const devValue = config.userConfig.dev === false ? false : true;
    const envValue = config.userConfig.dev === false ? 'production' : 'development';
    const preludeCode = [
        `var __DEV__=${devValue.toString()},`,
        '__BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now(),',
        'process=this.process||{};',
        'process.env=process.env||{};',
        `process.env.NODE_ENV="${envValue}";\n`,
    ].join('');
    preCode += preludeCode;

    const polyfills = [
        require.resolve('../lib/polyfills/require.js'),
        require.resolve('../lib/polyfills/Object.es6.js'),
        require.resolve('../lib/polyfills/console.js'),
        require.resolve('../lib/polyfills/error-guard.js'),
        require.resolve('../lib/polyfills/Number.es6.js'),
        require.resolve('../lib/polyfills/String.prototype.es6.js'),
        require.resolve('../lib/polyfills/Array.prototype.es6.js'),
        require.resolve('../lib/polyfills/Array.es6.js'),
        require.resolve('../lib/polyfills/Object.es7.js'),
    ];
    polyfills.forEach((polyfill: string) => {
        // $FlowFixMe 直接传null 表示无需对应参数项 仅此处特殊
        const ast = transform(null, config.userConfig, polyfill, 'script');
        // $FlowFixMe 直接传null 表示无需对应参数项 仅此处特殊
        const code = wrap(null, ast, null, null, 'script');
        preCode += code;
    });
    if (!config.userConfig.dev) {
        preCode = minify(preCode, config.systemConfig.minifierConfig);
    }
    return preCode;
}

function getPostCode(
    config: ConfigType,
    requireModules: Array<string>,
    createModuleId: CreateModuleIdFunctionType,
): string {
    let postCode = '';
    requireModules.forEach((requireModule: string) => {
        const moduleId = createModuleId(requireModule);
        postCode += `__r("${moduleId}")\n`;
    });
    if (!config.userConfig.dev) {
        postCode = minify(postCode, config.systemConfig.minifierConfig);
    }
    return postCode;
}

function processBaseCode(context: ContextType) {
    baseModuleAbsPaths.forEach((absPath: string) => {
        const moduleCode = context.getModule(absPath).code;
        if (!moduleCode) {
            throw new Error(`基础模块未处理: ${absPath}`);
        }
        baseCode += moduleCode;
    });
}

// 构建unbundle-indexed业务包，其结构如下：
// file contents layout:
// - magic number      char[4]  0xE5 0xD1 0x0B 0xFB (0xFB0BD1E5 uint32 LE)
// - offset table      table    table format...
// - code blob         char[]   null-terminated code strings, starting with
//                              the startup code

// table format:
// - modules num:      uint_32  number of modules
// - startup code len: uint_32  length of the startup section
// - modules info:              module info...
//
// module info:
// - module info len:  uint_8   length of the module info, including itself
// - module uri:       char[]   uri of the module
// - module offset:    uint_32  offset into the modules blob
// - module length:    uint_32  length of the module code in bytes
function processBusinessCode(
    context: ContextType,
    config: ConfigType,
    createModuleId: CreateModuleIdFunctionType,
) {
    let businessCodeBuffer: Buffer[] = []; // buffer of all
    let table: Buffer[] = []; // buffer of table

    // write magic number
    let fileHeaderBuffer = new Buffer(4);
    fileHeaderBuffer.writeUInt32LE(MAGIC_UNBUNDLE_FILE_HEADER, 0);

    // write modules num
    let modulesNumBuffer = new Buffer(4);
    let moduleAbsPaths = businessModuleAbsPaths;
    let modulesNum = moduleAbsPaths.length;
    modulesNumBuffer.writeUInt32LE(modulesNum, 0);

    // write startup code len
    let startupCodeLenBuffer = new Buffer(4);
    let startupCode = getPostCode(config, [config.userConfig.entryFile], createModuleId);
    let startupCodeBuffer = nullTerminatedBuffer(startupCode, 'utf8');
    let startupCodeLen = startupCodeBuffer.length;
    startupCodeLenBuffer.writeUInt32LE(startupCodeLen, 0);

    table.push(modulesNumBuffer);
    table.push(startupCodeLenBuffer);

    // write modules info
    // 记录各个模块代码在code blob的位置
    let codeOffset = startupCodeLen;
    moduleAbsPaths.forEach((moduleAbsPath: string) => {
      let module = context.getModule(moduleAbsPath);
      if (!module.moduleId || !module.code) {
          throw new Error(`业务模块未处理: ${moduleAbsPath}`);
      }
      // 从未拆包的大包中，根据模块信息，提取相应代码块并将ID替换为URL
      let moduleCode = module.code;
      let moduleId = module.moduleId;
      // 将上面组装好的模块代码转为buffer，末尾加上\0
      module.buffer = nullTerminatedBuffer(moduleCode, 'utf8');
      let moduleBuffer = module.buffer;
      // build info buffer
      let moduleInfoBuffer = new Buffer(SIZEOF_UINT8 + moduleId.length * SIZEOF_CHAR + 2 * SIZEOF_UINT32);
      let moduleInfoLen = moduleInfoBuffer.length;
      moduleInfoBuffer.writeUInt8(moduleInfoLen, 0);
      moduleInfoBuffer.write(moduleId, SIZEOF_UINT8);
      moduleInfoBuffer.writeUInt32LE(codeOffset, SIZEOF_UINT8 + moduleId.length * SIZEOF_CHAR);
      moduleInfoBuffer.writeUInt32LE(moduleBuffer.length, SIZEOF_UINT8 + moduleId.length * SIZEOF_CHAR + SIZEOF_UINT32);
      table.push(moduleInfoBuffer);
      // 下个模块代码在code blob的位置 = 当前位置 + 当前模块代码长度
      codeOffset += moduleBuffer.length;
    });

    // 写入magic number
    businessCodeBuffer.push(fileHeaderBuffer);
    table.forEach((pair: Buffer) => {
      // 写入table各项：模块数、起始模块代码长度、其他模块信息
      businessCodeBuffer.push(pair);
    });
    // 写入起始模块代码
    businessCodeBuffer.push(startupCodeBuffer);
    // 写入其他模块代码
    moduleAbsPaths.forEach((moduleAbsPath: string) => {
      businessCodeBuffer.push(context.getModule(moduleAbsPath).buffer);
    });

    businessCode = Buffer.concat(businessCodeBuffer);
}

// 将传入值转为Buffer对象，并在末尾加上\0
function nullTerminatedBuffer(
    content: string,
    encoding: string,
): Buffer {
    let nullByteBuffer = new Buffer(1).fill(0);
    return Buffer.concat([new Buffer(content, encoding), nullByteBuffer]);
}

module.exports = {
    name: 'bundle',
    description: '离线包构建',
    func: bundle,
    options: options,
    pathizationArgus: pathizationArgus,
};
