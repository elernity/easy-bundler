/**
 * @flow
 */
'use strict';

import type {
    AstType,
    IdentifierType,
    UserConfigType,
    BabelPathType,
} from '../types';

const path = require('path');
const fse = require('fs-extra');
const types = require('@babel/types');
const generate = require('@babel/generator').default;
const template = require('@babel/template').default;
const traverse = require('@babel/traverse').default;

const IIFE_PARAM = template("typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this");

function wrapJson(absolutePath: string): string {
  const json = fse.readFileSync(absolutePath);
  // Unused parameters; remember that's wrapping JSON.
  const moduleFactoryParameters = _buildParameters(
    '_aUnused',
    '_bUnused',
    '_cUnused',
  );
  return [
    `__d(function(${moduleFactoryParameters.join(', ')}) {`,
    `  module.exports = ${json};`,
    '});',
  ].join('\n');
}

function wrapScript(ast: AstType): string {
  const factory = types.functionExpression(
    types.identifier(''),
    ['global'].map((name: string): IdentifierType => types.identifier(name)),
    types.blockStatement(ast.program.body, ast.program.directives),
  );
  const iife = types.callExpression(factory, [IIFE_PARAM().expression]);
  const wrappedAst = types.file(types.program([types.expressionStatement(iife)]));
  return _generateCode(wrappedAst);
}

function wrapModule(
  ast: AstType,
  importAll: string,
  importDefault: string
): string {
  let dependencyMapName = '';
  traverse(ast, {
    Program(p: BabelPathType) {
      dependencyMapName = p.scope.generateUid('dependencyMap');
    },
  });
  const params = _buildParameters(
    importDefault,
    importAll,
    dependencyMapName,
  );
  const factory = types.functionExpression(
    types.identifier(''),
    params.map((name: string): IdentifierType => types.identifier(name)),
    types.blockStatement(ast.program.body, ast.program.directives),
  );
  const def = types.callExpression(types.identifier('__d'), [factory]);
  const wrappedAst = types.file(types.program([types.expressionStatement(def)]));
  // 替换方法中的require => $$_REQUIRE
  traverse(wrappedAst, {
    Program(p: BabelPathType) {
      const body = p.get('body.0.expression.arguments.0.body');
      const newRequireName = body.scope.generateUid('$$_REQUIRE'); // note: babel will prefix this with _
      body.scope.rename('require', newRequireName);
    },
  });
  return _generateCode(wrappedAst);
}

function _generateCode(ast: AstType): string {
  return generate(
    ast,
    {
      comments: false,
      compact: false,
      retainLines: false,
    }
  ).code + '\n';
}

function _buildParameters(
  importDefaultName: string,
  importAllName: string,
  dependencyMapName: string,
): Array<string> {
  return [
    'global',
    'require',
    importDefaultName,
    importAllName,
    'module',
    'exports',
    dependencyMapName,
  ];
}

function wrap(
    userConfig: UserConfigType,
    ast: AstType,
    absolutePath: string,
    createModuleId: (absPath: string) => string,
    type: string,
    importDefault: string,
    importAll: string,
): string {
  let code = '';
  // 不同类型 按不同策略封装代码
  switch (type) {
    case 'script':
      return wrapScript(ast);
    case 'module':
      code = wrapModule(ast, importDefault, importAll);
      break;
    case 'asset':
      code = wrapModule(ast, importDefault, importAll);
      break;
    case 'json':
      code = wrapJson(absolutePath);
      break;
    default:
      throw new Error(`[封装失败] 未知类型: ${type}, 路径: ${absolutePath}`);
  }
  // 附加参数
  const id = createModuleId(absolutePath);
  const relativePath = path.relative(userConfig.projectRoot, absolutePath);
  const paramsToAdd = [id, null, relativePath];
  const index = code.lastIndexOf(')');
  const params = paramsToAdd.map((param: string | null): string => (param !== undefined ? JSON.stringify(param) : 'undefined'));
  return code.slice(0, index) + ',' + params.join(',') + code.slice(index);
}

module.exports = wrap;
