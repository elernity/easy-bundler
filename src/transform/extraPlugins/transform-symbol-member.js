'use strict';
/**
 * Transforms function properties of the `Symbol` into
 * the presence check, and fallback string "@@<name>".
 *
 * Example:
 *
 *   Symbol.iterator;
 *
 * Transformed to:
 *
 *   typeof Symbol === 'function' ? Symbol.iterator : '@@iterator';
 */
module.exports = function symbolMember(babel) {
  const t = babel.types;

  return {
    visitor: {
      MemberExpression(path) {
        if (!isAppropriateMember(path)) {
          return;
        }

        const node = path.node;

        path.replaceWith(
          t.conditionalExpression(
            t.binaryExpression(
              '===',
              t.unaryExpression('typeof', t.identifier('Symbol'), true),
              t.stringLiteral('function'),
            ),
            node,
            t.stringLiteral(`@@${node.property.name}`),
          ),
        );

        // We should stop to avoid infinite recursion, since Babel
        // traverses replaced path, and again would hit our transform.
        path.stop();
      },
    },
  };
};

function isAppropriateMember(path) {
  const node = path.node;

  return (
    path.parentPath.type !== 'AssignmentExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'Symbol' &&
    node.property.type === 'Identifier'
  );
}
