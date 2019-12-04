// @flow
'use strict';

const traverse = require('@babel/traverse').default;

import type {Ast} from '@babel/core';

import type {
  BabelPathType,
} from '../types';

function generateImportNames(
  ast: Ast,
// eslint-disable-next-line flowtype/no-weak-types
): {importAll: any, importDefault: any} {
  let importDefault;
  let importAll;

  traverse(ast, {
    Program(path: BabelPathType) {
      importAll = path.scope.generateUid('$$_IMPORT_ALL');
      importDefault = path.scope.generateUid('$$_IMPORT_DEFAULT');
    },
  });

  return {
    importAll: importAll,
    importDefault: importDefault,
  };
}

module.exports = generateImportNames;
