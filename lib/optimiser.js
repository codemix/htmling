'use strict';
var fast = require('fast.js'),
    traverse = require('./traverse');

/**
 * Optimise the given AST.
 *
 * @param  {Object} ast The AST to optimise.
 * @return {Object}     The optimised AST.
 */
exports.optimise = function (ast) {
  ast = removeNestedBlocks(ast);
  ast = hoistFunctions(ast);
  ast = removeUnusedAssignmentExpressions(ast);
  ast = replaceContextReferences(ast);
  ast = cacheDuplicateReferences(ast);
  ast = removeUnusedVariableDeclarators(ast);
  ast = combineContiguousOutputStatements(ast);
  ast = combineContiguousLiterals(ast);
  ast = normalizeFirstOutputStatement(ast);
  ast = directReturnWherePossible(ast);
  return ast;
};

/**
 * Remove pointless nested BlockStatements that are caused by the compilation process.
 */
function removeNestedBlocks (ast) {
  var tagged;
  while((tagged = findNestedBlocks(ast)).length) {
    fast.forEach(tagged, function (item) {
      var node = item[0],
          parent = item[1],
          index = parent.body.indexOf(node);
      fast.apply(Array.prototype.splice, parent.body, fast.concat([index, 1], node.body));
    });
  }
  return ast;
}

/**
 * Find BlockStatements which are direct children of BlockStatements.
 */
function findNestedBlocks (ast) {
  var tagged = [];
  traverse.traverse(ast, {
    enter: function (node, parent) {
      if (node.type === 'BlockStatement' && parent && parent.type === 'BlockStatement') {
        tagged.push([node, parent]);
      }
    }
  });
  return tagged;
}

/**
 * Hoist tagged functions (a $ in the name) out of the `render()` method.
 */
function hoistFunctions (ast) {
  var tagged = findHoistableFunctionDeclarations(ast);
  fast.forEach(tagged, function (item) {
    var node = item[0],
        parent = item[1],
        index = parent.body.indexOf(node);
    ast.body.unshift(node);
    parent.body.splice(index, 1);
  });
  return ast;
}

/**
 * Find function declarations which can be hoisted,
 */
function findHoistableFunctionDeclarations (ast) {
  var tagged = [];
  traverse.traverse(ast, {
    enter: function (node, parent) {
      if (node.type === 'FunctionDeclaration' && ~node.id.name.indexOf('$')) {
        tagged.push([node, parent]);
      }
    }
  });

  return tagged;
}

/**
 * If the first output statement is not in a branch, make it a
 * direct assignment (`=`) rather than `+=`. And remove the initial value
 * from the `html` declarator. This optimisation pass is specifically designed
 * to upset @jdalton.
 */
function normalizeFirstOutputStatement (ast) {
  var replaceable;
  traverse.traverse(ast, {
    enter: function (node, parent) {
      if (node.type !== 'Identifier' || node.name !== 'html') {
        return;
      }
      if (parent.type === 'VariableDeclarator') {
        replaceable = parent;
        var scope = findScope(ast, parent);
        traverse.traverse(scope, {
          enter: function (node, parent) {
            if (node.type === 'ForStatement' ||
                node.type === 'FunctionDeclaration' ||
                node.type === 'FunctionExpression' ||
                node.type === 'IfStatement'
            ) {
              this.break();
            }
            else if (node.type === 'Identifier' &&
                     node.name === 'html' &&
                     parent.type === 'AssignmentExpression' &&
                     parent.operator === '+='
            ) {
              parent.operator = '=';
              replaceable.init = null;
              this.break();
            }
          }
        });
      }
    }
  });
  return ast;
}

/**
 * Turn sequential OutputStatements into one big one.
 */
