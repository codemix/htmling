'use strict';

var traverse = require('./traverse'),
    parser = require('./parser'),
    codegen = require('./codegen');

exports.compile = function (ast) {
  if (typeof ast === 'string') {
    ast = parser.parse(ast);
  }
  return codegen.generate(traverse.replace(ast, {
    enter: enter
  }));
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

CustomTypes.Program = function (node) {
  return {
    type: 'Program',
    body: [

      {
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: '=',
          left: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'Identifier',
              name: 'exports'
            },
            property: {
              type: 'Identifier',
              name: 'render'
            }
          },
          right: {
            type: "FunctionExpression",
            id: {
              type: "Identifier",
              name: "render"
            },
            params: [
              {
                type: 'Identifier',
                name: 'object'
              },
              {
                type: 'Identifier',
                name: 'content'
              }
            ],
            defaults: [],
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'VariableDeclaration',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: {
                        type: 'Identifier',
                        name: 'context'
                      },
                      init: {
                        type: 'Identifier',
                        name: 'this'
                      }
                    },
                    {
                      type: 'VariableDeclarator',
                      id: {
                        type: 'Identifier',
                        name: 'html'
                      },
                      init: {
                        type: 'Literal',
                        value: '',
                        raw: '""'
                      }
                    },
                    {
                      type: 'VariableDeclarator',
                      id: {
                        type: 'Identifier',
                        name: 'ref'
                      },
                      init: null
                    }
                  ],
                  kind: 'var'
                }
              ].concat(
                node.body,
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'Identifier',
                    name: 'html'
                  }
                }
              )
            }
          }
        }
      }
    ]
  };
};


CustomTypes.OutputStatement = function (node) {
  var right = node.expression;
  if (right.type !== 'Literal' && right.type !== 'SequenceExpression') {
    right = {
      type: 'LogicalExpression',
      operator: '||',
      left: right,
      right: {
        type: 'Literal',
        value: '',
        raw: '""'
      }
    };
  }

  if (!right.raw) {
    right = {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        computed: false,
        object: {
          type: 'Identifier',
          name: 'context'
        },
        property: {
          type: 'Identifier',
          name: 'escape'
        }
      },
      arguments: [
        right
      ]
    };
  }

  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '+=',
      left: {
        type: 'Identifier',
        name: 'html'
      },
      right: right
    }
  };
};


CustomTypes.ContentStatement = function (node) {
  return {
    type: 'IfStatement',
    test: {
      type: 'Identifier',
      name: 'content'
    },
    consequent: {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '+=',
        left: {
          type: 'Identifier',
          name: 'html'
        },
        right: {
          type: 'Identifier',
          name: 'content'
        }
      }
    },
    alternate: !node.body.length ? null : {
      type: 'BlockStatement',
      body: node.body
    }
  };
};

CustomTypes.LayoutStatement = function (node) {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "AssignmentExpression",
      operator: "+=",
      left: {
        type: "Identifier",
        name: "html"
      },
      right: {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          computed: false,
          object: {
            type: "Identifier",
            name: "context"
          },
          property: {
            type: "Identifier",
            name: "layout"
          }
        },
        arguments: [
          {
            type: "Literal",
            value: node.attributes.src || '',
            raw: JSON.stringify(node.attributes.src || '')
          },
          {
            type: "Identifier",
            name: 'object'
          },
          {
            type: "CallExpression",
            callee: {
              type: "FunctionExpression",
              id: null,
              params: [],
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
                      name: "html"
                    },
                    init: {
                      type: "Literal",
                      value: "",
                      raw: "''"
                    }
                  },
                  {
                    type: "VariableDeclarator",
                    id: {
                      type: "Identifier",
                      name: "ref"
                    },
                    init: null
                  }
                  ],
                  kind: "var"
                }
                ]
                .concat(
                  node.body,
                  {
                    type: "ReturnStatement",
                    argument: {
                      type: "Identifier",
                      name: "html"
                    }
                  })
              },
              rest: null,
              generator: false,
              expression: false
            },
            arguments: []
          }
        ]
      }
    }
  };
};

