'use strict';

exports.parser = require('./parser');
exports.traverse = require('./traverse');
exports.compiler = require('./compiler');
exports.codegen = require('./codegen');

exports.compile = function (input) {
  var compiled = this.compiler.compile(this.parser.parse(input));
  var generated = this.codegen.generate(compiled);
  var module = {exports: {
    // @todo move me to the template class
    sanitize: escapeHTML
  }};

  (new Function('module', 'exports', generated))(module, module.exports);
  return module.exports;
};


var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;'
};

function escapeHTML (data) {
  return (''+data).replace(/[&<>"']/g, function (match) {
    return entityMap[match];
  });
}