function combineContiguousOutputStatements (ast) {
  traverse.traverse(ast, {
    enter: function (node, parent) {
      if (node.type !== 'BlockStatement') {
        return;
      }
      var prev = false;

      node.body = fast.reduce(node.body, function (body, statement) {
        if (
          !body.length ||
          statement.type !== 'ExpressionStatement' ||
          statement.expression.type !== 'AssignmentExpression' ||
          statement.expression.operator !== '+=' ||
          statement.expression.left.type !== 'Identifier' ||
          statement.expression.left.name !== 'html'
        ) {
          prev = false;
          body.push(statement);
          return body;
        }
        else if (!prev) {
          prev = statement;
          body.push(statement);
          return body;
        }
        prev.expression.right = {
          type: 'BinaryExpression',
          operator: '+',
          left: prev.expression.right,
          right: statement.expression.right
        };
        return body;
      }, []);
    }
  });
  return ast;
}


function combineContiguousLiterals (ast) {
  while (combine()); //jshint ignore: line
  return ast;

  function combine () {
    var found = false;
    traverse.replace(ast, {enter: function (node, parent) {
      if (node.type !== 'BinaryExpression' || node.operator !== '+') {
        return;
      }
      if (node.left.type === 'Literal') {
        if (node.right.type === 'Literal') {
          found = true;
          return {
            type: 'Literal',
            value: ('' + node.left.value) + node.right.value,
            raw: JSON.stringify('' + node.left.value + node.right.value)
          };
        }
        else if (node.right.type === 'BinaryExpression' &&
                 node.right.operator === '+' &&
                 node.right.left.type === 'Literal'
        ) {
          found = true;
          return {
            type: 'BinaryExpression',
            operator: '+',
            left: {
              type: 'Literal',
              value: ('' + node.left.value) + node.right.left.value,
              raw: JSON.stringify('' + node.left.value + node.right.left.value)
            },
            right: node.right.right
          };
        }
      }
      else if (node.right.type === 'Literal') {
        if (node.left.type === 'BinaryExpression' &&
            node.left.operator === '+' &&
            node.left.right.type === 'Literal'
        ) {
          found = true;
          node.left.right = {
            type: 'Literal',
            value: ('' + node.left.right.value) + node.right.value,
            raw: JSON.stringify('' + node.left.right.value + node.right.value)
          };
          return node.left;
        }
      }
    }});
    return found;
  }
}

/**
 * If the result of an AssignmentExpression is not used, remove the
 * expression entirely.
 */
function removeUnusedAssignmentExpressions (ast) {
  var unused = findUnusedAssignmentExpressions(ast);
  traverse.traverse(ast, {
    enter: function (node, parent) {
      if (node.type !== 'BlockStatement') {
        return;
      }
      node.body = fast.filter(node.body, function (item) {
        return !~fast.indexOf(unused, item);
      });
    }
  });
  return ast;
}

/**
 * Find AssignmentExpression whose result is not used.
 */
function findUnusedAssignmentExpressions (ast) {
 var unused = [];
  traverse.traverse(ast, {
    enter: function (node, parent) {
      var scope, refs;
      if (parent &&
          parent.type === 'ExpressionStatement' &&
          node.type === 'AssignmentExpression' &&
          node.operator === '=' &&
          node.left.type === 'Identifier' &&
          (scope = findScope(ast, parent))
      ) {
        refs = fast.filter(findVariableReferences(scope, node.left, parent), function (item) {
          return item !== node.left;
        });
        if (!refs.length) {
          unused.push(parent); // the whole ExpressionStatement should be removed, not just the assignment.
        }
      }
    }
  });
  return unused;
}


/**
 * If a variable is declared, but not used, remove it.
 */
function removeUnusedVariableDeclarators (ast) {
  var unused = findUnusedVariableDeclarators(ast);
  traverse.traverse(ast, {
    enter: function (node, parent) {
      if (node.type !== 'VariableDeclaration') {
        return;
      }
      node.declarations = fast.filter(node.declarations, function (item) {
        return !~fast.indexOf(unused, item);
      });
    }
  });
  return ast;
}

/**
 * Find declarators of unused variables.
 */
function findUnusedVariableDeclarators (ast) {
  var unused = [];
  traverse.traverse(ast, {
    enter: function (node, parent) {
      var scope, refs;
      if (node.type === 'VariableDeclarator' && (scope = findScope(ast, node))) {
        refs = fast.filter(findVariableReferences(scope, node.id), function (item) {
          return item !== node.id;
        });

        if (!refs.length) {
          unused.push(node);
        }
      }
    }
  });
  return unused;
}

