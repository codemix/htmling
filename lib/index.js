'use strict';

exports.parser = require('./parser');
exports.traverse = require('./traverse');
exports.compiler = require('./compiler');
exports.codegen = require('./codegen');

exports.compile = function (input) {
  var compiled = this.compiler.compile(this.parser.parse(input));
  var generated = this.codegen.generate(compiled);
  var module = {exports: {}};

  (new Function('module', 'exports', generated))(module, module.exports);
  return module.exports;
};