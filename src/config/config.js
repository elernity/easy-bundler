/**
 * @flow
 */
'use strict';

import type {
    ConfigType,
    ShellConfigType,
} from '../types';

const defaultConfig = require('./default.js');
const fse = require('fs-extra');

/**
 * 配置优先级： 命令行配置 > 自定义文件配置 > 默认配置
 */
function getConfig(args: ShellConfigType): ConfigType {
    let config = defaultConfig;
    if (args.configFile) {
        const customConfig = fse.readJsonSync(args.configFile);
        config = Object.assign(config, customConfig);
    }
    config.userConfig = Object.assign(config.userConfig, args);
    return config;
}

module.exports = getConfig;