CustomTypes.RepeatStatement = function (node) {
  if (node.expression.type === 'IterateExpression') {
    node.expression.body = node.body;
    return {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '+=',
        left: {
          type: 'Identifier',
          name: 'html'
        },
        right: node.expression
      }
    };
  }

  return {
    type: "ExpressionStatement",
    expression: {
      type: 'AssignmentExpression',
      operator: '+=',
      left: {
        type: 'Identifier',
        name: 'html'
      },
      right: {
        type: "CallExpression",
        callee: {
          type: "FunctionExpression",
          id: null,
          params: [
          {
            type: "Identifier",
            name: "iterable"
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
                  name: "html"
                },
                init: {
                  type: "Literal",
                  value: "",
                  raw: "''"
                }
              },
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: "object"
                },
                init: null
              }
              ],
              kind: "var"
            },
            {
              type: "IfStatement",
              test: {
                type: "UnaryExpression",
                operator: "!",
                argument: {
                  type: "Identifier",
                  name: "iterable"
                },
                prefix: true
              },
              consequent: {
                type: "BlockStatement",
                body: [
                {
                  type: "ReturnStatement",
                  argument: {
                    type: "Identifier",
                    name: "html"
                  }
                }
                ]
              },
              alternate: null
            },
            {
              type: "VariableDeclaration",
              declarations: [
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: "isArray"
                },
                init: {
                  type: "CallExpression",
                  callee: {
                    type: "MemberExpression",
                    computed: false,
                    object: {
                      type: "Identifier",
                      name: "Array"
                    },
                    property: {
                      type: "Identifier",
                      name: "isArray"
                    }
                  },
                  arguments: [
                  {
                    type: "Identifier",
                    name: "iterable"
                  }
                  ]
                }
              },
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: "keys"
                },
                init: {
                  type: "ConditionalExpression",
                  test: {
                    type: "Identifier",
                    name: "isArray"
                  },
                  consequent: {
                    type: "ArrayExpression",
                    elements: []
                  },
                  alternate: {
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
                        name: "keys"
                      }
                    },
                    arguments: [
                    {
                      type: "Identifier",
                      name: "iterable"
                    }
                    ]
                  }
                }
              },
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: "total"
                },
                init: {
                  type: "ConditionalExpression",
                  test: {
                    type: "Identifier",
                    name: "isArray"
                  },
                  consequent: {
                    type: "MemberExpression",
                    computed: false,
                    object: {
                      type: "Identifier",
                      name: "iterable"
                    },
                    property: {
                      type: "Identifier",
                      name: "length"
                    }
                  },
                  alternate: {
                    type: "MemberExpression",
                    computed: false,
                    object: {
                      type: "Identifier",
                      name: "keys"
                    },
                    property: {
                      type: "Identifier",
                      name: "length"
                    }
                  }
                }
              },
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: "i"
                },
                init: null
              },
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: "key"
                },
                init: null
              }
              ],
              kind: "var"
            },
            {
              type: "ForStatement",
              init: {
                type: "AssignmentExpression",
                operator: "=",
                left: {
                  type: "Identifier",
                  name: "i"
                },
                right: {
                  type: "Literal",
                  value: 0,
                  raw: "0"
                }
              },
              test: {
                type: "BinaryExpression",
                operator: "<",
                left: {
                  type: "Identifier",
                  name: "i"
                },
                right: {
                  type: "Identifier",
                  name: "total"
                }
              },
              update: {
                type: "UpdateExpression",
                operator: "++",
                argument: {
                  type: "Identifier",
                  name: "i"
                },
                prefix: false
              },
              body: {
                type: "BlockStatement",
                body: [
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: {
                      type: "Identifier",
                      name: "key"
                    },
                    right: {
                      type: "ConditionalExpression",
                      test: {
                        type: "Identifier",
                        name: "isArray"
                      },
                      consequent: {
                        type: "Identifier",
                        name: "i"
                      },
                      alternate: {
                        type: "MemberExpression",
                        computed: true,
                        object: {
                          type: "Identifier",
                          name: "keys"
                        },
                        property: {
                          type: "Identifier",
                          name: "i"
                        }
                      }
                    }
                  }
                },
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: {
                      type: "Identifier",
                      name: "object"
                    },
                    right: {
                      type: "MemberExpression",
                      computed: true,
                      object: {
                        type: "Identifier",
                        name: "iterable"
                      },
                      property: {
                        type: "Identifier",
                        name: "key"
                      }
                    }
                  }
                },
                {
                  type: "IfStatement",
                  test: {
                    type: "UnaryExpression",
                    operator: "!",
                    argument: {
                      type: "Identifier",
                      name: "object"
                    },
                    prefix: true
                  },
                  consequent: {
                    type: "ContinueStatement",
                    label: null
                  },
                  alternate: null
                }
                ].concat(node.body)
              }
            },
            {
              type: "ReturnStatement",
              argument: {
                type: "Identifier",
                name: "html"
              }
            }
            ]
          },
          rest: null,
          generator: false,
          expression: false
        },
        arguments: [
          node.expression
        ]
      }
    }
  };
};

