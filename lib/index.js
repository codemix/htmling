'use strict';

var fs = require('fs'),
    path = require('path');

module.exports = exports = function (input, name, Template) {
  return exports.string(input, name, Template);
};

exports.parser = require('./parser');
exports.traverse = require('./traverse');
exports.compiler = require('./compiler');
exports.codegen = require('./codegen');

exports.Template = require('./template');
exports.Collection = require('./collection');

exports.string = function (input, name, Template) {
  name = name || '';
  Template = Template || exports.Template;
  var compiled = this.compiler.compile(input);

  var module = {exports: {
    name: name,
    source: input
  }};

  (new Function('module', 'exports', compiled))(module, module.exports); // jshint ignore: line
  return new Template(module.exports);
};


exports.file = function (filename, name, Template) {
  var content = fs.readFileSync(filename, 'utf8');
  return exports.string(content, name || filename, Template);
};

exports.dir = function (dirname, extname, Template) {
  dirname = path.resolve(dirname);
  extname = extname || '.html';
  var files = findAllFiles(dirname, extname).reduce(function (list, filename) {
    var name = filename.slice(dirname.length);
    if (name.charAt(0) === '/' || name.charAt(0) === '\\') {
      name = name.slice(1);
    }
    list[name] = exports.file(filename, name, Template);
    return list;
  }, {});
  return new exports.Collection(files);
};

function findAllFiles (dirname, extname) {
  return fs.readdirSync(dirname)
  .reduce(function (list, name) {
    var filename = path.join(dirname, name);
    var stat = fs.statSync(filename);
    if (stat.isDirectory()) {
      return list.concat(findAllFiles(filename, extname));
    }
    else {
      if (path.extname(filename, extname)) {
        list.push(filename);
      }
      return list;
    }
  }, []);
}