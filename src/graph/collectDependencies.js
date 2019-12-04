/**
 * @flow
 */
'use strict';

//=====================定义引用======================
const generate = require('@babel/generator').default;
const template = require('@babel/template').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');

//=====================定义类型=======================
import type {
  AstType,
  StringLiteralType,
  BabelPathType,
  CollectedDataType,
  ProcessOptionType,
} from '../types';

//====================定义全局变量====================
const makeAsyncRequireTemplate = template(`
  require(ASYNC_REQUIRE_MODULE_PATH)(MODULE_ID)
`);
const makeAsyncPrefetchTemplate = template(`
  require(ASYNC_REQUIRE_MODULE_PATH).prefetch(MODULE_ID)
`);
const asyncRequireModulePath = require.resolve('../lib/asyncRequire');
const asyncRequireModulePathStringLiteral: StringLiteralType = types.stringLiteral(asyncRequireModulePath);

//=====================定义类========================
class InvalidRequireCallError extends Error {
  constructor({node}: BabelPathType) {
    const line = node.loc && node.loc.start && node.loc.start.line;
    super(`Invalid call at line ${line || '<unknown>'}: ${generate(node).code}`);
  }
}

//=====================定义方法=======================
/**
 * 解析语法分析树，返回提取到的依赖项集合
 * 原理参见：https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
 * @param {AstType} ast 当前模块代码对应的语法分析树
 * @param {Array<string>} inlineableCalls 内联引用方法名
 * @returns {Set<string>} 依赖项集合
 */
function collectDependencies(
  ast: AstType,
  inlineableCalls: Array<string>,
): Set<string> {

  const dependencyCalls = new Set(['require', ...inlineableCalls]);

  const collectedData: CollectedDataType = {
    visited: new Set(),
    dependencies: new Set(),
  };

  const visitor = {
    CallExpression(path: BabelPathType, state: CollectedDataType) {
      if (state.visited.has(path.node)) {
        return;
      }
      const callee = path.get('callee');
      const name = callee.node.name;
      if (callee.isImport()) {
        state.visited.add(processImportCall(path, state, {prefetchOnly: false}).node);
        return;
      }

      if (name === '__prefetchImport' && !path.scope.getBinding(name)) {
        state.visited.add(processImportCall(path, state, {prefetchOnly: true}).node);
        return;
      }

      if (dependencyCalls.has(name) && !path.scope.getBinding(name)) {
        state.visited.add(processRequireCall(path, state).node);
      }
    },
  };

  traverse(ast, visitor, null, collectedData);
  return collectedData.dependencies;
}

/**
 * 解析import('a')语句，填充依赖集合，转换异步引用语法
 * @param {BabelPathType} path 当前访问节点的路径
 * @param {CollectedDataType} state 状态值，包含已经统计的依赖项集合
 * @param {ProcessOptionType} option
 * @returns {BabelPathType} 当前访问节点的路径（已经经过语法转换）
 * @throws 参数非string类型时抛错 eg. import(1)
 */
function processImportCall(
  path: BabelPathType,
  state: CollectedDataType,
  option: ProcessOptionType
): BabelPathType {
  const name = getModuleNameFromCallArgs(path);
  if (name == null) {
    throw new InvalidRequireCallError(path);
  }
  state.dependencies.add(name);
  if (option.prefetchOnly) {
    path.replaceWith(
      makeAsyncPrefetchTemplate({
        ASYNC_REQUIRE_MODULE_PATH: asyncRequireModulePathStringLiteral,
        MODULE_ID: [types.stringLiteral(name)],
      }),
    );
  } else {
    path.replaceWith(
      makeAsyncRequireTemplate({
        ASYNC_REQUIRE_MODULE_PATH: asyncRequireModulePathStringLiteral,
        MODULE_ID: [types.stringLiteral(name)],
      }),
    );
  }
  return path;
}

/**
 * 解析require('a')语句，填充依赖集合
 * @param {BabelPathType} path 当前访问节点的路径
 * @param {CollectedDataType} state 状态值，包含已经统计的依赖项集合
 * @returns {BabelPathType} 当前访问节点的路径
 * @throws 参数非string类型时抛错 eg. import(1)
 */
function processRequireCall(path: BabelPathType, state: CollectedDataType): BabelPathType {
  const name = getModuleNameFromCallArgs(path);
  if (name == null) {
    throw new InvalidRequireCallError(path);
  }
  state.dependencies.add(name);
  path.node.arguments = [types.stringLiteral(name)];
  return path;
}

/**
 * 提取调用表达式中的依赖项参数
 * @param {BabelPathType} path 当前访问节点的路径
 * @returns {string|null} 依赖项或null（依赖项参数非string类型时）
 * @throws 传入多个参数时抛错 eg. require('a', 'b')
 */
function getModuleNameFromCallArgs(path: BabelPathType): ?string {
  if (path.get('arguments').length !== 1) {
    throw new InvalidRequireCallError(path);
  }
  const result = path.get('arguments.0').evaluate();
  if (result.confident && typeof result.value === 'string') {
    return result.value;
  }
  return null;
}

module.exports = collectDependencies;
