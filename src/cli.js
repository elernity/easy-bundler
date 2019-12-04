/**
 * @flow
 */

import type {
    CommandType,
    CommandOptionArrayType,
    CommandOptionsType,
    ShellConfigType
} from './types';

const path = require('path');
const {camelCase} = require('lodash');
const commander = require('commander');
const getConfig = require('./config/config');
const bundle = require('./commands/bundle');

function checkSpecifiedOptions(allOpts: CommandOptionArrayType, definedOpts: ShellConfigType) {
    allOpts.forEach((option: CommandOptionsType) => {
        let opt = new commander.Option(option.command);
        if (!opt.required) {
            return;
        }
        let name = camelCase(opt.long);
        if (!definedOpts[name]) {
            throw new Error(`未定义参数 ${opt.long}`);
        }
    });
    return;
}

function addCommand(command: CommandType) {
    const cmd = commander
      .command(command.name)
      .description(command.description)
      .action(function runAction() {
        const shellConfig = this.opts();
        for (const opt in shellConfig) {
            if (shellConfig[opt] === undefined) {
                // 过滤空参数
                delete shellConfig[opt];
            } else if (command.pathizationArgus.includes(opt)) {
                // 兼容相对路径
                shellConfig[opt] = path.resolve(process.cwd(), shellConfig[opt]);
            }
        }
        const config = getConfig(shellConfig);
        checkSpecifiedOptions(command.options, shellConfig);
        command.func(config);
      });
    command.options.forEach((opt: CommandOptionsType) => {
        cmd.option(
            opt.command,
            opt.description,
            opt.parse || ((val: string): string => val),
            opt.default,
        );
    });
}

function cli() {
    addCommand(bundle);
    commander.parse(process.argv);
}

module.exports = cli;
