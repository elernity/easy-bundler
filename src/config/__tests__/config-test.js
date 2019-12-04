'use strict';
require('babel-register')();

const path = require('path');
const getConfig = require('../config');
const configFilePath = path.join(__dirname, '../__files__/customConfig.json');

describe('配置合并测试', () => {

    it('命令行配置应该覆盖默认配置', () => {
        const shellConfig = {
            projectRoot: '/tmp/root',
            entryFile: '/tmp/root/index.js',
            output: '/tmp/root/output/index.platform.bundle',
            platform: 'ios',
            dev: false,
            assetsOutput: '/tmp/root/output/assets/',
            split: true,
        };
        const config = getConfig(shellConfig);
        expect(config).toMatchSnapshot();
    });

    it('文件配置应该覆盖默认配置', () => {
        const shellConfig = {
            projectRoot: '/tmp/root',
            entryFile: '/tmp/root/index.js',
            output: '/tmp/root/output/index.platform.bundle',
            configFile: configFilePath,
        };
        const config = getConfig(shellConfig);
        delete config.userConfig['configFile'];
        expect(config).toMatchSnapshot();
    });
});
