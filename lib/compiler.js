'use strict';

var traverse = require('./traverse');

exports.compile = function (ast) {
  return traverse.replace(ast, {
    enter: enter
  })
};

var CustomTypes = {};


function enter (node, parent) {
  if (CustomTypes[node.type]) {
    return CustomTypes[node.type](node, parent);
  }
  else {
    return node;
  }
}


CustomTypes.OutputStatement = function (node) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '+=',
      left: {
        type: 'Identifier',
        name: '__html'
      },
      right: node.expression
    }
  };
};


CustomTypes.ContentStatement = function (node) {
  return {
    type: 'IfStatement',
    test: {
      type: 'Identifier',
      name: '__content'
    },
    consequent: {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '+=',
        left: {
          type: 'Identifier',
          name: '__html'
        },
        right: {
          type: 'Identifier',
          name: '__content'
        }
      }
    },
    alternate: !node.body.length ? null : {
      type: 'BlockStatement',
      body: node.body
    }
  };
};

CustomTypes.BindStatement = function (node) {
  var arg;
  if (node.expression.type === 'Identifier') {
    arg = {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        computed: false,
        object: {
          type: "Identifier",
          name: "Object"
        },
        property: {
          type: "Identifier",
          name: "create"
        }
      },
      arguments: [
        {
          type: "Identifier",
          name: "__object"
        },
        {
          type: "ObjectExpression",
          properties: [
            {
              type: "Property",
              key: node.expression,
              value: {
                type: "ObjectExpression",
                properties: [
                  {
                    type: "Property",
                    key: {
                      type: "Identifier",
                      name: "value"
                    },
                    value: node.expression,
                    kind: "init"
                  }
                ]
              },
              kind: "init"
            }
          ]
        }
      ]
    };
  }
  return {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "FunctionExpression",
        id: null,
        params: [
          {
            type: "Identifier",
            name: "__object"
          }
        ],
        defaults: [],
        body: {
          type: "BlockStatement",
          body: [
            {
              type: "VariableDeclaration",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: "__html"
                  },
                  init: {
                    type: "Literal",
                    value: "",
                    raw: "''"
                  }
                }
              ],
              kind: "var"
            }].concat(node.body, {
              type: "ReturnStatement",
              argument: {
                type: "Identifier",
                name: "__html"
              }
            }
          )
        },
        rest: null,
        generator: false,
        expression: false
      },
      arguments: [
        arg
      ]
    }
  };
};