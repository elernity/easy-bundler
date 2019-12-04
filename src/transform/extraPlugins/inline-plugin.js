'use strict';
import typeof {types as BabelTypes} from '@babel/core';
import type {Ast} from '@babel/core';
import type {Path} from '@babel/traverse';

type Context = {types: BabelTypes};

type Options = {
  dev: boolean,
  isWrapped: boolean,
  requireName?: string,
  platform: string
};

type State = {
  opts: Options
};

const env = {name: 'env'};
const nodeEnv = {name: 'NODE_ENV'};
const processId = {name: 'process'};

const dev = {name: '__DEV__'};

function inlinePlugin(context: Context, options: Options) {
  const t = context.types;

  const {
    isPlatformNode,
    isPlatformSelectNode,
    isPlatformOSSelect,
    getReplacementForPlatformOSSelect,
  } = createInlinePlatformChecks(t, options.requireName || 'require');

  const isGlobal = binding => !binding;

  const isFlowDeclared = binding => t.isDeclareVariable(binding.path);

  const isGlobalOrFlowDeclared = binding =>
    isGlobal(binding) || isFlowDeclared(binding);

  const isLeftHandSideOfAssignmentExpression = (node: Ast, parent) =>
    t.isAssignmentExpression(parent) && parent.left === node;

  const isProcessEnvNodeEnv = (node: Ast, scope) =>
    t.isIdentifier(node.property, nodeEnv) &&
    t.isMemberExpression(node.object) &&
    t.isIdentifier(node.object.property, env) &&
    t.isIdentifier(node.object.object, processId) &&
    isGlobal(scope.getBinding(processId.name));

  const isDev = (node: Ast, parent, scope) =>
    t.isIdentifier(node, dev) &&
    isGlobalOrFlowDeclared(scope.getBinding(dev.name)) &&
    !t.isMemberExpression(parent);

  function findProperty(objectExpression, key, fallback) {
    const property = objectExpression.properties.find(p => {
      if (t.isIdentifier(p.key) && p.key.name === key) {
        return true;
      }

      if (t.isStringLiteral(p.key) && p.key.value === key) {
        return true;
      }

      return false;
    });
    return property ? property.value : fallback();
  }

  function hasStaticProperties(objectExpression) {
    if (!t.isObjectExpression(objectExpression)) {
      return false;
    }

    return objectExpression.properties.every(p => {
      if (p.computed) {
        return false;
      }

      return t.isIdentifier(p.key) || t.isStringLiteral(p.key);
    });
  }

  return {
    visitor: {
      Identifier(path: Path, state: State) {
        if (isDev(path.node, path.parent, path.scope)) {
          path.replaceWith(t.booleanLiteral(state.opts.dev));
        }
      },
      MemberExpression(path: Path, state: State) {
        const node = path.node;
        const scope = path.scope;
        const opts = state.opts;

        if (!isLeftHandSideOfAssignmentExpression(node, path.parent)) {
          if (isPlatformNode(node, scope, !!opts.isWrapped)) {
            path.replaceWith(t.stringLiteral(opts.platform));
          } else if (isProcessEnvNodeEnv(node, scope)) {
            path.replaceWith(
              t.stringLiteral(opts.dev ? 'development' : 'production'),
            );
          }
        }
      },
      CallExpression(path: Path, state: State) {
        const node = path.node;
        const scope = path.scope;
        const arg = node.arguments[0];
        const opts = state.opts;

        if (isPlatformSelectNode(node, scope, !!opts.isWrapped)) {
          if (hasStaticProperties(arg)) {
            const fallback = () =>
              findProperty(arg, 'default', () => t.identifier('undefined'));

            path.replaceWith(findProperty(arg, opts.platform, fallback));
          }
        } else if (isPlatformOSSelect(node, scope, !!opts.isWrapped)) {
          path.replaceWith(
            getReplacementForPlatformOSSelect(node, opts.platform),
          );
        }
      },
    },
  };
}


// content from inline-platform

const importMap = new Map([['ReactNative', 'react-native']]);

