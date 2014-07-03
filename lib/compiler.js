'use strict';

var traverse = require('./traverse'),
    parser = require('./parser'),
    esprima = require('esprima'),
    optimiser = require('./optimiser'),
    fast = require('fast.js');

/**
 * Compile a template string (or template AST) to an optimised JavaScript AST.
 *
 * @param  {String|Object} ast The source or AST to compile.
 * @return {Object}            The compiled JavaScript AST, ready to pass to escodegen.
 */
exports.compile = function (ast) {
  if (typeof ast === 'string') {
    ast = parser.parse(ast);
  }
  return optimiser.optimise(traverse.replace(ast, {
    enter: enter
  }));
};


var counters = {
      scope: 0,
      include: 0,
      repeat: 0,
      _: 0
    },
    Trees = {},
    CustomTypes = {};


function enter (node, parent) {
  if (CustomTypes[node.type]) {
    return CustomTypes[node.type](node, parent);
  }
  else {
    return node;
  }
}

function astify (fn) {
  var ast = esprima.parse(fn.toString()).body[0].body;
  return function (replacements) {
    return replaceNodes(deepClone(ast), replacements);
  };
}

function replaceNodes (ast, replacements) {
  var toClean = [],
      toCleanWith = [];
  ast = traverse.replace(ast, {
    enter: function (node, parent) {
      var replacement;
      if (node.type === 'Identifier' && node.name.charAt(0) === '_') {
        replacement = replacements[node.name.slice(1)];
        if (parent.type === 'ExpressionStatement') {
          toClean.push(parent);
          toCleanWith.push(replacement);
        }
        else {
          return replacement;
        }
      }
    }
  });
  if (toClean.length) {
    ast = traverse.replace(ast, {
      enter: function (node, parent) {
        var index = fast.indexOf(toClean, node);
        if (~index) {
          return deepClone(toCleanWith[index]);
        }
      }
    });
  }
  return ast;
}

function deepClone (ast) {
  var keys = Object.keys(ast),
      length = keys.length,
      cloned = {},
      key, value, i;

  for (i = 0; i < length; i++) {
    key = keys[i];
    value = ast[key];
    if (Array.isArray(value)) {
      cloned[key] = fast.map(value, deepClone);
    }
    else if (!value || typeof value !== 'object') {
      cloned[key] = value;
    }
    else {
      cloned[key] = deepClone(value);
    }
  }
  return cloned;
}


Trees.Template = astify(function Template (exports, _) {
  /* jshint ignore:start */
  exports.render = function renderTemplate (object, content, filterContext) {
    var context = this,
        html = '',
        stack = [],
        ref;
    filterContext = filterContext || context;
    _body;
    return html;
  };
  /* jshint ignore:end */
});