CustomTypes.IterateExpression = function (node) {
  var body = [
    {
      type: "ExpressionStatement",
      expression: {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: "key"
        },
        right: {
          type: "ConditionalExpression",
          test: {
            type: "Identifier",
            name: "isArray"
          },
          consequent: {
            type: "Identifier",
            name: "i"
          },
          alternate: {
            type: "MemberExpression",
            computed: true,
            object: {
              type: "Identifier",
              name: "keys"
            },
            property: {
              type: "Identifier",
              name: "i"
            }
          }
        }
      }
    },
    {
      type: "ExpressionStatement",
      expression: {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          computed: false,
          object: {
            type: "Identifier",
            name: "object"
          },
          property: node.it
        },
        right: {
          type: "MemberExpression",
          computed: true,
          object: {
            type: "Identifier",
            name: "iterable"
          },
          property: {
            type: "Identifier",
            name: "key"
          }
        }
      }
    }
  ];

  if (node.index) {
    body.push({
      type: "ExpressionStatement",
      expression: {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          computed: false,
          object: {
            type: "Identifier",
            name: "object"
          },
          property: node.index
        },
        right: {
          type: "Identifier",
          name: "key"
        }
      }
    });
  }

  body = body.concat(node.body);

  return {
    type: "CallExpression",
    callee: {
      type: "FunctionExpression",
      id: null,
      params: [
      {
        type: "Identifier",
        name: "object"
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
              name: "iterable"
            },
            init: node.expression
          },
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: "html"
            },
            init: {
              type: "Literal",
              value: "",
              raw: "''"
            }
          },
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: "ref"
            },
            init: null
          }
          ],
          kind: "var"
        },
        {
          type: 'IfStatement',
          test: {
            type: 'UnaryExpression',
            operator: '!',
            argument: {
              type: 'Identifier',
              name: 'iterable'
            },
            prefix: true
          },
          consequent: {
            type: 'ReturnStatement',
            argument: {
              type: 'Identifier',
              name: 'html'
            }
          }
        },
        {
          type: "VariableDeclaration",
          declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: "isArray"
            },
            init: {
              type: "CallExpression",
              callee: {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "Identifier",
                  name: "Array"
                },
                property: {
                  type: "Identifier",
                  name: "isArray"
                }
              },
              arguments: [
              {
                type: "Identifier",
                name: "iterable"
              }
              ]
            }
          },
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: "keys"
            },
            init: {
              type: "ConditionalExpression",
              test: {
                type: "Identifier",
                name: "isArray"
              },
              consequent: {
                type: "ArrayExpression",
                elements: []
              },
              alternate: {
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
                    name: "keys"
                  }
                },
                arguments: [
                {
                  type: "Identifier",
                  name: "iterable"
                }
                ]
              }
            }
          },
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: "total"
            },
            init: {
              type: "ConditionalExpression",
              test: {
                type: "Identifier",
                name: "isArray"
              },
              consequent: {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "Identifier",
                  name: "iterable"
                },
                property: {
                  type: "Identifier",
                  name: "length"
                }
              },
              alternate: {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "Identifier",
                  name: "keys"
                },
                property: {
                  type: "Identifier",
                  name: "length"
                }
              }
            }
          },
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: "i"
            },
            init: null
          },
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: "key"
            },
            init: null
          }
          ],
          kind: "var"
        },
        {
          type: "ForStatement",
          init: {
            type: "AssignmentExpression",
            operator: "=",
            left: {
              type: "Identifier",
              name: "i"
            },
            right: {
              type: "Literal",
              value: 0,
              raw: "0"
            }
          },
          test: {
            type: "BinaryExpression",
            operator: "<",
            left: {
              type: "Identifier",
              name: "i"
            },
            right: {
              type: "Identifier",
              name: "total"
            }
          },
          update: {
            type: "UpdateExpression",
            operator: "++",
            argument: {
              type: "Identifier",
              name: "i"
            },
            prefix: false
          },
          body: {
            type: "BlockStatement",
            body: body
          }
        },
        {
          type: "ReturnStatement",
          argument: {
            type: "Identifier",
            name: "html"
          }
        }
        ]
      },
      rest: null,
      generator: false,
      expression: false
    },
    arguments: [
    {
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
        name: "object"
      }
      ]
    }
    ]
  };
};



CustomTypes.BindStatement = function (node) {
  var statement = {
    type: "ExpressionStatement",
    expression: {
      type: 'AssignmentExpression',
      operator: '+=',
      left: {
        type: 'Identifier',
        name: 'html'
      },
      right: {
        type: "CallExpression",
        callee: {
          type: "FunctionExpression",
          id: null,
          params: [
            {
              type: "Identifier",
              name: "object"
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
                      name: "html"
                    },
                    init: {
                      type: "Literal",
                      value: "",
                      raw: "''"
                    }
                  },
                  {
                    type: "VariableDeclarator",
                    id: {
                      type: "Identifier",
                      name: "ref"
                    },
                    init: null
                  }
                ],
                kind: "var"
              }].concat(node.body, {
                type: "ReturnStatement",
                argument: {
                  type: "Identifier",
                  name: "html"
                }
              }
            )
          },
          rest: null,
          generator: false,
          expression: false
        },
        arguments: []
      }
    }
  };

  if (node.expression.type === 'AliasExpression') {
    statement.expression.right.arguments.push({
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
          name: "object"
        },
        {
          type: "ObjectExpression",
          properties: [
            {
              type: "Property",
              key: node.expression.alias,
              value: {
                type: "ObjectExpression",
                properties: [
                  {
                    type: "Property",
                    key: {
                      type: "Identifier",
                      name: "value"
                    },
                    value: node.expression.subject,
                    kind: "init"
                  }
                ]
              },
              kind: "init"
            }
          ]
        }
      ]
    });
  }
  else {
    statement.expression.right.arguments.push({
      type: 'Identifier',
      name: 'ref'
    });
    statement = {
      type: 'IfStatement',
      test: {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          type: 'Identifier',
          name: 'ref'
        },
        right: node.expression
      },
      consequent: statement
    };
  }
  return statement;
};