/**
 * Find references to a given identifier
 */
function findVariableReferences (ast, identifier, skip) {
  var references = [];
  traverse.traverse(ast, {
    enter: function (node, parent) {
      if (node === skip) {
        this.skip();
      }
      else if (
          node.type === 'Identifier' &&
          node.name === identifier.name &&
          (parent.type !== 'MemberExpression' || parent.left !== node)
      ) {
        references.push(node);
      }
    }
  });
  return references;
}

/**
 * Find the scope for an item in the AST.
 */
function findScope (ast, item) {
  var scopes = [],
      found = false;
  traverse.traverse(ast, {
    enter: function (node, parent) {
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        scopes.push(node);
      }
      else if (node === item) {
        found = scopes[scopes.length - 1];
        this.break();
      }
    },
    leave: function (node, parent) {
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        scopes.pop();
      }
    }
  });
  return found ? found.body : false;
}

function replaceContextReferences (ast) {
  traverse.traverse(ast, { enter: function (node) {
    if (node.type === 'FunctionExpression') {
      this.skip();
      traverse.traverse(node, {
        enter: function (item, parent) {
          if (
            item !== node &&
            (item.type === 'FunctionExpression' || item.type === 'FunctionDeclaration')
          ) {
            this.skip();
          }
          else if (
            item.type === 'Identifier' &&
            item.name === 'context' &&
            (!parent || parent.type !== 'VariableDeclarator')
          ) {
            item.name = 'this';
          }
        }
      });
    }
    else if (node.type === 'FunctionDeclaration') {
      this.skip();
    }
  }});
  return ast;
}

function directReturnWherePossible (ast) {
  traverse.traverse(ast, { enter: function (node) {
    if (node.type === 'FunctionExpression') {
      var canOptimise = true,
          declaration, declarator, assignment, returnStatement;
      this.skip();
      traverse.traverse(node, {
        enter: function (item, parent) {
          if (
            item !== node &&
            (item.type === 'FunctionExpression' || item.type === 'FunctionDeclaration')
          ) {
            canOptimise = false;
            this.break();
          }
          else if (
            item.type === 'IfStatement' ||
            item.type === 'ForStatement'
          ) {
            canOptimise = false;
            this.break();
          }
          else if (item.type === 'VariableDeclarator' && item.id.name === 'html') {
            declarator = item;
            this.skip();
          }
          else if (item.type === 'VariableDeclaration') {
            if (declaration) {
              canOptimise = false;
              this.skip();
            }
            else {
              declaration = item;
            }
          }
          else if (item.type === 'AssignmentExpression' && item.left.name === 'html') {
            if (assignment) {
              canOptimise = false;
              this.break();
            }
            else {
              assignment = item;
              this.skip();
            }
          }
          else if (item.type === 'ReturnStatement') {
            returnStatement = item;
            this.skip();
          }
        }
      });
      if (canOptimise) {
        declaration.declarations = fast.filter(declaration.declarations, function (item) {
          return item !== declarator;
        });
        if (assignment) {
          returnStatement.argument = assignment.right;
        }
        else {
          returnStatement.argument = {
            type: 'Literal',
            value: '',
            raw: '""'
          };
        }
        node.body.body = fast.filter(node.body.body, function (item) {
          if (item === declaration && !declaration.declarations.length) {
            return false;
          }
          else if (item.type === 'ExpressionStatement' && item.expression === assignment) {
            return false;
          }
          else {
            return true;
          }
        });
      }
    }
    else if (node.type === 'FunctionDeclaration') {
      this.skip();
    }
  }});
  return ast;
}


function cacheDuplicateReferences (ast) {

  traverse.traverse(ast, { enter: function (node, parent) {
    if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
      findDuplicateReferences(node);
    }
  }});
  return ast;
}