function createInlinePlatformChecks(
  t: BabelTypes,
  requireName: string = 'require',
) {
  const isPlatformNode = (
    node: Object,
    scope: Object,
    isWrappedModule: boolean,
  ) =>
    isPlatformOS(node, scope, isWrappedModule) ||
    isReactPlatformOS(node, scope, isWrappedModule) ||
    isPlatformOSOS(node, scope, isWrappedModule);

  const isPlatformSelectNode = (
    node: Object,
    scope: Object,
    isWrappedModule: boolean,
  ) =>
    isPlatformSelect(node, scope, isWrappedModule) ||
    isReactPlatformSelect(node, scope, isWrappedModule);

  const isPlatformOS = (node, scope, isWrappedModule) =>
    t.isIdentifier(node.property, {name: 'OS'}) &&
    isImportOrGlobal(node.object, scope, [{name: 'Platform'}], isWrappedModule);

  const isReactPlatformOS = (node, scope, isWrappedModule) =>
    t.isIdentifier(node.property, {name: 'OS'}) &&
    t.isMemberExpression(node.object) &&
    t.isIdentifier(node.object.property, {name: 'Platform'}) &&
    isImportOrGlobal(
      node.object.object,
      scope,
      [{name: 'React'}, {name: 'ReactNative'}],
      isWrappedModule,
    );

  const isPlatformOSOS = (node, scope, isWrappedModule) =>
    t.isIdentifier(node.property, {name: 'OS'}) &&
    isImportOrGlobal(
      node.object,
      scope,
      [{name: 'PlatformOS'}],
      isWrappedModule,
    );

  const isPlatformSelect = (node, scope, isWrappedModule) =>
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.property, {name: 'select'}) &&
    isImportOrGlobal(
      node.callee.object,
      scope,
      [{name: 'Platform'}],
      isWrappedModule,
    );

  const isReactPlatformSelect = (node, scope, isWrappedModule) =>
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.property, {name: 'select'}) &&
    t.isMemberExpression(node.callee.object) &&
    t.isIdentifier(node.callee.object.property, {name: 'Platform'}) &&
    isImportOrGlobal(
      node.callee.object.object,
      scope,
      [{name: 'React'}, {name: 'ReactNative'}],
      isWrappedModule,
    );

  const isPlatformOSSelect = (
    node: Object,
    scope: Object,
    isWrappedModule: boolean,
  ) =>
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.property, {name: 'select'}) &&
    isImportOrGlobal(
      node.callee.object,
      scope,
      [{name: 'PlatformOS'}],
      isWrappedModule,
    );

  const getReplacementForPlatformOSSelect = (
    node: Object,
    platform: string,
  ) => {
    const matchingProperty = node.arguments[0].properties.find(
      p => p.key.name === platform,
    );

    if (!matchingProperty) {
      throw new Error(
        'No matching property was found for PlatformOS.select:\n' +
          JSON.stringify(node),
      );
    }
    return matchingProperty.value;
  };

  const isGlobal = binding => !binding;

  const isRequireCall = (node, dependencyId, scope) =>
    t.isCallExpression(node) &&
    t.isIdentifier(node.callee, {name: requireName}) &&
    checkRequireArgs(node.arguments, dependencyId);

  const isImport = (node, scope, patterns) =>
    patterns.some(pattern => {
      const importName = importMap.get(pattern.name) || pattern.name;
      return isRequireCall(node, importName, scope);
    });

  const isImportOrGlobal = (node, scope, patterns, isWrappedModule) => {
    const identifier = patterns.find(pattern => t.isIdentifier(node, pattern));
    return (
      (identifier &&
        isToplevelBinding(
          scope.getBinding(identifier.name),
          isWrappedModule,
        )) ||
      isImport(node, scope, patterns)
    );
  };

  const checkRequireArgs = (args, dependencyId) => {
    const pattern = t.stringLiteral(dependencyId);
    return (
      t.isStringLiteral(args[0], pattern) ||
      (t.isMemberExpression(args[0]) &&
        t.isNumericLiteral(args[0].property) &&
        t.isStringLiteral(args[1], pattern))
    );
  };

  const isToplevelBinding = (binding, isWrappedModule) =>
    isGlobal(binding) ||
    !binding.scope.parent ||
    (isWrappedModule && !binding.scope.parent.parent);

  return {
    isPlatformNode,
    isPlatformSelectNode,
    isPlatformOSSelect,
    getReplacementForPlatformOSSelect,
  };
}

module.exports = inlinePlugin;
