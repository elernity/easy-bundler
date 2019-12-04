/**
 * @flow
 */
'use strict';

module.exports = [
  {
    command: '--project-root <path>',
    description: '项目根目录',
    default: process.cwd(),
  },
  {
    command: '--entry-file <path>',
    description: '[必选参数]入口文件',
  },
  {
    command: '--output <path>',
    description: '[必选参数]离线包(目录)路径',
  },
  {
    command: '--platform [string]',
    description: 'android或ios(默认android)',
  },
  {
    command: '--dev [boolean]',
    description: '是否开发环境(默认true)',
    parse: (val: string): boolean => (val === 'false' ? false : true),
  },
  {
    command: '--assets-output [path]',
    description: 'asset文件目录',
  },
  {
    command: '--split [boolean]',
    description: '是否拆包(默认false)',
    parse: (val: string): boolean => (val === 'true' ? true : false),
  },
  {
    command: '--config-file [path]',
    description: '配置文件（优先级：命令行配置 > 配置文件 > 默认配置）',
  },
];