function findDuplicateReferences (ast) {
  var markers = [],
      markedNodes = {};
  traverse.traverse(ast, { enter: function (node, parent) {
    if (node !== ast && (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression')) {
      return this.skip();
    }
    else if (node.type !== 'SequenceExpression' ||
            !node.marker ||
            node.expressions[0].type !== 'AssignmentExpression' ||
            (node.expressions[0].right.type !== 'Identifier' &&
              (node.expressions[0].right.type !== 'MemberExpression' ||
                node.expressions[0].right.object.name === 'ref'))
    ) {
      return;
    }
    var marker;
    if (node.expressions[0].right.type === 'Identifier') {
      marker = node.expressions[0].right.name + '.' + node.marker;
    }
    else {
      marker = node.expressions[0].right.object.name + '.' + node.marker;
    }
    if (!markedNodes[marker]) {
      markedNodes[marker] = [];
    }
    markedNodes[marker].push(node);
    markers.push(marker);
  }});
  if (markers.length) {
    markers = collateMarkers(markers);
    markers.forEach(function (item) {
      var nodes = item[1].reduce(function (nodes, marker) {
        return nodes.concat(markedNodes[marker]);
      }, []);
      var first;
      /*traverse.replace(ast, {enter: function (n, p) {
        if (~nodes.indexOf(n)) {
          if (!first) {
            if (n.type === 'AssignmentExpression') {
              traverse.traverse(n, {enter: function (node, parent) {
                if (node.type === 'Identifier' && node.name === n.) {

                }
              });
            }
          }
          else {
            return replaceSequenceExpression(item[0], n);
          }
        }
      }});*/

    });

  }
  return ast;
}

function replaceSequenceExpression (marker, node) {
  var markerNoPrefix = marker.match(/^[A-Z0-9_$]+\.(.*)/i)[1];
  if (node.marker === markerNoPrefix) {
    return markerToIdentifier(marker);
  }
  else if (node.marker.slice(0, markerNoPrefix.length + 1) === markerNoPrefix + '.') {
    var remaining = node.marker.slice(markerNoPrefix.length + 1).split('.');
    if (remaining.length === 1) {
      return {
        type: 'ConditionalExpression',
        test: {
          type: 'BinaryExpression',
          operator: '!=',
          left: {
            type: 'MemberExpression',
            object: markerToIdentifier(marker),
            property: {
              type: 'Identifier',
              name: remaining[0]
            }
          },
          right: {
            type: 'Literal',
            value: null,
            raw: 'null'
          }
        },
        consequent: {
          type: 'MemberExpression',
          object: markerToIdentifier(marker),
          property: {
            type: 'Identifier',
            name: remaining[0]
          }
        },
        alternate: {
          type: 'Literal',
          value: '',
          raw: '""'
        }
      };
    }
    else {
      return node;
    }
  }
  else {
    return node;
  }
}

function markerToIdentifier (marker) {
  return {
    type: 'Identifier',
    name: "__" + marker.replace(/(\.)/g, '_')
  };
}


function collateMarkers (markers) {
  markers.sort();
  var prefixes = markers.reduce(function (prefixes, marker) {
    marker.split('.').reduce(function (collected, part) {
      if (collected) {
        collected += '.' + part;
      }
      else {
        collected = part;
      }
      prefixes[collected] = prefixes[collected] || [];
      prefixes[collected].push(marker);
      return collected;
    }, '');
    return prefixes;
  }, {});

  var collated = [];
  for (var prefix in prefixes) {
    if (prefixes[prefix].length > 1) {
      collated.push([prefix, prefixes[prefix]]);
    }
  }

  collated.sort(function (a, b) {
    if (a[0] > b[0]) {
      return -1;
    }
    else if (a[0] < b[0]) {
      return 1;
    }
    else {
      return 0;
    }
  });

  // if every reference to an identifier has already been seen, omit it

  var seen = {};


  collated = collated.reduce(function (collated, item) {
    var filtered = item[1].filter(function (a) {
      if (!seen[a]) {
        seen[a] = true;
        return true;
      }
      else {
        return false;
      }
    });
    if (filtered.length) {
      collated.push([item[0], filtered]);
    }
    return collated;
  }, []);

  collated = collated.reduceRight(function (collated, item) {
    var last = collated[collated.length - 1];
    if (last && item[0].slice(0, last[0].length + 1) === last[0] + '.') {
      last[1] = last[1].concat(item[1]);
    }
    else {
      collated.push(item);
    }
    return collated;
  }, []);

  return collated;
}