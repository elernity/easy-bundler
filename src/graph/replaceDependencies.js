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
  ResolvedDataType,
} from '../types';

//====================定义全局变量====================
const makeAsyncRequireTemplate = template(`
  require(ASYNC_REQUIRE_MODULE_PATH)(MODULE_ID)
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
function replaceDependencies(ast: AstType, map: Map<string, string>): AstType {

  const resolvedData: ResolvedDataType = {
    visited: new Set(),
    map: map,
  };

  const visitor = {
    CallExpression(path: BabelPathType, state: ResolvedDataType) {
      if (state.visited.has(path.node)) {
        return;
      }
      const callee = path.get('callee');
      const name = callee.node.name;
      if (callee.isImport()) {
        state.visited.add(processImportCall(path, state).node);
      } else if (name === 'require') {
        state.visited.add(processRequireCall(path, state).node);
      }
    },
  };

  traverse(ast, visitor, null, resolvedData);
  return ast;
}

function processImportCall(path: BabelPathType, state: ResolvedDataType): BabelPathType {
  const name = getModuleNameFromCallArgs(path);
  if (name == null) {
    throw new InvalidRequireCallError(path);
  }
  path.replaceWith(
    makeAsyncRequireTemplate({
      ASYNC_REQUIRE_MODULE_PATH: asyncRequireModulePathStringLiteral,
      MODULE_ID: [types.stringLiteral(state.map.get(name))],
    }),
  );
  return path;
}

function processRequireCall(path: BabelPathType, state: ResolvedDataType): BabelPathType {
  const name = getModuleNameFromCallArgs(path);
  if (name == null) {
    throw new InvalidRequireCallError(path);
  }
  path.node.arguments = [types.stringLiteral(state.map.get(name))];
  return path;
}

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

module.exports = replaceDependencies;
