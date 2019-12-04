'use strict';
require('babel-register')();

jest.mock('../commands/bundle');
jest.mock('../config/config');

const cli = require('../cli');
let logBox = [];
process.cwd = () => '/tmp/easy-bundler';
console.log = (log) => logBox.push(log);

describe('命令行参数处理测试', () => {

    beforeEach(() => {
        logBox = [];
    });

    it('缺漏必填项时应当抛错', () => {
        process.argv = [
            '/usr/bin/node',
            '/tmp/easy-bundler/index.js',
            'bundle',
            '--project-root',
            '/tmp/root',
        ];
        expect(cli).toThrow();
    });

    it('命令行未配置的项应该剔除', () => {
        process.argv = [
            '/usr/bin/node',
            '/tmp/easy-bundler/index.js',
            'bundle',
            '--project-root',
            '/tmp/root',
            '--entry-file',
            '/tmp/root/index.js',
            '--output',
            '/tmp/root/output/index.platform.bundle',
        ];
        cli();
        expect(logBox[0]).toMatchSnapshot();
    });

    it('路径形式的参数应统一为绝对路径', () => {
        process.argv = [
            '/usr/bin/node',
            '/tmp/easy-bundler/index.js',
            'bundle',
            '--project-root',
            '../root/',
            '--entry-file',
            '../root/index.js',
            '--output',
            '../root/output/index.platform.bundle',
        ];
        cli();
        expect(logBox[0]).toMatchSnapshot();
    });
});