CustomTypes.Template = function (node) {
  node.type = 'BlockStatement';
  var result = Trees.Template({
    body: traverse.replace(node, {
      enter: enter
    })
  });
  result.type = 'Program';
  return result;
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

Trees.IncludeStatement = astify(function IncludeStatement () {
  /* jshint ignore: start */
  function _scopeName (context, object, content, filterContext) {
    var html = '', ref;
    _body;
    return context.include(_src, object, html);
  }
  html += _scopeName(context, _object, content, filterContext);
  /* jshint ignore: end */
});

Trees.IncludeStatementNoContent = astify(function IncludeStatement () {
  /* jshint ignore: start */
  html += context.include(_src, _object);
  /* jshint ignore: end */
});

Trees.IncludeStatementAlias = astify(function IncludeStatement () {
  /* jshint ignore: start */
  function _scopeName (context, object, content, filterContext) {
    var html = '', ref;
    _body;
    return context.include(_src, object, html);
  }
  html += _scopeName(context, context.rescope(_object, _alias, _expr), content, filterContext);
  /* jshint ignore: end */
});

Trees.IncludeStatementAliasNoContent = astify(function IncludeStatement () {
  /* jshint ignore: start */
  html += context.include(_src, context.rescope(_object, _alias, _expr));
  /* jshint ignore: end */
});

CustomTypes.IncludeStatement = function (node) {
  var options = {
    src: {
      type: "Literal",
      value: node.attributes.src || '',
      raw: JSON.stringify(node.attributes.src || '')
    },
    body: {
      type: 'BlockStatement',
      body: node.body
    },
    object: {
      type: 'Identifier',
      name: 'object'
    },
    scopeName: {
      type: 'Identifier',
      name: 'include$' + (counters.include++)
    }
  };
  if (node.attributes.bind) {
    if (node.attributes.bind.expression.type === 'AliasExpression') {
      options.alias = {
        type: "Literal",
        value: node.attributes.bind.expression.alias.name,
        raw: JSON.stringify(node.attributes.bind.expression.alias.name)
      };
      options.expr = node.attributes.bind.expression.subject;
      return node.body.length ? Trees.IncludeStatementAlias(options) : Trees.IncludeStatementAliasNoContent(options);
    }
    else {
      options.object = node.attributes.bind.expression;
    }
  }
  return node.body.length ? Trees.IncludeStatement(options) : Trees.IncludeStatementNoContent(options);
};

Trees.RepeatStatement = astify(function RepeatStatement () {
  /* jshint ignore: start */
  function _fnNameArray (context, iterable, filterContext) {
    var html = '',
        object, ref, length, key, i;

    length = iterable.length;
    for (i = 0; i < length; i++) {
      object = iterable[i];
      if (!object) {
        continue;
      }
      _body;
    }


    return html;
  }
  function _fnNameObject (context, iterable, filterContext) {
    var html = '',
        object, ref, keys, length, key, i;
    keys = Object.keys(iterable);
    length = keys.length;
    for (i = 0; i < length; i++) {
      key = keys[i];
      object = iterable[key];
      if (!object) {
        continue;
      }
      _body;
    }
    return html;
  }

  if ((ref = _expr)) {
    html += Array.isArray(ref) ? _fnNameArray(context, ref, filterContext) : _fnNameObject(content, ref, filterContext);
  }
  /* jshint ignore: end */
});

CustomTypes.RepeatStatement = function (node) {
  if (node.expression.type === 'IterateExpression') {
    node.expression.body = node.body;
    return CustomTypes.IterateExpression(node.expression);
  }
  return Trees.RepeatStatement({
    fnNameObject: {
      type: 'Identifier',
      name: 'repeatObject$' + (counters.repeat++)
    },
    fnNameArray: {
      type: 'Identifier',
      name: 'repeatArray$' + (counters.repeat)
    },
    body: {
      type: 'BlockStatement',
      body: node.body
    },
    expr: node.expression
  });
};


Trees.IterateExpression = astify(function IterateExpression () {
  /* jshint ignore: start */
  var _target = _expr,
      _value, _key, _keys, _length, _i;
  if (_target) {
    if (Array.isArray(_target)) {
      _length = _target.length;
      for (_key = 0; _key < _length; _key++) {
        _value = _target[_key];
        _body;
      }
    }
    else {
      _keys = Object.keys(_target);
      _length = _keys.length;
      for (_i = 0; _i < _length; _i++) {
        _key = _keys[_i];
        _value = _target[_key];
        _body;
      }
    }
  }
  /* jshint ignore: end */
});

CustomTypes.IterateExpression = function (node) {
  var options = {
    target: {
      type: 'Identifier',
      name: 'target$' + (counters._++)
    },
    value: {
      type: 'Identifier',
      name: 'value$' + (counters._++)
    },
    key: {
      type: 'Identifier',
      name: 'key$' + (counters._++)
    },
    keys: {
      type: 'Identifier',
      name: 'keys$' + (counters._++)
    },
    length: {
      type: 'Identifier',
      name: 'length$' + (counters._++)
    },
    i: {
      type: 'Identifier',
      name: 'i$' + (counters._++)
    },
    body: {
      type: 'BlockStatement',
      body: node.body
    },
    expr: node.expression
  };

  replaceObjectReferences(options.body, node.it.name, options.value);
  if (node.index) {
    replaceObjectReferences(options.body, node.index.name, options.key);
  }

  return Trees.IterateExpression(options);
};

function replaceObjectReferences (ast, name, replacement) {
  return traverse.replace(ast, {
    enter: function (node, parent) {
      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        this.skip();
      }
      else if (
        node.type === 'MemberExpression' &&
        node.object.type === 'Identifier' &&
        node.object.name === 'object' &&
        node.property.type === 'Identifier' &&
        node.property.name === name
      ) {
        return deepClone(replacement);
      }
    }
  });
}

function findObjectReferences (ast, name, skip) {
  var references = [];
  traverse.traverse(ast, {
    enter: function (node, parent) {
      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        this.skip();
      }
      else if (node === skip) {
        this.skip();
      }
      else if (
        node.type === 'MemberExpression' &&
        node.object.type === 'Identifier' &&
        node.object.name === 'object' &&
        node.property.type === 'Identifier' &&
        node.property.name === name
      ) {
        references.push([node, parent]);
      }
    }
  });
  return references;
}

Trees.BindStatement = astify(function BindStatement () {
  /* jshint ignore: start */
  if (ref = _expr) {
    var _objectRef = object;
    object = ref;
    _body;
    object = _objectRef;
  }
  /* jshint ignore: end */
});

Trees.BindStatementAlias = astify(function BindStatement () {
  /* jshint ignore: start */
  var _objectRef = _expr;
  if (_objectRef) {
    _body;
  }
  /* jshint ignore: end */
});

CustomTypes.BindStatement = function (node) {
  var options = {
    objectRef: {
      type: 'Identifier',
      name: 'object$' + (counters._++)
    },
    body: {
      type: 'BlockStatement',
      body: node.body
    },
    expr: node.expression
  };

  if (node.expression.type === 'AliasExpression') {
    options.expr = node.expression.subject;
    replaceObjectReferences(options.body, node.expression.alias.name, options.objectRef);
    return Trees.BindStatementAlias(options);
  }
  else {
    return Trees.BindStatement(options);
  }
};

